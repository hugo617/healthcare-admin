-- RBAC 增强迁移脚本
-- 创建时间：2025-01-20
-- 描述：根据企业级RBAC设计文档增强数据库架构

-- 1. 增强用户表
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 添加用户状态约束
ALTER TABLE users ADD CONSTRAINT users_status_check
CHECK (status IN ('active','inactive','locked','deleted'));

-- 添加用户表索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_real_name ON users(real_name);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_password_updated_at ON users(password_updated_at);

-- 2. 增强角色表
ALTER TABLE roles ADD COLUMN IF NOT EXISTS code VARCHAR(100);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES roles(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 添加角色状态约束
ALTER TABLE roles ADD CONSTRAINT roles_status_check
CHECK (status IN ('active','inactive','deleted'));

-- 更新现有角色数据，为没有code的角色生成code
UPDATE roles SET code = 'role_' || id WHERE code IS NULL;

-- 添加角色唯一约束
ALTER TABLE roles ADD CONSTRAINT roles_tenant_code_unique
UNIQUE(tenant_id, code);

-- 创建角色层级索引
CREATE INDEX IF NOT EXISTS idx_roles_parent_id ON roles(parent_id);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_is_deleted ON roles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_roles_sort_order ON roles(sort_order);

-- 3. 增强权限表
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'api'
CHECK (type IN ('menu','page','button','api','data'));
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS front_path VARCHAR(255);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS api_path VARCHAR(255);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS method VARCHAR(20);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 添加权限状态约束
ALTER TABLE permissions ADD CONSTRAINT permissions_status_check
CHECK (status IN ('active','inactive','deleted'));

-- 添加权限唯一约束
ALTER TABLE permissions ADD CONSTRAINT permissions_tenant_code_unique
UNIQUE(tenant_id, code);

-- 更新现有权限数据，设置默认type
UPDATE permissions SET
  type = CASE
    WHEN code LIKE '%:read' THEN 'api'
    WHEN code LIKE '%:create' THEN 'button'
    WHEN code LIKE '%:update' THEN 'button'
    WHEN code LIKE '%:delete' THEN 'button'
    ELSE 'menu'
  END
WHERE type = 'api';

-- 创建权限表索引
CREATE INDEX IF NOT EXISTS idx_permissions_type ON permissions(type);
CREATE INDEX IF NOT EXISTS idx_permissions_front_path ON permissions(front_path);
CREATE INDEX IF NOT EXISTS idx_permissions_api_path ON permissions(api_path);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_permissions_method ON permissions(method);
CREATE INDEX IF NOT EXISTS idx_permissions_is_deleted ON permissions(is_deleted);

-- 4. 创建组织架构相关表

-- 启用 ltree 扩展
CREATE EXTENSION IF NOT EXISTS ltree;

-- 组织架构表
CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name VARCHAR(200) NOT NULL,
  code VARCHAR(100),
  path LTREE,

  parent_id BIGINT REFERENCES organizations(id),
  leader_id INTEGER REFERENCES users(id),

  status VARCHAR(20) DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- 创建组织表索引
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_path ON organizations USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_leader_id ON organizations(leader_id);
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);

