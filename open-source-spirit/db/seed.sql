-- ============================================
-- 开源精神分号器初始数据
-- ============================================

-- 注意：在生产环境中，请修改管理员密码！

-- 清空现有数据（按依赖顺序）
DELETE FROM system_logs;
DELETE FROM search_logs;
DELETE FROM projects;
DELETE FROM users;
DELETE FROM admins;

-- 重置自增ID
UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('users', 'projects', 'admins', 'search_logs', 'system_logs');

-- 插入默认管理员账户
-- 密码: Admin@123 (请在生产环境中更改)
INSERT INTO admins (id, admin_username, admin_password_hash) 
VALUES 
(1, 'admin', '$2b$10$Gq3pz2zVt2eY7L8J9K0L3uN1m2n3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q'),
(2, 'supervisor', '$2b$10$Hr4t8wXzYv1A2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z');

-- 插入测试用户
INSERT INTO users (username, nickname, contact_type, contact_value) VALUES
('opensource_fan', '开源爱好者', 'email', 'fan@opensource.org'),
('code_wizard', '代码巫师', 'qq', '123456789'),
('dev_master', '开发大师', 'bilibili', 'https://space.bilibili.com/123456'),
('tech_geek', '技术极客', 'phone', '13800138000'),
('web_designer', '前端设计师', 'email', 'designer@example.com'),
('ai_researcher', 'AI研究员', 'qq', '987654321'),
('blockchain_dev', '区块链开发者', 'bilibili', 'https://space.bilibili.com/789012'),
('data_scientist', '数据科学家', 'phone', '13900139000'),
('game_developer', '游戏开发者', 'email', 'game@dev.com'),
('security_expert', '安全专家', 'qq', '555666777');

-- 插入测试项目
INSERT INTO projects (id, project_name, first_repo_url, second_repo_url, video_url, applicant_id, apply_date, status) VALUES
('KY202312ABC12', '开源精神分号器V1', 'https://github.com/example/open-source-spirit', 'https://gitee.com/example/open-source-spirit', 'https://www.bilibili.com/video/BV1xxxxxx1', 1, '2023-12-01', 'approved'),
('KY202312DEF34', 'AI代码助手', 'https://github.com/example/ai-assistant', NULL, 'https://www.bilibili.com/video/BV1yyyyyy2', 2, '2023-12-05', 'approved'),
('KY202312GHI56', '区块链学习平台', 'https://github.com/example/blockchain-learn', 'https://gitlab.com/example/blockchain', 'https://www.bilibili.com/video/BV1zzzzzz3', 3, '2023-12-10', 'pending'),
('KY202312JKL78', '智能家居控制系统', 'https://github.com/example/smart-home', NULL, 'https://www.bilibili.com/video/BV1aaaaaa4', 4, '2023-12-15', 'rejected'),
('KY202312MNO90', '在线教育平台', 'https://github.com/example/edu-platform', 'https://gitee.com/example/edu-platform', 'https://www.bilibili.com/video/BV1bbbbbb5', 5, '2023-12-20', 'approved'),
('KY202401PQR12', '健康管理应用', 'https://github.com/example/health-app', NULL, 'https://www.bilibili.com/video/BV1cccccc6', 6, '2024-01-05', 'pending'),
('KY202401STU34', '电子商务网站', 'https://github.com/example/ecommerce', 'https://gitlab.com/example/ecommerce', 'https://www.bilibili.com/video/BV1dddddd7', 7, '2024-01-10', 'approved'),
('KY202401VWX56', '数据分析工具', 'https://github.com/example/data-tools', NULL, 'https://www.bilibili.com/video/BV1eeeeee8', 8, '2024-01-15', 'pending'),
('KY202401YZA78', '游戏引擎框架', 'https://github.com/example/game-engine', 'https://gitee.com/example/game-engine', 'https://www.bilibili.com/video/BV1ffffff9', 9, '2024-01-20', 'approved'),
('KY202401BCD90', '网络安全工具包', 'https://github.com/example/security-toolkit', NULL, 'https://www.bilibili.com/video/BV1gggggg0', 10, '2024-01-25', 'rejected');

-- 插入搜索日志（示例数据）
INSERT INTO search_logs (search_query, search_type, user_id, ip_address, user_agent) VALUES
('开源精神', 'project_name', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('KY202312ABC12', 'open_source_id', NULL, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
('AI', 'project_name', 2, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'),
('区块链', 'project_name', NULL, '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'),
('游戏开发', 'project_name', 9, '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124');

-- 插入系统日志（示例数据）
INSERT INTO system_logs (action_type, action_data, user_id, ip_address, user_agent) VALUES
('register', '{"username": "opensource_fan", "nickname": "开源爱好者", "contact_type": "email"}', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('apply', '{"project_id": "KY202312ABC12", "project_name": "开源精神分号器V1"}', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('approve', '{"project_id": "KY202312ABC12", "project_name": "开源精神分号器V1", "old_status": "pending", "new_status": "approved"}', 1, '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('login', '{"username": "admin"}', 1, '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('search', '{"query": "开源精神", "type": "project_name"}', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- 验证数据插入
SELECT 'admins:' as table_name, COUNT(*) as count FROM admins
UNION ALL
SELECT 'users:', COUNT(*) FROM users
UNION ALL
SELECT 'projects:', COUNT(*) FROM projects
UNION ALL
SELECT 'search_logs:', COUNT(*) FROM search_logs
UNION ALL
SELECT 'system_logs:', COUNT(*) FROM system_logs;

-- 显示示例数据
SELECT '=== 管理员账户 ===' as info;
SELECT id, admin_username, created_at FROM admins;

SELECT '=== 用户列表 ===' as info;
SELECT id, username, nickname, contact_type, contact_value, created_at FROM users;

SELECT '=== 项目列表 ===' as info;
SELECT id, project_name, applicant_id, status, apply_date FROM projects;

SELECT '=== 数据初始化完成 ===' as message;
SELECT '请访问 http://your-domain.pages.dev 查看应用' as next_step;