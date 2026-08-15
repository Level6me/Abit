/**
 * @file i18n.js
 * @description Lightweight bilingual (zh/en) internationalization with localStorage persistence.
 *              Keys are the original Chinese strings; the en dictionary maps them to English.
 *              Language persists via localStorage 'abit_lang' and the header toggle button.
 */

(function () {
    const STORAGE_KEY = 'abit_lang';

    const EN_DICT = {
        // Header
        '总览': 'Overview',
        '常规速率': 'Normal',
        '备用速率': 'Alt Speed',
        '切换备用速度限制模式': 'Toggle alternative speed limits',
        '自动': 'Auto',
        '浅色': 'Light',
        '深色': 'Dark',
        '切换明暗主题': 'Toggle theme',
        '语言切换 / Language': 'Language',

        // Dashboard
        '↓ 实时下载速度': '↓ Download speed',
        '活跃下载: ': 'Active downloads: ',
        '↑ 实时上传速度': '↑ Upload speed',
        '活跃做种: ': 'Active seeds: ',
        '网络连接与 DHT': 'Connection & DHT',
        '连接中...': 'Connecting...',
        'DHT 节点: ': 'DHT nodes: ',
        '下载磁盘剩余': 'Free disk space',
        '累计传输: ↓ ': 'Total: ↓ ',
        '实时网络传输走势': 'Live transfer chart',
        '● 下载速率': '● Download',
        '● 上传速率': '● Upload',
        '📊 任务状态汇总': '📊 Task summary',
        '(点击快速跳转筛选)': '(click to filter)',
        '点击查看全部任务': 'View all tasks',
        '全部任务': 'All',
        '点击查看下载中任务': 'View downloading',
        '下载中': 'Downloading',
        '点击查看做种中任务': 'View seeding',
        '做种中': 'Seeding',
        '点击查看已完成任务': 'View completed',
        '已完成': 'Completed',
        '点击查看已暂停任务': 'View paused',
        '已暂停': 'Paused',

        // Torrents page
        '实时过滤名称 / Hash...': 'Filter by name / hash...',
        '📁 全部分类': '📁 All categories',
        '🕒 添加时间 (最新)': '🕒 Added (newest)',
        '🕒 添加时间 (最早)': '🕒 Added (oldest)',
        '🔤 任务名称 (A-Z)': '🔤 Name (A-Z)',
        '📦 文件体积 (大到小)': '📦 Size (large to small)',
        '📈 下载进度 (高到低)': '📈 Progress (high to low)',
        '⚡ 下载速度 (快到慢)': '⚡ Download speed',
        '⚡ 上传速度 (快到慢)': '⚡ Upload speed',
        '⏳ 剩余时间 (ETA)': '⏳ ETA',
        '🔄 分享率 (高到低)': '🔄 Ratio (high to low)',
        '切换卡片 / 表格视图': 'Toggle card / table view',
        '全部': 'All',
        '活动中': 'Active',
        '排队中': 'Queued',
        '错误': 'Error',
        '已选中 ': 'Selected ',
        ' 项': '',
        '▶ 恢复': '▶ Resume',
        '⏸ 暂停': '⏸ Pause',
        '🔍 重新校验': '🔍 Recheck',
        '🔄 重新下载': '🔄 Redownload',
        '🏷 分类': '🏷 Category',
        '🗑 删除': '🗑 Delete',
        '取消选择': 'Clear selection',
        '正在与 qBittorrent 通信加载任务中...': 'Loading torrents from qBittorrent...',
        '新建任务': 'New torrent',

        // Search page
        '🔍 资源全网检索': '🔍 Search',
        '🧩 搜索插件管理': '🧩 Search plugins',
        '输入搜索关键字 (如 Ubuntu, Debian, Linux, Movie)...': 'Enter keywords (e.g. Ubuntu, Debian, Linux, Movie)...',
        '🌐 全部已安装插件': '🌐 All installed plugins',
        '⚡ 已启用插件': '⚡ Enabled plugins',
        '全部类型': 'All categories',
        '电影': 'Movies',
        '剧集': 'TV',
        '音乐': 'Music',
        '软件': 'Software',
        '游戏': 'Games',
        '动漫': 'Anime',
        '搜索进行中...': 'Searching...',
        '停止搜索': 'Stop',
        '为什么搜索不到资源？': 'Why no results?',
        '🔍 搜索插件管理': '🔍 Search plugins',
        '检索结果: 0 条': 'Results: 0',
        '排序:': 'Sort:',
        '👥 做种数': '👥 Seeds',
        '📦 体积': '📦 Size',
        '下载': 'Download',
        '做种: ': 'Seeds: ',
        '吸血: ': 'Leeches: ',
        '来源: ': 'Source: ',
        '正在检索全网结果，请稍候...': 'Searching the web, please wait...',
        '上一页': 'Previous page',
        '下一页': 'Next page',
        '正在全网启动搜索，拉取检索结果中...': 'Starting search, fetching results...',
        '启动搜索失败，请确认 qBittorrent 中已启用 Python 搜索插件。': 'Failed to start search. Please enable Python search plugins in qBittorrent.',
        '请输入搜索关键字！': 'Please enter a search keyword!',
        '✅ 磁力链接已成功添加，开始下载！': '✅ Magnet link added, download started!',
        '⚠️ 该资源为下载页链接，可能无法自动添加。已尝试添加，若任务未出现请用磁力链接手动添加。': '⚠️ This result links to a download page. Tried to add it anyway; if no task appears, add the magnet link manually.',
        '⚠️ 无效的下载链接': '⚠️ Invalid download link',
        '❌ 添加失败: ': '❌ Add failed: ',
        '✅ 已发送下载指令': '✅ Download command sent',
        '暂未安装任何搜索插件。请从下方常用插件库一键安装。': 'No search plugins installed. Install one from the presets below.',
        '卸载插件': 'Uninstall plugin',
        '🌐 全部插件': '🌐 All plugins',
        '网络错误': 'Network error',
        '第': 'page ',
        ' 条': '',
        ' 页': '',
        '显示第 ': 'Showing ',
        ' 条 / 共 ': ' of ',
        ' 条 (每页 20 条)': ' (20 per page)',
        '正在为 ': 'Searching for ',
        ' 检索中...': ' ...',
        '搜索完成，共抓取 ': 'Search complete, ',
        ' 条资源': ' results',
        '已恢复上次检索结果': 'Restored previous search results',
        '✓ 已安装': '✓ Installed',
        '+ 一键安装': '+ Install',
        '插件安装请求已发送，正在同步中': 'Plugin install request sent, syncing...',
        '安装失败，请确认服务器已安装 Python3': 'Install failed. Make sure Python3 is installed on the server',
        '所有推荐插件均已安装完毕！': 'All recommended plugins are installed!',
        '正在批量安装 ': 'Installing ',
        ' 个优质检索插件...': ' search plugins...',
        '批量插件安装指令已发出，正在同步...': 'Batch install command sent, syncing...',
        '批量安装请求失败，请检查网络连接': 'Batch install failed, check network',
        '正在检查并更新搜索插件...': 'Checking for plugin updates...',
        '插件更新指令已发送，正在拉取最新版本': 'Update command sent, fetching latest versions',
        '更新指令发送失败': 'Update command failed',
        '请输入有效的插件 URL': 'Please enter a valid plugin URL',
        '自定义插件安装指令已发出': 'Custom plugin install command sent',
        '已启用': 'Enabled',
        '已禁用': 'Disabled',
        '已卸载插件: ': 'Uninstalled plugin: ',
        '启用插件': 'Enable plugin',
        '卸载': 'Uninstall',
        '已激活备用限速模式': 'Alternative speed limit activated',
        '已恢复常规全局全速模式': 'Global full speed restored',
        '已在线': 'Online',
        '离线/未登入': 'Offline / Not logged in',
        '🟢 连接就绪': '🟢 Connected',
        '🟡 处于防火墙后': '🟡 Firewalled',
        '🔴 未连接': '🔴 Disconnected',
        '名称': 'Name',
        '输入关键字开始全网检索种子资源': 'Enter keywords to search torrents',
        '正在解析下载页，提取磁力链接...': 'Resolving download page, extracting magnet link...',
        '系统': 'System',
        '搜索': 'Search',
        '任务': 'Torrents',
        'RSS': 'RSS',
    };

    let currentLang = 'zh';
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'zh') currentLang = saved;
    } catch (e) { /* storage unavailable */ }

    window.t = function (key, fallback) {
        if (currentLang === 'en' && EN_DICT[key] !== undefined) return EN_DICT[key];
        return fallback !== undefined ? fallback : key;
    };

    window.currentLang = function () { return currentLang; };

    function applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            el.textContent = window.t(key, el.textContent);
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-ph');
            el.setAttribute('placeholder', window.t(key, el.getAttribute('placeholder') || key));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-title');
            el.setAttribute('title', window.t(key, el.getAttribute('title') || key));
        });
        document.querySelectorAll('[data-i18n-opt]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-opt');
            el.textContent = window.t(key, el.textContent);
        });
    }

    window.setLang = function (lang) {
        currentLang = (lang === 'en') ? 'en' : 'zh';
        try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* ignore */ }
        const html = document.documentElement;
        if (html) html.setAttribute('lang', currentLang === 'en' ? 'en' : 'zh-CN');
        const label = document.getElementById('lang-label');
        if (label) label.textContent = currentLang === 'en' ? 'EN / 中' : '中 / EN';
        applyI18n();
        if (window.onLanguageChanged) window.onLanguageChanged(currentLang);
    };

    // Toggle between zh <-> en and persist the chosen language immediately.
    window.toggleLang = function () {
        const next = (currentLang === 'en') ? 'zh' : 'en';
        window.setLang(next);
        const name = next === 'en' ? 'English' : '简体中文';
        if (window.showToast) {
            window.showToast('🌐 Language: ' + name + ' / 语言: ' + name);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.setLang(currentLang);
        });
    } else {
        window.setLang(currentLang);
    }
})();
