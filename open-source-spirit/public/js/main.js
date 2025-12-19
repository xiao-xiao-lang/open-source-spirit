// ============================================
// 开源精神分号器 - 通用工具函数
// ============================================

// API基础URL
const API_BASE = '/api';

// 全局状态
const AppState = {
    currentUser: null,
    adminToken: null,
    isLoggedIn: false,
    isAdmin: false
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();
    
    // 初始化工具提示
    initTooltips();
    
    // 初始化模态框
    initModals();
    
    // 初始化返回顶部按钮
    initBackToTop();
});

// ==================== 通用函数 ====================

/**
 * 发送API请求
 * @param {string} endpoint - API端点
 * @param {string} method - HTTP方法
 * @param {object} data - 请求数据
 * @param {boolean} requireAuth - 是否需要认证
 * @returns {Promise}
 */
async function apiRequest(endpoint, method = 'GET', data = null, requireAuth = false) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // 添加认证头
    if (requireAuth && AppState.currentUser && AppState.currentUser.token) {
        options.headers['Authorization'] = `Bearer ${AppState.currentUser.token}`;
    }

    // 添加请求体
    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        // 检查HTTP状态码
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '请求失败');
        }
        
        return result;
    } catch (error) {
        console.error('API请求失败:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * 显示成功消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长(ms)
 */
function showSuccess(message, duration = 3000) {
    showNotification(message, 'success', duration);
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 * @param {number} duration - 显示时长(ms)
 */
function showError(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

/**
 * 显示警告消息
 * @param {string} message - 警告消息
 * @param {number} duration - 显示时长(ms)
 */
function showWarning(message, duration = 4000) {
    showNotification(message, 'warning', duration);
}

/**
 * 显示通知
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型(success, error, warning, info)
 * @param {number} duration - 显示时长(ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // 移除现有的通知
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 根据类型设置图标
    let icon = 'info-circle';
    switch (type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
    }

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            min-width: 300px;
        }
        
        .notification.success {
            border-left: 4px solid #10b981;
            color: #065f46;
        }
        
        .notification.error {
            border-left: 4px solid #ef4444;
            color: #991b1b;
        }
        
        .notification.warning {
            border-left: 4px solid #f59e0b;
            color: #92400e;
        }
        
        .notification.info {
            border-left: 4px solid #3b82f6;
            color: #1e40af;
        }
        
        .notification i:first-child {
            font-size: 1.2rem;
        }
        
        .notification span {
            flex: 1;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            opacity: 0.6;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .notification-close:hover {
            opacity: 1;
            background: rgba(0, 0, 0, 0.1);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }

    // 添加关闭事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    });

    // 自动关闭
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // 添加淡出动画
    if (!document.querySelector('#notification-animations')) {
        const animations = document.createElement('style');
        animations.id = 'notification-animations';
        animations.textContent = `
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(animations);
    }
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000); // 秒数差
    
    // 刚刚（1分钟内）
    if (diff < 60) {
        return '刚刚';
    }
    
    // 分钟前
    if (diff < 3600) {
        return `${Math.floor(diff / 60)}分钟前`;
    }
    
    // 今天的小时:分钟
    if (d.toDateString() === now.toDateString()) {
        return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 一周内
    if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return `${days}天前`;
    }
    
    // 完整日期
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    const userData = localStorage.getItem('open_source_user');
    const adminData = localStorage.getItem('open_source_admin');
    
    if (userData) {
        try {
            AppState.currentUser = JSON.parse(userData);
            AppState.isLoggedIn = true;
            
            // 检查令牌是否过期（简单检查）
            const tokenParts = atob(AppState.currentUser.token).split(':');
            if (tokenParts.length === 2) {
                const tokenTime = parseInt(tokenParts[1]);
                const now = Date.now();
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
                
                if (now - tokenTime > maxAge) {
                    // 令牌过期，清除登录状态
                    clearLoginState();
                    return;
                }
            }
            
            updateUIForLogin();
        } catch (error) {
            console.error('解析用户数据失败:', error);
            clearLoginState();
        }
    }
    
    if (adminData) {
        try {
            const admin = JSON.parse(adminData);
            AppState.adminToken = admin.token;
            AppState.isAdmin = true;
        } catch (error) {
            console.error('解析管理员数据失败:', error);
            localStorage.removeItem('open_source_admin');
        }
    }
}

/**
 * 更新登录状态的UI
 */
function updateUIForLogin() {
    // 更新用户信息显示
    const usernameElements = document.querySelectorAll('[id^="current-username"], #profile-username, #info-username');
    const contactElements = document.querySelectorAll('[id^="current-contact"], #profile-contact, #info-contact');
    
    if (AppState.currentUser) {
        usernameElements.forEach(el => {
            if (el) el.textContent = AppState.currentUser.username || AppState.currentUser.nickname;
        });
        
        contactElements.forEach(el => {
            if (el) el.textContent = AppState.currentUser.contact_value || '-';
        });
    }
    
    // 显示/隐藏登录相关元素
    const authPrompts = document.querySelectorAll('.auth-prompt, .auth-section');
    const loggedInContents = document.querySelectorAll('.apply-content, .profile-content');
    
    if (AppState.isLoggedIn) {
        authPrompts.forEach(el => {
            if (el) el.style.display = 'none';
        });
        loggedInContents.forEach(el => {
            if (el) el.style.display = 'block';
        });
    } else {
        authPrompts.forEach(el => {
            if (el) el.style.display = 'block';
        });
        loggedInContents.forEach(el => {
            if (el) el.style.display = 'none';
        });
    }
}

/**
 * 清除登录状态
 */
function clearLoginState() {
    localStorage.removeItem('open_source_user');
    localStorage.removeItem('open_source_admin');
    AppState.currentUser = null;
    AppState.adminToken = null;
    AppState.isLoggedIn = false;
    AppState.isAdmin = false;
    updateUIForLogin();
}

/**
 * 保存用户数据
 * @param {object} userData - 用户数据
 */
function saveUserData(userData) {
    if (!userData) return;
    
    AppState.currentUser = userData;
    AppState.isLoggedIn = true;
    localStorage.setItem('open_source_user', JSON.stringify(userData));
    updateUIForLogin();
}

/**
 * 保存管理员数据
 * @param {object} adminData - 管理员数据
 */
function saveAdminData(adminData) {
    if (!adminData) return;
    
    AppState.adminToken = adminData.token;
    AppState.isAdmin = true;
    localStorage.setItem('open_source_admin', JSON.stringify(adminData));
}

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} 是否有效
 */
function isValidUrl(url) {
    if (!url) return false;
    
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * 验证QQ号格式
 * @param {string} qq - QQ号
 * @returns {boolean} 是否有效
 */
function isValidQQ(qq) {
    const re = /^[1-9][0-9]{4,10}$/;
    return re.test(qq);
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
}

/**
 * 验证B站链接格式
 * @param {string} url - B站链接
 * @returns {boolean} 是否有效
 */
function isValidBilibiliUrl(url) {
    return url.includes('bilibili.com') || url.includes('b23.tv');
}

/**
 * 根据联系方式类型验证值
 * @param {string} type - 联系方式类型
 * @param {string} value - 值
 * @returns {boolean} 是否有效
 */
function validateContact(type, value) {
    switch (type) {
        case 'email':
            return isValidEmail(value);
        case 'qq':
            return isValidQQ(value);
        case 'phone':
            return isValidPhone(value);
        case 'bilibili':
            return isValidBilibiliUrl(value);
        default:
            return value && value.trim().length > 0;
    }
}

/**
 * 获取联系方式提示
 * @param {string} type - 联系方式类型
 * @returns {string} 提示信息
 */
function getContactHint(type) {
    switch (type) {
        case 'email':
            return '请输入有效的邮箱地址，如：example@email.com';
        case 'qq':
            return '请输入5-11位的QQ号，如：123456789';
        case 'phone':
            return '请输入11位手机号，如：13800138000';
        case 'bilibili':
            return '请输入B站主页链接，如：https://space.bilibili.com/123456';
        default:
            return '请输入联系方式';
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间(ms)
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间(ms)
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 初始化工具提示
 */
function initTooltips() {
    // 为有title属性的元素添加工具提示
    const elements = document.querySelectorAll('[title]');
    elements.forEach(el => {
        el.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            tooltip.style.position = 'absolute';
            tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '6px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.zIndex = '10000';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.whiteSpace = 'nowrap';
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
            
            this._tooltip = tooltip;
        });
        
        el.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                delete this._tooltip;
            }
        });
    });
}

/**
 * 初始化模态框
 */
function initModals() {
    // 关闭按钮事件
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close') || 
            e.target.closest('.modal-close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }
    });
    
    // 点击模态框背景关闭
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

/**
 * 初始化返回顶部按钮
 */
function initBackToTop() {
    // 监听滚动事件
    window.addEventListener('scroll', debounce(() => {
        const backToTop = document.getElementById('back-to-top');
        if (!backToTop) {
            createBackToTopButton();
            return;
        }
        
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, 100));
}

/**
 * 创建返回顶部按钮
 */
function createBackToTopButton() {
    const button = document.createElement('button');
    button.id = 'back-to-top';
    button.innerHTML = '<i class="fas fa-chevron-up"></i>';
    button.setAttribute('aria-label', '返回顶部');
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #back-to-top {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            opacity: 0;
            visibility: hidden;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #back-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
        
        #back-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
    `;
    
    if (!document.querySelector('#back-to-top-styles')) {
        style.id = 'back-to-top-styles';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(button);
    
    // 添加点击事件
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        showError('复制失败，请手动复制');
    });
}

/**
 * 下载文件
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容
 * @param {string} type - MIME类型
 */
function downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 5) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 导出到全局作用域
window.AppState = AppState;
window.apiRequest = apiRequest;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.formatDate = formatDate;
window.clearLoginState = clearLoginState;
window.saveUserData = saveUserData;
window.saveAdminData = saveAdminData;
window.isValidUrl = isValidUrl;
window.validateContact = validateContact;
window.getContactHint = getContactHint;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.downloadFile = downloadFile;
window.generateRandomString = generateRandomString;