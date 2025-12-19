// ============================================
// 开源精神分号器 - 管理员页面逻辑
// ============================================

// 管理员状态
const AdminState = {
    isLoggedIn: false,
    currentView: 'dashboard',
    currentProjectPage: 1,
    totalProjectPages: 1,
    totalProjects: 0,
    projects: [],
    stats: {},
    isLoading: false,
    currentProjectDetail: null
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initAdminPage();
    checkAdminLogin();
});

/**
 * 初始化管理员页面
 */
function initAdminPage() {
    // 初始化管理员登录
    initAdminLogin();
    
    // 初始化侧边栏
    initSidebar();
    
    // 初始化仪表盘
    initDashboard();
    
    // 初始化项目管理
    initProjectManagement();
    
    // 初始化退出登录
    initLogout();
    
    // 初始化项目详情模态框
    initProjectDetailModal();
}

/**
 * 检查管理员登录状态
 */
function checkAdminLogin() {
    if (AppState.isAdmin && AppState.adminToken) {
        // 已登录，显示管理界面
        AdminState.isLoggedIn = true;
        showAdminInterface();
        loadDashboardData();
    } else {
        // 未登录，显示登录界面
        AdminState.isLoggedIn = false;
        showLoginInterface();
    }
}

/**
 * 初始化管理员登录
 */
function initAdminLogin() {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('admin-login-username').value.trim();
        const password = document.getElementById('admin-login-password').value.trim();
        
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
                AdminState.isLoggedIn = true;
                showSuccess('管理员登录成功！');
                
                // 显示管理界面
                showAdminInterface();
                loadDashboardData();
            }
        } catch (error) {
            console.error('管理员登录失败:', error);
            showError('管理员登录失败，请检查账号密码');
        }
    });
}

/**
 * 显示登录界面
 */
function showLoginInterface() {
    const loginPage = document.getElementById('admin-login-page');
    const adminContainer = document.querySelector('.admin-container');
    
    if (loginPage) loginPage.style.display = 'flex';
    if (adminContainer) adminContainer.style.display = 'none';
}

/**
 * 显示管理界面
 */
function showAdminInterface() {
    const loginPage = document.getElementById('admin-login-page');
    const adminContainer = document.querySelector('.admin-container');
    const adminName = document.getElementById('admin-name');
    
    if (loginPage) loginPage.style.display = 'none';
    if (adminContainer) adminContainer.style.display = 'flex';
    
    // 更新管理员名称
    if (adminName && AppState.adminToken) {
        const tokenData = atob(AppState.adminToken).split(':');
        if (tokenData.length >= 2) {
            adminName.textContent = tokenData[1] || '管理员';
        }
    }
}

/**
 * 初始化侧边栏
 */
function initSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const view = this.getAttribute('data-view');
            
            // 更新侧边栏状态
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // 切换视图
            switchView(view);
        });
    });
}

/**
 * 切换视图
 * @param {string} view - 视图名称
 */
function switchView(view) {
    // 隐藏所有视图
    const views = document.querySelectorAll('.admin-view');
    views.forEach(v => v.style.display = 'none');
    
    // 显示目标视图
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
        targetView.style.display = 'block';
        AdminState.currentView = view;
        
        // 加载对应视图的数据
        switch (view) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'projects':
                loadProjects();
                break;
            case 'users':
                loadUsers();
                break;
            case 'logs':
                loadLogs();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
}

/**
 * 初始化仪表盘
 */
function initDashboard() {
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // 初始化图表
    initCharts();
}

/**
 * 加载仪表盘数据
 */
async function loadDashboardData() {
    if (AdminState.currentView !== 'dashboard') return;
    
    AdminState.isLoading = true;
    setDashboardLoading(true);
    
    try {
        const result = await apiRequest('/admin/projects', 'GET', null, true);
        
        if (result.success) {
            AdminState.projects = result.data;
            AdminState.stats = result.stats;
            
            updateDashboardStats(result.stats);
            updateRecentActivity(result.data);
            updateCharts(result.data);
        }
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        showError('加载仪表盘数据失败');
    } finally {
        AdminState.isLoading = false;
        setDashboardLoading(false);
    }
}

