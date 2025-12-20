-- 多租户基础架构迁移
-- 创建时间：2024-01-XX
-- 描述：为 N-Admin 项目添加多租户支持

-- 1. 创建租户表
CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 索引
    CONSTRAINT tenants_code_unique UNIQUE (code)
);

-- 创建租户表索引
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- 2. 为现有表添加租户支持
-- 用户表
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id BIGINT DEFAULT 1;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- 角色表
ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id BIGINT DEFAULT 1;
ALTER TABLE roles ADD CONSTRAINT fk_roles_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- 权限表
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS tenant_id BIGINT DEFAULT 1;
ALTER TABLE permissions ADD CONSTRAINT fk_permissions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- 角色权限关联表
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS tenant_id BIGINT DEFAULT 1;
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- 3. 创建租户相关索引
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_status ON users(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_status ON roles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_id ON permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_status ON permissions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_id ON role_permissions(tenant_id);

-- 4. 创建默认租户
INSERT INTO tenants (id, name, code, status, settings)
VALUES (1, 'Default Tenant', 'default', 'active', '{"isDefault": true}')
ON CONFLICT (id) DO NOTHING;

-- 5. 确保现有数据关联到默认租户
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE roles SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE permissions SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE role_permissions SET tenant_id = 1 WHERE tenant_id IS NULL;

-- 6. 创建租户数据统计视图
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT
    t.id,
    t.name,
    t.code,
    t.status,
    t.created_at as tenant_created_at,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT r.id) as role_count,
    COUNT(DISTINCT p.id) as permission_count,
    COUNT(DISTINCT rp.id) as role_permission_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.is_deleted = false
LEFT JOIN roles r ON r.tenant_id = t.id AND r.is_deleted = false
LEFT JOIN permissions p ON p.tenant_id = t.id AND p.is_deleted = false
LEFT JOIN role_permissions rp ON rp.tenant_id = t.id
GROUP BY t.id, t.name, t.code, t.status, t.created_at;

-- 7. 创建租户数据清理函数（级联删除相关数据）
CREATE OR REPLACE FUNCTION cleanup_tenant_data(tenant_id_to_delete BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 删除角色权限关联
    DELETE FROM role_permissions WHERE tenant_id = tenant_id_to_delete;

    -- 删除权限
    DELETE FROM permissions WHERE tenant_id = tenant_id_to_delete;

    -- 删除角色
    DELETE FROM roles WHERE tenant_id = tenant_id_to_delete;

    -- 删除用户
    DELETE FROM users WHERE tenant_id = tenant_id_to_delete;

    -- 最后删除租户
    DELETE FROM tenants WHERE id = tenant_id_to_delete;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. 添加租户唯一约束（防止同一租户下重复的角色/权限名称）
ALTER TABLE roles ADD CONSTRAINT roles_tenant_name_unique
    UNIQUE (tenant_id, name);
ALTER TABLE permissions ADD CONSTRAINT permissions_tenant_name_unique
    UNIQUE (tenant_id, name);

-- 9. 创建租户数据隔离验证函数
CREATE OR REPLACE FUNCTION validate_tenant_data_isolation()
RETURNS TABLE(
    table_name TEXT,
    violation_count BIGINT
) AS $$
BEGIN
    -- 检查用户表是否有跨租户数据
    RETURN QUERY
    SELECT
        'users'::TEXT,
        COUNT(*)::BIGINT
    FROM users u
    WHERE u.tenant_id IS NULL;

    -- 检查角色表是否有跨租户数据
    RETURN QUERY
    SELECT
        'roles'::TEXT,
        COUNT(*)::BIGINT
    FROM roles r
    WHERE r.tenant_id IS NULL;

    -- 检查权限表是否有跨租户数据
    RETURN QUERY
    SELECT
        'permissions'::TEXT,
        COUNT(*)::BIGINT
    FROM permissions p
    WHERE p.tenant_id IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tenants IS '租户表 - 多租户系统的租户管理';
COMMENT ON COLUMN tenants.settings IS '租户配置信息 - JSON格式存储';
COMMENT ON VIEW tenant_statistics IS '租户统计视图 - 显示每个租户的基本数据统计';
COMMENT ON FUNCTION cleanup_tenant_data IS '清理租户数据函数 - 级联删除租户相关数据';
COMMENT ON FUNCTION validate_tenant_data_isolation IS '验证租户数据隔离函数 - 检查是否有跨租户数据';