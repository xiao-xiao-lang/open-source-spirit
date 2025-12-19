-- ============================================
-- 开源精神分号器数据库架构 v1.0
-- ============================================

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 用户表：存储用户注册信息
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('qq', 'email', 'phone', 'bilibili')),
    contact_value TEXT NOT NULL UNIQUE,
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 开源项目表：存储申请的开源项目信息
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    first_repo_url TEXT NOT NULL,
    second_repo_url TEXT,
    video_url TEXT NOT NULL,
    applicant_id INTEGER NOT NULL,
    apply_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    download_link TEXT DEFAULT 'https://www.baidu.com',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_username TEXT NOT NULL UNIQUE,
    admin_password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 查询日志表
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_query TEXT NOT NULL,
    search_type TEXT,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 系统日志表（用于管理员查看操作记录）
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL CHECK (action_type IN ('login', 'register', 'apply', 'approve', 'reject', 'delete', 'update', 'search')),
    action_data TEXT,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_projects_id ON projects(id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(project_name);
CREATE INDEX IF NOT EXISTS idx_projects_applicant ON projects(applicant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_apply_date ON projects(apply_date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_contact ON users(contact_value);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_time ON search_logs(search_time DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_time ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users 
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects 
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 项目状态更改日志触发器
CREATE TRIGGER IF NOT EXISTS log_project_status_change
AFTER UPDATE OF status ON projects
BEGIN
    INSERT INTO system_logs (action_type, action_data, user_id, created_at)
    VALUES (
        CASE 
            WHEN NEW.status = 'approved' THEN 'approve'
            WHEN NEW.status = 'rejected' THEN 'reject'
            ELSE 'update'
        END,
        json_object(
            'project_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'project_name', NEW.project_name
        ),
        (SELECT id FROM admins LIMIT 1),  -- 假设为管理员操作
        CURRENT_TIMESTAMP
    );
END;

-- 项目删除日志触发器
CREATE TRIGGER IF NOT EXISTS log_project_delete
AFTER DELETE ON projects
BEGIN
    INSERT INTO system_logs (action_type, action_data, created_at)
    VALUES (
        'delete',
        json_object(
            'project_id', OLD.id,
            'project_name', OLD.project_name,
            'applicant_id', OLD.applicant_id
        ),
        CURRENT_TIMESTAMP
    );
END;

-- 用户注册日志触发器
CREATE TRIGGER IF NOT EXISTS log_user_register
AFTER INSERT ON users
BEGIN
    INSERT INTO system_logs (action_type, action_data, user_id, created_at)
    VALUES (
        'register',
        json_object(
            'username', NEW.username,
            'nickname', NEW.nickname,
            'contact_type', NEW.contact_type
        ),
        NEW.id,
        CURRENT_TIMESTAMP
    );
END;

-- 视图：项目详情视图
CREATE VIEW IF NOT EXISTS project_details AS
SELECT 
    p.*,
    u.username,
    u.nickname,
    u.contact_type,
    u.contact_value,
    u.created_at as user_created_at
FROM projects p
LEFT JOIN users u ON p.applicant_id = u.id;

-- 视图：每日统计视图
CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_applications,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_applications,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_applications,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_applications
FROM projects
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 视图：用户活跃度视图
CREATE VIEW IF NOT EXISTS user_activity AS
SELECT 
    u.id,
    u.username,
    u.nickname,
    COUNT(p.id) as total_projects,
    SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
    SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending_projects,
    SUM(CASE WHEN p.status = 'rejected' THEN 1 ELSE 0 END) as rejected_projects,
    MAX(p.created_at) as last_activity
FROM users u
LEFT JOIN projects p ON u.id = p.applicant_id
GROUP BY u.id
ORDER BY total_projects DESC, last_activity DESC;

-- 表注释
COMMENT ON TABLE users IS '用户信息表';
COMMENT ON TABLE projects IS '开源项目申请表';
COMMENT ON TABLE admins IS '管理员账户表';
COMMENT ON TABLE search_logs IS '搜索日志表';
COMMENT ON TABLE system_logs IS '系统操作日志表';

COMMENT ON COLUMN users.username IS '用户名（登录用）';
COMMENT ON COLUMN users.nickname IS '昵称（显示用）';
COMMENT ON COLUMN users.contact_type IS '联系方式类型：qq/email/phone/bilibili';
COMMENT ON COLUMN users.contact_value IS '联系方式具体值';
COMMENT ON COLUMN projects.id IS '开源号，格式：KY+年月+随机5位字符串';
COMMENT ON COLUMN projects.status IS '项目状态：pending/approved/rejected';
COMMENT ON COLUMN projects.download_link IS '开源需知视频下载链接';
COMMENT ON COLUMN admins.admin_password_hash IS 'bcrypt哈希后的密码';
COMMENT ON COLUMN system_logs.action_data IS 'JSON格式的操作详情';

-- 打印创建完成信息
SELECT 'Database schema created successfully!' as message;