/**
 * 设置仪表盘加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function setDashboardLoading(isLoading) {
    const refreshBtn = document.getElementById('refresh-dashboard');
    const statsCards = document.querySelectorAll('.stat-card');
    
    if (refreshBtn) {
        refreshBtn.disabled = isLoading;
        refreshBtn.innerHTML = isLoading 
            ? '<i class="fas fa-spinner fa-spin"></i> 刷新中...'
            : '<i class="fas fa-sync-alt"></i> 刷新';
    }
    
    if (isLoading) {
        statsCards.forEach(card => {
            card.classList.add('loading');
        });
    } else {
        statsCards.forEach(card => {
            card.classList.remove('loading');
        });
    }
}

/**
 * 更新仪表盘统计
 * @param {Object} stats - 统计数据
 */
function updateDashboardStats(stats) {
    const totalProjectsEl = document.getElementById('total-projects');
    const totalUsersEl = document.getElementById('total-users');
    const pendingProjectsEl = document.getElementById('pending-projects');
    const todaySearchesEl = document.getElementById('today-searches');
    const projectTrendEl = document.getElementById('project-trend');
    const userTrendEl = document.getElementById('user-trend');
    const searchTrendEl = document.getElementById('search-trend');
    
    if (totalProjectsEl) totalProjectsEl.textContent = stats.total || 0;
    if (totalUsersEl) totalUsersEl.textContent = '...'; // 需要用户API
    if (pendingProjectsEl) pendingProjectsEl.textContent = stats.pending || 0;
    if (todaySearchesEl) todaySearchesEl.textContent = '...'; // 需要搜索日志API
    
    // 更新趋势（模拟数据）
    if (projectTrendEl) {
        const trend = Math.floor(Math.random() * 20) + 1;
        projectTrendEl.textContent = `+${trend}%`;
        projectTrendEl.className = 'trend-up';
    }
    
    if (userTrendEl) {
        const trend = Math.floor(Math.random() * 15) + 1;
        userTrendEl.textContent = `+${trend}%`;
        userTrendEl.className = 'trend-up';
    }
    
    if (searchTrendEl) {
        const trend = Math.floor(Math.random() * 25) + 1;
        searchTrendEl.textContent = `+${trend}%`;
        searchTrendEl.className = 'trend-up';
    }
}

/**
 * 更新最近活动
 * @param {Array} projects - 项目数据
 */
function updateRecentActivity(projects) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // 清空现有内容
    activityList.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        activityList.innerHTML = '<p class="no-activity">暂无活动记录</p>';
        return;
    }
    
    // 显示最近5个项目
    const recentProjects = projects.slice(0, 5);
    
    recentProjects.forEach(project => {
        const activityItem = createActivityItem(project);
        activityList.appendChild(activityItem);
    });
}

/**
 * 创建活动项
 * @param {Object} project - 项目数据
 * @returns {HTMLElement} 活动项元素
 */
