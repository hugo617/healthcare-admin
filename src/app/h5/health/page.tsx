'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { H5AuthManager } from '@/lib/h5-auth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SignatureModal from '@/components/h5/SignatureModal';
import '@/components/h5/SignatureModal.css';
import '../service-archive/service-archive.css';
import { BackgroundDecoration } from '@/components/h5/common/BackgroundDecoration';
import { HeaderBar } from '@/components/h5/home/HeaderBar';
import { MenuDropdown } from '@/components/h5/home/MenuDropdown';
import { BottomNavigation } from '@/components/h5/common/BottomNavigation';

interface ServiceArchiveData {
  customerNo: string;
  channels: {
    friendIntro: boolean;
    wechatMini: boolean;
    offlineEvent: boolean;
    meituan: boolean;
    onlinePromo: boolean;
    other: boolean;
    otherText: string;
  };
  basicInfo: {
    name: string;
    sex: 'male' | 'female' | '';
    age: string;
    contact: string;
    weight: string;
    height: string;
  };
  healthHistory: {
    surgeryHistory: {
      location: string;
      time: string;
    };
    chronicDisease: string;
    medication: string;
    allergy: 'no' | 'yes' | '';
    allergyText: string;
    recentCheckup: {
      time: string;
      result: string;
    };
    pregnancyPeriod: string;
    medicalDevice: string;
  };
  subjectiveDemand: string;
  signature1: {
    customer: string;
    signature: string;
    date: string;
  };
  signature2: {
    customer: string;
    signature: string;
    date: string;
  };
  footer: {
    focusTopics: {
      shoulderNeck: boolean;
      insomnia: boolean;
      weightLoss: boolean;
      femaleCare: boolean;
      antiAging: boolean;
      other: boolean;
    };
    joinGroup: string;
    review: string;
    shareMoment: string;
    reward: string;
    satisfaction: string;
  };
}

const defaultData: ServiceArchiveData = {
  customerNo: '',
  channels: {
    friendIntro: false,
    wechatMini: false,
    offlineEvent: false,
    meituan: false,
    onlinePromo: false,
    other: false,
    otherText: ''
  },
  basicInfo: {
    name: '',
    sex: '',
    age: '',
    contact: '',
    weight: '',
    height: ''
  },
  healthHistory: {
    surgeryHistory: {
      location: '',
      time: ''
    },
    chronicDisease: '',
    medication: '',
    allergy: '',
    allergyText: '',
    recentCheckup: {
      time: '',
      result: ''
    },
    pregnancyPeriod: '',
    medicalDevice: ''
  },
  subjectiveDemand: '',
  signature1: {
    customer: '',
    signature: '',
    date: ''
  },
  signature2: {
    customer: '',
    signature: '',
    date: ''
  },
  footer: {
    focusTopics: {
      shoulderNeck: false,
      insomnia: false,
      weightLoss: false,
      femaleCare: false,
      antiAging: false,
      other: false
    },
    joinGroup: '',
    review: '',
    shareMoment: '',
    reward: '',
    satisfaction: ''
  }
};

