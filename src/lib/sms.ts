import Dysmsapi, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';

/**
 * 阿里云短信服务配置
 */
interface SmsConfig {
  accessKeyId: string;
  accessKeySecret: string;
  regionId: string;
  signName: string;
  templateCode: string;
}

/**
 * 短信发送结果
 */
interface SendResult {
  success: boolean;
  requestId?: string;
  code?: string;
  message?: string;
}

/**
 * 短信服务类
 */
export class SmsService {
  private static instance: SmsService;
  private client: Dysmsapi;
  private config: SmsConfig;

  private constructor() {
    // 从环境变量读取配置
    this.config = {
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
      regionId: process.env.ALIYUN_SMS_REGION_ID || 'cn-hangzhou',
      signName: process.env.ALIYUN_SMS_SIGN_NAME || '',
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || ''
    };

    // 初始化阿里云 SMS 客户端
    const config = new OpenApi.Config({
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      regionId: this.config.regionId
    });

    this.client = new Dysmsapi(config);
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }

  /**
   * 发送验证码短信
   * @param phone 手机号
   * @param code 验证码
   * @returns 发送结果
   */
  async sendVerificationCode(phone: string, code: string): Promise<SendResult> {
    try {
      const request = new SendSmsRequest({
        phoneNumbers: phone,
        signName: this.config.signName,
        templateCode: this.config.templateCode,
        templateParam: JSON.stringify({ code })
      });

      // 使用正确的 API 方法
      const response = await this.client.sendSms(request);

      if (response.statusCode === 200 && response.body?.code === 'OK') {
        return {
          success: true,
          requestId: response.body.requestId,
          code: response.body.code,
          message: '发送成功'
        };
      } else {
        return {
          success: false,
          requestId: response.body?.requestId,
          code: response.body?.code,
          message: response.body?.message || '发送失败'
        };
      }
    } catch (error: any) {
      console.error('发送短信验证码失败:', error);
      return {
        success: false,
        message: error.message || '发送短信验证码失败'
      };
    }
  }

  /**
   * 验证手机号格式
   * @param phone 手机号
   * @returns 是否有效
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 生成随机验证码
   * @param length 验证码长度，默认6位
   * @returns 验证码
   */
  static generateCode(length: number = 6): string {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }
}

// 导出默认实例
export default SmsService.getInstance();