function createActivityItem(project) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    // 格式化日期
    const createDate = formatDate(project.created_at);
    
    // 状态图标
    let statusIcon = 'fa-clock';
    let statusColor = '#f59e0b';
    let statusText = '提交了申请';
    
    if (project.status === 'approved') {
        statusIcon = 'fa-check-circle';
        statusColor = '#10b981';
        statusText = '通过了申请';
    } else if (project.status === 'rejected') {
        statusIcon = 'fa-times-circle';
        statusColor = '#ef4444';
        statusText = '拒绝了申请';
    }
    
    item.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${statusIcon}" style="color: ${statusColor};"></i>
        </div>
        <div class="activity-content">
            <p class="activity-title">
                <strong>${project.nickname || '匿名用户'}</strong> ${statusText}
                <strong>${project.project_name}</strong>
            </p>
            <p class="activity-time">
                <i class="fas fa-clock"></i> ${createDate}
            </p>
        </div>
        <div class="activity-action">
            <button class="btn btn-sm btn-outline view-project" data-id="${project.id}">
                查看
            </button>
        </div>
    `;
    
    // 添加事件监听器
    const viewBtn = item.querySelector('.view-project');
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            showProjectDetailModal(id);
        });
    }
    
    return item;
}

/**
 * 初始化图表
 */
function initCharts() {
    // 状态分布图
    const statusCtx = document.getElementById('status-chart');
    if (statusCtx) {
        AdminState.statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['审核中', '已通过', '未通过'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#f59e0b',
                        '#10b981',
                        '#ef4444'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    // 趋势图
    const trendCtx = document.getElementById('trend-chart');
    if (trendCtx) {
        AdminState.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                datasets: [{
                    label: '项目申请数',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

/**
 * 更新图表数据
 * @param {Array} projects - 项目数据
 */
function updateCharts(projects) {
    if (!projects || !Array.isArray(projects)) return;
    
    // 更新状态分布图
    if (AdminState.statusChart) {
        const pendingCount = projects.filter(p => p.status === 'pending').length;
        const approvedCount = projects.filter(p => p.status === 'approved').length;
        const rejectedCount = projects.filter(p => p.status === 'rejected').length;
        
        AdminState.statusChart.data.datasets[0].data = [pendingCount, approvedCount, rejectedCount];
        AdminState.statusChart.update();
    }
    
    // 更新趋势图（模拟最近7天数据）
    if (AdminState.trendChart) {
        const trendData = generateTrendData(projects);
        AdminState.trendChart.data.datasets[0].data = trendData;
        AdminState.trendChart.update();
    }
}

/**
 * 生成趋势数据
 * @param {Array} projects - 项目数据
 * @returns {Array} 趋势数据
 */
function generateTrendData(projects) {
    // 模拟最近7天的申请数据
    const trendData = [0, 0, 0, 0, 0, 0, 0];
    
    // 获取最近7天的日期
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }
    
    // 统计每天的项目数（如果有实际数据）
    if (projects && projects.length > 0) {
        projects.forEach(project => {
            const projectDate = new Date(project.apply_date || project.created_at);
            const dateStr = projectDate.toISOString().split('T')[0];
            
            const dayIndex = last7Days.indexOf(dateStr);
            if (dayIndex !== -1) {
                trendData[dayIndex]++;
            }
        });
    } else {
        // 生成模拟数据
        for (let i = 0; i < 7; i++) {
            trendData[i] = Math.floor(Math.random() * 10) + 1;
        }
    }
    
    return trendData;
}

/**
 * 初始化项目管理
 */
function initProjectManagement() {
    // 初始化过滤器
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            AdminState.currentProjectPage = 1;
            loadProjects();
        });
    }
    
    // 初始化搜索
    const projectSearch = document.getElementById('project-search');
    if (projectSearch) {
        projectSearch.addEventListener('input', debounce(function() {
            AdminState.currentProjectPage = 1;
            loadProjects();
        }, 500));
    }
    
    // 初始化导出按钮
    const exportBtn = document.getElementById('export-projects');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProjects);
    }
    
    // 初始化分页
    initProjectPagination();
}

/**
 * 加载项目列表
 */
async function loadProjects() {
    if (AdminState.currentView !== 'projects') return;
    
    AdminState.isLoading = true;
    setProjectsLoading(true);
    
    try {
        const statusFilter = document.getElementById('status-filter');
        const projectSearch = document.getElementById('project-search');
        
        let endpoint = '/admin/projects';
        const params = [];
        
        // 构建查询参数
        if (statusFilter && statusFilter.value) {
            params.push(`status=${statusFilter.value}`);
        }
        
        if (projectSearch && projectSearch.value.trim()) {
            params.push(`q=${encodeURIComponent(projectSearch.value.trim())}`);
        }
        
        params.push(`page=${AdminState.currentProjectPage}`);
        params.push('limit=20');
        
        if (params.length > 0) {
            endpoint += '?' + params.join('&');
        }
        
        const result = await apiRequest(endpoint, 'GET', null, true);
        
        if (result.success) {
            AdminState.projects = result.data;
            AdminState.totalProjects = result.pagination.total;
            AdminState.totalProjectPages = result.pagination.totalPages;
            
            displayProjectsTable(result.data);
            updateProjectPaginationUI(result.pagination);
        }
    } catch (error) {
        console.error('加载项目列表失败:', error);
        showError('加载项目列表失败');
    } finally {
        AdminState.isLoading = false;
        setProjectsLoading(false);
    }
}

/**
 * 设置项目加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function setProjectsLoading(isLoading) {
    const tableBody = document.getElementById('projects-table-body');
    const exportBtn = document.getElementById('export-projects');
    
    if (exportBtn) {
        exportBtn.disabled = isLoading;
    }
    
    if (isLoading && tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>加载中...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * 显示项目表格
 * @param {Array} projects - 项目数组
 */
function displayProjectsTable(projects) {
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) return;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>暂无项目数据</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // 添加项目行
    projects.forEach(project => {
        const row = createProjectTableRow(project);
        tableBody.appendChild(row);
    });
}

/**
 * 创建项目表格行
 * @param {Object} project - 项目数据
 * @returns {HTMLElement} 表格行元素
 */
function createProjectTableRow(project) {
    const row = document.createElement('tr');
    
    // 格式化日期
    const applyDate = formatDate(project.apply_date || project.created_at);
    
    // 状态徽章
    const statusBadge = getAdminStatusBadge(project.status);
    
    // 截断过长的项目名
    const projectName = project.project_name.length > 30 
        ? project.project_name.substring(0, 30) + '...' 
        : project.project_name;
    
    // 截断过长的申请人
    const applicantName = project.nickname ? 
        (project.nickname.length > 15 ? project.nickname.substring(0, 15) + '...' : project.nickname)
        : '匿名用户';
    
    row.innerHTML = `
        <td>
            <span class="project-id" title="${project.id}">${project.id}</span>
        </td>
        <td>
            <span title="${project.project_name}">${projectName}</span>
        </td>
        <td>
            <span title="${project.nickname || ''}">${applicantName}</span>
        </td>
        <td>${applyDate}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="table-actions">
                <button class="btn btn-sm btn-outline view-project-detail" data-id="${project.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline edit-project-status" data-id="${project.id}" data-status="${project.status}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-project" data-id="${project.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // 添加事件监听器
    const viewBtn = row.querySelector('.view-project-detail');
    const editBtn = row.querySelector('.edit-project-status');
    const deleteBtn = row.querySelector('.delete-project');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            showProjectDetailModal(id);
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const status = this.getAttribute('data-status');
            showEditStatusModal(id, status);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            confirmDeleteProject(id);
        });
    }
    
    return row;
}