-- 用户组织关联表
CREATE TABLE IF NOT EXISTS user_organizations (
  id BIGSERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  position VARCHAR(100),
  is_main BOOLEAN DEFAULT FALSE,

  joined_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

-- 创建用户组织关联表索引
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_is_main ON user_organizations(is_main);

-- 5. 创建数据权限相关表

-- 数据权限规则表
CREATE TABLE IF NOT EXISTS data_permission_rules (
  id BIGSERIAL PRIMARY KEY,

  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name VARCHAR(200) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,

  rule_type VARCHAR(50) NOT NULL
    CHECK (rule_type IN ('all','org','dept','self','custom')),

  rule_expression JSONB,
  description TEXT,

  status VARCHAR(20) DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- 创建数据权限规则表索引
CREATE INDEX IF NOT EXISTS idx_data_rules_tenant_id ON data_permission_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_rules_resource_type ON data_permission_rules(resource_type);
CREATE INDEX IF NOT EXISTS idx_data_rules_rule_type ON data_permission_rules(rule_type);

-- 角色数据权限关联表
CREATE TABLE IF NOT EXISTS role_data_permissions (
  id BIGSERIAL PRIMARY KEY,

  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  rule_id BIGINT NOT NULL REFERENCES data_permission_rules(id) ON DELETE CASCADE,

  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by INTEGER REFERENCES users(id),

  UNIQUE(role_id, rule_id)
);

-- 创建角色数据权限关联表索引
CREATE INDEX IF NOT EXISTS idx_role_data_permissions_role_id ON role_data_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_data_permissions_rule_id ON role_data_permissions(rule_id);

-- 6. 创建用户会话管理表

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL UNIQUE,

  device_id VARCHAR(255),
  device_type VARCHAR(50),
  device_name VARCHAR(200),
  platform VARCHAR(100),

  token_hash VARCHAR(255),

  ip_address INET,
  user_agent TEXT,

  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  impersonator_id INTEGER REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- 创建用户会话表索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_impersonator_id ON user_sessions(impersonator_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- 7. 创建用户登录方式表

-- 用户登录方式表
CREATE TABLE IF NOT EXISTS user_login_methods (
  id BIGSERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  login_type VARCHAR(50)
    CHECK (login_type IN ('email','phone','wechat','oauth')),

  identifier VARCHAR(255) NOT NULL,

  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,

  last_used_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, login_type, identifier)
);

-- 创建用户登录方式表索引
CREATE INDEX IF NOT EXISTS idx_user_login_methods_user_id ON user_login_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_methods_identifier ON user_login_methods(identifier);
CREATE INDEX IF NOT EXISTS idx_user_login_methods_login_type ON user_login_methods(login_type);

-- 8. 创建角色层级查询视图
CREATE OR REPLACE VIEW role_hierarchy AS
WITH RECURSIVE role_tree AS (
  -- 基础角色
  SELECT
    id,
    parent_id,
    name,
    code,
    tenant_id,
    0 as level,
    ARRAY[name] as path_names
  FROM roles
  WHERE parent_id IS NULL AND is_deleted = FALSE

  UNION ALL

  -- 递归查询子角色
  SELECT
    r.id,
    r.parent_id,
    r.name,
    r.code,
    r.tenant_id,
    rt.level + 1,
    rt.path_names || r.name
  FROM roles r
  INNER JOIN role_tree rt ON r.parent_id = rt.id
  WHERE r.is_deleted = FALSE
)
SELECT
  id,
  parent_id,
  name,
  code,
  tenant_id,
  level,
  path_names
FROM role_tree;

-- 9. 创建用户有效权限视图
CREATE OR REPLACE VIEW user_effective_permissions AS
WITH RECURSIVE user_role_hierarchy AS (
  -- 获取用户直接角色
  SELECT
    u.id as user_id,
    u.tenant_id,
    r.id as role_id,
    r.name as role_name,
    r.code as role_code,
    r.parent_id,
    0 as level
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE u.is_deleted = FALSE AND r.is_deleted = FALSE AND ur.is_active = TRUE

  UNION ALL

  -- 递归获取父角色
  SELECT
    urh.user_id,
    urh.tenant_id,
    r.id as role_id,
    r.name as role_name,
    r.code as role_code,
    r.parent_id,
    urh.level + 1
  FROM user_role_hierarchy urh
  JOIN roles r ON urh.parent_id = r.id
  WHERE r.is_deleted = FALSE
),
user_permissions AS (
  SELECT DISTINCT
    urh.user_id,
    urh.tenant_id,
    p.id as permission_id,
    p.code as permission_code,
    p.name as permission_name,
    p.type as permission_type,
    p.front_path,
    p.api_path,
    p.resource_type,
    p.method
  FROM user_role_hierarchy urh
  JOIN role_permissions rp ON urh.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE p.is_deleted = FALSE AND rp.tenant_id = urh.tenant_id
)
SELECT
  up.*,
  u.email as user_email,
  u.username as user_name
FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.status = 'active';

-- 10. 创建审计日志表（增强现有system_logs）
ALTER TABLE systemLogs ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100);
ALTER TABLE systemLogs ADD COLUMN IF NOT EXISTS resource_id VARCHAR(255);
ALTER TABLE systemLogs ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE systemLogs ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE systemLogs ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE systemLogs ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);

