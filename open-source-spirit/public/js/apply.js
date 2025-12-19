// ============================================
// 开源精神分号器 - 申号页面逻辑
// ============================================

// 申请状态
const ApplyState = {
    currentApplications: [],
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    isSubmitting: false,
    isFormVisible: false
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (!AppState.isLoggedIn) {
        showLoginPrompt();
        return;
    }
    
    // 已登录，初始化页面
    initApplyPage();
    loadApplications();
});

/**
 * 显示登录提示
 */
function showLoginPrompt() {
    const authPrompt = document.getElementById('auth-prompt');
    const applyContent = document.getElementById('apply-content');
    const newProjectForm = document.getElementById('new-project-form');
    
    if (authPrompt) authPrompt.style.display = 'block';
    if (applyContent) applyContent.style.display = 'none';
    if (newProjectForm) newProjectForm.style.display = 'none';
    
    // 添加登录按钮事件
    const loginBtn = document.getElementById('goto-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
    }
}

/**
 * 初始化申号页面
 */
function initApplyPage() {
    // 显示已登录内容
    const authPrompt = document.getElementById('auth-prompt');
    const applyContent = document.getElementById('apply-content');
    
    if (authPrompt) authPrompt.style.display = 'none';
    if (applyContent) applyContent.style.display = 'block';
    
    // 更新用户信息
    updateUserInfo();
    
    // 初始化按钮事件
    initButtons();
    
    // 初始化申请表单
    initApplyForm();
}

/**
 * 更新用户信息显示
 */
function updateUserInfo() {
    if (!AppState.currentUser) return;
    
    const usernameEl = document.getElementById('current-username');
    const contactEl = document.getElementById('current-contact');
    
    if (usernameEl) {
        usernameEl.textContent = AppState.currentUser.nickname || AppState.currentUser.username;
    }
    
    if (contactEl) {
        contactEl.textContent = AppState.currentUser.contact_value || '-';
    }
}

/**
 * 初始化按钮事件
 */
function initButtons() {
    const newProjectBtn = document.getElementById('new-project-btn');
    const backToListBtn = document.getElementById('back-to-list');
    const cancelFormBtn = document.getElementById('cancel-form');
    
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', showNewProjectForm);
    }
    
    if (backToListBtn) {
        backToListBtn.addEventListener('click', showApplicationsList);
    }
    
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', showApplicationsList);
    }
}

/**
 * 显示新建项目表单
 */
function showNewProjectForm() {
    const applyContent = document.getElementById('apply-content');
    const newProjectForm = document.getElementById('new-project-form');
    
    if (applyContent && newProjectForm) {
        applyContent.style.display = 'none';
        newProjectForm.style.display = 'block';
        ApplyState.isFormVisible = true;
        
        // 重置表单
        resetApplyForm();
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    }
}

/**
 * 显示申请记录列表
 */
function showApplicationsList() {
    const applyContent = document.getElementById('apply-content');
    const newProjectForm = document.getElementById('new-project-form');
    
    if (applyContent && newProjectForm) {
        applyContent.style.display = 'block';
        newProjectForm.style.display = 'none';
        ApplyState.isFormVisible = false;
        
        // 重新加载申请记录
        loadApplications();
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    }
}

/**
 * 初始化申请表单
 */
function initApplyForm() {
    const projectForm = document.getElementById('project-form');
    if (!projectForm) return;
    
    projectForm.addEventListener('submit', handleSubmitApplication);
    
    // 初始化表单验证
    initFormValidation();
}

/**
 * 初始化表单验证
 */
function initFormValidation() {
    const projectNameInput = document.getElementById('project-name');
    const firstRepoInput = document.getElementById('first-repo-url');
    const videoUrlInput = document.getElementById('video-url');
    
    // 实时验证URL格式
    if (firstRepoInput) {
        firstRepoInput.addEventListener('blur', function() {
            validateUrlInput(this, '请输入有效的代码仓库URL');
        });
    }
    
    if (videoUrlInput) {
        videoUrlInput.addEventListener('blur', function() {
            validateUrlInput(this, '请输入有效的视频URL');
        });
    }
    
    // 实时验证项目名称
    if (projectNameInput) {
        projectNameInput.addEventListener('blur', function() {
            validateProjectName(this);
        });
    }
}

/**
 * 验证URL输入
 * @param {HTMLInputElement} input - 输入元素
 * @param {string} errorMessage - 错误消息
 */