/**
 * 获取管理员状态徽章
 * @param {string} status - 状态
 * @returns {string} 徽章HTML
 */
function getAdminStatusBadge(status) {
    const statusMap = {
        'pending': { text: '审核中', class: 'pending' },
        'approved': { text: '已通过', class: 'approved' },
        'rejected': { text: '未通过', class: 'rejected' }
    };
    
    const statusInfo = statusMap[status] || { text: '未知', class: 'pending' };
    
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

/**
 * 初始化项目分页
 */
function initProjectPagination() {
    const prevBtn = document.getElementById('projects-prev');
    const nextBtn = document.getElementById('projects-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (AdminState.currentProjectPage > 1) {
                AdminState.currentProjectPage--;
                loadProjects();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (AdminState.currentProjectPage < AdminState.totalProjectPages) {
                AdminState.currentProjectPage++;
                loadProjects();
            }
        });
    }
}

/**
 * 更新项目分页UI
 * @param {Object} pagination - 分页信息
 */
function updateProjectPaginationUI(pagination) {
    const currentEl = document.getElementById('projects-current');
    const totalEl = document.getElementById('projects-total');
    const prevBtn = document.getElementById('projects-prev');
    const nextBtn = document.getElementById('projects-next');
    
    if (currentEl) {
        currentEl.textContent = pagination.page;
    }
    
    if (totalEl) {
        totalEl.textContent = pagination.totalPages;
    }
    
    if (prevBtn) {
        prevBtn.disabled = pagination.page <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = pagination.page >= pagination.totalPages;
    }
}

/**
 * 导出项目数据
 */
async function exportProjects() {
    try {
        const result = await apiRequest('/admin/projects?limit=1000', 'GET', null, true);
        
        if (result.success && result.data) {
            // 转换为CSV格式
            const csvData = convertProjectsToCSV(result.data);
            const filename = `开源项目数据_${new Date().toISOString().split('T')[0]}.csv`;
            
            // 下载文件
            downloadFile(filename, csvData, 'text/csv;charset=utf-8;');
            showSuccess('项目数据导出成功');
        }
    } catch (error) {
        console.error('导出项目数据失败:', error);
        showError('导出项目数据失败');
    }
}

/**
 * 将项目数据转换为CSV
 * @param {Array} projects - 项目数组
 * @returns {string} CSV数据
 */
function convertProjectsToCSV(projects) {
    const headers = ['开源号', '项目名称', '申请人', '联系方式', '申请时间', '状态', '第一开源地址', '第二开源地址', '视频地址', '下载链接'];
    
    const rows = projects.map(project => [
        `"${project.id}"`,
        `"${project.project_name}"`,
        `"${project.nickname || ''}"`,
        `"${project.contact_value || ''}"`,
        `"${project.apply_date || project.created_at}"`,
        `"${getStatusText(project.status)}"`,
        `"${project.first_repo_url}"`,
        `"${project.second_repo_url || ''}"`,
        `"${project.video_url}"`,
        `"${project.download_link || ''}"`
    ]);
    
    return '\uFEFF' + [headers.join(','), ...rows].join('\n'); // 添加BOM解决中文乱码
}

