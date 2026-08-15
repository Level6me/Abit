/**
 * Apple Torrent Dashboard (Torrent Omni) — Bundled Application Logic
 */

// --- [Module: constants.js] ---
/**
 * @file constants.js
 * @description Global constants, preset search plugins repository and definitions
 */

// Popular Preset Search Plugins Repository (100% Verified Working URLs)
    const PRESET_PLUGINS = [
        { name: 'The Pirate Bay', desc: '老牌经典海盗湾公网资源库 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/piratebay.py' },
        { name: 'BitSearch', desc: '千万级高速 DHT 索引引擎 (社区最佳)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/bitsearch.py' },
        { name: 'SolidTorrents', desc: '纯净无广告的 DHT 搜索引擎 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/solidtorrents.py' },
        { name: 'EZTV', desc: '欧美电视连续剧与美剧发布站 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/eztv.py' },
        { name: 'LimeTorrents', desc: '老牌公开 BT 索引站 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/limetorrents.py' },
        { name: 'TorrentGalaxy', desc: '高质量影视与热门聚合资源 (社区精选)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/torrentgalaxy.py' },
        { name: 'Nyaa', desc: '日本动漫、ACG、原声音乐大站 (社区精选)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/nyaa.py' },
        { name: 'BT4G', desc: '中文热门资源与磁力 DHT 索引 (社区精选)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/bt4g.py' },
        { name: 'TorLock', desc: '严格验证/无虚假种子认证站 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/torlock.py' },
        { name: 'KickassTorrents', desc: '经典 KAT 资源检索索引 (社区精选)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/kickasstorrents.py' },
        { name: 'TorrentProject', desc: '千万级元搜索引擎聚合库 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/torrentproject.py' },
        { name: 'TorrentCSV', desc: '开源去中心化离线种子库 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/torrentscsv.py' },
        { name: 'RARBG Dump', desc: 'RARBG 经典历史影视资源归档 (社区精选)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/rarbg.py' },
        { name: 'Jackett', desc: '多源 Tracker 代理与私有站聚合引擎 (官方源)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/jackett.py' }
    ];

// --- [Module: state.js] ---
/**
 * @file state.js
 * @description Global reactive application state
 */

// Global State
    let netChart = null;
    let allTorrents = [];
    let allCategories = {};
    let currentFilter = 'all';
    let currentCategory = 'all';
    let searchFilter = '';
    let sortBy = 'added_on_desc';
    let viewMode = localStorage.getItem('omni_view_mode') || 'cards';
    let themeMode = localStorage.getItem('omni_theme') || 'auto';
    let isAltSpeedEnabled = false;

    // Selection
    let selectedTorrents = new Set();
    let pendingDeleteHashes = [];

    // Details & Modals
    let activeDetailHash = '';
    let activeDetailSubTab = 'dt-files';
    let detailRefreshTimer = null;
    let peerCurrentPage = 1;
    let cachedPieces = [];

    // Search Engine & Plugins State
    let searchId = null;
    let searchRefreshTimer = null;
    let installedPlugins = [];
    let searchCurrentPage = 1;
    const SEARCH_PAGE_SIZE = 20;

    // Polling System
    let netHistory = Array(20).fill(null).map(() => ({ down: 0, up: 0 }));
    let qbtVersion = '--';
    let webapiVersion = '--';
    let fastPollTimer = null;
    let slowPollTimer = null;
    let rawLogs = [];

// --- [Module: utils.js] ---
/**
 * @file utils.js
 * @description Formatting, sanitization, time parsing, toast notifications and torrent status parsers
 */

// --- Helpers ---
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatEta(seconds) {
        if (!seconds || seconds < 0 || seconds >= 8640000) return '∞';
        if (seconds < 60) return `${seconds}秒`;
        const m = Math.floor(seconds / 60);
        if (m < 60) return `${m}分 ${seconds % 60}秒`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}时 ${m % 60}分`;
        const d = Math.floor(h / 24);
        return `${d}天 ${h % 24}时`;
    }

    function formatTimestamp(ts) {
        if (!ts) return '--';
        const d = new Date(ts > 1e11 ? ts : ts * 1000);
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    function showToast(message, isSuccess = true) {
        const id = 'toast_' + Date.now();
        const icon = isSuccess ? '✅' : '⚠️';
        const html = `
            <div class="toast-pill" id="${id}">
                <span>${icon}</span>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
        $('#toast-container').append(html);
        setTimeout(() => {
            $(`#${id}`).fadeOut(300, function() { $(this).remove(); });
        }, 3200);
    }

    // --- Torrent Status Parser ---
    function getTorrentStatus(t) {
        const state = (t.state || '').toLowerCase();
        const progress = t.progress || 0;
        const isCompleted = (progress >= 0.999999 || t.amount_left === 0 || state.includes('up') || state.includes('completed'));
        const isSeeding = ['uploading', 'stalledup', 'forcedup', 'checkingup'].includes(state);
        const isDownloading = ['downloading', 'stalleddl', 'forceddl', 'metadl', 'allocating'].includes(state) || (!isCompleted && !state.includes('paused') && !state.includes('queued') && !state.includes('error'));
        const isPaused = state.includes('paused') || state === 'pauseddl' || state === 'pausedup';
        const isQueued = state.includes('queued') || state === 'queueddl' || state === 'queuedup';
        const isChecking = state.includes('checking') || state === 'checkingdl' || state === 'checkingup' || state === 'checkingresumedata';
        const isError = state.includes('error') || state.includes('missing') || state === 'missingfiles';
        const isActive = (t.dlspeed > 0 || t.upspeed > 0);

        let stateClass = 'paused';
        let stateName = '已暂停';

        if (isError) {
            stateClass = 'error';
            stateName = '错误/文件丢失';
        } else if (state === 'metadl') {
            stateClass = 'downloading';
            stateName = '获取元数据';
        } else if (state === 'allocating') {
            stateClass = 'downloading';
            stateName = '分配磁盘空间';
        } else if (isChecking) {
            stateClass = 'queued';
            stateName = '校验中';
        } else if (state === 'downloading' || state === 'forceddl') {
            stateClass = 'downloading';
            stateName = state === 'forceddl' ? '强制下载' : '下载中';
        } else if (state === 'stalleddl') {
            stateClass = 'downloading';
            stateName = '等待下载';
        } else if (state === 'queueddl') {
            stateClass = 'queued';
            stateName = '排队下载';
        } else if (state === 'pauseddl') {
            stateClass = 'paused';
            stateName = '下载暂停';
        } else if (state === 'uploading' || state === 'forcedup') {
            stateClass = 'completed';
            stateName = state === 'forcedup' ? '强制做种' : '做种中';
        } else if (state === 'stalledup') {
            stateClass = 'completed';
            stateName = '做种空闲';
        } else if (state === 'queuedup') {
            stateClass = 'queued';
            stateName = '排队做种';
        } else if (state === 'pausedup') {
            stateClass = 'paused';
            stateName = '做种暂停 (已完成)';
        } else if (isCompleted) {
            stateClass = 'completed';
            stateName = '已完成';
        }

        return {
            stateClass,
            stateName,
            isCompleted,
            isSeeding,
            isDownloading,
            isPaused,
            isQueued,
            isChecking,
            isError,
            isActive
        };
    }

// --- [Module: api.js] ---
/**
 * @file api.js
 * @description API helper configuration and global AJAX interceptors
 */

// Global AJAX Interceptor for 403/401 Unauthorized
    $.ajaxSetup({
        error: function(xhr) {
            if (xhr.status === 403 || xhr.status === 401) {
                if (typeof fastPollTimer !== 'undefined' && fastPollTimer) clearInterval(fastPollTimer);
                if (typeof slowPollTimer !== 'undefined' && slowPollTimer) clearInterval(slowPollTimer);
                if (typeof openLoginModal === 'function') openLoginModal(true);
            }
        }
    });

// --- [Module: chart.js] ---
/**
 * @file chart.js
 * @description Network transfer rate live trend chart initialization and update
 */

// --- Chart Initialization ---
    function initChart() {
        const ctx = document.getElementById('netChart').getContext('2d');
        netChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [
                    {
                        label: '下载 (KB/s)',
                        data: Array(20).fill(0),
                        borderColor: '#34c759',
                        backgroundColor: 'rgba(52,199,89,0.08)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0
                    },
                    {
                        label: '上传 (KB/s)',
                        data: Array(20).fill(0),
                        borderColor: '#007aff',
                        backgroundColor: 'rgba(0,122,255,0.08)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, beginAtZero: true }
                }
            }
        });
    }

// --- [Module: torrents.js] ---
/**
 * @file torrents.js
 * @description Torrent list management, filtering, batch actions, detail drawer, pieces canvas & add modal
 */

