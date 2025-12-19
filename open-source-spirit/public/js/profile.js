// ============================================
// 开源精神分号器 - 个人主页逻辑
// ============================================

// 个人主页状态
const ProfileState = {
    userStats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
    },
    recentApplications: []
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initProfilePage();
    initAuthTabs();
    initContactTypeHandler();
    initAdminDropdown();
    
    // 检查登录状态
    if (AppState.isLoggedIn) {
        loadUserProfile();
    }
});

/**
 * 初始化个人主页
 */
function initProfilePage() {
    // 初始化登录表单
    initLoginForm();
    
    // 初始化注册表单
    initRegisterForm();
    
    // 初始化退出登录按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 初始化管理员访问按钮
    const adminAccessBtn = document.getElementById('admin-access');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', toggleAdminDropdown);
    }
    
    // 初始化管理员登录模态框
    initAdminModal();
}

/**
 * 初始化认证标签页
 */
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // 更新标签页状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应的表单
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}-form`) {
                    form.classList.add('active');
                }
            });
            
            // 重置表单
            if (tabName === 'login') {
                resetLoginForm();
            } else if (tabName === 'register') {
                resetRegisterForm();
            }
        });
    });
}

/**
 * 初始化联系方式类型处理
 */
function initContactTypeHandler() {
    const contactTypeSelect = document.getElementById('register-contact-type');
    const contactValueInput = document.getElementById('register-contact-value');
    const contactHint = document.getElementById('contact-hint');
    
    if (contactTypeSelect && contactValueInput && contactHint) {
        contactTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            
            // 更新输入框提示和验证
            contactHint.textContent = getContactHint(selectedType);
            
            // 根据类型更新输入框类型
            switch (selectedType) {
                case 'email':
                    contactValueInput.type = 'email';
                    contactValueInput.placeholder = 'example@email.com';
                    break;
                case 'qq':
                case 'phone':
                    contactValueInput.type = 'tel';
                    contactValueInput.placeholder = selectedType === 'qq' ? '123456789' : '13800138000';
                    break;
                case 'bilibili':
                    contactValueInput.type = 'url';
                    contactValueInput.placeholder = 'https://space.bilibili.com/123456';
                    break;
                default:
                    contactValueInput.type = 'text';
                    contactValueInput.placeholder = '请输入联系方式';
            }
        });
    }
}

/**
 * 初始化登录表单
 */
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const contactValue = document.getElementById('login-contact').value.trim();
        
        if (!contactValue) {
            showError('请输入联系方式');
            return;
        }
        
        try {
            const result = await apiRequest('/login', 'POST', {
                contactValue: contactValue
            });
            
            if (result.success) {
                saveUserData(result.user);
                showSuccess('登录成功！');
                
                // 重新加载页面数据
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('登录失败:', error);
            showError('登录失败，请检查联系方式');
        }
    });
}

/**
 * 初始化注册表单
 */
function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateRegisterForm()) {
            return;
        }
        
        const formData = {
            username: document.getElementById('register-username').value.trim(),
            nickname: document.getElementById('register-nickname').value.trim(),
            contactType: document.getElementById('register-contact-type').value,
            contactValue: document.getElementById('register-contact-value').value.trim()
        };
        
        try {
            const result = await apiRequest('/register', 'POST', formData);
            
            if (result.success) {
                saveUserData(result.user);
                showSuccess('注册成功！已自动登录');
                
                // 重新加载页面数据
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('注册失败:', error);
            showError(error.message || '注册失败');
        }
    });
}

/**
 * 验证注册表单
 * @returns {boolean} 是否有效
 */
function validateRegisterForm() {
    const username = document.getElementById('register-username').value.trim();
    const nickname = document.getElementById('register-nickname').value.trim();
    const contactType = document.getElementById('register-contact-type').value;
    const contactValue = document.getElementById('register-contact-value').value.trim();
    
    // 验证用户名
    if (!username) {
        showError('请输入用户名');
        return false;
    }
    
    if (username.length < 3 || username.length > 20) {
        showError('用户名长度应在3-20个字符之间');
        return false;
    }
    
    // 验证昵称
    if (!nickname) {
        showError('请输入昵称');
        return false;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
        showError('昵称长度应在2-20个字符之间');
        return false;
    }
    
    // 验证联系方式类型
    if (!contactType) {
        showError('请选择联系方式类型');
        return false;
    }
    
    // 验证联系方式值
    if (!contactValue) {
        showError('请输入联系方式');
        return false;
    }
    
    if (!validateContact(contactType, contactValue)) {
        showError(`无效的${getContactTypeName(contactType)}格式`);
        return false;
    }
    
    return true;
}

/**
 * 获取联系方式类型名称
 * @param {string} type - 类型代码
 * @returns {string} 类型名称
 */
function getContactTypeName(type) {
    const typeMap = {
        'qq': 'QQ号',
        'email': '邮箱',
        'phone': '手机号',
        'bilibili': 'B站链接'
    };
    
    return typeMap[type] || '联系方式';
}

/**
 * 重置登录表单
 */
function resetLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
    }
}

/**
 * 重置注册表单
 */
function resetRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.reset();
        
        // 重置提示
        const contactHint = document.getElementById('contact-hint');
        if (contactHint) {
            contactHint.textContent = '请输入您选择的联系方式';
        }
    }
}

/**
 * 加载用户资料
 */
async function loadUserProfile() {
    if (!AppState.currentUser || !AppState.currentUser.id) {
        return;
    }
    
    try {
        const [userResult, applicationsResult] = await Promise.all([
            apiRequest(`/user/${AppState.currentUser.id}`),
            apiRequest(`/user/${AppState.currentUser.id}/applications?limit=5`)
        ]);
        
        if (userResult.success) {
            displayUserProfile(userResult.user, userResult.stats);
            ProfileState.userStats = userResult.stats;
        }
        
        if (applicationsResult.success) {
            displayRecentApplications(applicationsResult.data);
            ProfileState.recentApplications = applicationsResult.data;
        }
    } catch (error) {
        console.error('加载用户资料失败:', error);
        showError('加载用户资料失败');
    }
}

/**
 * 显示用户资料
 * @param {Object} user - 用户数据
 * @param {Object} stats - 统计数据
 */
function displayUserProfile(user, stats) {
    // 更新基本信息
    const usernameEl = document.getElementById('profile-username');
    const contactEl = document.getElementById('profile-contact');
    const infoUsernameEl = document.getElementById('info-username');
    const infoNicknameEl = document.getElementById('info-nickname');
    const infoContactEl = document.getElementById('info-contact');
    const infoRegisterTimeEl = document.getElementById('info-register-time');
    const infoLastLoginEl = document.getElementById('info-last-login');
    
    if (usernameEl) usernameEl.textContent = user.nickname;
    if (contactEl) contactEl.textContent = user.contact_value;
    if (infoUsernameEl) infoUsernameEl.textContent = user.username;
    if (infoNicknameEl) infoNicknameEl.textContent = user.nickname;
    if (infoContactEl) infoContactEl.textContent = user.contact_value;
    if (infoRegisterTimeEl) infoRegisterTimeEl.textContent = formatDate(user.created_at);
    if (infoLastLoginEl) infoLastLoginEl.textContent = formatDate(new Date());
    
    // 更新统计数据
    const approvedCountEl = document.getElementById('approved-count');
    const pendingCountEl = document.getElementById('pending-count');
    const rejectedCountEl = document.getElementById('rejected-count');
    const totalCountEl = document.getElementById('total-count');
    
    if (approvedCountEl) approvedCountEl.textContent = stats.approved || 0;
    if (pendingCountEl) pendingCountEl.textContent = stats.pending || 0;
    if (rejectedCountEl) rejectedCountEl.textContent = stats.rejected || 0;
    if (totalCountEl) totalCountEl.textContent = stats.total || 0;
    
    // 显示已登录内容
    const authSection = document.getElementById('auth-section');
    const profileContent = document.getElementById('profile-content');
    
    if (authSection) authSection.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
}

/**
 * 显示最近申请
 * @param {Array} applications - 申请记录
 */
function displayRecentApplications(applications) {
    const applicationsList = document.getElementById('profile-applications');
    if (!applicationsList) return;
    
    // 清空现有内容
    applicationsList.innerHTML = '';
    
    if (!applications || applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-applications">
                <i class="fas fa-folder-open"></i>
                <h3>暂无申请记录</h3>
                <p>前往"申号"页面创建您的第一个开源项目</p>
            </div>
        `;
        return;
    }
    
    // 生成申请记录卡片
    applications.forEach(application => {
        const card = createProfileApplicationCard(application);
        applicationsList.appendChild(card);
    });
}

