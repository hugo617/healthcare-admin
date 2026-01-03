import { z } from 'zod';

/**
 * 血压验证 Schema
 */
const bloodPressureSchema = z.object({
  high: z
    .number()
    .int()
    .min(0, '收缩压不能为负数')
    .max(300, '收缩压不能超过300')
    .default(0),
  low: z
    .number()
    .int()
    .min(0, '舒张压不能为负数')
    .max(200, '舒张压不能超过200')
    .default(0)
});

/**
 * 身体不适情况验证 Schema
 */
const discomfortSchema = z.object({
  tags: z
    .array(z.enum(['无', '头晕', '胸闷', '乏力', '肩颈疼痛']))
    .default(['无']),
  otherText: z.string().max(200, '其他描述不能超过200个字符').default('')
});

/**
 * 顾问签名验证 Schema
 */
const consultantSchema = z.object({
  name: z.string().max(50, '顾问姓名不能超过50个字符').default(''),
  signature: z
    .string()
    .default('')
    .refine(
      (val) => {
        if (!val) return true;
        // 验证Base64格式
        return val.startsWith('data:image/') && val.includes('base64,');
      },
      {
        message: '签名格式不正确，应为Base64格式图片'
      }
    )
});

/**
 * 服务日期验证 Schema (YYYY/MM/DD 格式)
 */
const serviceDateSchema = z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, {
  message: '日期格式不正确，应为YYYY/MM/DD'
});

/**
 * 创建服务记录验证 Schema
 */
export const createServiceRecordSchema = z.object({
  archiveId: z.string().optional(),
  serviceDate: serviceDateSchema.optional(),
  bloodPressure: bloodPressureSchema,
  discomfort: discomfortSchema,
  duration: z
    .number()
    .int()
    .min(10, '理疗时长不能少于10分钟')
    .max(180, '理疗时长不能超过180分钟')
    .default(45),
  temperature: z
    .number()
    .int()
    .min(30, '理疗温度不能低于30℃')
    .max(70, '理疗温度不能高于70℃')
    .default(45),
  feedback: z.string().max(500, '理疗感受不能超过500个字符').default(''),
  consultant: consultantSchema
});

/**
 * 更新服务记录验证 Schema (所有字段可选)
 */
export const updateServiceRecordSchema = createServiceRecordSchema.partial();

/**
 * 查询参数验证 Schema
 */
export const serviceRecordQuerySchema = z.object({
  page: z.coerce.number().min(1, '页码不能小于1').default(1),
  pageSize: z.coerce
    .number()
    .min(1, '每页数量不能小于1')
    .max(100, '每页数量不能超过100')
    .default(10),
  archiveId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, '开始日期格式不正确')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, '结束日期格式不正确')
    .optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional()
});
