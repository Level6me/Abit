/**
 * @file torrents.js
 * @description Torrent list management, filtering, batch actions, detail drawer, pieces canvas & add modal
 */

// --- Counter Calculation & Notification Tracking ---
    const previousTorrentStates = new Map();

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

            // Detect state transition from downloading -> completed
            const wasDownloading = previousTorrentStates.get(t.hash);
            if (wasDownloading && (s.isCompleted || t.progress >= 1.0)) {
                notifyTorrentCompleted(t);
            }
            previousTorrentStates.set(t.hash, s.isDownloading);
        });

        $('#sum-all, #cnt-all').text(allTorrents.length);
        $('#sum-dl, #cnt-dl, #v-dl-count-num').text(dl);
        $('#sum-seed, #cnt-seed, #v-up-count-num').text(seed);
        $('#sum-completed, #cnt-completed').text(completed);
        $('#sum-pause, #cnt-pause').text(paused);
        $('#cnt-active').text(active);
        $('#cnt-queue').text(queued);
        $('#cnt-err').text(err);

        // Update PWA App Badge (Dock / Taskbar dynamic icon number)
        updateAppBadge(dl);
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
            container.html(`<div style="text-align:center; padding:60px 20px; color:var(--text-sec); font-size:14px;">${window.t('当前筛选条件下无任务记录')}</div>`);
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
            const etaStr = (status.isCompleted || status.isSeeding) ? (status.isSeeding ? window.t('做种中') : window.t('已完成')) : (status.isPaused ? window.t('已暂停') : formatEta(t.eta));
            const seedsText = `${window.t('做种: ')}${t.num_seeds || 0} (${t.num_complete || 0}) · ${window.t('节点: ')}${t.num_leechs || 0} (${t.num_incomplete || 0})`;

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
                    <span>${t.category ? `<span class="badge category">🏷 ${escapeHtml(t.category)}</span> ` : ''}${window.t('比率: ')}${ratioVal}</span>
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
                    <div class="torrent-save-path" title="${escapeHtml(t.save_path || window.t('默认路径'))}">
                        📁 ${escapeHtml(t.save_path || window.t('默认路径'))}
                    </div>
                    <div class="torrent-btns">
                        <button class="icon-btn" title="${window.t('详情')}" onclick="event.stopPropagation(); openTorrentDetail('${hash}')">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </button>
                        <button class="icon-btn accent" title="${window.t('重新下载')}" onclick="event.stopPropagation(); redownloadTorrent('${hash}')">
                            <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                        </button>
                        <button class="icon-btn" title="${status.isPaused ? window.t('恢复') : window.t('暂停')}" onclick="event.stopPropagation(); torrentAction('${status.isPaused ? 'resume' : 'pause'}', '${hash}')">
                            <svg viewBox="0 0 24 24"><path d="${status.isPaused ? 'M8 5v14l11-7z' : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'}"/></svg>
                        </button>
                        <button class="icon-btn danger" title="${window.t('删除')}" onclick="event.stopPropagation(); confirmSingleDelete('${hash}', '${escapeHtml(t.name)}')">
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
                        <th>${window.t('名称')}</th>
                        <th>${window.t('状态')}</th>
                        <th>${window.t('大小')}</th>
                        <th>${window.t('进度')}</th>
                        <th>${window.t('下载速度')}</th>
                        <th>${window.t('上传速度')}</th>
                        <th>${window.t('做种/节点')}</th>
                        <th>ETA</th>
                        <th>${window.t('分享率')}</th>
                        <th style="text-align:right;">${window.t('操作')}</th>
                    </tr>
                </thead>
                <tbody>`;

        list.forEach(t => {
            const hash = t.hash;
            const isSelected = selectedTorrents.has(hash);
            const status = getTorrentStatus(t);

            const progressVal = (t.progress * 100).toFixed(1);
            const etaStr = (status.isCompleted || status.isSeeding) ? (status.isSeeding ? window.t('做种中') : window.t('已完成')) : (status.isPaused ? window.t('已暂停') : formatEta(t.eta));
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
                        <button class="icon-btn" title="${window.t('详情')}" onclick="event.stopPropagation(); openTorrentDetail('${hash}')"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></button>
                        <button class="icon-btn accent" title="${window.t('重新下载')}" onclick="event.stopPropagation(); redownloadTorrent('${hash}')"><svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg></button>
                        <button class="icon-btn" title="${status.isPaused ? window.t('恢复') : window.t('暂停')}" onclick="event.stopPropagation(); torrentAction('${status.isPaused ? 'resume' : 'pause'}', '${hash}')"><svg viewBox="0 0 24 24"><path d="${status.isPaused ? 'M8 5v14l11-7z' : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'}"/></svg></button>
                        <button class="icon-btn danger" title="${window.t('删除')}" onclick="event.stopPropagation(); confirmSingleDelete('${hash}', '${escapeHtml(t.name)}')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
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
            showToast(window.t('已发起重新校验并启动检查'));
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
            showToast(`${window.t('已对 ')}${count}${window.t(' 个任务发起强制重新校验')}`);
            pollFastData();
        });
    }

    // 单个任务从头重新下载（弹出确认弹窗）
    function redownloadTorrent(hash) {
        const t = allTorrents.find(item => item.hash === hash);
        const name = t ? t.name : hash;
        pendingRedownloadHashes = [hash];
        $('#redownload-confirm-msg').html(`${window.t('确定要清空已下载文件并从头重新下载 ')}<b>${escapeHtml(name)}</b>${window.t(' 吗？')}<br><span style="color:var(--warning); font-size:12px;">${window.t('系统将自动备份种子参数，清除已下载本地文件，并从 0% 重新发起下载。')}</span>`);
        openModal('redownload-confirm-modal');
    }

    // 批量任务从头重新下载（弹出确认弹窗）
    function batchRedownload() {
        if (selectedTorrents.size === 0) return;
        pendingRedownloadHashes = Array.from(selectedTorrents);
        $('#redownload-confirm-msg').html(`${window.t('确定要对选中的 ')}<b>${pendingRedownloadHashes.length}</b>${window.t(' 个任务进行从头重新下载吗？')}<br><span style="color:var(--warning); font-size:12px;">${window.t('系统将清除已下载本地文件，并从 0% 重新发起下载。')}</span>`);
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
            showToast(`${window.t('已对 ')}${count}${window.t(' 个任务发起强制重新校验')}`);
            pendingRedownloadHashes = [];
            clearTorrentSelection();
            pollFastData();
        });
    }

    // 真正从头重新下载：导出种子 -> 删旧任务与本地文件 -> 重新添加并开始下载
    async function executeRedownloadTorrent() {
        if (pendingRedownloadHashes.length === 0) return;
        closeModal('redownload-confirm-modal');
        showToast(window.t('正在准备重新下载任务...'));

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
        showToast(`${window.t('✅ 已成功重置并从头重新下载 ')}${successCount}${window.t(' 个任务！')}`);
        pollFastData();
    }

    function batchTorrentAction(action) {
        if (selectedTorrents.size === 0) return;
        const hashesStr = Array.from(selectedTorrents).join('|');
        $.post(`/api/v2/torrents/${action}`, { hashes: hashesStr }, function() {
            clearTorrentSelection();
            pollFastData();
            showToast(window.t('批量操作已完成'));
        });
    }

    // --- Safe Delete Modal System ---
    function confirmSingleDelete(hash, name) {
        pendingDeleteHashes = [hash];
        $('#delete-confirm-msg').html(`${window.t('确定要删除任务 ')}<b>${escapeHtml(name)}</b>${window.t(' 吗？<br>请选择仅删除任务或连同本地文件一起删除：')}`);
        openModal('delete-confirm-modal');
    }

    function confirmBatchDelete() {
        if (selectedTorrents.size === 0) return;
        pendingDeleteHashes = Array.from(selectedTorrents);
        $('#delete-confirm-msg').html(`${window.t('确定要批量删除选中的 ')}<b>${pendingDeleteHashes.length}</b>${window.t(' 个任务吗？<br>请选择仅删除任务或连同本地文件一起删除：')}`);
        openModal('delete-confirm-modal');
    }

    function executeDeleteTorrent(deleteFiles) {
        if (pendingDeleteHashes.length === 0) return;
        const hashesStr = pendingDeleteHashes.join('|');
        $.post('/api/v2/torrents/delete', { hashes: hashesStr, deleteFiles: deleteFiles ? 'true' : 'false' }, function() {
            closeModal('delete-confirm-modal');
            selectedTorrents.clear();
            pendingDeleteHashes = [];
            showToast(window.t('任务已成功删除'));
            pollFastData();
        });
    }

    // --- Batch Category Modal ---
    function openBatchCategoryModal() {
        if (selectedTorrents.size === 0) return;
        let optHtml = `<option value="">${window.t('(清除分类)')}</option>`;
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
            showToast(window.t('已更新所选任务分类'));
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
        const name = torrent ? torrent.name : window.t('种子详情');
        $('#detail-title').text(name);
        $('#detail-hash').text(`Hash: ${hash}`);
        $('#btn-share-torrent').show();
        openModal('detail-modal');

        refreshActiveDetailSubTab();
        if (detailRefreshTimer) clearInterval(detailRefreshTimer);
        detailRefreshTimer = setInterval(refreshActiveDetailSubTab, 1800);
    }

    function shareCurrentTorrent() {
        const torrent = allTorrents.find(t => t.hash === activeDetailHash);
        if (!torrent) return;
        const magnetUri = torrent.magnet_uri || `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(torrent.name)}`;
        if (navigator.share) {
            navigator.share({
                title: torrent.name,
                text: `[Abit 种子分享] ${torrent.name} (${formatBytes(torrent.total_size || torrent.size)})`,
                url: magnetUri
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    copyToClipboard(magnetUri);
                    showToast(window.t('已复制磁力链接至剪贴板'));
                }
            });
        } else {
            copyToClipboard(magnetUri);
            showToast(window.t('已复制磁力链接至剪贴板'));
        }
        hapticFeedback(15);
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
                    $('#dt-files').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${window.t('暂无文件树数据')}</div>`);
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
                            <option value="0" ${prio === 0 ? 'selected' : ''}>${window.t('不下载')}</option>
                            <option value="1" ${prio === 1 ? 'selected' : ''}>${window.t('常规优先级')}</option>
                            <option value="6" ${prio === 6 ? 'selected' : ''}>${window.t('高优先级')}</option>
                            <option value="7" ${prio === 7 ? 'selected' : ''}>${window.t('最高优先级')}</option>
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
                    $('#dt-trackers').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${window.t('暂无 Trackers')}</div>`);
                    return;
                }
                let html = '<div style="margin-bottom:12px; display:flex; gap:8px;">';
                html += `<input class="input-box" id="single-tracker-url" placeholder="${window.t('添加 Tracker URL (udp://...)')}" style="flex:1;">`;
                html += `<button class="btn" onclick="submitAddTrackers(false)" style="padding:6px 12px; font-size:12px;">${window.t('+ 添加')}</button>`;
                html += '</div>';

                trackers.forEach(t => {
                    if (!t.url) return;
                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden; margin-right:8px;">
                            <div style="font-weight:600; font-size:12px; font-family:monospace; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${escapeHtml(t.url)}">${escapeHtml(t.url)}</div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${window.t('状态: ')}${escapeHtml(t.msg || window.t('运行中'))} · ${window.t('做种: ')}${t.num_seeds || 0} · ${window.t('节点: ')}${t.num_peers || 0}</div>
                        </div>
                        <span class="badge ${t.status === 2 ? 'downloading' : (t.status === 0 ? 'paused' : 'error')}">${t.status === 2 ? window.t('工作正常') : window.t('已就绪')}</span>
                    </div>`;
                });
                $('#dt-trackers').html(html);
            });
        } else if (activeDetailSubTab === 'dt-peers') {
            $.getJSON(`/api/v2/sync/torrentPeers?hash=${activeDetailHash}`, function(res) {
                if (!res || !res.peers) {
                    $('#dt-peers').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${window.t('暂无连接节点')}</div>`);
                    return;
                }
                const peerKeys = Object.keys(res.peers);
                if (peerKeys.length === 0) {
                    $('#dt-peers').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${window.t('暂无连接节点 (Peers: 0)')}</div>`);
                    return;
                }

                const pageSize = 25;
                const totalPages = Math.ceil(peerKeys.length / pageSize);
                if (peerCurrentPage > totalPages) peerCurrentPage = totalPages;
                const startIndex = (peerCurrentPage - 1) * pageSize;
                const pageKeys = peerKeys.slice(startIndex, startIndex + pageSize);

                let html = `<div style="font-size:12px; color:var(--text-sec); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${window.t('当前在线 Peers 节点: ')}${peerKeys.length}${window.t(' 个')}</span>
                    ${totalPages > 1 ? `<span>${window.t('第 ')}${peerCurrentPage} / ${totalPages}${window.t(' 页')}</span>` : ''}
                </div>`;

                pageKeys.forEach(k => {
                    const p = res.peers[k];
                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-weight:600; font-family:monospace;">${escapeHtml(p.ip)}:${p.port} <span style="font-size:11px; color:var(--text-sec); font-weight:normal;">(${escapeHtml(p.client || window.t('未知客户端'))})</span></div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${window.t('进度: ')}${(p.progress * 100).toFixed(1)}% · ↓ ${formatBytes(p.dl_speed)}/s · ↑ ${formatBytes(p.up_speed)}/s</div>
                        </div>
                        <span class="badge ${p.dl_speed > 0 || p.up_speed > 0 ? 'downloading' : 'paused'}">${p.dl_speed > 0 ? window.t('传输中') : window.t('连接空闲')}</span>
                    </div>`;
                });

                if (totalPages > 1) {
                    html += `
                    <div style="display:flex; justify-content:center; gap:10px; margin-top:14px; padding-top:8px; border-top:1px solid var(--border-subtle);">
                        <button class="btn secondary" style="padding:6px 14px; font-size:12px;" onclick="changePeerPage(-1)" ${peerCurrentPage <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>${window.t('上一页')}</button>
                        <button class="btn secondary" style="padding:6px 14px; font-size:12px;" onclick="changePeerPage(1)" ${peerCurrentPage >= totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>${window.t('下一页')}</button>
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
            showToast(window.t('已更新文件下载优先级'));
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
        $('#pieces-stats-text').text(`${window.t('总区块: ')}${total}${window.t(' · 已下载: ')}${downloaded} (${((downloaded/total)*100).toFixed(1)}%)`);

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
                const statusNames = [window.t('未下载'), window.t('下载中'), window.t('已完成')];
                const tip = $('#pieces-tooltip');
                tip.text(`${window.t('区块 #')}${idx}: ${statusNames[pieces[idx]] || '?'}`);
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

        if (!urls) return showToast(window.t('请输入有效的 Tracker URL 列表！'), false);

        if (isGlobal) {
            if (allTorrents.length === 0) return showToast(window.t('当前没有运行中的任务！'), false);
            const allHashes = allTorrents.map(t => t.hash).join('|');
            $.post('/api/v2/torrents/addTrackers', { hashes: allHashes, urls: urls }, function() {
                showToast(`${window.t('已成功为全部 ')}${allTorrents.length}${window.t(' 个任务批量追加 Tracker！')}`);
                $('#global-tracker-urls').val('');
            }).fail(function() {
                showToast(window.t('批量 Tracker 请求已发送！'));
            });
        } else {
            $.post('/api/v2/torrents/addTrackers', { hash: activeDetailHash, urls: urls }, function() {
                showToast(window.t('Tracker 追加成功！'));
                $('#single-tracker-url').val('');
                refreshActiveDetailSubTab();
            });
        }
    }

    // --- Add Torrent Submission ---
    function openAddModal(prefillUrl) {
        if (prefillUrl) {
            $('#torrent-urls').val(prefillUrl);
        }
        openModal('add-modal');
    }

    function submitAddTorrent() {
        const fileInput = document.getElementById('torrent-file');
        const urls = $('#torrent-urls').val().trim();
        const cat = $('#add-torrent-category').val();
        const savepath = $('#add-torrent-savepath').val().trim();

        if (fileInput.files.length === 0 && !urls) {
            return showToast(window.t('请选择 .torrent 种子文件或填入 Magnet 磁力链接！'), false);
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
                showToast(window.t('任务已成功添加至 qBittorrent！'));
                pollFastData();
            },
            error: function() {
                showToast(window.t('发送种子失败，请检查网络或重新登录！'), false);
            }
        });
    }
