-- ============================================
-- 开源精神分号器测试数据生成
-- ============================================

-- 此文件用于生成大量测试数据，仅用于开发和测试环境

-- 生成随机用户数据（50个）
INSERT INTO users (username, nickname, contact_type, contact_value)
WITH RECURSIVE nums(n) AS (
    SELECT 1 UNION ALL SELECT n+1 FROM nums WHERE n < 50
)
SELECT 
    'test_user_' || n,
    '测试用户' || n,
    CASE (n % 4)
        WHEN 0 THEN 'qq'
        WHEN 1 THEN 'email'
        WHEN 2 THEN 'phone'
        ELSE 'bilibili'
    END,
    CASE (n % 4)
        WHEN 0 THEN CAST(100000000 + (n * 12345) % 900000000 AS TEXT)
        WHEN 1 THEN 'test' || n || '@example.com'
        WHEN 2 THEN '138' || LPAD(CAST((10000000 + (n * 56789) % 90000000) AS TEXT), 8, '0')
        ELSE 'https://space.bilibili.com/' || CAST(100000 + n * 1000 AS TEXT)
    END
FROM nums;

-- 生成随机项目数据（100个）
INSERT INTO projects (id, project_name, first_repo_url, second_repo_url, video_url, applicant_id, apply_date, status)
WITH RECURSIVE nums(n) AS (
    SELECT 1 UNION ALL SELECT n+1 FROM nums WHERE n < 100
)
SELECT 
    'KY' || 
    CASE 
        WHEN n <= 20 THEN '202401'
        WHEN n <= 40 THEN '202312'
        WHEN n <= 60 THEN '202311'
        WHEN n <= 80 THEN '202310'
        ELSE '202309'
    END ||
    UPPER(SUBSTR('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (n % 26) + 1, 1)) ||
    UPPER(SUBSTR('ABCDEFGHIJKLMNOPQRSTUVWXYZ', ((n * 7) % 26) + 1, 1)) ||
    LPAD(CAST((n * 123) % 10000 AS TEXT), 4, '0'),
    '开源测试项目 ' || n,
    'https://github.com/testuser/repo' || n,
    CASE WHEN n % 3 = 0 THEN 'https://gitee.com/testuser/repo' || n ELSE NULL END,
    'https://www.bilibili.com/video/BV' || LPAD(CAST((1000000 + n * 10000) AS TEXT), 7, '0'),
    (n % 50) + 1,  -- 分配到前50个用户
    DATE('2023-09-01', '+' || CAST((n * 2) % 120 AS TEXT) || ' days'),
    CASE (n % 3)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'approved'
        ELSE 'rejected'
    END
FROM nums;

-- 生成随机搜索日志（200条）
INSERT INTO search_logs (search_query, search_type, user_id, ip_address, user_agent)
WITH RECURSIVE nums(n) AS (
    SELECT 1 UNION ALL SELECT n+1 FROM nums WHERE n < 200
)
SELECT 
    CASE (n % 6)
        WHEN 0 THEN '开源'
        WHEN 1 THEN '测试'
        WHEN 2 THEN '项目'
        WHEN 3 THEN 'KY2023'
        WHEN 4 THEN '人工智能'
        ELSE '区块链'
    END,
    CASE WHEN n % 4 = 0 THEN 'open_source_id' ELSE 'project_name' END,
    CASE WHEN n % 3 = 0 THEN (n % 50) + 1 ELSE NULL END,
    '192.168.' || CAST((n / 256) % 256 AS TEXT) || '.' || CAST(n % 256 AS TEXT),
    CASE (n % 4)
        WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
        ELSE 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
    END
FROM nums;

-- 生成随机系统日志（100条）
INSERT INTO system_logs (action_type, action_data, user_id, ip_address, user_agent)
WITH RECURSIVE nums(n) AS (
    SELECT 1 UNION ALL SELECT n+1 FROM nums WHERE n < 100
)
SELECT 
    CASE (n % 7)
        WHEN 0 THEN 'login'
        WHEN 1 THEN 'register'
        WHEN 2 THEN 'apply'
        WHEN 3 THEN 'approve'
        WHEN 4 THEN 'reject'
        WHEN 5 THEN 'search'
        ELSE 'update'
    END,
    json_object(
        'action_id', n,
        'timestamp', CURRENT_TIMESTAMP,
        'details', '测试数据 ' || n
    ),
    CASE WHEN n % 3 = 0 THEN (n % 50) + 1 ELSE NULL END,
    '10.0.' || CAST((n / 256) % 256 AS TEXT) || '.' || CAST(n % 256 AS TEXT),
    CASE (n % 4)
        WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124'
        WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
        ELSE 'PostmanRuntime/7.28.4'
    END
FROM nums;

-- 验证生成的数据
SELECT '=== 测试数据生成完成 ===' as message;
SELECT 'users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'projects:', COUNT(*) FROM projects
UNION ALL
SELECT 'search_logs:', COUNT(*) FROM search_logs
UNION ALL
SELECT 'system_logs:', COUNT(*) FROM system_logs
ORDER BY table_name;

-- 显示一些示例数据
SELECT '=== 最新5个项目 ===' as info;
SELECT id, project_name, applicant_id, status, apply_date 
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '=== 用户统计 ===' as info;
SELECT contact_type, COUNT(*) as count 
FROM users 
GROUP BY contact_type 
ORDER BY count DESC;

SELECT '=== 项目状态分布 ===' as info;
SELECT status, COUNT(*) as count 
FROM projects 
GROUP BY status 
ORDER BY count DESC;