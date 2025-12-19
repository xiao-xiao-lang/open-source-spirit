// ============================================
// 开源精神分号器 - 查询页面逻辑
// ============================================

// 全局状态
const QueryState = {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    searchQuery: '',
    isLoading: false
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initSearch();
    initTags();
    initPagination();
    loadPopularProjects();
    
    // 检查URL参数
    checkUrlParams();
});

// ==================== 搜索功能 ====================

/**
 * 初始化搜索功能
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (!searchInput || !searchBtn) return;
    
    // 回车搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 按钮点击搜索
    searchBtn.addEventListener('click', performSearch);
    
    // 输入框实时搜索（防抖）
    const debouncedSearch = debounce(function() {
        if (this.value.trim().length >= 2) {
            performSearch();
        }
    }, 500);
    
    searchInput.addEventListener('input', debouncedSearch);
}

/**
 * 执行搜索
 */
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.trim();
    
    if (!searchQuery) {
        // 如果搜索词为空，显示热门项目
        loadPopularProjects();
        return;
    }
    
    // 更新状态
    QueryState.searchQuery = searchQuery;
    QueryState.currentPage = 1;
    
    // 显示加载状态
    setLoadingState(true);
    
    try {
        await searchProjects(searchQuery, 1);
    } catch (error) {
        console.error('搜索失败:', error);
        showError('搜索失败，请稍后重试');
    } finally {
        setLoadingState(false);
    }
}

/**
 * 搜索项目
 * @param {string} query - 搜索词
 * @param {number} page - 页码
 */
async function searchProjects(query, page = 1) {
    try {
        const result = await apiRequest(`/projects?q=${encodeURIComponent(query)}&page=${page}&limit=10`);
        
        if (result.success) {
            displayResults(result.data, result.pagination);
            QueryState.currentPage = page;
            QueryState.totalPages = result.pagination.totalPages;
            QueryState.totalResults = result.pagination.total;
            
            updateResultCount(result.pagination.total);
            updatePaginationUI();
        }
    } catch (error) {
        console.error('搜索项目失败:', error);
        throw error;
    }
}

/**
 * 显示搜索结果
 * @param {Array} projects - 项目数组
 * @param {Object} pagination - 分页信息
 */
function displayResults(projects, pagination) {
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.getElementById('no-results');
    const paginationEl = document.getElementById('pagination');
    
    if (!resultsContainer || !noResults || !paginationEl) return;
    
    // 清空现有结果
    resultsContainer.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        noResults.style.display = 'block';
        resultsContainer.style.display = 'none';
        paginationEl.style.display = 'none';
        return;
    }
    
    noResults.style.display = 'none';
    resultsContainer.style.display = 'grid';
    paginationEl.style.display = 'flex';
    
    // 生成结果卡片
    projects.forEach(project => {
        const card = createResultCard(project);
        resultsContainer.appendChild(card);
    });
}

/**
 * 创建结果卡片
 * @param {Object} project - 项目数据
 * @returns {HTMLElement} 卡片元素
 */