function validateUrlInput(input, errorMessage) {
    const value = input.value.trim();
    if (value && !isValidUrl(value)) {
        showInputError(input, errorMessage);
        return false;
    } else {
        clearInputError(input);
        return true;
    }
}

/**
 * 验证项目名称
 * @param {HTMLInputElement} input - 输入元素
 */
function validateProjectName(input) {
    const value = input.value.trim();
    if (value.length < 2) {
        showInputError(input, '项目名称至少需要2个字符');
        return false;
    } else if (value.length > 100) {
        showInputError(input, '项目名称不能超过100个字符');
        return false;
    } else {
        clearInputError(input);
        return true;
    }
}

/**
 * 显示输入错误
 * @param {HTMLInputElement} input - 输入元素
 * @param {string} message - 错误消息
 */
function showInputError(input, message) {
    input.classList.add('error');
    
    // 移除现有的错误消息
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 添加错误消息
    const errorElement = document.createElement('div');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    errorElement.style.color = '#ef4444';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    input.parentNode.appendChild(errorElement);
}

/**
 * 清除输入错误
 * @param {HTMLInputElement} input - 输入元素
 */
function clearInputError(input) {
    input.classList.remove('error');
    
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * 重置申请表单
 */
function resetApplyForm() {
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.reset();
        
        // 清除所有错误状态
        const errorInputs = projectForm.querySelectorAll('.error');
        errorInputs.forEach(input => {
            input.classList.remove('error');
        });
        
        // 移除所有错误消息
        const errorMessages = projectForm.querySelectorAll('.input-error');
        errorMessages.forEach(error => error.remove());
    }
}

/**
 * 处理提交申请
 * @param {Event} e - 事件对象
 */
async function handleSubmitApplication(e) {
    e.preventDefault();
    
    if (!validateApplyForm()) {
        return;
    }
    
    if (ApplyState.isSubmitting) {
        return;
    }
    
    ApplyState.isSubmitting = true;
    setSubmitButtonState(true);
    
    try {
        const formData = getFormData();
        
        // 提交申请
        const result = await apiRequest('/apply', 'POST', formData);
        
        if (result.success) {
            // 显示成功模态框
            showSuccessModal(result);
            
            // 重置表单
            resetApplyForm();
            
            // 记录申请
            ApplyState.currentApplications.unshift(result.project);
            ApplyState.totalApplications++;
            
            // 更新申请记录显示
            updateApplicationsList();
        }
    } catch (error) {
        console.error('提交申请失败:', error);
        showError('提交申请失败: ' + error.message);
    } finally {
        ApplyState.isSubmitting = false;
        setSubmitButtonState(false);
    }
}

/**
 * 验证申请表单
 * @returns {boolean} 是否有效
 */
function validateApplyForm() {
    let isValid = true;
    
    // 验证项目名称
    const projectNameInput = document.getElementById('project-name');
    if (!validateProjectName(projectNameInput)) {
        isValid = false;
    }
    
    // 验证第一开源地址
    const firstRepoInput = document.getElementById('first-repo-url');
    if (!validateUrlInput(firstRepoInput, '请输入有效的代码仓库URL')) {
        isValid = false;
    }
    
    // 验证视频地址
    const videoUrlInput = document.getElementById('video-url');
    if (!validateUrlInput(videoUrlInput, '请输入有效的视频URL')) {
        isValid = false;
    }
    
    // 验证条款同意
    const agreeTermsCheckbox = document.getElementById('agree-terms');
    if (!agreeTermsCheckbox.checked) {
        showError('请同意开源协议条款');
        isValid = false;
    }
    
    return isValid;
}

/**
 * 获取表单数据
 * @returns {Object} 表单数据
 */
function getFormData() {
    if (!AppState.currentUser || !AppState.currentUser.id) {
        throw new Error('用户未登录');
    }
    
    return {
        projectName: document.getElementById('project-name').value.trim(),
        firstRepoUrl: document.getElementById('first-repo-url').value.trim(),
        secondRepoUrl: document.getElementById('second-repo-url').value.trim() || null,
        videoUrl: document.getElementById('video-url').value.trim(),
        applicantId: AppState.currentUser.id,
        agreeTerms: document.getElementById('agree-terms').checked
    };
}

/**
 * 设置提交按钮状态
 * @param {boolean} isSubmitting - 是否正在提交
 */
