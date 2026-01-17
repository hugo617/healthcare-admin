import { z } from 'zod';

// 客户编号验证
const customerNoSchema = z
  .string()
  .regex(/^C\d{12}$/, '客户编号格式不正确,应为C+12位数字');

// 渠道来源验证
const channelsSchema = z.object({
  friendIntro: z.boolean().default(false),
  wechatMini: z.boolean().default(false),
  offlineEvent: z.boolean().default(false),
  meituan: z.boolean().default(false),
  onlinePromo: z.boolean().default(false),
  other: z.boolean().default(false),
  otherText: z.string().default('')
});

// 基础信息验证
const basicInfoSchema = z.object({
  name: z.string().max(50, '姓名不能超过50个字符').default(''),
  sex: z.enum(['male', 'female', '']).default(''),
  age: z
    .string()
    .refine((val) => !val || /^\d{1,3}$/.test(val), '年龄格式不正确')
    .default(''),
  contact: z
    .string()
    .refine((val) => !val || /^1[3-9]\d{9}$/.test(val), '手机号格式不正确')
    .default(''),
  weight: z
    .string()
    .refine((val) => !val || /^\d+(\.\d+)?$/.test(val), '体重格式不正确')
    .default(''),
  height: z
    .string()
    .refine((val) => !val || /^\d+(\.\d+)?$/.test(val), '身高格式不正确')
    .default('')
});

// 健康史验证
const healthHistorySchema = z.object({
  surgeryHistory: z.object({
    location: z.string().default(''),
    time: z
      .string()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        '日期格式不正确'
      )
      .default('')
  }),
  chronicDisease: z.string().default(''),
  medication: z.string().default(''),
  allergy: z.enum(['no', 'yes', '']).default(''),
  allergyText: z.string().default(''),
  recentCheckup: z.object({
    time: z
      .string()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        '日期格式不正确'
      )
      .default(''),
    result: z.string().default('')
  }),
  pregnancyPeriod: z.string().default(''),
  medicalDevice: z.string().default('')
});

// 签名验证
const signatureSchema = z.object({
  customer: z.string().max(50, '签名不能超过50个字符').default(''),
  signature: z
    .string()
    .default('')
    .refine((val) => {
      if (!val) return true;
      // 验证Base64格式
      return val.startsWith('data:image/') && val.includes('base64,');
    }, '签名格式不正确,应为Base64格式图片'),
  date: z
    .string()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), '日期格式不正确')
    .default('')
});

// 底部区域验证
const footerSchema = z.object({
  focusTopics: z.object({
    shoulderNeck: z.boolean().default(false),
    insomnia: z.boolean().default(false),
    weightLoss: z.boolean().default(false),
    femaleCare: z.boolean().default(false),
    antiAging: z.boolean().default(false),
    other: z.boolean().default(false)
  }),
  joinGroup: z.string().default(''),
  review: z.string().default(''),
  shareMoment: z.string().default(''),
  reward: z.string().default(''),
  satisfaction: z.string().default('')
});

// 完整的档案验证
export const createHealthArchiveSchema = z.object({
  customerNo: customerNoSchema.optional(),
  channels: channelsSchema,
  basicInfo: basicInfoSchema,
  healthHistory: healthHistorySchema,
  subjectiveDemand: z
    .string()
    .max(500, '主观诉求不能超过500个字符')
    .default(''),
  signature1: signatureSchema,
  signature2: signatureSchema,
  footer: footerSchema
});

// 更新档案验证(所有字段可选)
export const updateHealthArchiveSchema = createHealthArchiveSchema.partial();

// 查询参数验证
export const healthArchiveQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  customerNo: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});