/**
 * 创建个人主页申请卡片
 * @param {Object} application - 申请数据
 * @returns {HTMLElement} 卡片元素
 */
function createProfileApplicationCard(application) {
    const card = document.createElement('div');
    card.className = 'application-card profile';
    
    // 状态徽章
    const statusBadge = getStatusBadge(application.status);
    
    // 格式化日期
    const applyDate = formatDate(application.apply_date || application.created_at);
    
    // 截断过长的项目名
    const projectName = application.project_name.length > 25 
        ? application.project_name.substring(0, 25) + '...' 
        : application.project_name;
    
    card.innerHTML = `
        <div class="application-header">
            <div class="application-title">
                <h4 title="${application.project_name}">
                    <i class="fas fa-project-diagram"></i> ${projectName}
                </h4>
                <span class="application-id">${application.id}</span>
            </div>
            ${statusBadge}
        </div>
        
        <div class="application-details">
            <p><strong><i class="fas fa-calendar"></i> ${applyDate}</strong></p>
            <p class="truncate">
                <i class="fab fa-github"></i> ${formatUrl(application.first_repo_url)}
            </p>
        </div>
        
        <div class="application-actions">
            <button class="btn btn-outline btn-sm view-application" data-id="${application.id}">
                <i class="fas fa-eye"></i> 查看
            </button>
        </div>
    `;
    
    // 添加事件监听器
    const viewBtn = card.querySelector('.view-application');
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewApplicationDetails(id);
        });
    }
    
    return card;
}

