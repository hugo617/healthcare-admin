/**
 * 序列化工具函数
 * 用于处理数据库返回的数据，将BigInt等类型转换为可序列化的格式
 */

import { ServiceArchive } from '@/db/schema';

/**
 * 序列化服务档案对象，将BigInt字段转换为字符串
 */
export function serializeServiceArchive(archive: any): any {
  if (!archive) return null;

  return {
    ...archive,
    id: archive.id?.toString() || archive.id,
    userId: archive.userId,
    tenantId: archive.tenantId?.toString() || archive.tenantId || null,
    createdBy: archive.createdBy?.toString() || archive.createdBy || null,
    updatedBy: archive.updatedBy?.toString() || archive.updatedBy || null,
    deletedAt: archive.deletedAt || null
  };
}

/**
 * 序列化服务档案列表
 */
export function serializeServiceArchiveList(list: any[]): any[] {
  return list.map(serializeServiceArchive);
}

/**
 * 序列化服务记录对象，将BigInt字段转换为字符串
 */
export function serializeServiceRecord(record: any): any {
  if (!record) return null;

  return {
    ...record,
    id: record.id?.toString() || record.id,
    archiveId: record.archiveId?.toString() || record.archiveId,
    userId: record.userId,
    createdBy: record.createdBy?.toString() || record.createdBy || null,
    updatedBy: record.updatedBy?.toString() || record.updatedBy || null,
    deletedAt: record.deletedAt || null
  };
}

/**
 * 序列化服务记录列表
 */
export function serializeServiceRecordList(list: any[]): any[] {
  return list.map(serializeServiceRecord);
}