function setSubmitButtonState(isSubmitting) {
    const submitBtn = document.getElementById('submit-form');
    if (!submitBtn) return;
    
    if (isSubmitting) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 提交申请';
    }
}

/**
 * 显示成功模态框
 * @param {Object} result - 提交结果
 */
function showSuccessModal(result) {
    const successModal = document.getElementById('success-modal');
    const generatedIdEl = document.getElementById('generated-id');
    const successProjectNameEl = document.getElementById('success-project-name');
    const successApplyTimeEl = document.getElementById('success-apply-time');
    const downloadVideoLink = document.getElementById('download-video');
    const goToSearchLink = document.getElementById('go-to-search');
    const closeModalBtn = document.getElementById('close-modal');
    
    if (!successModal) return;
    
    // 填充数据
    if (generatedIdEl) {
        generatedIdEl.textContent = result.openSourceId;
        generatedIdEl.title = '点击复制';
        generatedIdEl.style.cursor = 'pointer';
        generatedIdEl.addEventListener('click', () => {
            copyToClipboard(result.openSourceId);
        });
    }
    
    if (successProjectNameEl) {
        successProjectNameEl.textContent = result.project.project_name;
    }
    
    if (successApplyTimeEl) {
        successApplyTimeEl.textContent = formatDate(new Date());
    }
    
    // 设置下载链接
    if (downloadVideoLink) {
        downloadVideoLink.href = result.downloadLink || 'https://www.baidu.com';
    }
    
    // 设置查询链接
    if (goToSearchLink) {
        goToSearchLink.href = '/?q=' + encodeURIComponent(result.openSourceId);
    }
    
    // 显示模态框
    successModal.classList.add('active');
    
    // 添加关闭事件
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }
    
    // 点击背景关闭
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('active');
        }
    });
    
    // 自动关闭（可选）
    setTimeout(() => {
        successModal.classList.remove('active');
    }, 10000);
}

/**
 * 加载申请记录
 */
async function loadApplications() {
    if (!AppState.currentUser || !AppState.currentUser.id) {
        return;
    }
    
    try {
        const result = await apiRequest(`/user/${AppState.currentUser.id}/applications?limit=10&page=${ApplyState.currentPage}`);
        
        if (result.success) {
            ApplyState.currentApplications = result.data;
            ApplyState.totalApplications = result.pagination.total;
            ApplyState.totalPages = result.pagination.totalPages;
            
            displayApplications(result.data);
            updateApplicationStats();
        }
    } catch (error) {
        console.error('加载申请记录失败:', error);
        showError('加载申请记录失败');
    }
}

/**
 * 显示申请记录
 * @param {Array} applications - 申请记录数组
 */
function displayApplications(applications) {
    const applicationsList = document.getElementById('applications-list');
    if (!applicationsList) return;
    
    // 清空现有内容
    applicationsList.innerHTML = '';
    
    if (!applications || applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-applications">
                <i class="fas fa-folder-open"></i>
                <h3>暂无申请记录</h3>
                <p>点击上方"新建开源项目"开始您的第一个申请</p>
            </div>
        `;
        return;
    }
    
    // 生成申请记录卡片
    applications.forEach(application => {
        const card = createApplicationCard(application);
        applicationsList.appendChild(card);
    });
}

/**
 * 创建申请卡片
 * @param {Object} application - 申请数据
 * @returns {HTMLElement} 卡片元素
 */
function createApplicationCard(application) {
    const card = document.createElement('div');
    card.className = 'application-card';
    
    // 状态徽章
    const statusBadge = getApplicationStatusBadge(application.status);
    
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
            ${application.video_url ? `
            <p class="truncate">
                <i class="fab fa-youtube"></i> ${formatUrl(application.video_url)}
            </p>
            ` : ''}
        </div>
        
        <div class="application-actions">
            <button class="btn btn-outline btn-sm view-application" data-id="${application.id}">
                <i class="fas fa-eye"></i> 查看
            </button>
            <button class="btn btn-outline btn-sm copy-application-id" data-id="${application.id}">
                <i class="fas fa-copy"></i> 复制ID
            </button>
            ${application.status === 'approved' ? `
            <a href="${application.download_link || 'https://www.baidu.com'}" 
               class="btn btn-outline btn-sm" 
               target="_blank">
                <i class="fas fa-download"></i> 下载
            </a>
            ` : ''}
        </div>
    `;
    
    // 添加事件监听器
    const viewBtn = card.querySelector('.view-application');
    const copyBtn = card.querySelector('.copy-application-id');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewApplicationDetails(id);
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            copyToClipboard(id);
            showSuccess('开源号已复制到剪贴板');
        });
    }
    
    return card;
}