export default function HealthPage() {
  const router = useRouter();
  const authManager = H5AuthManager.getInstance();
  const [showMenu, setShowMenu] = useState(false);
  const [authState, setAuthState] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState<ServiceArchiveData>(defaultData);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [tempData, setTempData] = useState<ServiceArchiveData>(defaultData);
  const [signatureModal, setSignatureModal] = useState({
    isOpen: false,
    signatureKey: '' as 'signature1' | 'signature2' | null
  });
  const [showFabMenu, setShowFabMenu] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭 FAB 菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setShowFabMenu(false);
      }
    };

    if (showFabMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFabMenu]);

  useEffect(() => {
    setIsClient(true);
    if (!authManager.requireAuth()) {
      return;
    }
    setAuthState(authManager.getAuthState());
    loadData();
  }, [router, authManager]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/health-archives?page=1&pageSize=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (result.code === 0 && result.data.list.length > 0) {
        const archive = result.data.list[0];
        setData({
          customerNo: archive.customerNo || '',
          channels: archive.channels || defaultData.channels,
          basicInfo: archive.basicInfo || defaultData.basicInfo,
          healthHistory: archive.healthHistory || defaultData.healthHistory,
          subjectiveDemand: archive.subjectiveDemand || '',
          signature1: archive.signature1 || defaultData.signature1,
          signature2: archive.signature2 || defaultData.signature2,
          footer: archive.footer || defaultData.footer
        });
      } else {
        await createNewArchive();
      }

      setIsLoading(false);
    } catch (error) {
      console.error('加载数据失败:', error);
      setShowToast(true);
      setToastMessage('加载数据失败');
      setTimeout(() => setShowToast(false), 2000);
      setIsLoading(false);
    }
  };

  const createNewArchive = async () => {
    try {
      const token = localStorage.getItem('token');

      const genResponse = await fetch(
        '/api/health-archives/generate-customer-no',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          credentials: 'include'
        }
      );

      const genResult = await genResponse.json();

      if (genResult.code === 0) {
        const customerNo = genResult.data.customerNo;

        const createResponse = await fetch('/api/health-archives', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          credentials: 'include',
          body: JSON.stringify({
            customerNo,
            channels: defaultData.channels,
            basicInfo: defaultData.basicInfo,
            healthHistory: defaultData.healthHistory,
            subjectiveDemand: defaultData.subjectiveDemand,
            signature1: defaultData.signature1,
            signature2: defaultData.signature2,
            footer: defaultData.footer
          })
        });

        const createResult = await createResponse.json();

        if (createResult.code === 0) {
          setData({
            ...defaultData,
            customerNo: createResult.data.customerNo
          });
        } else {
          throw new Error(createResult.message || '创建档案失败');
        }
      } else {
        throw new Error(genResult.message || '生成客户编号失败');
      }
    } catch (error: any) {
      console.error('创建新档案失败:', error);
      setShowToast(true);
      setToastMessage(error.message || '创建档案失败');
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleUpdate = () => {
    setTempData(JSON.parse(JSON.stringify(data)));
    setIsEditing(true);
    setShowToast(true);
    setToastMessage('已进入编辑模式');
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');

      const listResponse = await fetch(
        `/api/health-archives?customerNo=${data.customerNo}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          credentials: 'include'
        }
      );

      const listResult = await listResponse.json();

      if (listResult.code === 0 && listResult.data.list.length > 0) {
        const archiveId = listResult.data.list[0].id;

        const response = await fetch(`/api/health-archives/${archiveId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          credentials: 'include',
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.code === 0) {
          setIsEditing(false);
          setShowToast(true);
          setToastMessage('保存成功');
          setTimeout(() => setShowToast(false), 2000);
        } else {
          throw new Error(result.message || '保存失败');
        }
      } else {
        throw new Error('未找到要更新的档案');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      setShowToast(true);
      setToastMessage(error.message || '保存失败');
      setTimeout(() => setShowToast(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setData(tempData);
    setIsEditing(false);
    setShowToast(true);
    setToastMessage('已取消编辑');
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleDownload = () => {
    setShowToast(true);
    setToastMessage('下载功能开发中');
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleLogout = () => {
    authManager.clearAuthState();
    router.push('/h5/login');
  };

  const openSignatureModal = (signatureKey: 'signature1' | 'signature2') => {
    if (!isEditing) {
      setShowToast(true);
      setToastMessage('请先点击更新按钮进入编辑模式');
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    setSignatureModal({
      isOpen: true,
      signatureKey
    });
  };

  const closeSignatureModal = () => {
    setSignatureModal({
      isOpen: false,
      signatureKey: null
    });
  };

  const handleSignatureConfirm = (signatureData: string) => {
    if (signatureModal.signatureKey) {
      updateData(`${signatureModal.signatureKey}.signature`, signatureData);
    }
  };

  const updateData = (path: string, value: any) => {
    setData((prevData) => {
      const keys = path.split('.');
      const newData = { ...prevData };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const DateInput = ({
    value,
    onChange,
    disabled,
    placeholder,
    className
  }: {
    value: string;
    onChange: (date: string) => void;
    disabled: boolean;
    placeholder?: string;
    className?: string;
  }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    }, [value]);

    const handleChange = (date: Date | null) => {
      setSelectedDate(date);
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        onChange(formattedDate);
      } else {
        onChange('');
      }
    };

    const formatDateDisplay = (date: Date | null) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return (
      <div className='date-input-wrapper'>
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          disabled={disabled}
          placeholderText={placeholder || '选择日期'}
          dateFormat='yyyy-MM-dd'
          customInput={
            <input
              type='text'
              className={`input-line ${className || ''}`}
              value={formatDateDisplay(selectedDate)}
              disabled={disabled}
              placeholder={placeholder || '选择日期'}
              readOnly
              style={{
                border: 'none',
                borderBottom: '1px solid var(--border-line)'
              }}
            />
          }
        />
      </div>
    );
  };

  if (!isClient || authState === null) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-600'>正在加载...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-600'>正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-600'>正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-cream relative flex h-screen min-h-screen flex-col text-slate-700 antialiased'>
      <BackgroundDecoration />

      {/* 头部区域 */}
      <HeaderBar onMenuClick={() => setShowMenu(!showMenu)} />

      {/* 下拉菜单 */}
      <MenuDropdown
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onLogout={handleLogout}
      />

      {/* 主容器 - 占据剩余空间并可滚动 */}
      <div className='relative z-10 mx-auto flex max-w-lg flex-1 flex-col overflow-hidden'>
        {/* 可滚动内容区域 */}
        <div
          className={`scrollable-content flex-1 overflow-y-auto pb-24 ${isEditing ? 'editing-mode' : ''}`}
        >
          <div className='paper p-4'>
            <div className='header'>
              <div className='logo-section'>
                <div className='logo-box'>
                  <span></span>石墨烯健康生活馆
                </div>
              </div>
              <div className='company-name-right'>
                <div className='cn'>烯灸健康</div>
                <div className='en'>XIXI HEALTH</div>
              </div>
            </div>

            <h1>烯灸客户服务档案</h1>

            <div className='customer-no'>
              客户编号：
              <input
                type='text'
                className='input-line input-lg'
                value={data.customerNo}
                onChange={(e) => updateData('customerNo', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className='section'>
              <div className='section-title'>一、渠道来源:</div>
              <div className='form-row'>
                <label>
                  <input
                    type='checkbox'
                    checked={data.channels.friendIntro}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.channels.friendIntro = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />{' '}
                  朋友介绍
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.channels.wechatMini}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.channels.wechatMini = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />{' '}
                  公众号/小程序
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.channels.offlineEvent}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.channels.offlineEvent = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />{' '}
                  线下活动/宣传单
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.channels.meituan}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.channels.meituan = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />{' '}
                  美团/大众
                </label>
              </div>
              <div className='form-row'>
                <label>
                  <input
                    type='checkbox'
                    checked={data.channels.onlinePromo}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.channels.onlinePromo = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />{' '}
                  线上推广(视频号/抖音/小红书)
                </label>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <label style={{ marginRight: '5px' }}>
                    <input
                      type='checkbox'
                      checked={data.channels.other}
                      onChange={(e) => {
                        const newData = { ...data };
                        newData.channels.other = e.target.checked;
                        if (!e.target.checked) {
                          newData.channels.otherText = '';
                        }
                        setData(newData);
                      }}
                      disabled={!isEditing}
                    />{' '}
                    其他(请注明)
                  </label>
                  <input
                    type='text'
                    className='input-line input-auto'
                    value={data.channels.otherText}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.channels.otherText = e.target.value;
                      setData(newData);
                    }}
                    disabled={!isEditing || !data.channels.other}
                    placeholder={data.channels.other ? '' : '请先勾选"其他"'}
                  />
                </div>
              </div>
            </div>

            <div className='section'>
              <div className='section-title'>二、基础健康数据：</div>

              <div className='sub-divider'>基本信息</div>

              <div className='form-row'>
                <div className='form-item'>
                  姓名：
                  <input
                    type='text'
                    className='input-line input-md'
                    value={data.basicInfo.name}
                    onChange={(e) =>
                      updateData('basicInfo.name', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className='form-item'>
                  性别:
                  <label style={{ margin: '0 5px 0 5px' }}>
                    <input
                      type='radio'
                      name='sex'
                      checked={data.basicInfo.sex === 'male'}
                      onChange={() => {
                        const newData = { ...data };
                        newData.basicInfo.sex = 'male';
                        setData(newData);
                      }}
                      disabled={!isEditing}
                    />
                    男
                  </label>
                  <label style={{ margin: '0' }}>
                    <input
                      type='radio'
                      name='sex'
                      checked={data.basicInfo.sex === 'female'}
                      onChange={() => {
                        const newData = { ...data };
                        newData.basicInfo.sex = 'female';
                        setData(newData);
                      }}
                      disabled={!isEditing}
                    />
                    女
                  </label>
                </div>
                <div className='form-item'>
                  年龄：
                  <input
                    type='text'
                    className='input-line input-sm'
                    value={data.basicInfo.age}
                    onChange={(e) =>
                      updateData('basicInfo.age', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className='form-item' style={{ flex: 1 }}>
                  联系方式：
                  <input
                    type='text'
                    className='input-line'
                    style={{ width: '40%' }}
                    value={data.basicInfo.contact}
                    onChange={(e) =>
                      updateData('basicInfo.contact', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className='form-row'>
                <div className='form-item' style={{ marginLeft: '0em' }}>
                  体重：
                  <input
                    type='text'
                    className='input-line input-sm'
                    value={data.basicInfo.weight}
                    onChange={(e) =>
                      updateData('basicInfo.weight', e.target.value)
                    }
                    disabled={!isEditing}
                  />{' '}
                  Kg
                </div>
                <div className='form-item'>
                  身高：
                  <input
                    type='text'
                    className='input-line input-sm'
                    value={data.basicInfo.height}
                    onChange={(e) =>
                      updateData('basicInfo.height', e.target.value)
                    }
                    disabled={!isEditing}
                  />{' '}
                  cm
                </div>
              </div>

              <div className='sub-divider'>健康史筛查</div>

              <div className='form-row'>
                手术史(部位：
                <input
                  type='text'
                  className='input-line input-md'
                  value={data.healthHistory.surgeryHistory.location}
                  onChange={(e) =>
                    updateData(
                      'healthHistory.surgeryHistory.location',
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                />{' '}
                时间：
                <DateInput
                  value={data.healthHistory.surgeryHistory.time}
                  onChange={(date) =>
                    updateData('healthHistory.surgeryHistory.time', date)
                  }
                  disabled={!isEditing}
                  placeholder='选择日期'
                  className='input-line input-date'
                />
                )
              </div>
              <div className='form-row'>
                慢性病：
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.healthHistory.chronicDisease}
                  onChange={(e) =>
                    updateData('healthHistory.chronicDisease', e.target.value)
                  }
                  disabled={!isEditing}
                />
                <span style={{ margin: '0 5px' }}></span>
                服药情况：
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.healthHistory.medication}
                  onChange={(e) =>
                    updateData('healthHistory.medication', e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className='form-row'>
                过敏:
                <label style={{ margin: '0 5px' }}>
                  <input
                    type='radio'
                    name='allergy'
                    checked={data.healthHistory.allergy === 'no'}
                    onChange={() => {
                      const newData = { ...data };
                      newData.healthHistory.allergy = 'no';
                      if (newData.healthHistory.allergy === 'no') {
                        newData.healthHistory.allergyText = '';
                      }
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  否
                </label>
                <label style={{ margin: '0 5px' }}>
                  <input
                    type='radio'
                    name='allergy'
                    checked={data.healthHistory.allergy === 'yes'}
                    onChange={() => {
                      const newData = { ...data };
                      newData.healthHistory.allergy = 'yes';
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  是
                </label>
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.healthHistory.allergyText}
                  onChange={(e) => {
                    const newData = { ...data };
                    newData.healthHistory.allergyText = e.target.value;
                    setData(newData);
                  }}
                  disabled={!isEditing || data.healthHistory.allergy !== 'yes'}
                  placeholder={
                    data.healthHistory.allergy === 'yes'
                      ? '请填写过敏信息'
                      : '选择"是"后填写'
                  }
                />
                <span style={{ margin: '0 5px' }}></span>
                近期医院检查(时间:
                <DateInput
                  value={data.healthHistory.recentCheckup.time}
                  onChange={(date) =>
                    updateData('healthHistory.recentCheckup.time', date)
                  }
                  disabled={!isEditing}
                  placeholder='选择日期'
                  className='input-line input-date'
                />{' '}
                诊断结果:
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.healthHistory.recentCheckup.result}
                  onChange={(e) =>
                    updateData(
                      'healthHistory.recentCheckup.result',
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                />
                )
              </div>
              <div className='form-row'>
                孕期/月经期/体内肿瘤{' '}
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.healthHistory.pregnancyPeriod}
                  onChange={(e) =>
                    updateData('healthHistory.pregnancyPeriod', e.target.value)
                  }
                  disabled={!isEditing}
                />
                <span style={{ margin: '0 5px' }}></span>
                植入医疗设备{' '}
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.healthHistory.medicalDevice}
                  onChange={(e) =>
                    updateData('healthHistory.medicalDevice', e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className='sub-divider'>客户主观诉求</div>
              <center
                style={{
                  marginBottom: '20px',
                  padding: '0 1.5em',
                  color: '#777',
                  fontSize: '12px'
                }}
              >
                (例:肩颈酸痛持续3个月,睡眠质量差,美容等)
              </center>
            </div>

            <hr
              style={{
                border: 0,
                borderTop: '1px solid #000',
                margin: '30px 0'
              }}
            />

            <div className='section'>
              <div
                style={{
                  textAlign: 'center',
                  color: '#d32f2f',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
              >
                禁忌症告知
              </div>
              <div className='warning-box'>
                以下人群不建议使用本烯灸服务:怀孕女士、女性经期、严重高血压&gt;140/90mmHg、体内植入电子医疗设备(如心脏起搏器)、癌症晚期、正在发烧、醉酒后、过饿或过饱、重疾者、年老体弱者。
              </div>

              <div className='declaration'>
                本人确认:已阅读禁忌症清单且不属于任何禁忌人群,理解烯灸非医疗行为,自愿承担因隐瞒病史导致的后果。
              </div>

              <div className='signature-area'>
                <div className='sign-item'>
                  客户签名:
                  {data.signature1.signature ? (
                    <div
                      className='signature-preview'
                      onClick={() => openSignatureModal('signature1')}
                      title='点击重新签名'
                    >
                      <img src={data.signature1.signature} alt='客户签名' />
                    </div>
                  ) : (
                    <>
                      <input
                        type='text'
                        className='input-line input-md'
                        value={data.signature1.customer}
                        onChange={(e) =>
                          updateData('signature1.customer', e.target.value)
                        }
                        disabled={!isEditing}
                        placeholder='输入姓名'
                      />
                      <button
                        type='button'
                        className='signature-trigger-btn'
                        onClick={() => openSignatureModal('signature1')}
                        disabled={!isEditing}
                      >
                        ✍️ 手写签名
                      </button>
                    </>
                  )}
                </div>
                <div className='sign-item'>
                  日期:
                  <DateInput
                    value={data.signature1.date}
                    onChange={(date) => updateData('signature1.date', date)}
                    disabled={!isEditing}
                    placeholder='选择日期'
                    className='input-line input-date'
                  />
                </div>
              </div>
            </div>

            <div className='section'>
              <div className='declaration' style={{ fontWeight: 'normal' }}>
                本人授权烯灸公司使用本人的数据用于个性化服务制定。(您的健康数据存储期为服务终止后2年,届满后将匿名化处理。)
              </div>
              <div className='signature-area'>
                <div className='sign-item'>
                  客户签名:
                  {data.signature2.signature ? (
                    <div
                      className='signature-preview'
                      onClick={() => openSignatureModal('signature2')}
                      title='点击重新签名'
                    >
                      <img src={data.signature2.signature} alt='客户签名' />
                    </div>
                  ) : (
                    <>
                      <input
                        type='text'
                        className='input-line input-md'
                        value={data.signature2.customer}
                        onChange={(e) =>
                          updateData('signature2.customer', e.target.value)
                        }
                        disabled={!isEditing}
                        placeholder='输入姓名'
                      />
                      <button
                        type='button'
                        className='signature-trigger-btn'
                        onClick={() => openSignatureModal('signature2')}
                        disabled={!isEditing}
                      >
                        ✍️ 手写签名
                      </button>
                    </>
                  )}
                </div>
                <div className='sign-item'>
                  日期:
                  <DateInput
                    value={data.signature2.date}
                    onChange={(date) => updateData('signature2.date', date)}
                    disabled={!isEditing}
                    placeholder='选择日期'
                    className='input-line input-date'
                  />
                </div>
              </div>
            </div>

            <div className='footer-area'>
              <div className='footer-row'>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
                  重点关注话题:
                </span>
                <label>
                  <input
                    type='checkbox'
                    checked={data.footer.focusTopics.shoulderNeck}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.footer.focusTopics.shoulderNeck =
                        e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  肩颈养护
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.footer.focusTopics.insomnia}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.footer.focusTopics.insomnia = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  失眠改善
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.footer.focusTopics.weightLoss}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.footer.focusTopics.weightLoss = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  减肥排毒
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.footer.focusTopics.femaleCare}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.footer.focusTopics.femaleCare = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  女性调理
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.footer.focusTopics.antiAging}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.footer.focusTopics.antiAging = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  抗衰美容
                </label>
                <label>
                  <input
                    type='checkbox'
                    checked={data.footer.focusTopics.other}
                    onChange={(e) => {
                      const newData = { ...data };
                      newData.footer.focusTopics.other = e.target.checked;
                      setData(newData);
                    }}
                    disabled={!isEditing}
                  />
                  其他
                </label>
              </div>

              <div className='footer-row'>
                <div
                  style={{ width: '45%', display: 'flex', marginRight: '5%' }}
                >
                  加群:
                  <input
                    type='text'
                    className='input-line input-auto'
                    value={data.footer.joinGroup}
                    onChange={(e) =>
                      updateData('footer.joinGroup', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div style={{ width: '50%', display: 'flex' }}>
                  写/发评价:
                  <input
                    type='text'
                    className='input-line input-auto'
                    value={data.footer.review}
                    onChange={(e) =>
                      updateData('footer.review', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className='footer-row'>
                朋友圈分享:
                <input
                  type='text'
                  className='input-line input-auto'
                  value={data.footer.shareMoment}
                  onChange={(e) =>
                    updateData('footer.shareMoment', e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className='footer-row'>
                <div
                  style={{ width: '45%', display: 'flex', marginRight: '5%' }}
                >
                  奖励发放:
                  <input
                    type='text'
                    className='input-line input-auto'
                    value={data.footer.reward}
                    onChange={(e) =>
                      updateData('footer.reward', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div style={{ width: '50%', display: 'flex' }}>
                  回访满意度及建议:
                  <input
                    type='text'
                    className='input-line input-auto'
                    value={data.footer.satisfaction}
                    onChange={(e) =>
                      updateData('footer.satisfaction', e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className='internal-mark'>内部资料,外泄必究</div>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <BottomNavigation />

      {/* Toast 提示 */}
      {showToast && (
        <div className='animate-fade-in fixed top-32 left-1/2 z-50 -translate-x-1/2 transform rounded-lg bg-gray-800 px-6 py-3 text-white shadow-lg'>
          {toastMessage}
        </div>
      )}

      {/* 浮动操作按钮 (FAB) */}
      <div
        ref={fabRef}
        className='fixed right-4 bottom-24 z-30 flex flex-col items-end gap-2'
      >
        {/* FAB 展开菜单 */}
        {showFabMenu && (
          <div className='animate-fade-in mb-2 flex flex-col gap-2'>
            {!isEditing ? (
              <button
                onClick={() => {
                  handleUpdate();
                  setShowFabMenu(false);
                }}
                className='from-primary to-secondary flex items-center gap-2 rounded-2xl bg-gradient-to-br px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl active:scale-95'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                <span>更新档案</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    handleSave();
                    setShowFabMenu(false);
                  }}
                  disabled={isSaving}
                  className='from-primary to-secondary flex items-center gap-2 rounded-2xl bg-gradient-to-br px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isSaving ? (
                    <>
                      <svg
                        className='h-4 w-4 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className='h-4 w-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                      <span>保存</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleCancel();
                    setShowFabMenu(false);
                  }}
                  className='bg-neumorphic-light shadow-neumorphic hover:shadow-neumorphic-hover flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all active:scale-95'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                  <span>取消编辑</span>
                </button>
                <button
                  onClick={() => {
                    handleDownload();
                    setShowFabMenu(false);
                  }}
                  className='from-accent flex items-center gap-2 rounded-2xl bg-gradient-to-br to-orange-400 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl active:scale-95'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                    />
                  </svg>
                  <span>下载档案</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* FAB 主按钮 */}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`from-primary to-secondary shadow-neumorphic hover:shadow-neumorphic-hover flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white transition-all duration-300 hover:scale-105 active:scale-95 ${showFabMenu ? 'rotate-45' : ''}`}
        >
          {showFabMenu ? (
            <svg
              className='h-6 w-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2.5}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          ) : (
            <svg
              className='h-6 w-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          )}
        </button>
      </div>

      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={closeSignatureModal}
        onConfirm={handleSignatureConfirm}
        title={
          signatureModal.signatureKey === 'signature1'
            ? '禁忌症告知 - 客户签名'
            : '数据授权 - 客户签名'
        }
        existingSignature={
          signatureModal.signatureKey
            ? data[signatureModal.signatureKey].signature
            : undefined
        }
      />
    </div>
  );
}