-- 创建审计日志表索引
CREATE INDEX IF NOT EXISTS idx_system_logs_resource_type ON systemLogs(resource_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource_id ON systemLogs(resource_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_session_id ON systemLogs(session_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant_id ON systemLogs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_action ON systemLogs(level, action);

-- 11. 创建触发器函数来自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_permission_rules_updated_at
    BEFORE UPDATE ON data_permission_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 创建数据清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR is_active = FALSE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 13. 创建租户数据统计视图（更新现有视图）
DROP VIEW IF EXISTS tenant_statistics;
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT
    t.id,
    t.name,
    t.code,
    t.status,
    t.created_at as tenant_created_at,
    COUNT(DISTINCT CASE WHEN u.is_deleted = FALSE THEN u.id END) as user_count,
    COUNT(DISTINCT CASE WHEN r.is_deleted = FALSE THEN r.id END) as role_count,
    COUNT(DISTINCT CASE WHEN p.is_deleted = FALSE THEN p.id END) as permission_count,
    COUNT(DISTINCT rp.id) as role_permission_count,
    COUNT(DISTINCT o.id) as organization_count,
    COUNT(DISTINCT CASE WHEN s.expires_at > NOW() AND s.is_active = TRUE THEN s.id END) as active_sessions_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN roles r ON r.tenant_id = t.id
LEFT JOIN permissions p ON p.tenant_id = t.id
LEFT JOIN role_permissions rp ON rp.tenant_id = t.id
LEFT JOIN organizations o ON o.tenant_id = t.id
LEFT JOIN user_sessions s ON s.user_id IN (SELECT id FROM users WHERE tenant_id = t.id)
GROUP BY t.id, t.name, t.code, t.status, t.created_at;

-- 14. 添加注释
COMMENT ON TABLE organizations IS '组织架构表 - 支持无限层级组织结构';
COMMENT ON COLUMN organizations.path IS '组织路径 - 使用PostgreSQL ltree类型存储层级关系';
COMMENT ON TABLE user_organizations IS '用户组织关联表 - 支持用户属于多个组织';
COMMENT ON TABLE data_permission_rules IS '数据权限规则表 - 定义数据访问控制规则';
COMMENT ON TABLE role_data_permissions IS '角色数据权限关联表 - 关联角色和数据权限规则';
COMMENT ON TABLE user_sessions IS '用户会话表 - 管理用户登录会话';
COMMENT ON TABLE user_login_methods IS '用户登录方式表 - 支持多种登录方式';
COMMENT ON VIEW role_hierarchy IS '角色层级视图 - 显示角色继承关系';
COMMENT ON VIEW user_effective_permissions IS '用户有效权限视图 - 显示用户所有可用权限';

-- 15. 创建默认组织（每个租户）
INSERT INTO organizations (id, tenant_id, name, code, path, status)
SELECT
  (SELECT COALESCE(MAX(id), 0) + ROW_NUMBER() OVER (ORDER BY t.id) FROM organizations) as id,
  t.id,
  'Root Organization',
  'root',
  'root'::ltree,
  'active'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.tenant_id = t.id AND o.code = 'root'
);

-- 16. 创建根用户组织关联（将现有用户关联到根组织）
INSERT INTO user_organizations (user_id, organization_id, is_main, position)
SELECT
  u.id,
  o.id,
  TRUE,
  'Member'
FROM users u
JOIN organizations o ON o.tenant_id = u.tenant_id AND o.code = 'root'
WHERE NOT EXISTS (
  SELECT 1 FROM user_organizations uo
  WHERE uo.user_id = u.id AND uo.is_main = TRUE
);

-- 迁移完成
SELECT 'RBAC增强迁移完成' as migration_status;