/**
 * 获取申请状态徽章
 * @param {string} status - 状态
 * @returns {string} 徽章HTML
 */
function getApplicationStatusBadge(status) {
    const statusMap = {
        'pending': { text: '审核中', class: 'pending', icon: 'fa-clock' },
        'approved': { text: '已通过', class: 'approved', icon: 'fa-check-circle' },
        'rejected': { text: '未通过', class: 'rejected', icon: 'fa-times-circle' }
    };
    
    const statusInfo = statusMap[status] || { text: '未知', class: 'pending', icon: 'fa-question-circle' };
    
    return `
        <span class="status-badge ${statusInfo.class}">
            <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
        </span>
    `;
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
        let displayText = urlObj.hostname;
        
        // 如果是GitHub，显示仓库名
        if (urlObj.hostname === 'github.com') {
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length >= 2) {
                displayText = `${pathParts[0]}/${pathParts[1]}`;
            }
        }
        
        // 如果是B站，显示视频ID
        if (urlObj.hostname.includes('bilibili.com')) {
            const videoMatch = urlObj.pathname.match(/\/video\/(BV\w+)/);
            if (videoMatch) {
                displayText = `B站: ${videoMatch[1]}`;
            }
        }
        
        return displayText;
    } catch {
        // 如果不是合法URL，返回原字符串（截断）
        return url.length > 30 ? url.substring(0, 30) + '...' : url;
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
    modal.id = 'application-details-modal';
    
    // 状态徽章
    const statusBadge = getApplicationStatusBadge(application.status);
    
    // 格式化日期
    const applyDate = formatDate(application.apply_date || application.created_at);
    const createDate = formatDate(application.created_at);
    
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
                            <span class="open-source-id" style="cursor: pointer;" 
                                  onclick="copyToClipboard('${application.id}')">
                                ${application.id}
                            </span>
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
                        <div class="detail-item">
                            <strong>创建时间：</strong>
                            <span>${createDate}</span>
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
                        ${application.download_link ? `
                        <div class="link-item">
                            <strong>视频下载：</strong>
                            <a href="${application.download_link}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-download"></i> 下载
                            </a>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>操作</h4>
                    <div class="action-buttons">
                        <button class="btn btn-outline copy-all-links">
                            <i class="fas fa-copy"></i> 复制所有链接
                        </button>
                        <button class="btn btn-primary open-all-links">
                            <i class="fas fa-external-link-alt"></i> 打开所有链接
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 添加事件监听器
    const closeBtn = modal.querySelector('.modal-close');
    const copyAllBtn = modal.querySelector('.copy-all-links');
    const openAllBtn = modal.querySelector('.open-all-links');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
            const links = [
                `开源号: ${application.id}`,
                `项目名称: ${application.project_name}`,
                `第一开源地址: ${application.first_repo_url}`,
                application.second_repo_url ? `第二开源地址: ${application.second_repo_url}` : '',
                `视频地址: ${application.video_url}`,
                application.download_link ? `下载链接: ${application.download_link}` : ''
            ].filter(link => link);
            
            copyToClipboard(links.join('\n'));
            showSuccess('所有链接已复制到剪贴板');
        });
    }
    
    if (openAllBtn) {
        openAllBtn.addEventListener('click', () => {
            // 打开所有链接
            const links = [
                application.first_repo_url,
                application.second_repo_url,
                application.video_url,
                application.download_link
            ].filter(url => url && isValidUrl(url));
            
            links.forEach(url => {
                window.open(url, '_blank');
            });
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
 * 更新申请统计
 */
function updateApplicationStats() {
    const appliedCountEl = document.getElementById('applied-count');
    if (appliedCountEl) {
        appliedCountEl.textContent = ApplyState.totalApplications;
    }
}

/**
 * 更新申请记录列表
 */
function updateApplicationsList() {
    displayApplications(ApplyState.currentApplications);
    updateApplicationStats();
}

// 导出到全局作用域
window.ApplyState = ApplyState;
window.showNewProjectForm = showNewProjectForm;
window.showApplicationsList = showApplicationsList;