/**
 * 获取状态徽章HTML
 * @param {string} status - 状态
 * @returns {string} 徽章HTML
 */
function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: '审核中', class: 'pending' },
        'approved': { text: '已通过', class: 'approved' },
        'rejected': { text: '未通过', class: 'rejected' }
    };
    
    const statusInfo = statusMap[status] || { text: '未知', class: 'pending' };
    
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

/**
 * 格式化URL显示
 * @param {string} url - 完整URL
 * @returns {string} 格式化后的显示文本
 */
function formatUrl(url) {
    if (!url) return '';
    
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        // 如果不是合法URL，返回原字符串（截断）
        return url.length > 20 ? url.substring(0, 20) + '...' : url;
    }
}

/**
 * 查看申请详情
 * @param {string} applicationId - 申请ID
 */
async function viewApplicationDetails(applicationId) {
    try {
        const result = await apiRequest(`/projects/${applicationId}`);
        
        if (result.success) {
            showApplicationDetailsModal(result.data);
        }
    } catch (error) {
        console.error('获取申请详情失败:', error);
        showError('获取申请详情失败');
    }
}

/**
 * 显示申请详情模态框
 * @param {Object} application - 申请数据
 */
function showApplicationDetailsModal(application) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'profile-application-details-modal';
    
    // 状态徽章
    const statusBadge = getStatusBadge(application.status);
    
    // 格式化日期
    const applyDate = formatDate(application.apply_date || application.created_at);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-file-alt"></i> 申请详情</h3>
                <button class="modal-close">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>开源号：</strong>
                            <span class="open-source-id">${application.id}</span>
                        </div>
                        <div class="detail-item">
                            <strong>项目名称：</strong>
                            <span>${application.project_name}</span>
                        </div>
                        <div class="detail-item">
                            <strong>申请状态：</strong>
                            ${statusBadge}
                        </div>
                        <div class="detail-item">
                            <strong>申请时间：</strong>
                            <span>${applyDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>项目地址</h4>
                    <div class="detail-links">
                        <div class="link-item">
                            <strong>第一开源地址：</strong>
                            <a href="${application.first_repo_url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> 访问
                            </a>
                        </div>
                        ${application.second_repo_url ? `
                        <div class="link-item">
                            <strong>第二开源地址：</strong>
                            <a href="${application.second_repo_url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> 访问
                            </a>
                        </div>
                        ` : ''}
                        <div class="link-item">
                            <strong>视频地址：</strong>
                            <a href="${application.video_url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> 观看
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>操作</h4>
                    <div class="action-buttons">
                        <button class="btn btn-outline copy-application-id">
                            <i class="fas fa-copy"></i> 复制开源号
                        </button>
                        <button class="btn btn-primary open-all-links">
                            <i class="fas fa-external-link-alt"></i> 打开链接
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 添加事件监听器
    const copyBtn = modal.querySelector('.copy-application-id');
    const openAllBtn = modal.querySelector('.open-all-links');
    const closeBtn = modal.querySelector('.modal-close');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(application.id);
        });
    }
    
    if (openAllBtn) {
        openAllBtn.addEventListener('click', () => {
            // 打开所有链接
            const links = [
                application.first_repo_url,
                application.second_repo_url,
                application.video_url
            ].filter(url => url && isValidUrl(url));
            
            links.forEach(url => {
                window.open(url, '_blank');
            });
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * 处理退出登录
 */
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        clearLoginState();
        showSuccess('已退出登录');
        
        // 重新加载页面
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

/**
 * 初始化管理员下拉菜单
 */
function initAdminDropdown() {
    const adminAccessBtn = document.getElementById('admin-access');
    const adminDropdown = document.getElementById('admin-dropdown');
    
    if (!adminAccessBtn || !adminDropdown) return;
    
    // 点击其他区域关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!adminAccessBtn.contains(e.target) && !adminDropdown.contains(e.target)) {
            adminDropdown.style.display = 'none';
        }
    });
    
    // 管理员登录链接
    const adminLoginLink = document.getElementById('admin-login');
    if (adminLoginLink) {
        adminLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAdminModal();
            adminDropdown.style.display = 'none';
        });
    }
}