function createResultCard(project) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // 状态徽章
    const statusBadge = getStatusBadge(project.status);
    
    // 格式化日期
    const applyDate = formatDate(project.apply_date || project.created_at);
    
    card.innerHTML = `
        <div class="result-header">
            <h3 title="${project.project_name}">
                <i class="fas fa-project-diagram"></i> ${project.project_name}
            </h3>
            <div class="result-id-section">
                <span class="open-source-id" title="点击复制" data-id="${project.id}">
                    ${project.id}
                </span>
                ${statusBadge}
            </div>
        </div>
        
        <div class="result-details">
            <p><strong><i class="fas fa-user"></i> 开源人：</strong>${project.nickname || '匿名用户'}</p>
            <p><strong><i class="fas fa-calendar"></i> 申请时间：</strong>${applyDate}</p>
            
            <p>
                <strong><i class="fab fa-github"></i> 开源地址：</strong>
                <a href="${project.first_repo_url}" target="_blank" rel="noopener noreferrer">
                    ${formatUrl(project.first_repo_url)}
                </a>
            </p>
            
            ${project.second_repo_url ? `
            <p>
                <strong><i class="fas fa-code-branch"></i> 备用地址：</strong>
                <a href="${project.second_repo_url}" target="_blank" rel="noopener noreferrer">
                    ${formatUrl(project.second_repo_url)}
                </a>
            </p>
            ` : ''}
            
            <p>
                <strong><i class="fab fa-youtube"></i> 视频地址：</strong>
                <a href="${project.video_url}" target="_blank" rel="noopener noreferrer">
                    ${formatUrl(project.video_url)}
                </a>
            </p>
            
            ${project.download_link ? `
            <p>
                <strong><i class="fas fa-download"></i> 下载链接：</strong>
                <a href="${project.download_link}" target="_blank" rel="noopener noreferrer">
                    下载开源需知视频
                </a>
            </p>
            ` : ''}
        </div>
        
        <div class="result-actions">
            <button class="btn btn-outline btn-sm view-details" data-id="${project.id}">
                <i class="fas fa-info-circle"></i> 查看详情
            </button>
            <button class="btn btn-outline btn-sm copy-id" data-id="${project.id}">
                <i class="fas fa-copy"></i> 复制开源号
            </button>
        </div>
    `;
    
    // 添加事件监听器
    const copyBtn = card.querySelector('.copy-id');
    const viewBtn = card.querySelector('.view-details');
    const idElement = card.querySelector('.open-source-id');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            copyToClipboard(id);
        });
    }
    
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewProjectDetails(id);
        });
    }
    
    if (idElement) {
        idElement.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            copyToClipboard(id);
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
        return `${urlObj.hostname}${urlObj.pathname.length > 30 ? '...' : urlObj.pathname}`;
    } catch {
        // 如果不是合法URL，返回原字符串（截断）
        return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }
}

/**
 * 查看项目详情
 * @param {string} projectId - 项目ID
 */
async function viewProjectDetails(projectId) {
    try {
        const result = await apiRequest(`/projects/${projectId}`);
        
        if (result.success) {
            showProjectDetailsModal(result.data);
        }
    } catch (error) {
        console.error('获取项目详情失败:', error);
        showError('获取项目详情失败');
    }
}

/**
 * 显示项目详情模态框
 * @param {Object} project - 项目数据
 */