// --- Counter Calculation ---
    function updateSummaryCounters() {
        let dl = 0, seed = 0, completed = 0, paused = 0, active = 0, queued = 0, err = 0;
        
        allTorrents.forEach(t => {
            const s = getTorrentStatus(t);
            if (s.isDownloading) dl++;
            if (s.isSeeding) seed++;
            if (s.isCompleted) completed++;
            if (s.isPaused) paused++;
            if (s.isActive) active++;
            if (s.isQueued || s.isChecking) queued++;
            if (s.isError) err++;
        });

        $('#sum-all, #cnt-all').text(allTorrents.length);
        $('#sum-dl, #cnt-dl, #v-dl-count').text(dl);
        $('#sum-seed, #cnt-seed, #v-up-count').text(seed);
        $('#sum-completed, #cnt-completed').text(completed);
        $('#sum-pause, #cnt-pause').text(paused);
        $('#cnt-active').text(active);
        $('#cnt-queue').text(queued);
        $('#cnt-err').text(err);
    }

    // --- Filter & Sorting ---
    function filterTorrents(filter, btn) {
        currentFilter = filter;
        $('.segment-btn').removeClass('active');
        $(btn).addClass('active');
        renderTorrents();
    }

    function onCategoryFilterChange(cat) {
        currentCategory = cat;
        renderTorrents();
    }

    function onSearchFilterChange(val) {
        searchFilter = (val || '').trim().toLowerCase();
        $('#search-clear-btn').toggle(searchFilter.length > 0);
        renderTorrents();
    }

    function clearSearchFilter() {
        $('#torrent-search-input').val('');
        onSearchFilterChange('');
    }

    function onSortChange(val) {
        sortBy = val;
        renderTorrents();
    }

    function toggleViewMode() {
        viewMode = viewMode === 'cards' ? 'table' : 'cards';
        localStorage.setItem('omni_view_mode', viewMode);
        updateViewModeIcon();
        renderTorrents();
    }

    function updateViewModeIcon() {
        if (viewMode === 'cards') {
            $('#view-icon-cards').show();
            $('#view-icon-table').hide();
        } else {
            $('#view-icon-cards').hide();
            $('#view-icon-table').show();
        }
    }

    function getFilteredAndSortedTorrents() {
        let list = [...allTorrents];

        // 1. Status Filter
        if (currentFilter !== 'all') {
            list = list.filter(t => {
                const s = getTorrentStatus(t);
                if (currentFilter === 'downloading') return s.isDownloading;
                if (currentFilter === 'seeding') return s.isSeeding;
                if (currentFilter === 'completed') return s.isCompleted;
                if (currentFilter === 'paused') return s.isPaused;
                if (currentFilter === 'active') return s.isActive;
                if (currentFilter === 'queued') return s.isQueued || s.isChecking;
                if (currentFilter === 'error') return s.isError;
                return true;
            });
        }

        // 2. Category Filter
        if (currentCategory && currentCategory !== 'all') {
            list = list.filter(t => (t.category || '') === currentCategory);
        }

        // 3. Keyword / Hash Search
        if (searchFilter) {
            list = list.filter(t => (t.name || '').toLowerCase().includes(searchFilter) || (t.hash || '').toLowerCase().includes(searchFilter));
        }

        // 4. Sorting
        list.sort((a, b) => {
            switch(sortBy) {
                case 'added_on_desc': return (b.added_on || 0) - (a.added_on || 0);
                case 'added_on_asc': return (a.added_on || 0) - (b.added_on || 0);
                case 'name_asc': return (a.name || '').localeCompare(b.name || '');
                case 'size_desc': return (b.size || 0) - (a.size || 0);
                case 'progress_desc': return (b.progress || 0) - (a.progress || 0);
                case 'dlspeed_desc': return (b.dlspeed || 0) - (a.dlspeed || 0);
                case 'upspeed_desc': return (b.upspeed || 0) - (a.upspeed || 0);
                case 'eta_asc': return (a.eta || 0) - (b.eta || 0);
                case 'ratio_desc': return (b.ratio || 0) - (a.ratio || 0);
                default: return 0;
            }
        });

        return list;
    }

    // --- Render Torrents ---
    function renderTorrents() {
        const container = $('#torrent-list-container');
        const list = getFilteredAndSortedTorrents();

        if (list.length === 0) {
            container.html('<div style="text-align:center; padding:60px 20px; color:var(--text-sec); font-size:14px;">当前筛选条件下无任务记录</div>');
            return;
        }

        if (viewMode === 'cards') {
            renderCardsView(list, container);
        } else {
            renderTableView(list, container);
        }

        updateBatchBar();
    }

    // --- Dashboard Filter Navigation ---
    function jumpToTorrentFilter(filter) {
        switchTab('p-torrents', '任务', $('.dock-btn:nth-child(2)'));
        const filterMap = {
            'all': 0,
            'downloading': 1,
            'seeding': 2,
            'completed': 3,
            'paused': 4,
            'active': 5,
            'queued': 6,
            'error': 7
        };
        const idx = filterMap[filter] !== undefined ? filterMap[filter] : 0;
        const targetBtn = $('#p-torrents .segmented-control .segment-btn').eq(idx);
        filterTorrents(filter, targetBtn);
    }

    function renderCardsView(list, container) {
        let html = '<div class="torrent-grid-container">';
        list.forEach(t => {
            const hash = t.hash;
            const isSelected = selectedTorrents.has(hash);
            const status = getTorrentStatus(t);

            const progressVal = (t.progress * 100).toFixed(1);
            const ratioVal = (t.ratio || 0).toFixed(2);
            const etaStr = (status.isCompleted || status.isSeeding) ? (status.isSeeding ? '做种中' : '已完成') : (status.isPaused ? '已暂停' : formatEta(t.eta));
            const seedsText = `做种: ${t.num_seeds || 0} (${t.num_complete || 0}) · 节点: ${t.num_leechs || 0} (${t.num_incomplete || 0})`;

            html += `
            <div class="torrent-card ${isSelected ? 'selected' : ''}" onclick="onCardClick(event, '${hash}')">
                <div class="torrent-header">
                    <input type="checkbox" class="torrent-check" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelectTorrent('${hash}', this.checked)">
                    <div class="torrent-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>
                    <span class="badge ${status.stateClass}">${status.stateName}</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill ${status.stateClass}" style="width: ${progressVal}%"></div>
                </div>
                <div class="torrent-meta">
                    <span>${progressVal}% · ${formatBytes(t.completed)} / ${formatBytes(t.size)}</span>
                    <span>${t.category ? `<span class="badge category">🏷 ${escapeHtml(t.category)}</span> ` : ''}比率: ${ratioVal}</span>
                </div>
                <div class="torrent-meta">
                    <span>↓ ${formatBytes(t.dlspeed)}/s · ↑ ${formatBytes(t.upspeed)}/s</span>
                    <span>${etaStr}</span>
                </div>
                <div class="torrent-meta" style="margin-bottom:10px; font-size:11px;">
                    <span>👥 ${seedsText}</span>
                    <span style="font-family:monospace; font-size:10px; color:var(--text-ter);">${hash.substring(0, 8)}...</span>
                </div>
                <div class="torrent-ctrls">
                    <div class="torrent-save-path" title="${escapeHtml(t.save_path || '默认路径')}">
                        📁 ${escapeHtml(t.save_path || '默认路径')}
                    </div>
                    <div class="torrent-btns">
                        <button class="icon-btn" title="详情" onclick="event.stopPropagation(); openTorrentDetail('${hash}')">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </button>
                        <button class="icon-btn accent" title="重新下载" onclick="event.stopPropagation(); redownloadTorrent('${hash}')">
                            <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                        </button>
                        <button class="icon-btn" title="${status.isPaused ? '恢复' : '暂停'}" onclick="event.stopPropagation(); torrentAction('${status.isPaused ? 'resume' : 'pause'}', '${hash}')">
                            <svg viewBox="0 0 24 24"><path d="${status.isPaused ? 'M8 5v14l11-7z' : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'}"/></svg>
                        </button>
                        <button class="icon-btn danger" title="删除" onclick="event.stopPropagation(); confirmSingleDelete('${hash}', '${escapeHtml(t.name)}')">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </div>
            </div>`;
        });
        html += '</div>';
        container.html(html);
    }

    function renderTableView(list, container) {
        let html = `
        <div class="torrent-table-wrap">
            <table class="torrent-table">
                <thead>
                    <tr>
                        <th style="width:30px;"><input type="checkbox" class="torrent-check" onchange="toggleSelectAllTorrents(this.checked)"></th>
                        <th>名称</th>
                        <th>状态</th>
                        <th>大小</th>
                        <th>进度</th>
                        <th>下载速度</th>
                        <th>上传速度</th>
                        <th>做种/节点</th>
                        <th>ETA</th>
                        <th>分享率</th>
                        <th style="text-align:right;">操作</th>
                    </tr>
                </thead>
                <tbody>`;

        list.forEach(t => {
            const hash = t.hash;
            const isSelected = selectedTorrents.has(hash);
            const status = getTorrentStatus(t);

            const progressVal = (t.progress * 100).toFixed(1);
            const etaStr = (status.isCompleted || status.isSeeding) ? (status.isSeeding ? '做种中' : '已完成') : (status.isPaused ? '已暂停' : formatEta(t.eta));
            html += `
            <tr class="${isSelected ? 'selected' : ''}" onclick="onCardClick(event, '${hash}')">
                <td><input type="checkbox" class="torrent-check" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelectTorrent('${hash}', this.checked)"></td>
                <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</td>
                <td><span class="badge ${status.stateClass}">${status.stateName}</span></td>
                <td>${formatBytes(t.size)}</td>
                <td style="min-width:100px;">
                    <div style="font-size:11px; margin-bottom:2px;">${progressVal}%</div>
                    <div class="progress-track" style="margin:0; height:5px;"><div class="progress-fill ${status.stateClass}" style="width:${progressVal}%"></div></div>
                </td>
                <td style="color:var(--success); font-weight:600;">${formatBytes(t.dlspeed)}/s</td>
                <td style="color:var(--accent); font-weight:600;">${formatBytes(t.upspeed)}/s</td>
                <td style="font-size:11px; color:var(--text-sec); white-space:nowrap;">${t.num_seeds || 0} / ${t.num_leechs || 0}</td>
                <td>${etaStr}</td>
                <td>${(t.ratio||0).toFixed(2)}</td>
                <td style="text-align:right;">
                    <div style="display:inline-flex; gap:4px;">
                        <button class="icon-btn" title="详情" onclick="event.stopPropagation(); openTorrentDetail('${hash}')"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></button>
                        <button class="icon-btn accent" title="重新下载" onclick="event.stopPropagation(); redownloadTorrent('${hash}')"><svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg></button>
                        <button class="icon-btn" title="${status.isPaused ? '恢复' : '暂停'}" onclick="event.stopPropagation(); torrentAction('${status.isPaused ? 'resume' : 'pause'}', '${hash}')"><svg viewBox="0 0 24 24"><path d="${status.isPaused ? 'M8 5v14l11-7z' : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'}"/></svg></button>
                        <button class="icon-btn danger" title="删除" onclick="event.stopPropagation(); confirmSingleDelete('${hash}', '${escapeHtml(t.name)}')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
                    </div>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        container.html(html);
    }

    // --- Selection Management ---
    function onCardClick(e, hash) {
        if (e.target.tagName === 'BUTTON' || $(e.target).closest('button').length > 0 || e.target.type === 'checkbox') return;
        openTorrentDetail(hash);
    }

    function toggleSelectTorrent(hash, isChecked) {
        if (isChecked) selectedTorrents.add(hash);
        else selectedTorrents.delete(hash);
        updateBatchBar();
        renderTorrents();
    }

    function toggleSelectAllTorrents(isChecked) {
        const list = getFilteredAndSortedTorrents();
        if (isChecked) {
            list.forEach(t => selectedTorrents.add(t.hash));
        } else {
            selectedTorrents.clear();
        }
        updateBatchBar();
        renderTorrents();
    }

    function clearTorrentSelection() {
        selectedTorrents.clear();
        updateBatchBar();
        renderTorrents();
    }

    function updateBatchBar() {
        const count = selectedTorrents.size;
        if (count > 0) {
            $('#batch-count').text(count);
            $('#batch-bar').css('display', 'flex');
        } else {
            $('#batch-bar').hide();
        }
    }

    // --- Single & Batch Actions ---
    function torrentAction(action, hash) {
        $.post(`/api/v2/torrents/${action}`, { hashes: hash }, function() {
            pollFastData();
        });
    }

    let pendingRedownloadHashes = [];

    // 单个任务重新校验（不删本地文件）
    function recheckTorrent(hash) {
        $.post('/api/v2/torrents/recheck', { hashes: hash }, function() {
            $.post('/api/v2/torrents/resume', { hashes: hash });
            showToast('已发起重新校验并启动检查');
            pollFastData();
        });
    }

    // 批量强制重新校验
    function batchForceRecheck() {
        if (selectedTorrents.size === 0) return;
        const hashesStr = Array.from(selectedTorrents).join('|');
        const count = selectedTorrents.size;
        $.post('/api/v2/torrents/recheck', { hashes: hashesStr }, function() {
            $.post('/api/v2/torrents/resume', { hashes: hashesStr });
            clearTorrentSelection();
            showToast(`已对 ${count} 个任务发起强制重新校验`);
            pollFastData();
        });
    }

    // 单个任务从头重新下载（弹出确认弹窗）
    function redownloadTorrent(hash) {
        const t = allTorrents.find(item => item.hash === hash);
        const name = t ? t.name : hash;
        pendingRedownloadHashes = [hash];
        $('#redownload-confirm-msg').html(`确定要清空已下载文件并从头重新下载 <b>${escapeHtml(name)}</b> 吗？<br><span style="color:var(--warning); font-size:12px;">系统将自动备份种子参数，清除已下载本地文件，并从 0% 重新发起下载。</span>`);
        openModal('redownload-confirm-modal');
    }

    // 批量任务从头重新下载（弹出确认弹窗）
    function batchRedownload() {
        if (selectedTorrents.size === 0) return;
        pendingRedownloadHashes = Array.from(selectedTorrents);
        $('#redownload-confirm-msg').html(`确定要对选中的 <b>${pendingRedownloadHashes.length}</b> 个任务进行从头重新下载吗？<br><span style="color:var(--warning); font-size:12px;">系统将清除已下载本地文件，并从 0% 重新发起下载。</span>`);
        openModal('redownload-confirm-modal');
    }

    // 仅执行强制重新校验（不删本地文件）
    function executeForceRecheckOnly() {
        if (pendingRedownloadHashes.length === 0) return;
        const hashesStr = pendingRedownloadHashes.join('|');
        const count = pendingRedownloadHashes.length;
        $.post('/api/v2/torrents/recheck', { hashes: hashesStr }, function() {
            $.post('/api/v2/torrents/resume', { hashes: hashesStr });
            closeModal('redownload-confirm-modal');
            showToast(`已对 ${count} 个任务发起强制重新校验`);
            pendingRedownloadHashes = [];
            clearTorrentSelection();
            pollFastData();
        });
    }

    // 真正从头重新下载：导出种子 -> 删旧任务与本地文件 -> 重新添加并开始下载
    async function executeRedownloadTorrent() {
        if (pendingRedownloadHashes.length === 0) return;
        closeModal('redownload-confirm-modal');
        showToast('正在准备重新下载任务...');

        const targets = pendingRedownloadHashes.slice();
        pendingRedownloadHashes = [];
        let successCount = 0;

        for (const hash of targets) {
            const t = allTorrents.find(item => item.hash === hash);
            const savepath = t ? (t.save_path || '') : '';
            const category = t ? (t.category || '') : '';
            const tags = t ? (t.tags || '') : '';
            const magnetUri = t ? (t.magnet_uri || '') : '';

            // 1. 尝试通过 export API 导出 .torrent 二进制文件
            let torrentBlob = null;
            try {
                const res = await fetch(`/api/v2/torrents/export?hash=${hash}`);
                if (res.ok) {
                    torrentBlob = await res.blob();
                }
            } catch (e) {
                console.warn(`[Redownload] Failed to export torrent ${hash}:`, e);
            }

            // 2. 检查是否有种子 Blob 或磁力链接
            if (!torrentBlob && !magnetUri) {
                // 如果导出和磁链皆不可用，降级为强制校验
                await $.post('/api/v2/torrents/recheck', { hashes: hash });
                await $.post('/api/v2/torrents/resume', { hashes: hash });
                continue;
            }

            // 3. 构建重新添加任务的 FormData
            const formData = new FormData();
            if (torrentBlob && torrentBlob.size > 0) {
                formData.append('torrents', torrentBlob, `${(t && t.name) ? t.name : hash}.torrent`);
            } else if (magnetUri) {
                formData.append('urls', magnetUri);
            }
            if (savepath) formData.append('savepath', savepath);
            if (category) formData.append('category', category);
            if (tags) formData.append('tags', tags);
            formData.append('paused', 'false');

            // 4. 删除原有任务及已下载本地文件
            try {
                await $.post('/api/v2/torrents/delete', { hashes: hash, deleteFiles: 'true' });
                // 延时等待 qBittorrent 释放文件占用
                await new Promise(resolve => setTimeout(resolve, 350));
                // 5. 重新添加任务从 0% 开始下载
                await $.ajax({
                    url: '/api/v2/torrents/add',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false
                });
                successCount++;
            } catch (err) {
                console.error(`[Redownload] Failed to recreate torrent ${hash}:`, err);
            }
        }

        clearTorrentSelection();
        showToast(`✅ 已成功重置并从头重新下载 ${successCount} 个任务！`);
        pollFastData();
    }

    function batchTorrentAction(action) {
        if (selectedTorrents.size === 0) return;
        const hashesStr = Array.from(selectedTorrents).join('|');
        $.post(`/api/v2/torrents/${action}`, { hashes: hashesStr }, function() {
            clearTorrentSelection();
            pollFastData();
            showToast('批量操作已完成');
        });
    }

    // --- Safe Delete Modal System ---
    function confirmSingleDelete(hash, name) {
        pendingDeleteHashes = [hash];
        $('#delete-confirm-msg').html(`确定要删除任务 <b>${escapeHtml(name)}</b> 吗？<br>请选择仅删除任务或连同本地文件一起删除：`);
        openModal('delete-confirm-modal');
    }

    function confirmBatchDelete() {
        if (selectedTorrents.size === 0) return;
        pendingDeleteHashes = Array.from(selectedTorrents);
        $('#delete-confirm-msg').html(`确定要批量删除选中的 <b>${pendingDeleteHashes.length}</b> 个任务吗？<br>请选择仅删除任务或连同本地文件一起删除：`);
        openModal('delete-confirm-modal');
    }

    function executeDeleteTorrent(deleteFiles) {
        if (pendingDeleteHashes.length === 0) return;
        const hashesStr = pendingDeleteHashes.join('|');
        $.post('/api/v2/torrents/delete', { hashes: hashesStr, deleteFiles: deleteFiles ? 'true' : 'false' }, function() {
            closeModal('delete-confirm-modal');
            selectedTorrents.clear();
            pendingDeleteHashes = [];
            showToast('任务已成功删除');
            pollFastData();
        });
    }

    // --- Batch Category Modal ---
    function openBatchCategoryModal() {
        if (selectedTorrents.size === 0) return;
        let optHtml = '<option value="">(清除分类)</option>';
        Object.keys(allCategories).forEach(cat => {
            optHtml += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
        });
        $('#batch-target-category').html(optHtml);
        openModal('batch-category-modal');
    }

    function submitBatchCategory() {
        const cat = $('#batch-target-category').val();
        const hashesStr = Array.from(selectedTorrents).join('|');
        $.post('/api/v2/torrents/setCategory', { hashes: hashesStr, category: cat }, function() {
            closeModal('batch-category-modal');
            clearTorrentSelection();
            showToast('已更新所选任务分类');
            pollFastData();
        });
    }

    // --- Torrent Details Modal (On-demand polling) ---
    function openTorrentDetail(hash) {
        if (activeDetailHash !== hash) {
            peerCurrentPage = 1;
            cachedPieces = [];
        }
        activeDetailHash = hash;
        const torrent = allTorrents.find(t => t.hash === hash);
        const name = torrent ? torrent.name : '种子详情';
        $('#detail-title').text(name);
        $('#detail-hash').text(`Hash: ${hash}`);
        openModal('detail-modal');

        refreshActiveDetailSubTab();
        if (detailRefreshTimer) clearInterval(detailRefreshTimer);
        detailRefreshTimer = setInterval(refreshActiveDetailSubTab, 1800);
    }

    function switchDetailTab(tabId, btn) {
        activeDetailSubTab = tabId;
        $('.detail-tab-content').hide();
        $(`#${tabId}`).show();
        $('#detail-modal .tab-item').removeClass('active');
        $(btn).addClass('active');
        refreshActiveDetailSubTab();
    }

    function closeDetailModal() {
        closeModal('detail-modal');
        if (detailRefreshTimer) {
            clearInterval(detailRefreshTimer);
            detailRefreshTimer = null;
        }
    }

    function refreshActiveDetailSubTab() {
        if (!activeDetailHash || $('#detail-modal').is(':hidden')) return;

        if (activeDetailSubTab === 'dt-files') {
            $.getJSON(`/api/v2/torrents/files?hash=${activeDetailHash}`, function(files) {
                if (!files || files.length === 0) {
                    $('#dt-files').html('<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">暂无文件树数据</div>');
                    return;
                }
                let html = '';
                files.forEach((f, idx) => {
                    const sizeFormatted = formatBytes(f.size);
                    const progressPercent = (f.progress * 100).toFixed(1);
                    const prio = f.priority; // 0=Do not dl, 1=Normal, 6=High, 7=Max

                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden; margin-right:10px;">
                            <div style="font-weight:600; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${escapeHtml(f.name)}">📄 ${escapeHtml(f.name)}</div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${sizeFormatted} · ${progressPercent}%</div>
                        </div>
                        <select class="select-custom" style="padding:4px 8px; font-size:12px;" onchange="setFilePriority(${idx}, this.value)">
                            <option value="0" ${prio === 0 ? 'selected' : ''}>不下载</option>
                            <option value="1" ${prio === 1 ? 'selected' : ''}>常规优先级</option>
                            <option value="6" ${prio === 6 ? 'selected' : ''}>高优先级</option>
                            <option value="7" ${prio === 7 ? 'selected' : ''}>最高优先级</option>
                        </select>
                    </div>`;
                });
                $('#dt-files').html(html);
            });
        } else if (activeDetailSubTab === 'dt-pieces') {
            $.getJSON(`/api/v2/torrents/pieceStates?hash=${activeDetailHash}`, function(pieces) {
                if (!pieces || pieces.length === 0) return;
                cachedPieces = pieces;
                drawPiecesCanvas(pieces);
            });
        } else if (activeDetailSubTab === 'dt-trackers') {
            $.getJSON(`/api/v2/torrents/trackers?hash=${activeDetailHash}`, function(trackers) {
                if (!trackers || trackers.length === 0) {
                    $('#dt-trackers').html('<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">暂无 Trackers</div>');
                    return;
                }
                let html = '<div style="margin-bottom:12px; display:flex; gap:8px;">';
                html += '<input class="input-box" id="single-tracker-url" placeholder="添加 Tracker URL (udp://...)" style="flex:1;">';
                html += '<button class="btn" onclick="submitAddTrackers(false)" style="padding:6px 12px; font-size:12px;">+ 添加</button>';
                html += '</div>';

                trackers.forEach(t => {
                    if (!t.url) return;
                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden; margin-right:8px;">
                            <div style="font-weight:600; font-size:12px; font-family:monospace; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${escapeHtml(t.url)}">${escapeHtml(t.url)}</div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">状态: ${escapeHtml(t.msg || '运行中')} · 做种: ${t.num_seeds || 0} · 节点: ${t.num_peers || 0}</div>
                        </div>
                        <span class="badge ${t.status === 2 ? 'downloading' : (t.status === 0 ? 'paused' : 'error')}">${t.status === 2 ? '工作正常' : '已就绪'}</span>
                    </div>`;
                });
                $('#dt-trackers').html(html);
            });
        } else if (activeDetailSubTab === 'dt-peers') {
            $.getJSON(`/api/v2/sync/torrentPeers?hash=${activeDetailHash}`, function(res) {
                if (!res || !res.peers) {
                    $('#dt-peers').html('<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">暂无连接节点</div>');
                    return;
                }
                const peerKeys = Object.keys(res.peers);
                if (peerKeys.length === 0) {
                    $('#dt-peers').html('<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">暂无连接节点 (Peers: 0)</div>');
                    return;
                }

                const pageSize = 25;
                const totalPages = Math.ceil(peerKeys.length / pageSize);
                if (peerCurrentPage > totalPages) peerCurrentPage = totalPages;
                const startIndex = (peerCurrentPage - 1) * pageSize;
                const pageKeys = peerKeys.slice(startIndex, startIndex + pageSize);

                let html = `<div style="font-size:12px; color:var(--text-sec); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>当前在线 Peers 节点: ${peerKeys.length} 个</span>
                    ${totalPages > 1 ? `<span>第 ${peerCurrentPage} / ${totalPages} 页</span>` : ''}
                </div>`;

                pageKeys.forEach(k => {
                    const p = res.peers[k];
                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-weight:600; font-family:monospace;">${escapeHtml(p.ip)}:${p.port} <span style="font-size:11px; color:var(--text-sec); font-weight:normal;">(${escapeHtml(p.client || '未知客户端')})</span></div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">进度: ${(p.progress * 100).toFixed(1)}% · ↓ ${formatBytes(p.dl_speed)}/s · ↑ ${formatBytes(p.up_speed)}/s</div>
                        </div>
                        <span class="badge ${p.dl_speed > 0 || p.up_speed > 0 ? 'downloading' : 'paused'}">${p.dl_speed > 0 ? '传输中' : '连接空闲'}</span>
                    </div>`;
                });

                if (totalPages > 1) {
                    html += `
                    <div style="display:flex; justify-content:center; gap:10px; margin-top:14px; padding-top:8px; border-top:1px solid var(--border-subtle);">
                        <button class="btn secondary" style="padding:6px 14px; font-size:12px;" onclick="changePeerPage(-1)" ${peerCurrentPage <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>上一页</button>
                        <button class="btn secondary" style="padding:6px 14px; font-size:12px;" onclick="changePeerPage(1)" ${peerCurrentPage >= totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>下一页</button>
                    </div>`;
                }

                $('#dt-peers').html(html);
            });
        }
    }

    function changePeerPage(delta) {
        peerCurrentPage += delta;
        refreshActiveDetailSubTab();
    }

    function setFilePriority(fileId, prio) {
        $.post('/api/v2/torrents/filePrio', { hash: activeDetailHash, id: fileId, priority: prio }, function() {
            showToast('已更新文件下载优先级');
            refreshActiveDetailSubTab();
        });
    }

    // --- Canvas Pieces Rendering ---
    function drawPiecesCanvas(pieces) {
        const canvas = document.getElementById('piecesCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const total = pieces.length;
        let downloaded = 0;
        pieces.forEach(p => { if (p === 2) downloaded++; });
        $('#pieces-stats-text').text(`总区块: ${total} · 已下载: ${downloaded} (${((downloaded/total)*100).toFixed(1)}%)`);

        const cols = Math.floor(Math.sqrt(total * (rect.width / rect.height))) || 30;
        const rows = Math.ceil(total / cols);
        const cellW = (rect.width - 4) / cols;
        const cellH = (rect.height - 4) / rows;

        ctx.clearRect(0, 0, rect.width, rect.height);
        pieces.forEach((val, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            const x = 2 + c * cellW;
            const y = 2 + r * cellH;

            if (val === 2) ctx.fillStyle = '#34c759'; // Have
            else if (val === 1) ctx.fillStyle = '#007aff'; // Downloading
            else ctx.fillStyle = 'rgba(120,120,128,0.2)'; // Missing

            ctx.fillRect(x, y, Math.max(1, cellW - 1), Math.max(1, cellH - 1));
        });

        // Hover tooltip
        canvas.onmousemove = function(e) {
            const cx = e.offsetX;
            const cy = e.offsetY;
            const c = Math.floor((cx - 2) / cellW);
            const r = Math.floor((cy - 2) / cellH);
            const idx = r * cols + c;
            if (idx >= 0 && idx < total) {
                const statusNames = ['未下载', '下载中', '已完成'];
                const tip = $('#pieces-tooltip');
                tip.text(`区块 #${idx}：${statusNames[pieces[idx]] || '未知'}`);
                tip.css({ left: e.pageX + 10, top: e.pageY + 10 }).show();
            } else {
                $('#pieces-tooltip').hide();
            }
        };
        canvas.onmouseleave = function() { $('#pieces-tooltip').hide(); };
    }

// --- Global Trackers ---
    function submitAddTrackers(isGlobal) {
        let urls = '';
        if (isGlobal) {
            urls = $('#global-tracker-urls').val().trim();
        } else {
            urls = $('#single-tracker-url').val().trim();
        }

        if (!urls) return showToast('请输入有效的 Tracker URL 列表！', false);

        if (isGlobal) {
            if (allTorrents.length === 0) return showToast('当前没有运行中的任务！', false);
            const allHashes = allTorrents.map(t => t.hash).join('|');
            $.post('/api/v2/torrents/addTrackers', { hashes: allHashes, urls: urls }, function() {
                showToast(`已成功为全部 ${allTorrents.length} 个任务批量追加 Tracker！`);
                $('#global-tracker-urls').val('');
            }).fail(function() {
                showToast('批量 Tracker 请求已发送！');
            });
        } else {
            $.post('/api/v2/torrents/addTrackers', { hash: activeDetailHash, urls: urls }, function() {
                showToast('Tracker 追加成功！');
                $('#single-tracker-url').val('');
                refreshActiveDetailSubTab();
            });
        }
    }

    // --- Add Torrent Submission ---
    function openAddModal() { openModal('add-modal'); }

    function submitAddTorrent() {
        const fileInput = document.getElementById('torrent-file');
        const urls = $('#torrent-urls').val().trim();
        const cat = $('#add-torrent-category').val();
        const savepath = $('#add-torrent-savepath').val().trim();

        if (fileInput.files.length === 0 && !urls) {
            return showToast('请选择 .torrent 种子文件或填入 Magnet 磁力链接！', false);
        }

        let formData = new FormData();
        if (fileInput.files.length > 0) {
            formData.append('torrents', fileInput.files[0]);
        }
        if (urls) {
            formData.append('urls', urls);
        }
        if (cat) formData.append('category', cat);
        if (savepath) formData.append('savepath', savepath);

        if ($('#add-torrent-sequential').is(':checked')) formData.append('sequentialDownload', 'true');
        if ($('#add-torrent-firstlast').is(':checked')) formData.append('firstLastPiecePrio', 'true');
        formData.append('paused', $('#add-torrent-autostart').is(':checked') ? 'false' : 'true');

        $.ajax({
            url: '/api/v2/torrents/add',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function() {
                closeModal('add-modal');
                $('#torrent-urls').val('');
                fileInput.value = '';
                $('#add-torrent-savepath').val('');
                showToast('任务已成功添加至 qBittorrent！');
                pollFastData();
            },
            error: function() {
                showToast('发送种子失败，请检查网络或重新登录！', false);
            }
        });
    }

// --- [Module: search.js] ---
/**
 * @file search.js
 * @description Search engine plugins manager, active search jobs, and search results
 */

// --- Search Engine & Plugins Management ---
    function fetchSearchPlugins() {
        $.getJSON('/api/v2/search/plugins', function(plugins) {
            installedPlugins = plugins || [];
            $('#cnt-plugins').text(installedPlugins.length);
            renderInstalledPlugins();
            updateSearchPluginDropdown();
            renderPresetPlugins();

            if (installedPlugins.length === 0) {
                $('#plugin-warning-box').show();
            } else {
                $('#plugin-warning-box').hide();
            }
        }).fail(function() {
            $('#plugin-warning-box').show();
        });
    }

    function renderInstalledPlugins() {
        const container = $('#installed-plugins-list');
        if (!installedPlugins || installedPlugins.length === 0) {
            container.html('<div style="text-align:center; padding:30px; color:var(--text-sec); font-size:13px;">暂未安装任何搜索插件。请从下方常用插件库一键安装。</div>');
            return;
        }

        let html = '';
        installedPlugins.forEach(p => {
            html += `
            <div class="list-row">
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:700; font-size:14px;">${escapeHtml(p.fullName || p.name)} <span style="font-size:11px; color:var(--text-sec); font-weight:normal;">v${escapeHtml(p.version || '1.0')}</span></div>
                    <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">URL: <a href="${escapeHtml(p.url)}" target="_blank" style="color:var(--accent); text-decoration:none;">${escapeHtml(p.url)}</a></div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <label class="switch">
                        <input type="checkbox" ${p.enabled ? 'checked' : ''} onchange="togglePluginEnabled('${escapeHtml(p.name)}', this.checked)">
                        <span class="slider"></span>
                    </label>
                    <button class="icon-btn danger" onclick="uninstallSearchPlugin('${escapeHtml(p.name)}')" title="卸载插件">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>`;
        });
        container.html(html);
    }

    function updateSearchPluginDropdown() {
        let html = '<option value="all">🌐 全部插件</option><option value="enabled" selected>⚡ 已启用插件</option>';
        installedPlugins.forEach(p => {
            html += `<option value="${escapeHtml(p.name)}">${escapeHtml(p.fullName || p.name)}</option>`;
        });
        $('#search-plugin').html(html);
    }

    function renderPresetPlugins() {
        const container = $('#preset-plugins-grid');
        let html = '';
        PRESET_PLUGINS.forEach(preset => {
            const cleanName = preset.name.toLowerCase().replace(/[\s\-_]/g, '');
            const urlName = preset.url.split('/').pop().replace('.py', '').toLowerCase();
            const isInstalled = installedPlugins.some(p => {
                const pName = (p.name || '').toLowerCase().replace(/[\s\-_]/g, '');
                const pFull = (p.fullName || '').toLowerCase().replace(/[\s\-_]/g, '');
                return pName === cleanName || pName === urlName || pFull.includes(cleanName) || cleanName.includes(pName);
            });

            html += `
            <div class="card" style="padding:12px; margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div style="font-weight:700; font-size:13px; margin-bottom:2px;">${escapeHtml(preset.name)}</div>
                    <div style="font-size:11px; color:var(--text-sec); margin-bottom:10px; line-height:1.4;">${escapeHtml(preset.desc)}</div>
                </div>
                <button class="btn ${isInstalled ? 'secondary' : ''}" style="padding:6px 12px; font-size:11px;" onclick="installPresetPlugin('${preset.url}')" ${isInstalled ? 'disabled style="opacity:0.6;"' : ''}>
                    ${isInstalled ? '✓ 已安装' : '+ 一键安装'}
                </button>
            </div>`;
        });
        container.html(html);
    }

    function installPresetPlugin(url) {
        showToast('正在向 qBittorrent 发送插件安装指令...');
        $.post('/api/v2/search/installPlugin', { sources: url }, function() {
            showToast('插件安装请求已发送，正在同步中');
            setTimeout(fetchSearchPlugins, 2500);
        }).fail(function() {
            showToast('安装失败，请确认服务器已安装 Python3', false);
        });
    }

    function installAllPresetPlugins() {
        const uninstalled = PRESET_PLUGINS.filter(preset => {
            const cleanName = preset.name.toLowerCase().replace(/[\s\-_]/g, '');
            const urlName = preset.url.split('/').pop().replace('.py', '').toLowerCase();
            return !installedPlugins.some(p => {
                const pName = (p.name || '').toLowerCase().replace(/[\s\-_]/g, '');
                const pFull = (p.fullName || '').toLowerCase().replace(/[\s\-_]/g, '');
                return pName === cleanName || pName === urlName || pFull.includes(cleanName) || cleanName.includes(pName);
            });
        });

        if (uninstalled.length === 0) {
            return showToast('所有推荐插件均已安装完毕！');
        }

        showToast(`正在批量安装 ${uninstalled.length} 个优质检索插件...`);
        const sources = uninstalled.map(p => p.url).join('|');
        $.post('/api/v2/search/installPlugin', { sources: sources }, function() {
            showToast('批量插件安装指令已发出，正在同步...');
            setTimeout(fetchSearchPlugins, 3000);
        }).fail(function() {
            showToast('批量安装请求失败，请检查网络连接', false);
        });
    }

    function updateSearchPlugins() {
        showToast('正在检查并更新搜索插件...');
        $.post('/api/v2/search/updatePlugins', function() {
            showToast('插件更新指令已发送，正在拉取最新版本');
            setTimeout(fetchSearchPlugins, 2500);
        }).fail(function() {
            showToast('更新指令发送失败', false);
        });
    }

    function submitInstallCustomPlugin() {
        const url = $('#custom-plugin-url').val().trim();
        if (!url) return showToast('请输入有效的插件 URL', false);
        $.post('/api/v2/search/installPlugin', { sources: url }, function() {
            closeModal('install-plugin-modal');
            $('#custom-plugin-url').val('');
            showToast('自定义插件安装指令已发出');
            setTimeout(fetchSearchPlugins, 2000);
        });
    }

    function togglePluginEnabled(pluginName, enable) {
        $.post('/api/v2/search/enablePlugin', { names: pluginName, enable: enable ? 'true' : 'false' }, function() {
            showToast(`已${enable ? '启用' : '禁用'}插件: ${pluginName}`);
            fetchSearchPlugins();
        });
    }

    function uninstallSearchPlugin(pluginName) {
        if (!confirm(`确定要卸载搜索插件 [${pluginName}] 吗？`)) return;
        $.post('/api/v2/search/uninstallPlugin', { names: pluginName }, function() {
            showToast(`已卸载插件: ${pluginName}`);
            fetchSearchPlugins();
        });
    }

    function updateSearchPlugins() {
        showToast('正在检查并更新所有搜索插件...');
        $.post('/api/v2/search/updatePlugins', function() {
            showToast('已发起插件在线更新');
            setTimeout(fetchSearchPlugins, 3000);
        });
    }

    let cachedSearchResults = [];
    let searchSortMode = 'seeds';

    function changeSearchSort(mode) {
        searchSortMode = mode;
        searchCurrentPage = 1;
        $('.sort-pill').removeClass('active');
        $(`#sort-btn-${mode}`).addClass('active');
        renderSearchResultsUI();
    }

    function renderSearchResultsUI() {
        let list = [...cachedSearchResults];
        if (searchSortMode === 'seeds') {
            list.sort((a, b) => (b.nbSeeders || 0) - (a.nbSeeders || 0));
        } else if (searchSortMode === 'size') {
            list.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
        } else if (searchSortMode === 'name') {
            list.sort((a, b) => (a.fileName || '').localeCompare(b.fileName || ''));
        }

        const totalResults = list.length;
        const totalPages = Math.ceil(totalResults / SEARCH_PAGE_SIZE) || 1;
        if (searchCurrentPage > totalPages) searchCurrentPage = totalPages;
        if (searchCurrentPage < 1) searchCurrentPage = 1;

        if (totalResults > 0) {
            $('#search-count-label').text(`检索结果: ${totalResults} 条 (第 ${searchCurrentPage} / ${totalPages} 页)`);
            $('#search-toolbar').css('display', 'flex');
        } else {
            $('#search-toolbar').hide();
        }

        const startIndex = (searchCurrentPage - 1) * SEARCH_PAGE_SIZE;
        const endIndex = Math.min(startIndex + SEARCH_PAGE_SIZE, totalResults);
        const pageItems = list.slice(startIndex, endIndex);

        let html = '';
        pageItems.forEach((item, index) => {
            const itemIndex = startIndex + index + 1;
            const sizeFormatted = formatBytes(item.fileSize);
            html += `
            <div class="card" style="padding:14px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:700; font-size:14px; line-height:1.4; word-break:break-all;" title="${escapeHtml(item.fileName)}">
                            <span style="display:inline-block; min-width:24px; color:var(--accent); font-weight:800; font-size:13px; margin-right:4px;">${itemIndex}.</span>${escapeHtml(item.fileName)}
                        </div>
                        <div style="font-size:12px; color:var(--text-sec); margin-top:4px;">
                            📦 ${sizeFormatted} · 👤 做种: <span style="color:var(--success); font-weight:700;">${item.nbSeeders}</span> · 吸血: ${item.nbLeechers} · 来源: ${escapeHtml(item.siteUrl || '插件')}
                        </div>
                    </div>
                    <button class="btn" style="padding:8px 16px; font-size:12px; flex-shrink:0;" onclick="addMagnetFromSearch('${escapeHtml(item.fileUrl)}')">下载</button>
                </div>
            </div>`;
        });

        if (totalResults === 0) {
            html = '<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">正在检索全网结果，请稍候...</div>';
        } else {
            // 分页控制器（始终展示统计与翻页器）
            let pageButtonsHtml = '';
            // 上一页
            pageButtonsHtml += `<button class="page-pill" onclick="changeSearchPage(-1)" ${searchCurrentPage <= 1 ? 'disabled' : ''} title="上一页">‹</button>`;

            if (totalPages <= 1) {
                pageButtonsHtml += `<button class="page-pill active" disabled>1</button>`;
            } else {
                const maxVisible = 5;
                let startPage = Math.max(1, searchCurrentPage - 2);
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                }

                if (startPage > 1) {
                    pageButtonsHtml += `<button class="page-pill" onclick="goToSearchPage(1)">1</button>`;
                    if (startPage > 2) pageButtonsHtml += `<span class="page-ellipsis">…</span>`;
                }

                for (let p = startPage; p <= endPage; p++) {
                    pageButtonsHtml += `<button class="page-pill ${p === searchCurrentPage ? 'active' : ''}" onclick="goToSearchPage(${p})">${p}</button>`;
                }

                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) pageButtonsHtml += `<span class="page-ellipsis">…</span>`;
                    pageButtonsHtml += `<button class="page-pill" onclick="goToSearchPage(${totalPages})">${totalPages}</button>`;
                }
            }

            // 下一页
            pageButtonsHtml += `<button class="page-pill" onclick="changeSearchPage(1)" ${searchCurrentPage >= totalPages ? 'disabled' : ''} title="下一页">›</button>`;

            html += `
            <div class="pagination-wrapper">
                <div class="pagination-info">
                    显示第 <strong>${startIndex + 1}</strong> - <strong>${endIndex}</strong> 条 / 共 <strong>${totalResults}</strong> 条 (每页 20 条)
                </div>
                <div class="pagination-controls">
                    ${pageButtonsHtml}
                </div>
            </div>`;
        }

        $('#search-results-container').html(html);
    }

    function changeSearchPage(delta) {
        goToSearchPage(searchCurrentPage + delta);
    }

    function goToSearchPage(page) {
        searchCurrentPage = page;
        renderSearchResultsUI();
        const el = document.getElementById('search-toolbar');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function triggerSearch() {
        const pattern = $('#search-keyword').val().trim();
        if (!pattern) return showToast('请输入搜索关键字！', false);

        stopCurrentSearch();
        cachedSearchResults = [];
        searchCurrentPage = 1;
        $('#search-toolbar').hide();
        const plugin = $('#search-plugin').val();
        const category = $('#search-category').val();

        $('#search-results-container').html('<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">正在全网启动搜索，拉取检索结果中...</div>');
        $('#search-status-bar').css('display', 'flex');
        $('#search-status-text').text(`正在为 “${pattern}” 检索中...`);

        $.post('/api/v2/search/start', { pattern: pattern, plugins: plugin, category: category }, function(res) {
            if (res && res.id) {
                searchId = res.id;
                if (searchRefreshTimer) clearInterval(searchRefreshTimer);
                searchRefreshTimer = setInterval(pollSearchResults, 1500);
            } else {
                $('#search-results-container').html('<div style="text-align:center; padding:40px; color:var(--danger); font-size:14px;">启动搜索失败，请确认 qBittorrent 中已启用 Python 搜索插件。</div>');
            }
        });
    }

    function pollSearchResults() {
        if (!searchId) return;
        $.post('/api/v2/search/results', { id: searchId, limit: 500 }, function(res) {
            if (!res || !res.results) return;

            cachedSearchResults = res.results || [];
            renderSearchResultsUI();

            if (res.status === 'Stopped') {
                $('#search-status-text').text(`搜索完成，共抓取 ${res.total || cachedSearchResults.length} 条资源`);
                if (searchRefreshTimer) clearInterval(searchRefreshTimer);
                searchRefreshTimer = null;
            }
        });
    }

    function stopCurrentSearch() {
        if (searchId) {
            $.post('/api/v2/search/stop', { id: searchId });
            $.post('/api/v2/search/delete', { id: searchId });
            searchId = null;
        }
        if (searchRefreshTimer) {
            clearInterval(searchRefreshTimer);
            searchRefreshTimer = null;
        }
        $('#search-status-bar').hide();
    }

    function addMagnetFromSearch(magnetUrl) {
        $.post('/api/v2/torrents/add', { urls: magnetUrl }, function() {
            showToast('✅ 磁力链接已成功添加，开始下载！');
            pollFastData();
        });
    }

// --- [Module: rss.js] ---
/**
 * @file rss.js
 * @description RSS feed subscriptions, article explorer, auto-download rules & filters
 */

// --- RSS Feeds & Rules & Categories ---
    function fetchRssData() {
        // 1. Feeds
        $.getJSON('/api/v2/rss/items?withData=true', function(feeds) {
            renderRssFeeds(feeds);
        });

        // 2. Rules
        $.getJSON('/api/v2/rss/rules', function(rules) {
            renderRssRules(rules);
        });

        // 3. Categories
        $.getJSON('/api/v2/torrents/categories', function(cats) {
            allCategories = cats || {};
            renderCategories();
        });
    }

    function renderRssFeeds(feeds) {
        const container = $('#rss-feed-list-container');
        if (!feeds || Object.keys(feeds).length === 0) {
            container.html('<div class="card" style="text-align:center; color:var(--text-sec); font-size:13px;">暂无订阅源，请点击上方按钮添加 RSS 订阅 URL</div>');
            return;
        }

        let html = '';
        Object.keys(feeds).forEach(key => {
            const feed = feeds[key];
            const articles = feed.articles || [];
            html += `
            <div class="card" style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <div style="font-weight:700; font-size:14px;">📡 ${escapeHtml(feed.title || key)}</div>
                        <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">URL: ${escapeHtml(feed.url || key)} · 文章数: ${articles.length}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn secondary" style="padding:6px 12px; font-size:12px;" onclick="viewRssArticles('${escapeHtml(key)}')">浏览文章</button>
                        <button class="btn secondary" style="padding:6px 12px; font-size:12px;" onclick="refreshRssFeed('${escapeHtml(key)}')">刷新</button>
                        <button class="icon-btn danger" style="width:30px; height:30px;" title="删除订阅源" onclick="deleteRssFeed('${escapeHtml(key)}')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
                    </div>
                </div>
            </div>`;
        });
        container.html(html);
    }

    function viewRssArticles(feedKey) {
        $.getJSON('/api/v2/rss/items?withData=true', function(feeds) {
            const feed = feeds[feedKey];
            if (!feed || !feed.articles) return;

            $('#rss-active-feed-title').text(`📡 ${feed.title || feedKey} (共 ${feed.articles.length} 篇)`);
            let html = '';
            feed.articles.forEach(art => {
                html += `
                <div class="list-row">
                    <div style="flex:1; overflow:hidden; margin-right:10px;">
                        <div style="font-weight:600; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${escapeHtml(art.title)}">${escapeHtml(art.title)}</div>
                        <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">发布时间: ${art.date ? formatTimestamp(art.date) : '--'}</div>
                    </div>
                    <button class="btn" style="padding:6px 12px; font-size:11px;" onclick="addMagnetFromSearch('${escapeHtml(art.torrentURL || art.link)}')">下载</button>
                </div>`;
            });
            $('#rss-articles-list').html(html);
            $('#rss-articles-container').slideDown();
        });
    }

    function refreshRssFeed(feedPath) {
        $.post('/api/v2/rss/refreshItem', { itemPath: feedPath }, function() {
            showToast('已发起 RSS 订阅源刷新请求！');
            fetchRssData();
        });
    }

    function refreshAllRssFeeds() {
        $.post('/api/v2/rss/refreshItem', { itemPath: '' }, function() {
            showToast('已发起全部 RSS 订阅刷新！');
            fetchRssData();
        });
    }

    function deleteRssFeed(feedPath) {
        if (!confirm(`确定要删除 RSS 订阅源 [${feedPath}] 吗？`)) return;
        $.post('/api/v2/rss/removeItem', { path: feedPath }, function() {
            showToast('已删除订阅源');
            fetchRssData();
        });
    }

    function submitAddRssFeed() {
        const url = $('#feed-url').val().trim();
        const path = $('#feed-path').val().trim();
        if (!url) return showToast('请输入有效的 RSS 订阅链接！', false);

        $.post('/api/v2/rss/addFeed', { url: url, path: path }, function() {
            closeModal('add-rss-feed-modal');
            $('#feed-url').val('');
            $('#feed-path').val('');
            showToast('已添加 RSS 订阅源');
            fetchRssData();
        });
    }

    function renderRssRules(rules) {
        const container = $('#rss-rules-container');
        if (!rules || Object.keys(rules).length === 0) {
            container.html('<div class="card" style="text-align:center; color:var(--text-sec); font-size:13px;">暂无自动下载规则</div>');
            return;
        }

        let html = '';
        Object.keys(rules).forEach(name => {
            const r = rules[name];
            html += `
            <div class="card" style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <div style="font-weight:700; font-size:14px;">⚡ ${escapeHtml(name)}</div>
                        <div style="font-size:12px; color:var(--text-sec); margin-top:4px;">
                            包含: <code>${escapeHtml(r.mustContain || '所有')}</code> · 排除: <code>${escapeHtml(r.mustNotContain || '无')}</code> · 分类: ${r.assignedCategory ? `🏷 ${escapeHtml(r.assignedCategory)}` : '无'}
                        </div>
                    </div>
                    <button class="icon-btn danger" onclick="deleteRssRule('${escapeHtml(name)}')" title="删除规则"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
                </div>
            </div>`;
        });
        container.html(html);
    }

    function openRssRuleModal() {
        let optHtml = '<option value="">(分配分类: 无)</option>';
        Object.keys(allCategories).forEach(c => {
            optHtml += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
        });
        $('#rule-category').html(optHtml);
        openModal('rss-rule-modal');
    }

    function submitRssRule() {
        const name = $('#rule-name').val().trim();
        const must = $('#rule-must').val().trim();
        const not = $('#rule-not').val().trim();
        const cat = $('#rule-category').val();
        if (!name) return showToast('请输入规则名称！', false);

        const ruleDef = {
            enabled: true,
            mustContain: must,
            mustNotContain: not,
            useRegex: true,
            assignedCategory: cat || "",
            savePath: ""
        };

        $.post('/api/v2/rss/setRule', { ruleName: name, ruleDef: JSON.stringify(ruleDef) }, function() {
            closeModal('rss-rule-modal');
            $('#rule-name').val('');
            $('#rule-must').val('');
            $('#rule-not').val('');
            showToast('已保存自动下载规则');
            fetchRssData();
        });
    }

    function deleteRssRule(name) {
        if (!confirm(`确定要删除规则 [${name}] 吗？`)) return;
        $.post('/api/v2/rss/removeRule', { ruleName: name }, function() {
            showToast('已删除规则');
            fetchRssData();
        });
    }

    function renderCategories() {
        const container = $('#categories-container');
        if (!allCategories || Object.keys(allCategories).length === 0) {
            container.html('<div class="card" style="text-align:center; color:var(--text-sec); font-size:13px;">暂无分类数据</div>');
            return;
        }

        let html = '<div class="card"><div style="display:flex; flex-wrap:wrap; gap:8px;">';
        Object.keys(allCategories).forEach(cat => {
            html += `<span class="badge category" style="font-size:12px; padding:6px 12px;">🏷️ ${escapeHtml(cat)}</span>`;
        });
        html += '</div></div>';
        container.html(html);
    }

    function submitCreateCategory() {
        const name = $('#new-cat-name').val().trim();
        const path = $('#new-cat-path').val().trim();
        if (!name) return showToast('请输入分类名称！', false);

        $.post('/api/v2/torrents/createCategory', { category: name, savePath: path }, function() {
            closeModal('add-category-modal');
            $('#new-cat-name').val('');
            $('#new-cat-path').val('');
            showToast('已成功创建分类');
            pollSlowData();
        });
    }

    function updateCategoryDropdowns() {
        let filterHtml = '<option value="all">📁 全部分类</option>';
        let addHtml = '<option value="">(无分类)</option>';

        Object.keys(allCategories).forEach(c => {
            filterHtml += `<option value="${escapeHtml(c)}" ${currentCategory === c ? 'selected' : ''}>${escapeHtml(c)}</option>`;
            addHtml += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
        });

        $('#filter-category').html(filterHtml);
        $('#add-torrent-category').html(addHtml);
    }

// --- [Module: system.js] ---
/**
 * @file system.js
 * @description qBittorrent preferences, speed limits, network, categories, trackers & live logs
 */

// --- Comprehensive System Preferences Loading & Saving ---
    function loadAllSystemPreferences() {
        $.getJSON('/api/v2/app/preferences', function(prefs) {
            if (!prefs) return;

            // Speed
            const dlLimit = prefs.dl_limit_global ? Math.round(prefs.dl_limit_global / 1024) : (prefs.global_dl_limit ? Math.round(prefs.global_dl_limit / 1024) : '');
            const upLimit = prefs.up_limit_global ? Math.round(prefs.up_limit_global / 1024) : (prefs.global_up_limit ? Math.round(prefs.global_up_limit / 1024) : '');
            const altDl = prefs.alt_dl_limit ? Math.round(prefs.alt_dl_limit / 1024) : '';
            const altUp = prefs.alt_up_limit ? Math.round(prefs.alt_up_limit / 1024) : '';

            if (!$('#limit-dl').is(':focus')) $('#limit-dl').val(dlLimit);
            if (!$('#limit-up').is(':focus')) $('#limit-up').val(upLimit);
            if (!$('#limit-alt-dl').is(':focus')) $('#limit-alt-dl').val(altDl);
            if (!$('#limit-alt-up').is(':focus')) $('#limit-alt-up').val(altUp);

            $('#pref-scheduler-enabled').prop('checked', !!prefs.scheduler_enabled);
            if (prefs.schedule_from_hour !== undefined && prefs.schedule_from_min !== undefined) {
                const fromStr = `${String(prefs.schedule_from_hour).padStart(2,'0')}:${String(prefs.schedule_from_min).padStart(2,'0')}`;
                $('#pref-schedule-from').val(fromStr);
            }
            if (prefs.schedule_to_hour !== undefined && prefs.schedule_to_min !== undefined) {
                const toStr = `${String(prefs.schedule_to_hour).padStart(2,'0')}:${String(prefs.schedule_to_min).padStart(2,'0')}`;
                $('#pref-schedule-to').val(toStr);
            }
            if (prefs.scheduler_days !== undefined) {
                $('#pref-scheduler-days').val(prefs.scheduler_days);
            }

            $('#pref-limit-overhead').prop('checked', !!prefs.limit_tcp_overhead);
            $('#pref-limit-utp').prop('checked', !!prefs.limit_utp_rate);

            // Downloads & Storage
            if (!$('#pref-save-path').is(':focus')) $('#pref-save-path').val(prefs.save_path || '');
            $('#pref-temp-path-enabled').prop('checked', !!prefs.temp_path_enabled);
            if (!$('#pref-temp-path').is(':focus')) $('#pref-temp-path').val(prefs.temp_path || '');
            $('#pref-preallocate').prop('checked', !!prefs.preallocate_all);
            $('#pref-incomplete-ext').prop('checked', !!prefs.incomplete_files_ext);
            $('#pref-create-subfolder').prop('checked', !!prefs.create_subfolder_enabled);

            // Connection & Ports
            if (!$('#pref-listen-port').is(':focus')) $('#pref-listen-port').val(prefs.listen_port || '');
            $('#pref-upnp').prop('checked', !!prefs.upnp);
            if (!$('#pref-max-conns').is(':focus')) $('#pref-max-conns').val(prefs.max_conns || 500);
            if (!$('#pref-max-conns-per-torrent').is(':focus')) $('#pref-max-conns-per-torrent').val(prefs.max_conns_per_torrent || 100);
            if (!$('#pref-max-uploads').is(':focus')) $('#pref-max-uploads').val(prefs.max_uploads || 8);
            if (!$('#pref-max-uploads-per-torrent').is(':focus')) $('#pref-max-uploads-per-torrent').val(prefs.max_uploads_per_torrent || 4);

            // BitTorrent & Queueing
            $('#pref-dht').prop('checked', !!prefs.dht);
            $('#pref-pex').prop('checked', !!prefs.pex);
            $('#pref-lsd').prop('checked', !!prefs.lsd);
            if (prefs.encryption !== undefined) $('#pref-encryption').val(prefs.encryption);

            $('#pref-queueing').prop('checked', !!prefs.queueing_enabled);
            if (!$('#pref-max-active-dl').is(':focus')) $('#pref-max-active-dl').val(prefs.max_active_downloads || 3);
            if (!$('#pref-max-active-up').is(':focus')) $('#pref-max-active-up').val(prefs.max_active_uploads || 5);
            if (!$('#pref-max-active-torrents').is(':focus')) $('#pref-max-active-torrents').val(prefs.max_active_torrents || 8);

            $('#pref-max-ratio-enabled').prop('checked', !!prefs.max_ratio_enabled);
            if (!$('#pref-max-ratio').is(':focus')) $('#pref-max-ratio').val(prefs.max_ratio || 2.0);
            if (prefs.max_ratio_act !== undefined) $('#pref-max-ratio-act').val(prefs.max_ratio_act);

            // WebUI
            if (!$('#pref-webui-username').is(':focus')) $('#pref-webui-username').val(prefs.web_ui_username || '');
            if (!$('#pref-webui-port').is(':focus')) $('#pref-webui-port').val(prefs.web_ui_port || 8080);
            if (!$('#pref-session-timeout').is(':focus')) $('#pref-session-timeout').val(prefs.web_ui_session_timeout ? Math.round(prefs.web_ui_session_timeout / 60) : 60);
            $('#pref-bypass-local-auth').prop('checked', !!prefs.bypass_local_auth);
            if (!$('#pref-ban-count').is(':focus')) $('#pref-ban-count').val(prefs.web_ui_max_auth_fail_count || 5);
            if (!$('#pref-ban-duration').is(':focus')) $('#pref-ban-duration').val(prefs.web_ui_ban_duration || 3600);
        });
    }

    function saveAllSystemPreferences() {
        const dl = $('#limit-dl').val() ? parseInt($('#limit-dl').val()) * 1024 : 0;
        const up = $('#limit-up').val() ? parseInt($('#limit-up').val()) * 1024 : 0;
        const altDl = $('#limit-alt-dl').val() ? parseInt($('#limit-alt-dl').val()) * 1024 : 0;
        const altUp = $('#limit-alt-up').val() ? parseInt($('#limit-alt-up').val()) * 1024 : 0;

        const fromTime = ($('#pref-schedule-from').val() || '08:00').split(':');
        const toTime = ($('#pref-schedule-to').val() || '20:00').split(':');

        const newUsername = $('#pref-webui-username').val().trim();
        const newPassword = $('#pref-webui-password').val();
        const confirmPassword = $('#pref-webui-password-confirm').val();

        if (newPassword && newPassword !== confirmPassword) {
            return showToast('❌ 两次输入的新密码不一致，请重新核对！', false);
        }

        const prefs = {
            // Speed & limits
            dl_limit_global: dl,
            up_limit_global: up,
            alt_dl_limit: altDl,
            alt_up_limit: altUp,
            scheduler_enabled: $('#pref-scheduler-enabled').is(':checked'),
            schedule_from_hour: parseInt(fromTime[0]) || 8,
            schedule_from_min: parseInt(fromTime[1]) || 0,
            schedule_to_hour: parseInt(toTime[0]) || 20,
            schedule_to_min: parseInt(toTime[1]) || 0,
            scheduler_days: parseInt($('#pref-scheduler-days').val()) || 0,
            limit_tcp_overhead: $('#pref-limit-overhead').is(':checked'),
            limit_utp_rate: $('#pref-limit-utp').is(':checked'),

            // Storage
            save_path: $('#pref-save-path').val().trim(),
            temp_path_enabled: $('#pref-temp-path-enabled').is(':checked'),
            temp_path: $('#pref-temp-path').val().trim(),
            preallocate_all: $('#pref-preallocate').is(':checked'),
            incomplete_files_ext: $('#pref-incomplete-ext').is(':checked'),
            create_subfolder_enabled: $('#pref-create-subfolder').is(':checked'),

            // Network & Ports
            listen_port: parseInt($('#pref-listen-port').val()) || 6881,
            upnp: $('#pref-upnp').is(':checked'),
            max_conns: parseInt($('#pref-max-conns').val()) || 500,
            max_conns_per_torrent: parseInt($('#pref-max-conns-per-torrent').val()) || 100,
            max_uploads: parseInt($('#pref-max-uploads').val()) || 8,
            max_uploads_per_torrent: parseInt($('#pref-max-uploads-per-torrent').val()) || 4,

            // BitTorrent & Queueing
            dht: $('#pref-dht').is(':checked'),
            pex: $('#pref-pex').is(':checked'),
            lsd: $('#pref-lsd').is(':checked'),
            encryption: parseInt($('#pref-encryption').val()) || 0,
            queueing_enabled: $('#pref-queueing').is(':checked'),
            max_active_downloads: parseInt($('#pref-max-active-dl').val()) || 3,
            max_active_uploads: parseInt($('#pref-max-active-up').val()) || 5,
            max_active_torrents: parseInt($('#pref-max-active-torrents').val()) || 8,
            max_ratio_enabled: $('#pref-max-ratio-enabled').is(':checked'),
            max_ratio: parseFloat($('#pref-max-ratio').val()) || 2.0,
            max_ratio_act: parseInt($('#pref-max-ratio-act').val()) || 0,

            // WebUI
            web_ui_port: parseInt($('#pref-webui-port').val()) || 8080,
            web_ui_session_timeout: (parseInt($('#pref-session-timeout').val()) || 60) * 60,
            bypass_local_auth: $('#pref-bypass-local-auth').is(':checked'),
            web_ui_max_auth_fail_count: parseInt($('#pref-ban-count').val()) || 5,
            web_ui_ban_duration: parseInt($('#pref-ban-duration').val()) || 3600
        };

        if (newUsername) prefs.web_ui_username = newUsername;
        if (newPassword) {
            prefs.web_ui_password = newPassword;
            prefs.bypass_auth_subnet_whitelist_enabled = false;
            prefs.bypass_local_auth = false;
        }

        $.post('/api/v2/transfer/setDownloadLimit', { limit: dl });
        $.post('/api/v2/transfer/setUploadLimit', { limit: up });
        $.post('/api/v2/app/setPreferences', { json: JSON.stringify(prefs) }, function() {
            $('#pref-webui-password').val('');
            $('#pref-webui-password-confirm').val('');
            showToast('✅ 系统配置与安全凭据已全量保存！');
            loadAllSystemPreferences();
        }).fail(function() {
            showToast('保存配置失败，请检查网络或权限', false);
        });
    }

    // --- Logs ---
    function fetchSystemLogs() {
        $.getJSON('/api/v2/log/main?normal=true&info=true&warning=true&critical=true&last_known_id=-1', function(logs) {
            rawLogs = logs || [];
            filterLogEntries();
        });
    }

    function filterLogEntries() {
        const type = $('#log-filter-type').val();
        const kw = ($('#log-search-input').val() || '').trim().toLowerCase();
        let filtered = [...rawLogs];
        if (type && type !== 'all') {
            filtered = filtered.filter(l => l.type === parseInt(type));
        }
        if (kw) {
            filtered = filtered.filter(l => (l.message || '').toLowerCase().includes(kw));
        }
        renderSystemLogs(filtered);
    }

    function copySystemLogs() {
        if (!rawLogs || rawLogs.length === 0) return showToast('暂无日志记录可复制', false);
        const textLines = rawLogs.map(l => `[${formatTimestamp(l.timestamp)}] [${l.type}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(textLines).then(() => {
            showToast('✅ 已复制全部日志到剪贴板！');
        }).catch(() => {
            showToast('复制失败，请手动选择复制', false);
        });
    }

    function renderSystemLogs(logs) {
        const container = $('#sys-logs-container');
        if (!logs || logs.length === 0) {
            container.html('<div style="color:var(--text-sec); text-align:center; padding:20px;">暂无日志记录</div>');
            return;
        }

        const typeMap = {
            1: { class: 'normal', text: 'NORMAL' },
            2: { class: 'info', text: 'INFO' },
            4: { class: 'warning', text: 'WARN' },
            8: { class: 'critical', text: 'CRIT' }
        };

        let html = '';
        logs.slice().reverse().forEach(l => {
            const badgeInfo = typeMap[l.type] || { class: 'normal', text: 'LOG' };
            html += `
            <div style="padding:6px 0; border-bottom:1px solid var(--border-subtle); display:flex; gap:8px; align-items:flex-start;">
                <span style="color:var(--text-sec);">${formatTimestamp(l.timestamp)}</span>
                <span class="log-badge ${badgeInfo.class}">${badgeInfo.text}</span>
                <span style="flex:1; word-break:break-all;">${escapeHtml(l.message)}</span>
            </div>`;
        });
        container.html(html);
    }

// --- [Module: ui.js] ---
/**
 * @file ui.js
 * @description Theme toggle, navigation tabs, modal popups, keyboard shortcuts & drag/drop
 */

// --- Theme System ---
    function initTheme() {
        setTheme(themeMode);
    }

    function setTheme(mode) {
        themeMode = mode;
        localStorage.setItem('omni_theme', mode);
        document.documentElement.setAttribute('data-theme', mode);

        const icons = { auto: '🌓', light: '☀️', dark: '🌙' };
        const labels = { auto: '自动', light: '浅色', dark: '深色' };
        $('#theme-icon').text(icons[mode] || '🌓');
        $('#theme-label').text(labels[mode] || '自动');
    }

    function cycleTheme() {
        const modes = ['auto', 'light', 'dark'];
        const nextIdx = (modes.indexOf(themeMode) + 1) % modes.length;
        setTheme(modes[nextIdx]);
    }

    // --- Alt Speed Limits (Turtle Mode) ---
    function checkAltSpeedMode() {
        $.get('/api/v2/transfer/speedLimitsMode', function(mode) {
            isAltSpeedEnabled = (parseInt(mode) === 1);
            updateAltSpeedUI();
        });
    }

    function updateAltSpeedUI() {
        if (isAltSpeedEnabled) {
            $('#btn-alt-speed').addClass('alt-speed-active');
            $('#alt-speed-icon').text('🐢');
            $('#alt-speed-label').text('限速中');
        } else {
            $('#btn-alt-speed').removeClass('alt-speed-active');
            $('#alt-speed-icon').text('⚡');
            $('#alt-speed-label').text('全速');
        }
    }

    function toggleAltSpeedMode() {
        $.post('/api/v2/transfer/toggleSpeedLimitsMode', function() {
            isAltSpeedEnabled = !isAltSpeedEnabled;
            updateAltSpeedUI();
            showToast(isAltSpeedEnabled ? '已激活备用限速模式' : '已恢复常规全局全速模式');
        });
    }

// --- Tab Navigation ---
    function switchTab(pageId, title, btn) {
        $('.page').removeClass('active');
        $(`#${pageId}`).addClass('active');
        $('.dock-btn').removeClass('active');
        $(btn).addClass('active');
        $('#page-title').text(title);

        window.scrollTo(0, 0);

        if (pageId === 'p-search') fetchSearchPlugins();
        if (pageId === 'p-rss') fetchRssData();
        if (pageId === 'p-system') {
            loadAllSystemPreferences();
            fetchSystemLogs();
        }
    }

    function switchSearchSubTab(tabId, btn) {
        $('.search-sub-content').hide();
        $(`#${tabId}`).show();
        $('#p-search .tab-item').removeClass('active');
        $(btn).addClass('active');
        if (tabId === 'search-sub-plugins') fetchSearchPlugins();
    }

    function switchRssSubTab(tabId, btn) {
        $('.rss-sub-content').hide();
        $(`#${tabId}`).show();
        $('#p-rss .tab-item').removeClass('active');
        $(btn).addClass('active');
        fetchRssData();
    }

    function switchSysSubTab(tabId, btn) {
        $('.sys-sub-content').hide();
        $(`#${tabId}`).show();
        $('#p-system .tab-item').removeClass('active');
        $(btn).addClass('active');
        if (tabId === 'sys-sub-logs') {
            fetchSystemLogs();
        } else if (tabId !== 'sys-sub-trackers') {
            loadAllSystemPreferences();
        }
    }

// --- Modal Helpers ---
    function openModal(id) {
        $(`#${id}`).addClass('active');
        $('body').addClass('modal-open');
    }

    function closeModal(id) {
        $(`#${id}`).removeClass('active');
        if ($('.modal-overlay.active').length === 0) {
            $('body').removeClass('modal-open');
        }
    }

    // --- Authentication & Login Dialog ---
    function openLoginModal(isForced) {
        if (isForced) {
            $('#login-modal').addClass('forced-login');
        } else {
            $('#login-modal').removeClass('forced-login');
        }
        openModal('login-modal');
        setTimeout(() => {
            if (!$('#login-user').val()) $('#login-user').focus();
            else $('#login-pass').focus();
        }, 150);
    }

    function submitLogin() {
        const username = $('#login-user').val().trim();
        const password = $('#login-pass').val();

        if (!username || !password) {
            showToast('⚠️ 请输入完整的 WebUI 用户名与密码', false);
            if (!username) $('#login-user').focus();
            else $('#login-pass').focus();
            return;
        }

        const loginBtn = $('#login-modal button.btn.w-full');
        const origText = loginBtn.text();
        loginBtn.prop('disabled', true).text('正在核验中...');

        $.ajax({
            url: '/api/v2/auth/login',
            type: 'POST',
            data: { username: username, password: password },
            success: function(res) {
                loginBtn.prop('disabled', false).text(origText);
                const respStr = String(res || '').trim();
                if (respStr === 'Ok.' || respStr === 'Ok') {
                    $('#login-modal').removeClass('forced-login');
                    closeModal('login-modal');
                    $('#login-pass').val('');
                    showToast('✅ 身份验证通过，已成功登录！');
                    if (typeof checkAuthStatus === 'function') {
                        checkAuthStatus();
                    }
                } else {
                    showToast('❌ 用户名或密码错误，请核对后重试！', false);
                    $('#login-pass').val('').focus();
                }
            },
            error: function(xhr) {
                loginBtn.prop('disabled', false).text(origText);
                if (xhr.status === 403 || xhr.status === 401) {
                    showToast('❌ 登录失败：用户名或密码错误 / 尝试过多被临时锁定', false);
                } else {
                    showToast('❌ 连接 qBittorrent 登录接口失败 (' + xhr.status + ')', false);
                }
                $('#login-pass').val('').focus();
            }
        });
    }

    function logout() {
        if (typeof fastPollTimer !== 'undefined' && fastPollTimer) clearInterval(fastPollTimer);
        if (typeof slowPollTimer !== 'undefined' && slowPollTimer) clearInterval(slowPollTimer);
        $.post('/api/v2/auth/logout', function() {
            showToast('已退出登录');
            $('#qbt-dot').addClass('offline');
            $('#qbt-status-text').text('未登录 / 需鉴权');
            openLoginModal(true);
        }).fail(function() {
            openLoginModal(true);
        });
    }

// --- Global Drag & Drop + Clipboard Listener ---
    function initDragAndDrop() {
        let dragCounter = 0;
        window.addEventListener('dragenter', function(e) {
            e.preventDefault();
            dragCounter++;
            $('#drag-overlay').css('display', 'flex');
        });

        window.addEventListener('dragleave', function(e) {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                $('#drag-overlay').hide();
            }
        });

        window.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        window.addEventListener('drop', function(e) {
            e.preventDefault();
            dragCounter = 0;
            $('#drag-overlay').hide();

            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.name.endsWith('.torrent')) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    document.getElementById('torrent-file').files = dataTransfer.files;
                    openAddModal();
                }
            }
        });

        // Clipboard listener
        window.addEventListener('paste', function(e) {
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            if (pasteData && pasteData.startsWith('magnet:?')) {
                $('#torrent-urls').val(pasteData);
                openAddModal();
            }
        });
    }

// --- [Module: app.js] ---
/**
 * @file app.js
 * @description Application polling loops, lifecycle bootstrap and event bindings
 */

// --- Data Synchronization ---
    function pollFastData() {
        // 1. Transfer Rates & Status
        $.getJSON('/api/v2/transfer/info', function(info) {
            if (!info) return;
            $('#qbt-dot').removeClass('offline');
            $('#qbt-status-text').text('已在线');

            const dlSpeed = formatBytes(info.dl_info_speed);
            const upSpeed = formatBytes(info.up_info_speed);
            $('#v-dl-speed').text(dlSpeed + '/s');
            $('#v-up-speed').text(upSpeed + '/s');

            const statusMap = {
                "connected": "🟢 连接就绪",
                "firewalled": "🟡 处于防火墙后",
                "disconnected": "🔴 未连接"
            };
            $('#v-conn-status').text(statusMap[info.connection_status] || info.connection_status);
            $('#v-dht-nodes').text(`DHT 节点: ${info.dht_nodes}`);
            $('#v-disk-free').text(formatBytes(info.free_space_on_disk));

            const totalDL = formatBytes(info.dl_info_data);
            const totalUP = formatBytes(info.up_info_data);
            $('#v-total-transferred').text(`累计传输: ↓ ${totalDL} | ↑ ${totalUP}`);

            // Chart update
            const dlKB = (info.dl_info_speed || 0) / 1024;
            const upKB = (info.up_info_speed || 0) / 1024;
            netHistory.push({ down: parseFloat(dlKB.toFixed(1)), up: parseFloat(upKB.toFixed(1)) });
            if (netHistory.length > 20) netHistory.shift();

            if (netChart) {
                netChart.data.datasets[0].data = netHistory.map(i => i.down);
                netChart.data.datasets[1].data = netHistory.map(i => i.up);
                netChart.update('none');
            }
        }).fail(function() {
            $('#qbt-dot').addClass('offline');
            $('#qbt-status-text').text('离线/未登入');
        });

        // 2. Torrents List Sync
        $.getJSON('/api/v2/torrents/info', function(torrents) {
            allTorrents = torrents || [];
            updateSummaryCounters();
            renderTorrents();
        });
    }

    function pollSlowData() {
        // Categories
        $.getJSON('/api/v2/torrents/categories', function(cats) {
            allCategories = cats || {};
            updateCategoryDropdowns();
            renderCategories();
        });

        checkAltSpeedMode();
    }

// --- App Init ---
    $(document).ready(function() {
        initTheme();
        updateViewModeIcon();
        initChart();
        initDragAndDrop();

        // Backdrop click to close modals (except forced login)
        $(document).on('click', '.modal-overlay', function(e) {
            if (e.target === this) {
                if (this.id === 'login-modal' && $(this).hasClass('forced-login')) {
                    return;
                }
                closeModal(this.id);
            }
        });

        // Global Keyboard Shortcuts
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModal = $('.modal-overlay.active').last();
                if (activeModal.length > 0) {
                    if (activeModal.attr('id') === 'login-modal' && activeModal.hasClass('forced-login')) {
                        return;
                    }
                    closeModal(activeModal.attr('id'));
                }
            } else if (!$(e.target).is('input, textarea, select')) {
                if (e.key === '1') switchTab('p-dash', '总览', $('.dock-btn:nth-child(1)'));
                else if (e.key === '2') switchTab('p-torrents', '任务', $('.dock-btn:nth-child(2)'));
                else if (e.key === '3') switchTab('p-search', '搜索', $('.dock-btn:nth-child(3)'));
                else if (e.key === '4') switchTab('p-rss', 'RSS', $('.dock-btn:nth-child(4)'));
                else if (e.key === '5') switchTab('p-system', '系统', $('.dock-btn:nth-child(5)'));
                else if (e.key === '/' || e.key === 'f' || e.key === 'F') {
                    e.preventDefault();
                    switchTab('p-torrents', '任务', $('.dock-btn:nth-child(2)'));
                    setTimeout(() => $('#torrent-search-input').focus().select(), 100);
                } else if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    openAddModal();
                }
            }
        });

        // Set Date
        const now = new Date();
        const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        $('#date-now').text(`${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]}`);

        // Bootstrap authentication check (VueTorrent-style probe)
        checkAuthStatus();
    });

    function checkAuthStatus() {
        $.get('/api/v2/app/version', function(ver) {
            qbtVersion = ver;
            $('#sys-qbt-version-text').text(`qBittorrent ${ver}`);
            $('#login-modal').removeClass('forced-login');
            closeModal('login-modal');

            $.get('/api/v2/app/webapiVersion', function(wver) {
                webapiVersion = wver;
                $('#sys-webapi-version-text').text(`v${wver}`);
            });

            // Initial Data Poll
            pollFastData();
            pollSlowData();

            // Setup recurring timers
            if (fastPollTimer) clearInterval(fastPollTimer);
            if (slowPollTimer) clearInterval(slowPollTimer);
            fastPollTimer = setInterval(pollFastData, 1800);
            slowPollTimer = setInterval(pollSlowData, 15000);
        }).fail(function(err) {
            if (fastPollTimer) clearInterval(fastPollTimer);
            if (slowPollTimer) clearInterval(slowPollTimer);
            $('#qbt-dot').addClass('offline');
            $('#qbt-status-text').text('未登录 / 需鉴权');
            openLoginModal(true);
        });
    }