/**
 * 切换管理员下拉菜单
 */
function toggleAdminDropdown() {
    const adminDropdown = document.getElementById('admin-dropdown');
    if (adminDropdown) {
        adminDropdown.style.display = adminDropdown.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * 初始化管理员模态框
 */
function initAdminModal() {
    const adminModal = document.getElementById('admin-modal');
    if (!adminModal) return;
    
    const closeBtn = document.getElementById('close-admin-modal');
    const adminLoginForm = document.getElementById('admin-login-form');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            adminModal.classList.remove('active');
        });
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // 点击背景关闭
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.classList.remove('active');
        }
    });
}

/**
 * 显示管理员模态框
 */
function showAdminModal() {
    const adminModal = document.getElementById('admin-modal');
    if (adminModal) {
        adminModal.classList.add('active');
    }
}

/**
 * 处理管理员登录
 * @param {Event} e - 事件对象
 */
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    
    if (!username || !password) {
        showError('请输入管理员账号和密码');
        return;
    }
    
    try {
        const result = await apiRequest('/admin/login', 'POST', {
            username: username,
            password: password
        });
        
        if (result.success) {
            saveAdminData(result);
            showSuccess('管理员登录成功！');
            
            // 关闭模态框
            const adminModal = document.getElementById('admin-modal');
            if (adminModal) {
                adminModal.classList.remove('active');
            }
            
            // 跳转到管理员页面
            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 1000);
        }
    } catch (error) {
        console.error('管理员登录失败:', error);
        showError('管理员登录失败，请检查账号密码');
    }
}

// 导出到全局作用域
window.ProfileState = ProfileState;
window.loadUserProfile = loadUserProfile;