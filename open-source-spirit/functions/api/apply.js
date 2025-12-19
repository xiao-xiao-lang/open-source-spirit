// POST /api/apply - 申请开源号
export async function onRequestPost(context) {
    const { request, env } = context;
    const { DB } = env;
    
    try {
        const data = await request.json();
        const { 
            projectName, 
            firstRepoUrl, 
            secondRepoUrl, 
            videoUrl, 
            applicantId,
            agreeTerms 
        } = data;
        
        // 验证必填字段
        if (!projectName || !firstRepoUrl || !videoUrl || !applicantId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 验证用户是否同意条款
        if (!agreeTerms) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You must agree to the terms'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 验证用户存在
        const user = await DB.prepare(
            'SELECT id, username, nickname FROM users WHERE id = ?'
        ).bind(applicantId).first();
        
        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 验证URL格式
        if (!isValidUrl(firstRepoUrl)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid first repository URL'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (secondRepoUrl && !isValidUrl(secondRepoUrl)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid second repository URL'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!isValidUrl(videoUrl)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid video URL'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 生成开源号：KY + 年份 + 月份 + 随机5位字符串
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        // 生成5位随机字符串（大写字母+数字）
        const generateRandomString = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 5; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        
        // 确保开源号唯一
        let openSourceId;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!isUnique && attempts < maxAttempts) {
            const randomPart = generateRandomString();
            openSourceId = `KY${year}${month}${randomPart}`;
            
            const existing = await DB.prepare(
                'SELECT id FROM projects WHERE id = ?'
            ).bind(openSourceId).first();
            
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }
        
        if (!isUnique) {
            throw new Error('Failed to generate unique open source ID');
        }
        
        // 插入项目申请
        const result = await DB.prepare(`
            INSERT INTO projects (
                id, project_name, first_repo_url, second_repo_url, 
                video_url, applicant_id, apply_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), 'pending')
        `).bind(
            openSourceId,
            projectName,
            firstRepoUrl,
            secondRepoUrl || null,
            videoUrl,
            applicantId
        ).run();
        
        if (result.success) {
            // 记录系统日志
            await DB.prepare(`
                INSERT INTO system_logs (action_type, action_data, user_id)
                VALUES ('apply', ?, ?)
            `).bind(
                JSON.stringify({
                    project_id: openSourceId,
                    project_name: projectName,
                    applicant_id: applicantId
                }),
                applicantId
            ).run();
            
            // 获取新创建的项目
            const newProject = await DB.prepare(`
                SELECT p.*, u.nickname, u.username
                FROM projects p
                LEFT JOIN users u ON p.applicant_id = u.id
                WHERE p.id = ?
            `).bind(openSourceId).first();
            
            return new Response(JSON.stringify({
                success: true,
                message: 'Application submitted successfully',
                openSourceId: openSourceId,
                project: newProject,
                downloadLink: 'https://www.baidu.com'
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('Failed to submit application');
        }
    } catch (error) {
        console.error('Apply API error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Application failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 辅助函数：验证URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}