/**
 * 获取状态文本
 * @param {string} status - 状态代码
 * @returns {string} 状态文本
 */
function getStatusText(status) {
    const statusMap = {
        'pending': '审核中',
        'approved': '已通过',
        'rejected': '未通过'
    };
    
    return statusMap[status] || '未知';
}

/**
 * 显示项目详情模态框
 * @param {string} projectId - 项目ID
 */
async function showProjectDetailModal(projectId) {
    try {
        const result = await apiRequest(`/projects/${projectId}`);
        
        if (result.success) {
            AdminState.currentProjectDetail = result.data;
            updateProjectDetailModal(result.data);
            
            const modal = document.getElementById('project-detail-modal');
            if (modal) {
                modal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('获取项目详情失败:', error);
        showError('获取项目详情失败');
    }
}

/**
 * 初始化项目详情模态框
 */
function initProjectDetailModal() {
    const modal = document.getElementById('project-detail-modal');
    if (!modal) return;
    
    const closeBtn = document.getElementById('close-detail-modal');
    const deleteBtn = document.getElementById('delete-project');
    const statusActions = modal.querySelectorAll('.status-actions button');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (AdminState.currentProjectDetail) {
                confirmAdminDeleteProject(AdminState.currentProjectDetail.id);
            }
        });
    }
    
    if (statusActions.length > 0) {
        statusActions.forEach(btn => {
            btn.addEventListener('click', function() {
                const status = this.getAttribute('data-status');
                if (AdminState.currentProjectDetail) {
                    updateProjectStatus(AdminState.currentProjectDetail.id, status);
                }
            });
        });
    }
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

/**
 * 更新项目详情模态框
 * @param {Object} project - 项目数据
 */
function updateProjectDetailModal(project) {
    const detailId = document.getElementById('detail-id');
    const detailName = document.getElementById('detail-name');
    const detailApplicant = document.getElementById('detail-applicant');
    const detailContact = document.getElementById('detail-contact');
    const detailApplyTime = document.getElementById('detail-apply-time');
    const detailStatus = document.getElementById('detail-status');
    const detailFirstRepo = document.getElementById('detail-first-repo');
    const detailSecondRepo = document.getElementById('detail-second-repo');
    const detailVideo = document.getElementById('detail-video');
    
    if (detailId) detailId.textContent = project.id;
    if (detailName) detailName.textContent = project.project_name;
    if (detailApplicant) detailApplicant.textContent = project.nickname || '匿名用户';
    if (detailContact) detailContact.textContent = project.contact_value || '-';
    if (detailApplyTime) detailApplyTime.textContent = formatDate(project.apply_date || project.created_at);
    if (detailStatus) {
        detailStatus.textContent = getStatusText(project.status);
        detailStatus.className = 'status-badge ' + project.status;
    }
    
    if (detailFirstRepo) {
        detailFirstRepo.href = project.first_repo_url;
        detailFirstRepo.textContent = '访问';
    }
    
    if (detailSecondRepo) {
        if (project.second_repo_url) {
            detailSecondRepo.href = project.second_repo_url;
            detailSecondRepo.textContent = '访问';
            detailSecondRepo.style.display = 'inline';
        } else {
            detailSecondRepo.style.display = 'none';
        }
    }
    
    if (detailVideo) {
        detailVideo.href = project.video_url;
        detailVideo.textContent = '观看';
    }
}

/**
 * 显示编辑状态模态框
 * @param {string} projectId - 项目ID
 * @param {string} currentStatus - 当前状态
 */
function showEditStatusModal(projectId, currentStatus) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'edit-status-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> 修改项目状态</h3>
                <button class="modal-close">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label for="new-status">选择新状态</label>
                    <select id="new-status" class="form-select">
                        <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>审核中</option>
                        <option value="approved" ${currentStatus === 'approved' ? 'selected' : ''}>已通过</option>
                        <option value="rejected" ${currentStatus === 'rejected' ? 'selected' : ''}>未通过</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-outline cancel-edit">取消</button>
                    <button class="btn btn-primary confirm-edit" data-id="${projectId}">确认修改</button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 添加事件监听器
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-edit');
    const confirmBtn = modal.querySelector('.confirm-edit');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const newStatus = document.getElementById('new-status').value;
            const projectId = this.getAttribute('data-id');
            
            updateProjectStatus(projectId, newStatus);
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
 * 更新项目状态
 * @param {string} projectId - 项目ID
 * @param {string} status - 新状态
 */
