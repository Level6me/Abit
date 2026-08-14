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
            const isInstalled = installedPlugins.some(p => p.name.toLowerCase() === preset.name.toLowerCase() || (p.fullName && p.fullName.toLowerCase().includes(preset.name.toLowerCase())));
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
            setTimeout(fetchSearchPlugins, 2000);
        }).fail(function() {
            showToast('安装失败，请确认服务器已安装 Python3', false);
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

        $('#search-count-label').text(`检索结果: ${list.length} 条`);
        if (list.length > 0) {
            $('#search-toolbar').css('display', 'flex');
        } else {
            $('#search-toolbar').hide();
        }

        let html = '';
        list.forEach(item => {
            const sizeFormatted = formatBytes(item.fileSize);
            html += `
            <div class="card" style="padding:14px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:700; font-size:14px; line-height:1.35; word-break:break-all;" title="${escapeHtml(item.fileName)}">${escapeHtml(item.fileName)}</div>
                        <div style="font-size:12px; color:var(--text-sec); margin-top:4px;">
                            📦 ${sizeFormatted} · 👤 做种: <span style="color:var(--success); font-weight:700;">${item.nbSeeders}</span> · 吸血: ${item.nbLeechers} · 来源: ${escapeHtml(item.siteUrl || '插件')}
                        </div>
                    </div>
                    <button class="btn" style="padding:8px 16px; font-size:12px; flex-shrink:0;" onclick="addMagnetFromSearch('${escapeHtml(item.fileUrl)}')">下载</button>
                </div>
            </div>`;
        });

        if (list.length === 0) {
            html = '<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">正在检索全网结果，请稍候...</div>';
        }

        $('#search-results-container').html(html);
    }

    function triggerSearch() {
        const pattern = $('#search-keyword').val().trim();
        if (!pattern) return showToast('请输入搜索关键字！', false);

        stopCurrentSearch();
        cachedSearchResults = [];
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
        $.post('/api/v2/search/results', { id: searchId, limit: 100 }, function(res) {
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
