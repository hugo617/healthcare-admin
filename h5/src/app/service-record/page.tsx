'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import SignatureModal from '@/components/SignatureModal';
import '@/components/SignatureModal.css';

interface BloodPressure {
  high: number;
  low: number;
}

interface Discomfort {
  tags: string[];
  otherText: string;
}

interface ConsultantSignature {
  name: string;
  signature: string; // Base64格式的签名图片
}

interface ServiceRecord {
  id: number;
  date: string;
  count: number;
  bloodPressure: BloodPressure;
  discomfort: Discomfort;
  duration: number;
  temperature: number;
  feedback: string;
  consultant: ConsultantSignature;
}

const DISCOMFORT_TAGS = ['无', '头晕', '胸闷', '乏力', '肩颈疼痛'];

const DEFAULT_RECORD: Omit<ServiceRecord, 'id' | 'count' | 'date'> = {
  bloodPressure: { high: 0, low: 0 },
  discomfort: { tags: ['无'], otherText: '' },
  duration: 45,
  temperature: 45,
  feedback: '',
  consultant: { name: '李顾问', signature: '' },
};

export default function ServiceRecordPage() {
  const router = useRouter();
  const authManager = AuthManager.getInstance();
  const [isClient, setIsClient] = useState(false);
  const [authState, setAuthState] = useState<any | null>(null);

  // 记录列表
  const [records, setRecords] = useState<ServiceRecord[]>([
    {
      id: 1,
      date: '2023/12/30',
      count: 1,
      bloodPressure: { high: 125, low: 82 },
      discomfort: { tags: ['无'], otherText: '' },
      duration: 45,
      temperature: 45,
      feedback: '身体微微发汗，感觉良好。',
      consultant: { name: '李顾问', signature: '' },
    },
  ]);

  // 抽屉状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);

  // 签名模态框状态
  const [signatureModal, setSignatureModal] = useState({
    isOpen: false,
  });

  // 表单数据
  const [formData, setFormData] = useState({
    bloodPressure: { high: 0, low: 0 },
    discomfort: { tags: ['无'], otherText: '' },
    duration: 45,
    temperature: 45,
    feedback: '',
    consultant: { name: '李顾问', signature: '' },
  });

  // 血压预警状态
  const [bpStatus, setBpStatus] = useState<'normal' | 'warning' | 'danger'>('normal');

  useEffect(() => {
    setIsClient(true);
    if (!authManager.requireAuth()) {
      return;
    }
    setAuthState(authManager.getAuthState());
  }, [router]);

  const handleBack = () => {
    router.push('/');
  };

  // 获取下一次的序号
  const getNextCount = () => {
    if (records.length === 0) return 1;
    return Math.max(...records.map((r) => r.count)) + 1;
  };

  // 打开新增抽屉
  const handleAddNew = () => {
    setIsEditing(false);
    setEditingRecordId(null);
    setFormData({
      bloodPressure: { high: 0, low: 0 },
      discomfort: { tags: ['无'], otherText: '' },
      duration: 45,
      temperature: 45,
      feedback: '',
      consultant: { name: '李顾问', signature: '' },
    });
    setBpStatus('normal');
    setIsDrawerOpen(true);
  };

  // 打开编辑抽屉
  const handleEdit = (recordId: number) => {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;

    setIsEditing(true);
    setEditingRecordId(recordId);
    setFormData({
      bloodPressure: { ...record.bloodPressure },
      discomfort: { ...record.discomfort },
      duration: record.duration,
      temperature: record.temperature,
      feedback: record.feedback,
      consultant: { ...record.consultant },
    });
    checkBpStatus(record.bloodPressure.high, record.bloodPressure.low);
    setIsDrawerOpen(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // 打开签名模态框
  const openSignatureModal = () => {
    setSignatureModal({ isOpen: true });
  };

  // 关闭签名模态框
  const closeSignatureModal = () => {
    setSignatureModal({ isOpen: false });
  };

  // 处理签名确认
  const handleSignatureConfirm = (signatureData: string) => {
    setFormData({
      ...formData,
      consultant: { ...formData.consultant, signature: signatureData },
    });
  };

  // 血压实时检测
  const checkBpStatus = (high: number, low: number) => {
    if (!high || !low) {
      setBpStatus('normal');
      return;
    }
    if (high >= 160 || low >= 100) {
      setBpStatus('danger');
    } else if (high >= 140 || low >= 90) {
      setBpStatus('warning');
    } else {
      setBpStatus('normal');
    }
  };

  // 处理血压输入
  const handleBpChange = (field: 'high' | 'low', value: string) => {
    const numValue = parseInt(value) || 0;
    const newBp = { ...formData.bloodPressure, [field]: numValue };
    setFormData({ ...formData, bloodPressure: newBp });
    checkBpStatus(newBp.high, newBp.low);
  };

  // 处理不适标签切换
  const handleDiscomfortTagToggle = (tag: string) => {
    let newTags: string[];

    if (tag === '无') {
      // 选"无"时，清空其他标签
      newTags = ['无'];
      setFormData({
        ...formData,
        discomfort: { tags: newTags, otherText: '' },
      });
      return;
    }

    // 选其他标签时，先移除"无"
    const filteredTags = formData.discomfort.tags.filter((t) => t !== '无');

    // 切换当前标签
    if (filteredTags.includes(tag)) {
      newTags = filteredTags.filter((t) => t !== tag);
      // 如果没有标签了，默认选"无"
      if (newTags.length === 0) {
        newTags = ['无'];
      }
    } else {
      newTags = [...filteredTags, tag];
    }

    setFormData({
      ...formData,
      discomfort: { ...formData.discomfort, tags: newTags },
    });
  };

  // 保存记录
  const handleSave = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getDate()
    ).padStart(2, '0')}`;

    if (isEditing && editingRecordId !== null) {
      // 编辑模式：更新现有记录
      setRecords(
        records.map((r) =>
          r.id === editingRecordId
            ? {
                ...r,
                ...formData,
                bloodPressure: { ...formData.bloodPressure },
                discomfort: { ...formData.discomfort },
                consultant: { ...formData.consultant },
              }
            : r
        )
      );
    } else {
      // 新增模式：添加新记录
      const newRecord: ServiceRecord = {
        id: Date.now(),
        date: dateStr,
        count: getNextCount(),
        bloodPressure: { ...formData.bloodPressure },
        discomfort: { ...formData.discomfort },
        duration: formData.duration,
        temperature: formData.temperature,
        feedback: formData.feedback || '良好',
        consultant: { ...formData.consultant },
      };
      setRecords([...records, newRecord]);
    }

    setIsDrawerOpen(false);
  };

  // 删除记录
  const handleDelete = () => {
    if (editingRecordId === null) return;
    if (confirm('确定删除本条档案记录吗？')) {
      setRecords(records.filter((r) => r.id !== editingRecordId));
      setIsDrawerOpen(false);
    }
  };

  // 获取血压样式类
  const getBpClass = (high: number, low: number) => {
    if (high >= 160 || low >= 100) return 'text-red-500 font-bold underline';
    if (high >= 140 || low >= 90) return 'text-orange-500 font-bold';
    return '';
  };

  // 获取血压提示信息
  const getBpHint = () => {
    if (bpStatus === 'danger') {
      return { text: '🚨 极高压：严禁理疗，建议就医！', color: 'text-red-500' };
    }
    if (bpStatus === 'warning') {
      return { text: '⚠️ 血压偏高：请调低理疗温度并观察。', color: 'text-orange-500' };
    }
    return { text: '✅ 血压正常', color: 'text-teal-600' };
  };

  // 获取血压卡片样式
  const getBpCardClass = () => {
    if (bpStatus === 'danger') return 'bg-red-50 border-red-500';
    if (bpStatus === 'warning') return 'bg-orange-50 border-orange-500';
    return 'bg-white border-gray-200';
  };

  if (!isClient || authState === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* 顶部状态栏 */}
      <header className="bg-white px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="font-bold text-teal-700">烯灸健康管理系统</div>
        <div className="text-xs text-gray-600">
          客户：{authState.user?.email || '张美玲'} (VIP)
        </div>
      </header>

      {/* 档案展示区 */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
        {/* 还原纸质表格 A4 比例 */}
        <div className="bg-white w-full max-w-[210mm] p-6 shadow-lg">
          {/* 纸张头部 */}
          <div className="text-center mb-5">
            <div className="text-left text-lg font-bold text-gray-800 mb-1 flex items-center">
              <span className="text-red-600 mr-1 text-xl">■</span>
              石墨烯健康生活馆
            </div>
            <h1 className="text-2xl font-bold tracking-wider my-2">烯灸服务记录</h1>
            <div className="text-right text-sm">
              会员卡种类：<span className="border-b border-black inline-block w-[120px]"></span>
            </div>
          </div>

          {/* 表格 */}
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-sm w-[15%]">次数/日期</th>
                <th className="border border-black p-2 text-sm w-[85%]">健康记录与理疗内容</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <React.Fragment key={record.id}>
                  <tr
                    className="cursor-pointer hover:bg-teal-50/50 active:bg-teal-50"
                    onClick={() => handleEdit(record.id)}
                  >
                    <td rowSpan={2} className="border border-black p-2 text-center align-top text-sm">
                      {record.count}
                      <br />
                      {record.date}
                    </td>
                    <td className="border border-black p-2 text-sm leading-relaxed">
                      血压：
                      <span className={getBpClass(record.bloodPressure.high, record.bloodPressure.low)}>
                        {record.bloodPressure.high}/{record.bloodPressure.low}
                      </span>{' '}
                      &nbsp; 是否有身体不适：
                      <span>{record.discomfort.tags.join('、')}</span>
                      {record.discomfort.otherText && ` (${record.discomfort.otherText})`} &nbsp; 时长：
                      <span>{record.duration}</span>min &nbsp; 温度：<span>{record.temperature}</span>℃
                      &nbsp; 顾问：
                      {record.consultant.signature ? (
                        <span className="inline-flex items-center">
                          <img
                            src={record.consultant.signature}
                            alt="签名"
                            className="h-4 w-auto align-middle ml-1 inline-block"
                          />
                        </span>
                      ) : (
                        <span className="text-gray-600">{record.consultant.name || '未签名'}</span>
                      )}
                    </td>
                  </tr>
                  <tr
                    className="cursor-pointer hover:bg-teal-50/50 active:bg-teal-50"
                    onClick={() => handleEdit(record.id)}
                  >
                    <td className="border border-black p-2 text-sm">
                      理疗后感受：<span>{record.feedback}</span>
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* 新增入口 */}
              <tr>
                <td
                  colSpan={2}
                  className="border-2 border-dashed border-teal-600 text-teal-600 text-center font-bold p-6 cursor-pointer hover:bg-teal-50/50 transition-colors"
                  onClick={handleAddNew}
                >
                  + 填写今日服务记录 (第 {getNextCount()} 次)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseDrawer}
      ></div>

      {/* 录入抽屉式表单 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gray-50 rounded-t-3xl shadow-2xl z-50 max-h-[92vh] flex flex-col transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 抽屉头部 */}
        <div className="p-5 text-center border-b border-gray-200 relative">
          <button
            className="absolute left-5 top-5 text-gray-400 text-sm"
            onClick={handleCloseDrawer}
          >
            取消
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? `修改第 ${records.find((r) => r.id === editingRecordId)?.count} 次记录` : `第 ${getNextCount()} 次服务录入`}
          </h2>
        </div>

        {/* 抽屉内容 */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* 服务前评估：血压测量 */}
          <div>
            <div className="text-sm text-teal-600 font-bold mb-3 flex items-center">
              <span className="w-1 h-3.5 bg-teal-600 mr-2 rounded"></span>
              服务前评估：血压测量
            </div>
            <div className={`bg-white p-4 rounded-2xl border ${getBpCardClass()} transition-all`}>
              <label className="text-xs text-gray-400">收缩压(高压) / 舒张压(低压)</label>
              <div className="flex items-center gap-2.5 mt-2.5">
                <input
                  type="number"
                  className="flex-1 p-3.5 border border-gray-300 rounded-xl text-xl text-center outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  placeholder="0"
                  value={formData.bloodPressure.high || ''}
                  onChange={(e) => handleBpChange('high', e.target.value)}
                />
                <span className="text-2xl text-gray-300">/</span>
                <input
                  type="number"
                  className="flex-1 p-3.5 border border-gray-300 rounded-xl text-xl text-center outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  placeholder="0"
                  value={formData.bloodPressure.low || ''}
                  onChange={(e) => handleBpChange('low', e.target.value)}
                />
              </div>
              <div className={`text-xs font-bold text-center mt-2 h-4 ${getBpHint().color}`}>
                {formData.bloodPressure.high && formData.bloodPressure.low ? getBpHint().text : ''}
              </div>
            </div>
          </div>

          {/* 是否有身体不适 */}
          <div>
            <div className="text-sm text-teal-600 font-bold mb-3 flex items-center">
              <span className="w-1 h-3.5 bg-teal-600 mr-2 rounded"></span>
              是否有身体不适
            </div>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {DISCOMFORT_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`px-4 py-2 rounded-full text-sm cursor-pointer border transition-colors ${
                    formData.discomfort.tags.includes(tag)
                      ? 'bg-teal-50 text-teal-600 border-teal-600 font-bold'
                      : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                  }`}
                  onClick={() => handleDiscomfortTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
              rows={2}
              placeholder="如有其他特殊情况，请在此补充描述..."
              value={formData.discomfort.otherText}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discomfort: { ...formData.discomfort, otherText: e.target.value },
                })
              }
            ></textarea>
          </div>

          {/* 理疗情况 */}
          <div>
            <div className="text-sm text-teal-600 font-bold mb-3 flex items-center">
              <span className="w-1 h-3.5 bg-teal-600 mr-2 rounded"></span>
              理疗情况
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-400">时长 (min)</label>
                <input
                  type="number"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-base text-center outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 mt-1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 45 })}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400">温度 (℃)</label>
                <input
                  type="number"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-base text-center outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 mt-1"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: parseInt(e.target.value) || 45 })
                  }
                />
              </div>
            </div>
          </div>

          {/* 本次理疗后感受 */}
          <div>
            <div className="text-sm text-teal-600 font-bold mb-3 flex items-center">
              <span className="w-1 h-3.5 bg-teal-600 mr-2 rounded"></span>
              本次理疗后感受
            </div>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
              rows={2}
              placeholder="填写客户理疗后的主观反馈..."
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            ></textarea>
            <div className="mt-4">
              <label className="text-xs text-gray-400">健康顾问签名</label>
              <div
                className="mt-2 min-h-[60px] border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all bg-white"
                onClick={openSignatureModal}
              >
                {formData.consultant.signature ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={formData.consultant.signature}
                      alt="顾问签名"
                      className="h-12 w-auto max-w-[200px]"
                    />
                    <p className="text-xs text-gray-400 mt-1">点击重新签名</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="text-sm">点击手写签名</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="p-5 flex gap-3 bg-white border-t border-gray-200">
          {isEditing && (
            <button
              className="flex-1 py-4 rounded-xl text-base font-bold text-red-500 border border-red-500 hover:bg-red-50 active:scale-95 transition-all"
              onClick={handleDelete}
            >
              删除
            </button>
          )}
          <button
            className="flex-1 py-4 rounded-xl text-base font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all"
            onClick={handleSave}
          >
            保存归档
          </button>
        </div>
      </div>

      {/* 签名模态框 */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={closeSignatureModal}
        onConfirm={handleSignatureConfirm}
        title="健康顾问签名"
      />
    </div>
  );
}
