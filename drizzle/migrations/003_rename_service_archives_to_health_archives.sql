-- 重命名 service_archives 表为 health_archives
ALTER TABLE service_archives RENAME TO health_archives;

-- 重命名索引
ALTER INDEX idx_service_archives_user_id RENAME TO idx_health_archives_user_id;
ALTER INDEX idx_service_archives_customer_no RENAME TO idx_health_archives_customer_no;
ALTER INDEX idx_service_archives_status RENAME TO idx_health_archives_status;
ALTER INDEX idx_service_archives_created_at RENAME TO idx_health_archives_created_at;
ALTER INDEX idx_service_archives_is_deleted RENAME TO idx_health_archives_is_deleted;

-- 重命名唯一约束
ALTER TABLE health_archives RENAME CONSTRAINT service_archives_user_customer_unique TO health_archives_user_customer_unique;

-- 更新外键引用（service_records 表的外键）
-- 先删除旧的外键约束
ALTER TABLE service_records DROP CONSTRAINT service_records_archive_id_fkey;

-- 重新创建外键约束，指向新的 health_archives 表
ALTER TABLE service_records ADD CONSTRAINT service_records_archive_id_fkey
  FOREIGN KEY (archive_id) REFERENCES health_archives(id) ON DELETE CASCADE;
