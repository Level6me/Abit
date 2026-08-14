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