function showProjectDetailsModal(project) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'project-details-modal';
    
    // 状态徽章
    const statusBadge = getStatusBadge(project.status);
    
    // 格式化日期
    const applyDate = formatDate(project.apply_date || project.created_at);
    const createDate = formatDate(project.created_at);
    const updateDate = formatDate(project.updated_at);
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3><i class="fas fa-info-circle"></i> 项目详情</h3>
                <button class="modal-close">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>开源号：</strong>
                            <span class="open-source-id">${project.id}</span>
                        </div>
                        <div class="detail-item">
                            <strong>项目名称：</strong>
                            <span>${project.project_name}</span>
                        </div>
                        <div class="detail-item">
                            <strong>申请状态：</strong>
                            ${statusBadge}
                        </div>
                        <div class="detail-item">
                            <strong>申请人：</strong>
                            <span>${project.nickname || '匿名用户'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>联系方式：</strong>
                            <span>${project.contact_value || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>申请时间：</strong>
                            <span>${applyDate}</span>
                        </div>
                        <div class="detail-item">
                            <strong>创建时间：</strong>
                            <span>${createDate}</span>
                        </div>
                        <div class="detail-item">
                            <strong>更新时间：</strong>
                            <span>${updateDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>项目地址</h4>
                    <div class="detail-links">
                        <div class="link-item">
                            <strong>第一开源地址：</strong>
                            <a href="${project.first_repo_url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> 访问
                            </a>
                        </div>
                        ${project.second_repo_url ? `
                        <div class="link-item">
                            <strong>第二开源地址：</strong>
                            <a href="${project.second_repo_url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> 访问
                            </a>
                        </div>
                        ` : ''}
                        <div class="link-item">
                            <strong>视频地址：</strong>
                            <a href="${project.video_url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> 观看
                            </a>
                        </div>
                        ${project.download_link ? `
                        <div class="link-item">
                            <strong>视频下载：</strong>
                            <a href="${project.download_link}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-download"></i> 下载
                            </a>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>操作</h4>
                    <div class="action-buttons">
                        <button class="btn btn-outline copy-project-id">
                            <i class="fas fa-copy"></i> 复制开源号
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
    const copyBtn = modal.querySelector('.copy-project-id');
    const openAllBtn = modal.querySelector('.open-all-links');
    const closeBtn = modal.querySelector('.modal-close');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(project.id);
        });
    }
    
    if (openAllBtn) {
        openAllBtn.addEventListener('click', () => {
            // 打开所有链接
            const links = [
                project.first_repo_url,
                project.second_repo_url,
                project.video_url,
                project.download_link
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

// ==================== 标签功能 ====================

/**
 * 初始化标签功能
 */
function initTags() {
    const tags = document.querySelectorAll('.tag');
    
    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchText = this.getAttribute('data-search');
            const searchInput = document.getElementById('search-input');
            
            if (searchInput && searchText) {
                searchInput.value = searchText;
                performSearch();
            }
        });
    });
}

// ==================== 分页功能 ====================

/**
 * 初始化分页功能
 */
function initPagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', goToPrevPage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', goToNextPage);
    }
}

/**
 * 前往上一页
 */
function goToPrevPage() {
    if (QueryState.currentPage > 1) {
        QueryState.currentPage--;
        performPagedSearch();
    }
}

/**
 * 前往下一页
 */
function goToNextPage() {
    if (QueryState.currentPage < QueryState.totalPages) {
        QueryState.currentPage++;
        performPagedSearch();
    }
}

/**
 * 执行分页搜索
 */
async function performPagedSearch() {
    if (!QueryState.searchQuery) return;
    
    setLoadingState(true);
    
    try {
        await searchProjects(QueryState.searchQuery, QueryState.currentPage);
    } catch (error) {
        console.error('分页搜索失败:', error);
        showError('加载失败，请稍后重试');
    } finally {
        setLoadingState(false);
    }
}

/**
 * 更新分页UI
 */
function updatePaginationUI() {
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (currentPageEl) {
        currentPageEl.textContent = QueryState.currentPage;
    }
    
    if (totalPagesEl) {
        totalPagesEl.textContent = QueryState.totalPages;
    }
    
    if (prevBtn) {
        prevBtn.disabled = QueryState.currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = QueryState.currentPage >= QueryState.totalPages;
    }
}

// ==================== 热门项目 ====================

/**
 * 加载热门项目
 */
async function loadPopularProjects() {
    try {
        const result = await apiRequest('/projects?limit=6');
        
        if (result.success && result.data && result.data.length > 0) {
            displayPopularProjects(result.data);
        }
    } catch (error) {
        console.error('加载热门项目失败:', error);
        // 静默失败，不显示错误
    }
}

/**
 * 显示热门项目
 * @param {Array} projects - 项目数组
 */
function displayPopularProjects(projects) {
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.getElementById('no-results');
    const paginationEl = document.getElementById('pagination');
    const sectionHeader = document.querySelector('.section-header h3');
    
    if (!resultsContainer || !noResults || !paginationEl || !sectionHeader) return;
    
    // 更新标题
    sectionHeader.innerHTML = '<i class="fas fa-fire"></i> 热门项目';
    
    // 清空现有结果
    resultsContainer.innerHTML = '';
    
    noResults.style.display = 'none';
    resultsContainer.style.display = 'grid';
    paginationEl.style.display = 'none';
    
    // 生成热门项目卡片
    projects.forEach(project => {
        const card = createPopularProjectCard(project);
        resultsContainer.appendChild(card);
    });
    
    // 更新结果计数
    updateResultCount(projects.length);
}

/**
 * 创建热门项目卡片
 * @param {Object} project - 项目数据
 * @returns {HTMLElement} 卡片元素
 */
function createPopularProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'result-card popular-card';
    
    // 状态徽章
    const statusBadge = getStatusBadge(project.status);
    
    // 格式化日期
    const applyDate = formatDate(project.apply_date || project.created_at);
    
    // 截断过长的项目名
    const projectName = project.project_name.length > 30 
        ? project.project_name.substring(0, 30) + '...' 
        : project.project_name;
    
    card.innerHTML = `
        <div class="result-header">
            <h3 title="${project.project_name}">
                <i class="fas fa-star"></i> ${projectName}
            </h3>
            <div class="result-id-section">
                <span class="open-source-id" title="点击复制" data-id="${project.id}">
                    ${project.id.substring(0, 12)}...
                </span>
                ${statusBadge}
            </div>
        </div>
        
        <div class="result-details">
            <p><strong><i class="fas fa-user"></i> 开源人：</strong>${project.nickname || '匿名用户'}</p>
            <p><strong><i class="fas fa-calendar"></i> 申请时间：</strong>${applyDate}</p>
            
            <p>
                <strong><i class="fab fa-github"></i> 代码仓库：</strong>
                <span class="truncate-url">${formatUrl(project.first_repo_url)}</span>
            </p>
        </div>
        
        <div class="result-actions">
            <button class="btn btn-outline btn-sm view-details" data-id="${project.id}">
                <i class="fas fa-info-circle"></i> 查看详情
            </button>
            <button class="btn btn-outline btn-sm copy-id" data-id="${project.id}">
                <i class="fas fa-copy"></i> 复制ID
            </button>
        </div>
    `;
    
    // 添加事件监听器
    const copyBtn = card.querySelector('.copy-id');
    const viewBtn = card.querySelector('.view-details');
    const idElement = card.querySelector('.open-source-id');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            copyToClipboard(id);
        });
    }
    
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewProjectDetails(id);
        });
    }
    
    if (idElement) {
        idElement.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            copyToClipboard(id);
        });
    }
    
    return card;
}

// ==================== 工具函数 ====================

/**
 * 更新结果计数
 * @param {number} count - 结果数量
 */
function updateResultCount(count) {
    const countElement = document.getElementById('result-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

/**
 * 设置加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function setLoadingState(isLoading) {
    QueryState.isLoading = isLoading;
    
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    
    if (searchBtn) {
        searchBtn.disabled = isLoading;
        searchBtn.innerHTML = isLoading 
            ? '<i class="fas fa-spinner fa-spin"></i> 搜索中...'
            : '<i class="fas fa-search"></i> 查询';
    }
    
    if (searchInput) {
        searchInput.disabled = isLoading;
    }
    
    if (resultsContainer && isLoading && QueryState.searchQuery) {
        resultsContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>正在搜索 "${QueryState.searchQuery}"...</p>
            </div>
        `;
        
        // 添加加载样式
        const style = document.createElement('style');
        style.textContent = `
            .loading-placeholder {
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }
            
            .loading-spinner {
                font-size: 3rem;
                color: #667eea;
                margin-bottom: 20px;
            }
        `;
        
        if (!document.querySelector('#loading-styles')) {
            style.id = 'loading-styles';
            document.head.appendChild(style);
        }
    }
}

/**
 * 检查URL参数
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const page = urlParams.get('page');
    
    if (query) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = query;
            QueryState.searchQuery = query;
            QueryState.currentPage = parseInt(page) || 1;
            
            // 执行搜索
            setTimeout(() => {
                performSearch();
            }, 100);
        }
    }
}

/**
 * 生成分享链接
 * @param {string} query - 搜索词
 * @param {number} page - 页码
 * @returns {string} 分享链接
 */
function generateShareLink(query, page = 1) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    if (query) {
        params.set('q', query);
    }
    
    if (page > 1) {
        params.set('page', page);
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

/**
 * 复制搜索结果分享链接
 */
function copySearchResultsLink() {
    const shareLink = generateShareLink(QueryState.searchQuery, QueryState.currentPage);
    copyToClipboard(shareLink);
    showSuccess('分享链接已复制到剪贴板');
}

// 导出到全局作用域
window.QueryState = QueryState;
window.performSearch = performSearch;
window.loadPopularProjects = loadPopularProjects;
window.copySearchResultsLink = copySearchResultsLink;