async function updateProjectStatus(projectId, status) {
    try {
        const result = await apiRequest(`/admin/projects/${projectId}`, 'PUT', { status: status }, true);
        
        if (result.success) {
            showSuccess('项目状态更新成功');
            
            // 重新加载数据
            if (AdminState.currentView === 'dashboard') {
                loadDashboardData();
            } else if (AdminState.currentView === 'projects') {
                loadProjects();
            }
            
            // 关闭详情模态框
            const detailModal = document.getElementById('project-detail-modal');
            if (detailModal) {
                detailModal.classList.remove('active');
            }
            
            // 更新当前项目详情状态
            if (AdminState.currentProjectDetail && AdminState.currentProjectDetail.id === projectId) {
                AdminState.currentProjectDetail.status = status;
            }
        }
    } catch (error) {
        console.error('更新项目状态失败:', error);
        showError('更新项目状态失败');
    }
}

/**
 * 确认删除项目
 * @param {string} projectId - 项目ID
 */
function confirmDeleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？此操作不可撤销。')) {
        deleteProject(projectId);
    }
}

/**
 * 确认管理员删除项目
 * @param {string} projectId - 项目ID
 */
function confirmAdminDeleteProject(projectId) {
    if (confirm('确定要永久删除这个项目吗？此操作将删除所有相关数据，不可撤销。')) {
        deleteProject(projectId);
        
        // 关闭详情模态框
        const detailModal = document.getElementById('project-detail-modal');
        if (detailModal) {
            detailModal.classList.remove('active');
        }
    }
}

/**
 * 删除项目
 * @param {string} projectId - 项目ID
 */
async function deleteProject(projectId) {
    try {
        const result = await apiRequest(`/admin/projects/${projectId}`, 'DELETE', null, true);
        
        if (result.success) {
            showSuccess('项目删除成功');
            
            // 重新加载数据
            if (AdminState.currentView === 'dashboard') {
                loadDashboardData();
            } else if (AdminState.currentView === 'projects') {
                loadProjects();
            }
        }
    } catch (error) {
        console.error('删除项目失败:', error);
        showError('删除项目失败');
    }
}

/**
 * 初始化用户管理
 */
function initUserManagement() {
    // 用户管理功能待实现
}

/**
 * 加载用户列表
 */
async function loadUsers() {
    if (AdminState.currentView !== 'users') return;
    
    const usersView = document.getElementById('users-view');
    if (usersView) {
        usersView.innerHTML = `
            <div class="view-header">
                <h2><i class="fas fa-users"></i> 用户管理</h2>
            </div>
            <div style="padding: 40px; text-align: center; color: #666;">
                <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>功能开发中</h3>
                <p>用户管理功能正在开发中，敬请期待</p>
            </div>
        `;
    }
}

/**
 * 初始化操作日志
 */
function initLogs() {
    // 日志功能待实现
}

/**
 * 加载操作日志
 */
async function loadLogs() {
    if (AdminState.currentView !== 'logs') return;
    
    const logsView = document.getElementById('logs-view');
    if (logsView) {
        logsView.innerHTML = `
            <div class="view-header">
                <h2><i class="fas fa-clipboard-list"></i> 操作日志</h2>
            </div>
            <div style="padding: 40px; text-align: center; color: #666;">
                <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>功能开发中</h3>
                <p>操作日志功能正在开发中，敬请期待</p>
            </div>
        `;
    }
}

/**
 * 加载系统设置
 */
async function loadSettings() {
    if (AdminState.currentView !== 'settings') return;
    
    const settingsView = document.getElementById('settings-view');
    if (settingsView) {
        settingsView.innerHTML = `
            <div class="view-header">
                <h2><i class="fas fa-cog"></i> 系统设置</h2>
            </div>
            <div style="padding: 40px; text-align: center; color: #666;">
                <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>功能开发中</h3>
                <p>系统设置功能正在开发中，敬请期待</p>
            </div>
        `;
    }
}

/**
 * 初始化退出登录
 */
function initLogout() {
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出管理员登录吗？')) {
                clearLoginState();
                window.location.reload();
            }
        });
    }
}

// 导出到全局作用域
window.AdminState = AdminState;
window.switchView = switchView;
window.loadDashboardData = loadDashboardData;
window.loadProjects = loadProjects;