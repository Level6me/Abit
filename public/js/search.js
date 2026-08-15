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
            container.html(`<div style="text-align:center; padding:30px; color:var(--text-sec); font-size:13px;">${window.t('暂未安装任何搜索插件。请从下方常用插件库一键安装。')}</div>`);
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
                    <button class="icon-btn danger" onclick="uninstallSearchPlugin('${escapeHtml(p.name)}')" title="${window.t('卸载插件')}">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>`;
        });
        container.html(html);
    }

    function updateSearchPluginDropdown() {
        let html = `<option value="all">${window.t('🌐 全部插件')}</option><option value="enabled" selected>${window.t('⚡ 已启用插件')}</option>`;
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
                    ${isInstalled ? window.t('✓ 已安装') : window.t('+ 一键安装')}
                </button>
            </div>`;
        });
        container.html(html);
    }

    function installPresetPlugin(url) {
        showToast(window.t('正在向 qBittorrent 发送插件安装指令...'));
        $.post('/api/v2/search/installPlugin', { sources: url }, function() {
            showToast(window.t('插件安装请求已发送，正在同步中'));
            setTimeout(fetchSearchPlugins, 2500);
        }).fail(function() {
            showToast(window.t('安装失败，请确认服务器已安装 Python3'), false);
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
            showToast(`${enable ? window.t('已启用') : window.t('已禁用')}${pluginName}`);
            fetchSearchPlugins();
        });
    }

    function uninstallSearchPlugin(pluginName) {
        if (!confirm(`${window.t('确定要卸载搜索插件 ')}[${pluginName}]${window.t(' 吗？')}`)) return;
        $.post('/api/v2/search/uninstallPlugin', { names: pluginName }, function() {
            showToast(`${window.t('已卸载插件: ')}${pluginName}`);
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
            $('#search-count-label').text(`${window.t('检索结果: ')}${totalResults}${window.t(' 条')} (${window.t('第')} ${searchCurrentPage} / ${totalPages}${window.t(' 页')})`);
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
                            📦 ${sizeFormatted} · 👤 ${window.t('做种: ')}<span style="color:var(--success); font-weight:700;">${item.nbSeeders}</span> · ${window.t('吸血: ')}${item.nbLeechers} · ${window.t('来源: ')}${escapeHtml(item.siteUrl || '插件')}
                        </div>
                    </div>
                    <button class="btn" style="padding:8px 16px; font-size:12px; flex-shrink:0;" onclick="addMagnetFromSearch('${escapeHtml(item.fileUrl)}')">${window.t('下载')}</button>
                </div>
            </div>`;
        });

        if (totalResults === 0) {
            html = `<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">${window.t('正在检索全网结果，请稍候...')}</div>`;
        } else {
            // 分页控制器（始终展示统计与翻页器）
            let pageButtonsHtml = '';
            // 上一页
            pageButtonsHtml += `<button class="page-pill" onclick="changeSearchPage(-1)" ${searchCurrentPage <= 1 ? 'disabled' : ''} title="${window.t('上一页')}">‹</button>`;

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
            pageButtonsHtml += `<button class="page-pill" onclick="changeSearchPage(1)" ${searchCurrentPage >= totalPages ? 'disabled' : ''} title="${window.t('下一页')}">›</button>`;

            html += `
            <div class="pagination-wrapper">
                <div class="pagination-info">
                    ${window.t('显示第 ')}<strong>${startIndex + 1}</strong> - <strong>${endIndex}</strong>${window.t(' 条 / 共 ')}<strong>${totalResults}</strong>${window.t(' 条 (每页 20 条)')}
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
        if (!pattern) return showToast(window.t('请输入搜索关键字！'), false);

        stopCurrentSearch();
        cachedSearchResults = [];
        searchCurrentPage = 1;
        $('#search-toolbar').hide();
        const plugin = $('#search-plugin').val();
        const category = $('#search-category').val();

        $('#search-results-container').html(`<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">${window.t('正在全网启动搜索，拉取检索结果中...')}</div>`);
        $('#search-status-bar').css('display', 'flex');
        $('#search-status-text').text(`${window.t('正在为 ')}“${pattern}”${window.t(' 检索中...')}`);

        $.post('/api/v2/search/start', { pattern: pattern, plugins: plugin, category: category }, function(res) {
            if (res && res.id) {
                searchId = res.id;
                if (searchRefreshTimer) clearInterval(searchRefreshTimer);
                searchRefreshTimer = setInterval(pollSearchResults, 1500);
            } else {
                $('#search-results-container').html(`<div style="text-align:center; padding:40px; color:var(--danger); font-size:14px;">${window.t('启动搜索失败，请确认 qBittorrent 中已启用 Python 搜索插件。')}</div>`);
            }
        });
    }

    function pollSearchResults() {
        if (!searchId) return;
        $.post('/api/v2/search/results', { id: searchId, limit: 500 }, function(res) {
            if (!res || !res.results) return;

            cachedSearchResults = res.results || [];
            renderSearchResultsUI();
            scheduleSearchStateSave();

            if (res.status === 'Stopped') {
                $('#search-status-text').text(`${window.t('搜索完成，共抓取 ')}${res.total || cachedSearchResults.length}${window.t(' 条资源')}`);
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
        scheduleSearchStateSave();
    }

    function addTorrentUrl(url, isMagnet) {
        $.ajax({
            url: '/api/v2/torrents/add',
            method: 'POST',
            data: { urls: url },
            dataType: 'text',
            success: function () {
                showToast(isMagnet ? window.t('✅ 磁力链接已成功添加，开始下载！') : window.t('✅ 已发送下载指令'));
                if (typeof pollFastData === 'function') pollFastData();
                // 稍后主动刷新任务列表，让新任务尽快出现
                setTimeout(function () {
                    if (typeof pollFastData === 'function') pollFastData();
                }, 2000);
            },
            error: function (xhr) {
                showToast(window.t('❌ 添加失败: ') + (xhr.statusText || window.t('网络错误')), false);
            }
        });
    }

    function addMagnetFromSearch(rawUrl) {
        const url = (rawUrl || '').trim();
        if (!url) {
            showToast(window.t('⚠️ 无效的下载链接'), false);
            return;
        }
        const isMagnet = /^magnet:\?/i.test(url);
        const isTorrentFile = /^https?:\/\/.+/i.test(url) && /\.torrent($|\?)/i.test(url);
        if (isMagnet || isTorrentFile) {
            addTorrentUrl(url, isMagnet);
            return;
        }
        // 下载页链接无法被 qBittorrent 直接解析（实测返回 200 但不创建任务）：
        // 先通过代理解析页面提取磁力 / .torrent 链接，再尝试添加。
        showToast(window.t('正在解析下载页，提取磁力链接...'));
        $.ajax({
            url: '/api/v2/abit/resolve',
            method: 'POST',
            data: { url: url },
            dataType: 'json',
            success: function (res) {
                const candidates = (res && res.magnets && res.magnets.length)
                    ? res.magnets
                    : (res && res.torrents && res.torrents.length) ? res.torrents : [];
                if (candidates.length) {
                    addTorrentUrl(candidates[0], /^magnet:\?/i.test(candidates[0]));
                } else {
                    showToast(window.t('⚠️ 该资源为下载页链接，可能无法自动添加。已尝试添加，若任务未出现请用磁力链接手动添加。'), false);
                    addTorrentUrl(url, false);
                }
            },
            error: function () {
                showToast(window.t('⚠️ 该资源为下载页链接，可能无法自动添加。已尝试添加，若任务未出现请用磁力链接手动添加。'), false);
                addTorrentUrl(url, false);
            }
        });
    }

    // ---- Search results persistence (survives page refresh) ----
    const SEARCH_STATE_KEY = 'abit_search_state';
    let searchStateSaveTimer = null;

    function scheduleSearchStateSave() {
        if (searchStateSaveTimer) clearTimeout(searchStateSaveTimer);
        searchStateSaveTimer = setTimeout(saveSearchState, 600);
    }

    function saveSearchState() {
        try {
            const payload = {
                keyword: $('#search-keyword').val() || '',
                plugin: $('#search-plugin').val() || 'all',
                category: $('#search-category').val() || 'all',
                results: (cachedSearchResults || []).slice(0, 300),
                page: searchCurrentPage || 1,
                savedAt: Date.now()
            };
            localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(payload));
        } catch (e) { /* storage full or unavailable */ }
    }

    function restoreSearchState() {
        let saved = null;
        try {
            saved = JSON.parse(localStorage.getItem(SEARCH_STATE_KEY) || 'null');
        } catch (e) { return false; }
        if (!saved || !Array.isArray(saved.results) || saved.results.length === 0) return false;

        $('#search-keyword').val(saved.keyword || '');
        $('#search-plugin').val(saved.plugin || 'all');
        $('#search-category').val(saved.category || 'all');
        cachedSearchResults = saved.results;
        searchCurrentPage = saved.page || 1;
        renderSearchResultsUI();
        $('#search-toolbar').css('display', 'flex');
        $('#search-status-bar').css('display', 'flex');
        $('#search-status-text').text(`${window.t('已恢复上次检索结果')} (${saved.results.length}${window.t(' 条)')}`);
        return true;
    }

    // Restore previous search results once DOM is ready
    $(function () {
        restoreSearchState();
    });

    // Persist state when the page is about to be refreshed
    window.addEventListener('beforeunload', saveSearchState);
