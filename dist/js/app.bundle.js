/**
 * Apple Torrent Dashboard (Torrent Omni) — Bundled Application Logic
 */

// --- [Module: i18n.js] ---
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
        // ===== Full UI dictionary (settings / rss / modals / details) =====
        ' 项': '',
        '(分配分类: 无)': '(Category: None)',
        '(无分类)': '(No category)',
        '(清除分类)': '(Clear category)',
        '+ 安装自定义插件': '+ Install custom plugin',
        '+ 新增分类': '+ New category',
        '+ 新建规则': '+ New rule',
        '+ 添加订阅源': '+ Add feed',
        'Feed 文章': 'Feed articles',
        'IP 封禁时长 (秒)': 'Ban duration (seconds)',
        'RSS 订阅链接 URL (https://...)': 'RSS feed URL (https://...)',
        'UPnP / NAT-PMP 端口映射': 'UPnP / NAT-PMP port mapping',
        'WebAPI 版本': 'WebAPI version',
        'WebUI 登录用户名': 'WebUI username',
        'WebUI 监听端口': 'WebUI port',
        'plugin_diagnostic_text': 'qBittorrent search relies on the server-side <b>Python Search Plugins</b>. If your server was just installed or plugins are disabled, no results will be returned. Switch to the <b>“🧩 Search plugins”</b> tab above to install or enable popular public index plugins (Python3 is required on the server).',
        'qBittorrent Alternative WebUI (纯前端沙箱)': 'qBittorrent Alternative WebUI (pure front-end sandbox)',
        'qBittorrent 身份验证': 'qBittorrent Authentication',
        'redownload_confirm_text': 'Are you sure you want to clear downloaded files and re-download the selected torrents?<br><span style="color:var(--warning); font-size:12px;">The app will export torrent/magnet parameters, clear local files and re-download from 0%.</span>',
        '⏸ 暂停做种任务': '⏸ Pause seeding',
        '■ 下载中': '■ Downloading',
        '■ 已完成': '■ Completed',
        '■ 未下载': '■ Not downloaded',
        '⚡ 一键安装常用公开检索插件': '⚡ One-click install popular public search plugins',
        '⚡ 上传速度 (快到慢)': '⚡ Upload speed',
        '⚡ 自动下载规则 (Rules)': '⚡ Auto-download rules',
        '⚡ 速率与计划': '⚡ Speed & schedule',
        '⚡ 速率与计划限制 (KB/s)': '⚡ Speed limit (KB/s)',
        '一键为所有任务批量补充 Trackers': 'Add trackers to all torrents in one click',
        '上传限制 KB/s': 'Upload limit KB/s',
        '下载完成前将文件存放于独立临时路径': 'Keep incomplete files in a separate temporary path',
        '下载开始时立即为整个文件分配磁盘空间，防止空间不足与碎片': 'Allocate the full disk space at download start to avoid fragmentation',
        '下载限制 KB/s': 'Download limit KB/s',
        '专用保存子路径 (可选)': 'Save sub-path (optional)',
        '严重 Critical': 'Critical',
        '中 / EN': '中 / EN',
        '为多文件任务自动创建子文件夹': 'Create a subfolder for multi-file torrents',
        '为未完成的文件添加 .!qB 扩展名': 'Append .!qB to incomplete files',
        '仅删除任务 (保留硬盘文件)': 'Delete torrent only (keep files)',
        '仅周末 (Sat-Sun)': 'Weekends (Sat-Sun)',
        '仅工作日 (Mon-Fri)': 'Weekdays (Mon-Fri)',
        '仅强制重新校验 (不删本地文件)': 'Force recheck only (keep files)',
        '优先加密 (Prefer)': 'Prefer encryption',
        '会话超时时间 (分钟)': 'Session timeout (minutes)',
        '传入连接监听端口 (Listening Port)': 'Listening port (incoming)',
        '传输数据加密模式': 'Encryption mode',
        '例如: /home/ubuntu/Downloads': 'e.g. /home/ubuntu/Downloads',
        '例如: /home/ubuntu/Downloads/temp': 'e.g. /home/ubuntu/Downloads/temp',
        '例如: 2.0': 'e.g. 2.0',
        '例如: 3': 'e.g. 3',
        '例如: 3600': 'e.g. 3600',
        '例如: 5': 'e.g. 5',
        '例如: 6881 或随机端口': 'e.g. 6881 or random port',
        '例如: 8': 'e.g. 8',
        '例如: 8080': 'e.g. 8080',
        '保存子路径 (可选)：': 'Save sub-path (optional):',
        '保存规则': 'Save rule',
        '信息 Info': 'Info',
        '先下载首尾区块': 'Download first and last pieces first',
        '全局最大上传槽数': 'Global max upload slots',
        '全局最大连接数': 'Global max connections',
        '全部级别': 'All levels',
        '内核实时日志': 'Kernel live logs',
        '内核版本': 'Kernel version',
        '再次输入新密码': 'Re-enter new password',
        '分类名称 (如 Movies, Anime, TV)': 'Category name (e.g. Movies, Anime, TV)',
        '创建分类': 'Create category',
        '删除确认': 'Confirm delete',
        '加载 Peers 节点中...': 'Loading peers...',
        '加载 Trackers 中...': 'Loading trackers...',
        '加载文件树中...': 'Loading file tree...',
        '加载日志中...': 'Loading logs...',
        '包含关键字 (支持正则)': 'Contains (regex supported)',
        '区块加载中...': 'Loading pieces...',
        '单次批量向当前所有种子任务注入最新可用 Tracker 列表（支持换行隔开多个 URL）：': 'Inject the latest available tracker list into all current torrents (separate URLs with newlines):',
        '取消': 'Cancel',
        '启用 DHT 网络 (Distributed Hash Table)': 'Enable DHT network',
        '启用 LSD (本地用户发现 / Local Peer Discovery)': 'Enable LSD (local peer discovery)',
        '启用 PeX (用户交换 / Peer Exchange)': 'Enable PeX (peer exchange)',
        '启用任务排队管理 (Torrent Queueing)': 'Enable torrent queueing',
        '启用备用速率计划调度': 'Enable alternative speed schedule',
        '启用未完成文件临时保存目录': 'Enable incomplete-file temp directory',
        '在指定时间段内自动激活备用限速策略': 'Automatically activate alt speed limits during the scheduled window',
        '在目标目录中以种子名称创建单独的目录保存': 'Create a separate folder per torrent in the target directory',
        '备用上传速度限制': 'Alt upload limit',
        '备用上传限制 KB/s': 'Alt upload limit KB/s',
        '备用下载速度限制': 'Alt download limit',
        '备用下载限制 KB/s': 'Alt download limit KB/s',
        '安装插件': 'Install plugin',
        '安装自定义搜索插件': 'Install custom search plugin',
        '密码': 'Password',
        '对 uTP (Micro Transport Protocol) 应用上传/下载限制': 'Apply limits to uTP connections',
        '对本地主机及子网客户端跳过身份验证': 'Skip auth for local host & subnet clients',
        '将传输开销计入限速': 'Include transfer overhead in limits',
        '已保存的任务分类': 'Saved categories',
        '已订阅 RSS 列表': 'Subscribed RSS feeds',
        '常规全局上传限制 (0 为不限)': 'Global upload limit (0 = unlimited)',
        '常规全局下载限制 (0 为不限)': 'Global download limit (0 = unlimited)',
        '应用分类': 'Apply category',
        '开启后局域网访问无需输入密码；若需强制登录请关闭此项': 'LAN access needs no password; turn off to force login',
        '开始下载': 'Start download',
        '强制加密 (Require)': 'Require encryption',
        '当分享率达到阈值时自动暂停或移除': 'Auto pause/remove when ratio threshold is reached',
        '当前 WebUI 模式': 'Current WebUI mode',
        '彻底删除任务及本地文件': 'Delete torrent and files',
        '您确定要删除选中的任务吗？请选择是否同时删除本地下载的文件：': 'Delete the selected torrents? Choose whether to also delete local files:',
        '或输入 Magnet 磁力链接 / HTTP 种子 URL (支持换行多个)：': 'Or paste Magnet / HTTP torrent URLs (multiple per line):',
        '批量设置分类': 'Set category (batch)',
        '指定分类：': 'Category:',
        '按顺序下载 (边下边播)': 'Sequential download',
        '排除关键字 (支持正则)': 'Excludes (regex supported)',
        '新增 RSS 自动下载规则': 'New RSS auto-download rule',
        '新密码 (留空则不修改密码)': 'New password (leave blank to keep)',
        '新建任务分类': 'New torrent category',
        '方便识别和避免未完成文件被其他软件误读': 'Marks incomplete files so other apps ignore them',
        '无 Tracker 查找更多节点（公网资源推荐开启，PT 任务会自动隔离）': 'Discover peers without trackers (recommended for public; auto-isolated for PT)',
        '普通 Normal': 'Normal',
        '最大下载中任务数': 'Max active downloads',
        '最大做种中任务数': 'Max active uploads',
        '最大总活跃任务数': 'Max total active torrents',
        '未完成临时目录路径 (Incomplete Save Path)': 'Incomplete save path',
        '每个任务最大上传槽数': 'Max upload slots per torrent',
        '每个任务最大连接数': 'Max connections per torrent',
        '每天 (Every Day)': 'Every day',
        '添加 RSS 订阅源': 'Add RSS feed',
        '添加 Torrent 种子 / Magnet': 'Add torrent / magnet',
        '添加订阅': 'Add',
        '点击直接为您的 qBittorrent 安装官方与社区主流的 BT 索引引擎：': 'Click to install popular official & community BT index engines for qBittorrent:',
        '生效周期': 'Schedule days',
        '用户名 (默认: admin)': 'Username (default: admin)',
        '留空使用默认路径': 'Leave empty for default path',
        '留空则保持当前用户名 (如: admin)': 'Leave blank to keep current username (e.g. admin)',
        '登录失败尝试封禁次数': 'Login failure ban threshold',
        '登录进入面板': 'Log in',
        '目标分享率 (Ratio)': 'Target ratio',
        '确认新密码': 'Confirm new password',
        '确认重新下载 (清除文件从头重下)': 'Confirm redownload (clear files and restart)',
        '禁用加密 (Disable)': 'Disable encryption',
        '种子详情': 'Torrent details',
        '立即开始下载': 'Download now',
        '管理 qBittorrent 调用的 Python 搜索索引引擎与爬虫脚本': 'Manage the Python search engines and crawlers used by qBittorrent',
        '自动下载规则': 'Auto-download rules',
        '自动发现同一局域网下的做种客户端': 'Discover seeding clients on the same LAN',
        '自动请求路由器转发端口': 'Automatically request router port forwarding',
        '规则名称 (如: Linux Releases)': 'Rule name (e.g. Linux Releases)',
        '警告 Warning': 'Warning',
        '订阅名称 / 文件夹路径 (可选)': 'Feed name / folder path (optional)',
        '记住凭据': 'Remember credentials',
        '请输入 qBittorrent WebUI 用户名与密码：': 'Enter your qBittorrent WebUI username and password:',
        '输入 Python 插件脚本的在线 URL (以 .py 结尾或 GitHub 裸链) 或本地路径：': 'Enter the Python plugin script URL (ending in .py or a GitHub raw link) or a local path:',
        '输入新密码': 'Enter new password',
        '达到指定分享率后自动停止做种': 'Stop seeding after reaching the target ratio',
        '达成后操作': 'Action after reaching',
        '选择为所选任务应用的目标分类：': 'Choose the target category to apply to the selected torrents:',
        '选择本地 .torrent 种子文件：': 'Choose local .torrent files:',
        '通过已连接节点发现更多同伴': 'Discover more peers through connected nodes',
        '重新下载确认': 'Confirm redownload',
        '防止运营商流量特征干扰': 'Prevent ISP traffic-shaping interference',
        '限制 TCP/IP 协议握手及传输开销': 'Apply limits to TCP/IP handshake & transfer overhead',
        '限制 uTP 协议连接速度': 'Limit uTP connection speed',
        '限制同时运行的最大活跃任务数': 'Limit the number of concurrently active torrents',
        '限速生效时段': 'Active time window',
        '预分配所有磁盘空间 (Pre-allocate Disk Space)': 'Pre-allocate disk space',
        '默认: 100': 'Default: 100',
        '默认: 4': 'Default: 4',
        '默认: 500': 'Default: 500',
        '默认: 60 分钟': 'Default: 60 minutes',
        '默认: 8': 'Default: 8',
        '默认下载保存路径 (Default Save Path)': 'Default save path',
        '默认密码可查阅日志': 'Default password is shown in the logs',
        '🌍 全局Tracker': '🌍 Global trackers',
        '🌐 全局批量添加 Trackers': '🌐 Add trackers globally',
        '🌐 网络与连接': '🌐 Network & connections',
        '🌐 网络连接与端口配置': '🌐 Network & port configuration',
        '🎯 BitTorrent、做种与排队规则': '🎯 BitTorrent, seeding & queueing',
        '🎯 做种与BT': '🎯 Seeding & BT',
        '👥 Peers 节点': '👥 Peers',
        '💾 保存做种与排队配置': '💾 Save seeding & queueing',
        '💾 保存存储配置': '💾 Save storage settings',
        '💾 保存网络连接配置': '💾 Save network settings',
        '💾 保存账户与安全配置': '💾 Save account & security',
        '💾 保存速率配置': '💾 Save speed settings',
        '📁 存储与下载': '📁 Storage & downloads',
        '📁 存储路径与下载行为': '📁 Storage paths & behavior',
        '📄 文件树 (Files)': '📄 Files',
        '📋 复制日志': '📋 Copy logs',
        '📜 运行日志': '📜 Logs',
        '📡 RSS 订阅源 (Feeds)': '📡 RSS feeds',
        '🔍 过滤日志关键字...': '🔍 Filter logs...',
        '🔐 修改 WebUI 登录账户与凭据': '🔐 Change WebUI login credentials',
        '🗑 移除种子任务': '🗑 Remove torrents',
        '🚀 一键安装全部推荐': '🚀 Install all recommended',
        '🚪 退出当前登录 (Logout)': '🚪 Logout',
        '🛡️ WebUI 账户密码与安全配置': '🛡️ WebUI credentials & security',
        '🛡️ 账户与安全': '🛡️ Account & security',
        '🧩 已安装的搜索插件 (Search Plugins)': '🧩 Installed search plugins',
        '🧱 下载区块 (Pieces)': '🧱 Pieces',
        '❌ 两次输入的新密码不一致，请重新核对！': '❌ New passwords do not match!',
        '✅ 系统配置与安全凭据已全量保存！': '✅ All system settings & credentials saved!',
        '保存配置失败，请检查网络或权限': 'Failed to save settings, check network or permissions',
        '暂无日志记录可复制': 'No logs to copy',
        '✅ 已复制全部日志到剪贴板！': '✅ All logs copied to clipboard!',
        '复制失败，请手动选择复制': 'Copy failed, select and copy manually',
        '暂无日志记录': 'No logs',
        '暂无订阅源，请点击上方按钮添加 RSS 订阅 URL': 'No feeds yet. Add an RSS URL using the button above',
        'URL: ': 'URL: ',
        '文章数: ': 'articles: ',
        '浏览文章': 'Browse',
        '刷新': 'Refresh',
        '删除订阅源': 'Delete feed',
        '共 ': 'total ',
        ' 篇)': ')',
        '发布时间: ': 'Published: ',
        '已发起 RSS 订阅源刷新请求！': 'RSS refresh requested!',
        '已发起全部 RSS 订阅刷新！': 'All RSS feeds refresh requested!',
        '确定要删除 RSS 订阅源 ': 'Delete RSS feed ',
        ' 吗？': '?',
        '已删除订阅源': 'Feed deleted',
        '请输入有效的 RSS 订阅链接！': 'Please enter a valid RSS feed URL!',
        '已添加 RSS 订阅源': 'RSS feed added',
        '暂无自动下载规则': 'No auto-download rules',
        '包含: ': 'Contains: ',
        '排除: ': 'Excludes: ',
        '· 分类: ': '· Category: ',
        '所有': 'All',
        '无': 'None',
        '删除规则': 'Delete rule',
        '请输入规则名称！': 'Please enter a rule name!',
        '已保存自动下载规则': 'Auto-download rule saved',
        '确定要删除规则 ': 'Delete rule ',
        '已删除规则': 'Rule deleted',
        '暂无分类数据': 'No categories',
        '请输入分类名称！': 'Please enter a category name!',
        '已成功创建分类': 'Category created',
        '当前筛选条件下无任务记录': 'No torrents match the current filter',
        '做种: ': 'Seeds: ',
        '节点: ': 'Peers: ',
        '比率: ': 'Ratio: ',
        '默认路径': 'Default path',
        '详情': 'Details',
        '重新下载': 'Redownload',
        '恢复': 'Resume',
        '暂停': 'Pause',
        '删除': 'Delete',
        '状态': 'Status',
        '大小': 'Size',
        '进度': 'Progress',
        '下载速度': 'Download speed',
        '上传速度': 'Upload speed',
        '做种/节点': 'Seeds/Peers',
        '分享率': 'Ratio',
        '操作': 'Actions',
        '已发起重新校验并启动检查': 'Recheck requested',
        '已对 ': 'Recheck requested for ',
        ' 个任务发起强制重新校验': ' torrents',
        '确定要清空已下载文件并从头重新下载 ': 'Clear files and re-download ',
        '系统将自动备份种子参数，清除已下载本地文件，并从 0% 重新发起下载。': 'The app will back up torrent parameters, clear local files and re-download from 0%.',
        '确定要对选中的 ': 'Re-download the selected ',
        ' 个任务进行从头重新下载吗？': ' torrents from scratch?',
        '系统将清除已下载本地文件，并从 0% 重新发起下载。': 'The app will clear local files and re-download from 0%.',
        '正在准备重新下载任务...': 'Preparing to re-download...',
        '✅ 已成功重置并从头重新下载 ': '✅ Successfully re-downloaded ',
        ' 个任务！': ' torrents!',
        '批量操作已完成': 'Batch operation completed',
        '确定要删除任务 ': 'Delete torrent ',
        ' 吗？<br>请选择仅删除任务或连同本地文件一起删除：': '?<br>Choose whether to also delete local files:',
        '确定要批量删除选中的 ': 'Delete the selected ',
        ' 个任务吗？<br>请选择仅删除任务或连同本地文件一起删除：': ' torrents?<br>Choose whether to also delete local files:',
        '任务已成功删除': 'Torrents deleted',
        '暂无文件树数据': 'No file tree data',
        '不下载': 'Skip',
        '常规优先级': 'Normal priority',
        '高优先级': 'High priority',
        '最高优先级': 'Maximum priority',
        '暂无 Trackers': 'No trackers',
        '添加 Tracker URL (udp://...)': 'Add tracker URL (udp://...)',
        '+ 添加': '+ Add',
        '状态: ': 'Status: ',
        '运行中': 'Running',
        '工作正常': 'Working',
        '已就绪': 'Ready',
        '暂无连接节点': 'No peers',
        '暂无连接节点 (Peers: 0)': 'No peers (0)',
        '当前在线 Peers 节点: ': 'Online peers: ',
        ' 个': '',
        '第 ': 'Page ',
        ' 页': '',
        '未知客户端': 'Unknown client',
        '进度: ': 'Progress: ',
        '传输中': 'Transferring',
        '连接空闲': 'Idle',
        '已更新文件下载优先级': 'File priority updated',
        '总区块: ': 'Total pieces: ',
        ' · 已下载: ': ' · Downloaded: ',
        '未下载': 'Not downloaded',
        '区块 #': 'Piece #',
        '请输入有效的 Tracker URL 列表！': 'Please enter a valid tracker URL list!',
        '当前没有运行中的任务！': 'No running torrents!',
        '已成功为全部 ': 'Successfully added trackers to all ',
        ' 个任务批量追加 Tracker！': ' torrents!',
        '批量 Tracker 请求已发送！': 'Batch tracker request sent!',
        'Tracker 追加成功！': 'Tracker added!',
        '请选择 .torrent 种子文件或填入 Magnet 磁力链接！': 'Choose a .torrent file or paste a magnet link!',
        '任务已成功添加至 qBittorrent！': 'Torrent added to qBittorrent!',
        '发送种子失败，请检查网络或重新登录！': 'Failed to add torrent, check network or re-login!',
        '⚠️ 请输入完整的 WebUI 用户名与密码': '⚠️ Please enter both WebUI username and password',
        '正在核验中...': 'Verifying...',
        '✅ 身份验证通过，已成功登录！': '✅ Authentication passed, logged in!',
        '❌ 用户名或密码错误，请核对后重试！': '❌ Wrong username or password, try again!',
        '❌ 登录失败：用户名或密码错误 / 尝试过多被临时锁定': '❌ Login failed: wrong credentials / temporarily locked after too many attempts',
        '❌ 连接 qBittorrent 登录接口失败 (': '❌ Failed to reach qBittorrent login API (',
        '已退出登录': 'Logged out',
        '未登录 / 需鉴权': 'Not logged in / auth required',
        '下载 (KB/s)': 'Download (KB/s)',
        '上传 (KB/s)': 'Upload (KB/s)',
        '星期日': 'Sunday',
        '星期一': 'Monday',
        '星期二': 'Tuesday',
        '星期三': 'Wednesday',
        '星期四': 'Thursday',
        '星期五': 'Friday',
        '星期六': 'Saturday',
        '秒': 's',
        '分': 'm',
        '时': 'h',
        '天': 'd',
        '错误/文件丢失': 'Error / missing files',
        '获取元数据': 'Fetching metadata',
        '分配磁盘空间': 'Allocating disk',
        '校验中': 'Checking',
        '强制下载': 'Forced download',
        '等待下载': 'Stalled',
        '排队下载': 'Queued download',
        '下载暂停': 'Paused download',
        '强制做种': 'Forced seed',
        '做种空闲': 'Stalled seed',
        '排队做种': 'Queued seed',
        '做种暂停 (已完成)': 'Paused seed (complete)',
        '📥 松开鼠标以添加 Torrent 种子文件': '📥 Release to add torrent files',
        '🔄 检查更新': '🔄 Check updates',
        '🔄 刷新全部': '🔄 Refresh all',
        '🔄 刷新': '🔄 Refresh',
        '加载插件列表中...': 'Loading plugins...',
        '🏷️ 分类管理 (Categories)': '🏷️ Categories',
        '加载 RSS 订阅源中...': 'Loading RSS feeds...',
        '加载自动规则中...': 'Loading rules...',
        '加载分类数据中...': 'Loading categories...',
        '正在向 qBittorrent 发送插件安装指令...': 'Sending plugin install command to qBittorrent...',
        '正在检查并更新所有搜索插件...': 'Checking and updating all search plugins...',
        '已发起插件在线更新': 'Plugin online update requested',
        '检索结果: ': 'Results: ',
        ' 条)': ')',
        '已更新所选任务分类': 'Category updated',
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
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-html');
            el.innerHTML = window.t(key, el.innerHTML);
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

// --- [Module: constants.js] ---
/**
 * @file constants.js
 * @description Global constants, preset search plugins repository and definitions
 */

// Popular Preset Search Plugins Repository (100% Verified Working URLs)
    const PRESET_PLUGINS = [
        { name: 'The Pirate Bay', desc: 'Classic public torrent index (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/piratebay.py' },
        { name: 'BitSearch', desc: 'High-speed DHT index engine (community)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/bitsearch.py' },
        { name: 'SolidTorrents', desc: 'Clean ad-free DHT search engine (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/solidtorrents.py' },
        { name: 'EZTV', desc: 'TV series release tracker (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/eztv.py' },
        { name: 'LimeTorrents', desc: 'Long-running public BT index (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/limetorrents.py' },
        { name: 'TorrentGalaxy', desc: 'High-quality media aggregation (community)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/torrentgalaxy.py' },
        { name: 'Nyaa', desc: 'Japanese anime / ACG / OST hub (community)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/nyaa.py' },
        { name: 'BT4G', desc: 'Chinese hot content & magnet DHT index (community)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/bt4g.py' },
        { name: 'TorLock', desc: 'Verified / no-fake torrent index (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/torlock.py' },
        { name: 'KickassTorrents', desc: 'Classic KAT resource index (community)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/kickasstorrents.py' },
        { name: 'TorrentProject', desc: 'Meta-search aggregation engine (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/torrentproject.py' },
        { name: 'TorrentCSV', desc: 'Open-source decentralized offline seed library (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/torrentscsv.py' },
        { name: 'RARBG Dump', desc: 'RARBG classic movie/TV archive (community)', url: 'https://raw.githubusercontent.com/LightDestory/qBittorrent-Search-Plugins/master/src/engines/rarbg.py' },
        { name: 'Jackett', desc: 'Multi-source tracker proxy & private index (official)', url: 'https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/jackett.py' }
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
        if (seconds < 60) return `${seconds}${t('秒')}`;
        const m = Math.floor(seconds / 60);
        if (m < 60) return `${m}${t('分')} ${seconds % 60}${t('秒')}`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}${t('时')} ${m % 60}${t('分')}`;
        const d = Math.floor(h / 24);
        return `${d}${t('天')} ${h % 24}${t('时')}`;
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
        let stateName = t('已暂停');

        if (isError) {
            stateClass = 'error';
            stateName = t('错误/文件丢失');
        } else if (state === 'metadl') {
            stateClass = 'downloading';
            stateName = t('获取元数据');
        } else if (state === 'allocating') {
            stateClass = 'downloading';
            stateName = t('分配磁盘空间');
        } else if (isChecking) {
            stateClass = 'queued';
            stateName = t('校验中');
        } else if (state === 'downloading' || state === 'forceddl') {
            stateClass = 'downloading';
            stateName = state === 'forceddl' ? t('强制下载') : t('下载中');
        } else if (state === 'stalleddl') {
            stateClass = 'downloading';
            stateName = t('等待下载');
        } else if (state === 'queueddl') {
            stateClass = 'queued';
            stateName = t('排队下载');
        } else if (state === 'pauseddl') {
            stateClass = 'paused';
            stateName = t('下载暂停');
        } else if (state === 'uploading' || state === 'forcedup') {
            stateClass = 'completed';
            stateName = state === 'forcedup' ? t('强制做种') : t('做种中');
        } else if (state === 'stalledup') {
            stateClass = 'completed';
            stateName = t('做种空闲');
        } else if (state === 'queuedup') {
            stateClass = 'queued';
            stateName = t('排队做种');
        } else if (state === 'pausedup') {
            stateClass = 'paused';
            stateName = t('做种暂停 (已完成)');
        } else if (isCompleted) {
            stateClass = 'completed';
            stateName = t('已完成');
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
                        label: t('下载 (KB/s)'),
                        data: Array(20).fill(0),
                        borderColor: '#34c759',
                        backgroundColor: 'rgba(52,199,89,0.08)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0
                    },
                    {
                        label: t('上传 (KB/s)'),
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
            container.html(`<div style="text-align:center; padding:60px 20px; color:var(--text-sec); font-size:14px;">${t('当前筛选条件下无任务记录')}</div>`);
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
            const etaStr = (status.isCompleted || status.isSeeding) ? (status.isSeeding ? t('做种中') : t('已完成')) : (status.isPaused ? t('已暂停') : formatEta(t.eta));
            const seedsText = `${t('做种: ')}${t.num_seeds || 0} (${t.num_complete || 0}) · ${t('节点: ')}${t.num_leechs || 0} (${t.num_incomplete || 0})`;

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
                    <span>${t.category ? `<span class="badge category">🏷 ${escapeHtml(t.category)}</span> ` : ''}${t('比率: ')}${ratioVal}</span>
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
                    <div class="torrent-save-path" title="${escapeHtml(t.save_path || t('默认路径'))}">
                        📁 ${escapeHtml(t.save_path || t('默认路径'))}
                    </div>
                    <div class="torrent-btns">
                        <button class="icon-btn" title="${t('详情')}" onclick="event.stopPropagation(); openTorrentDetail('${hash}')">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </button>
                        <button class="icon-btn accent" title="${t('重新下载')}" onclick="event.stopPropagation(); redownloadTorrent('${hash}')">
                            <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                        </button>
                        <button class="icon-btn" title="${status.isPaused ? t('恢复') : t('暂停')}" onclick="event.stopPropagation(); torrentAction('${status.isPaused ? 'resume' : 'pause'}', '${hash}')">
                            <svg viewBox="0 0 24 24"><path d="${status.isPaused ? 'M8 5v14l11-7z' : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'}"/></svg>
                        </button>
                        <button class="icon-btn danger" title="${t('删除')}" onclick="event.stopPropagation(); confirmSingleDelete('${hash}', '${escapeHtml(t.name)}')">
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
                        <th>${t('名称')}</th>
                        <th>${t('状态')}</th>
                        <th>${t('大小')}</th>
                        <th>${t('进度')}</th>
                        <th>${t('下载速度')}</th>
                        <th>${t('上传速度')}</th>
                        <th>${t('做种/节点')}</th>
                        <th>ETA</th>
                        <th>${t('分享率')}</th>
                        <th style="text-align:right;">${t('操作')}</th>
                    </tr>
                </thead>
                <tbody>`;

        list.forEach(t => {
            const hash = t.hash;
            const isSelected = selectedTorrents.has(hash);
            const status = getTorrentStatus(t);

            const progressVal = (t.progress * 100).toFixed(1);
            const etaStr = (status.isCompleted || status.isSeeding) ? (status.isSeeding ? t('做种中') : t('已完成')) : (status.isPaused ? t('已暂停') : formatEta(t.eta));
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
                        <button class="icon-btn" title="${t('详情')}" onclick="event.stopPropagation(); openTorrentDetail('${hash}')"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></button>
                        <button class="icon-btn accent" title="${t('重新下载')}" onclick="event.stopPropagation(); redownloadTorrent('${hash}')"><svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg></button>
                        <button class="icon-btn" title="${status.isPaused ? t('恢复') : t('暂停')}" onclick="event.stopPropagation(); torrentAction('${status.isPaused ? 'resume' : 'pause'}', '${hash}')"><svg viewBox="0 0 24 24"><path d="${status.isPaused ? 'M8 5v14l11-7z' : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'}"/></svg></button>
                        <button class="icon-btn danger" title="${t('删除')}" onclick="event.stopPropagation(); confirmSingleDelete('${hash}', '${escapeHtml(t.name)}')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
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
            showToast(t('已发起重新校验并启动检查'));
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
            showToast(`${t('已对 ')}${count}${t(' 个任务发起强制重新校验')}`);
            pollFastData();
        });
    }

    // 单个任务从头重新下载（弹出确认弹窗）
    function redownloadTorrent(hash) {
        const t = allTorrents.find(item => item.hash === hash);
        const name = t ? t.name : hash;
        pendingRedownloadHashes = [hash];
        $('#redownload-confirm-msg').html(`${t('确定要清空已下载文件并从头重新下载 ')}<b>${escapeHtml(name)}</b>${t(' 吗？')}<br><span style="color:var(--warning); font-size:12px;">${t('系统将自动备份种子参数，清除已下载本地文件，并从 0% 重新发起下载。')}</span>`);
        openModal('redownload-confirm-modal');
    }

    // 批量任务从头重新下载（弹出确认弹窗）
    function batchRedownload() {
        if (selectedTorrents.size === 0) return;
        pendingRedownloadHashes = Array.from(selectedTorrents);
        $('#redownload-confirm-msg').html(`${t('确定要对选中的 ')}<b>${pendingRedownloadHashes.length}</b>${t(' 个任务进行从头重新下载吗？')}<br><span style="color:var(--warning); font-size:12px;">${t('系统将清除已下载本地文件，并从 0% 重新发起下载。')}</span>`);
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
            showToast(`${t('已对 ')}${count}${t(' 个任务发起强制重新校验')}`);
            pendingRedownloadHashes = [];
            clearTorrentSelection();
            pollFastData();
        });
    }

    // 真正从头重新下载：导出种子 -> 删旧任务与本地文件 -> 重新添加并开始下载
    async function executeRedownloadTorrent() {
        if (pendingRedownloadHashes.length === 0) return;
        closeModal('redownload-confirm-modal');
        showToast(t('正在准备重新下载任务...'));

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
        showToast(`${t('✅ 已成功重置并从头重新下载 ')}${successCount}${t(' 个任务！')}`);
        pollFastData();
    }

    function batchTorrentAction(action) {
        if (selectedTorrents.size === 0) return;
        const hashesStr = Array.from(selectedTorrents).join('|');
        $.post(`/api/v2/torrents/${action}`, { hashes: hashesStr }, function() {
            clearTorrentSelection();
            pollFastData();
            showToast(t('批量操作已完成'));
        });
    }

    // --- Safe Delete Modal System ---
    function confirmSingleDelete(hash, name) {
        pendingDeleteHashes = [hash];
        $('#delete-confirm-msg').html(`${t('确定要删除任务 ')}<b>${escapeHtml(name)}</b>${t(' 吗？<br>请选择仅删除任务或连同本地文件一起删除：')}`);
        openModal('delete-confirm-modal');
    }

    function confirmBatchDelete() {
        if (selectedTorrents.size === 0) return;
        pendingDeleteHashes = Array.from(selectedTorrents);
        $('#delete-confirm-msg').html(`${t('确定要批量删除选中的 ')}<b>${pendingDeleteHashes.length}</b>${t(' 个任务吗？<br>请选择仅删除任务或连同本地文件一起删除：')}`);
        openModal('delete-confirm-modal');
    }

    function executeDeleteTorrent(deleteFiles) {
        if (pendingDeleteHashes.length === 0) return;
        const hashesStr = pendingDeleteHashes.join('|');
        $.post('/api/v2/torrents/delete', { hashes: hashesStr, deleteFiles: deleteFiles ? 'true' : 'false' }, function() {
            closeModal('delete-confirm-modal');
            selectedTorrents.clear();
            pendingDeleteHashes = [];
            showToast(t('任务已成功删除'));
            pollFastData();
        });
    }

    // --- Batch Category Modal ---
    function openBatchCategoryModal() {
        if (selectedTorrents.size === 0) return;
        let optHtml = `<option value="">${t('(清除分类)')}</option>`;
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
            showToast(t('已更新所选任务分类'));
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
        const name = torrent ? torrent.name : t('种子详情');
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
                    $('#dt-files').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${t('暂无文件树数据')}</div>`);
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
                            <option value="0" ${prio === 0 ? 'selected' : ''}>${t('不下载')}</option>
                            <option value="1" ${prio === 1 ? 'selected' : ''}>${t('常规优先级')}</option>
                            <option value="6" ${prio === 6 ? 'selected' : ''}>${t('高优先级')}</option>
                            <option value="7" ${prio === 7 ? 'selected' : ''}>${t('最高优先级')}</option>
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
                    $('#dt-trackers').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${t('暂无 Trackers')}</div>`);
                    return;
                }
                let html = '<div style="margin-bottom:12px; display:flex; gap:8px;">';
                html += `<input class="input-box" id="single-tracker-url" placeholder="${t('添加 Tracker URL (udp://...)')}" style="flex:1;">`;
                html += `<button class="btn" onclick="submitAddTrackers(false)" style="padding:6px 12px; font-size:12px;">${t('+ 添加')}</button>`;
                html += '</div>';

                trackers.forEach(t => {
                    if (!t.url) return;
                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden; margin-right:8px;">
                            <div style="font-weight:600; font-size:12px; font-family:monospace; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${escapeHtml(t.url)}">${escapeHtml(t.url)}</div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${t('状态: ')}${escapeHtml(t.msg || t('运行中'))} · ${t('做种: ')}${t.num_seeds || 0} · ${t('节点: ')}${t.num_peers || 0}</div>
                        </div>
                        <span class="badge ${t.status === 2 ? 'downloading' : (t.status === 0 ? 'paused' : 'error')}">${t.status === 2 ? t('工作正常') : t('已就绪')}</span>
                    </div>`;
                });
                $('#dt-trackers').html(html);
            });
        } else if (activeDetailSubTab === 'dt-peers') {
            $.getJSON(`/api/v2/sync/torrentPeers?hash=${activeDetailHash}`, function(res) {
                if (!res || !res.peers) {
                    $('#dt-peers').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${t('暂无连接节点')}</div>`);
                    return;
                }
                const peerKeys = Object.keys(res.peers);
                if (peerKeys.length === 0) {
                    $('#dt-peers').html(`<div style="color:var(--text-sec); font-size:13px; text-align:center; padding:30px;">${t('暂无连接节点 (Peers: 0)')}</div>`);
                    return;
                }

                const pageSize = 25;
                const totalPages = Math.ceil(peerKeys.length / pageSize);
                if (peerCurrentPage > totalPages) peerCurrentPage = totalPages;
                const startIndex = (peerCurrentPage - 1) * pageSize;
                const pageKeys = peerKeys.slice(startIndex, startIndex + pageSize);

                let html = `<div style="font-size:12px; color:var(--text-sec); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${t('当前在线 Peers 节点: ')}${peerKeys.length}${t(' 个')}</span>
                    ${totalPages > 1 ? `<span>${t('第 ')}${peerCurrentPage} / ${totalPages}${t(' 页')}</span>` : ''}
                </div>`;

                pageKeys.forEach(k => {
                    const p = res.peers[k];
                    html += `
                    <div class="list-row">
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-weight:600; font-family:monospace;">${escapeHtml(p.ip)}:${p.port} <span style="font-size:11px; color:var(--text-sec); font-weight:normal;">(${escapeHtml(p.client || t('未知客户端'))})</span></div>
                            <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${t('进度: ')}${(p.progress * 100).toFixed(1)}% · ↓ ${formatBytes(p.dl_speed)}/s · ↑ ${formatBytes(p.up_speed)}/s</div>
                        </div>
                        <span class="badge ${p.dl_speed > 0 || p.up_speed > 0 ? 'downloading' : 'paused'}">${p.dl_speed > 0 ? t('传输中') : t('连接空闲')}</span>
                    </div>`;
                });

                if (totalPages > 1) {
                    html += `
                    <div style="display:flex; justify-content:center; gap:10px; margin-top:14px; padding-top:8px; border-top:1px solid var(--border-subtle);">
                        <button class="btn secondary" style="padding:6px 14px; font-size:12px;" onclick="changePeerPage(-1)" ${peerCurrentPage <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>${t('上一页')}</button>
                        <button class="btn secondary" style="padding:6px 14px; font-size:12px;" onclick="changePeerPage(1)" ${peerCurrentPage >= totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>${t('下一页')}</button>
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
            showToast(t('已更新文件下载优先级'));
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
        $('#pieces-stats-text').text(`${t('总区块: ')}${total}${t(' · 已下载: ')}${downloaded} (${((downloaded/total)*100).toFixed(1)}%)`);

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
                const statusNames = [t('未下载'), t('下载中'), t('已完成')];
                const tip = $('#pieces-tooltip');
                tip.text(`${t('区块 #')}${idx}: ${statusNames[pieces[idx]] || '?'}`);
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

        if (!urls) return showToast(t('请输入有效的 Tracker URL 列表！'), false);

        if (isGlobal) {
            if (allTorrents.length === 0) return showToast(t('当前没有运行中的任务！'), false);
            const allHashes = allTorrents.map(t => t.hash).join('|');
            $.post('/api/v2/torrents/addTrackers', { hashes: allHashes, urls: urls }, function() {
                showToast(`${t('已成功为全部 ')}${allTorrents.length}${t(' 个任务批量追加 Tracker！')}`);
                $('#global-tracker-urls').val('');
            }).fail(function() {
                showToast(t('批量 Tracker 请求已发送！'));
            });
        } else {
            $.post('/api/v2/torrents/addTrackers', { hash: activeDetailHash, urls: urls }, function() {
                showToast(t('Tracker 追加成功！'));
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
            return showToast(t('请选择 .torrent 种子文件或填入 Magnet 磁力链接！'), false);
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
                showToast(t('任务已成功添加至 qBittorrent！'));
                pollFastData();
            },
            error: function() {
                showToast(t('发送种子失败，请检查网络或重新登录！'), false);
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
            container.html(`<div style="text-align:center; padding:30px; color:var(--text-sec); font-size:13px;">${t('暂未安装任何搜索插件。请从下方常用插件库一键安装。')}</div>`);
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
                    <button class="icon-btn danger" onclick="uninstallSearchPlugin('${escapeHtml(p.name)}')" title="${t('卸载插件')}">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>`;
        });
        container.html(html);
    }

    function updateSearchPluginDropdown() {
        let html = `<option value="all">${t('🌐 全部插件')}</option><option value="enabled" selected>${t('⚡ 已启用插件')}</option>`;
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
                    ${isInstalled ? t('✓ 已安装') : t('+ 一键安装')}
                </button>
            </div>`;
        });
        container.html(html);
    }

    function installPresetPlugin(url) {
        showToast(t('正在向 qBittorrent 发送插件安装指令...'));
        $.post('/api/v2/search/installPlugin', { sources: url }, function() {
            showToast(t('插件安装请求已发送，正在同步中'));
            setTimeout(fetchSearchPlugins, 2500);
        }).fail(function() {
            showToast(t('安装失败，请确认服务器已安装 Python3'), false);
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
            showToast(`${enable ? t('已启用') : t('已禁用')}${pluginName}`);
            fetchSearchPlugins();
        });
    }

    function uninstallSearchPlugin(pluginName) {
        if (!confirm(`确定要卸载搜索插件 [${pluginName}] 吗？`)) return;
        $.post('/api/v2/search/uninstallPlugin', { names: pluginName }, function() {
            showToast(`${t('已卸载插件: ')}${pluginName}`);
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
            $('#search-count-label').text(`${t('检索结果: ')}${totalResults}${t(' 条')} (${t('第')} ${searchCurrentPage} / ${totalPages}${t(' 页')})`);
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
                            📦 ${sizeFormatted} · 👤 ${t('做种: ')}<span style="color:var(--success); font-weight:700;">${item.nbSeeders}</span> · ${t('吸血: ')}${item.nbLeechers} · ${t('来源: ')}${escapeHtml(item.siteUrl || '插件')}
                        </div>
                    </div>
                    <button class="btn" style="padding:8px 16px; font-size:12px; flex-shrink:0;" onclick="addMagnetFromSearch('${escapeHtml(item.fileUrl)}')">${t('下载')}</button>
                </div>
            </div>`;
        });

        if (totalResults === 0) {
            html = `<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">${t('正在检索全网结果，请稍候...')}</div>`;
        } else {
            // 分页控制器（始终展示统计与翻页器）
            let pageButtonsHtml = '';
            // 上一页
            pageButtonsHtml += `<button class="page-pill" onclick="changeSearchPage(-1)" ${searchCurrentPage <= 1 ? 'disabled' : ''} title="${t('上一页')}">‹</button>`;

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
            pageButtonsHtml += `<button class="page-pill" onclick="changeSearchPage(1)" ${searchCurrentPage >= totalPages ? 'disabled' : ''} title="${t('下一页')}">›</button>`;

            html += `
            <div class="pagination-wrapper">
                <div class="pagination-info">
                    ${t('显示第 ')}<strong>${startIndex + 1}</strong> - <strong>${endIndex}</strong>${t(' 条 / 共 ')}<strong>${totalResults}</strong>${t(' 条 (每页 20 条)')}
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
        if (!pattern) return showToast(t('请输入搜索关键字！'), false);

        stopCurrentSearch();
        cachedSearchResults = [];
        searchCurrentPage = 1;
        $('#search-toolbar').hide();
        const plugin = $('#search-plugin').val();
        const category = $('#search-category').val();

        $('#search-results-container').html(`<div style="text-align:center; padding:50px; color:var(--text-sec); font-size:14px;">${t('正在全网启动搜索，拉取检索结果中...')}</div>`);
        $('#search-status-bar').css('display', 'flex');
        $('#search-status-text').text(`${t('正在为 ')}“${pattern}”${t(' 检索中...')}`);

        $.post('/api/v2/search/start', { pattern: pattern, plugins: plugin, category: category }, function(res) {
            if (res && res.id) {
                searchId = res.id;
                if (searchRefreshTimer) clearInterval(searchRefreshTimer);
                searchRefreshTimer = setInterval(pollSearchResults, 1500);
            } else {
                $('#search-results-container').html(`<div style="text-align:center; padding:40px; color:var(--danger); font-size:14px;">${t('启动搜索失败，请确认 qBittorrent 中已启用 Python 搜索插件。')}</div>`);
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
                $('#search-status-text').text(`${t('搜索完成，共抓取 ')}${res.total || cachedSearchResults.length}${t(' 条资源')}`);
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
                showToast(isMagnet ? t('✅ 磁力链接已成功添加，开始下载！') : t('✅ 已发送下载指令'));
                if (typeof pollFastData === 'function') pollFastData();
                // 稍后主动刷新任务列表，让新任务尽快出现
                setTimeout(function () {
                    if (typeof pollFastData === 'function') pollFastData();
                }, 2000);
            },
            error: function (xhr) {
                showToast(t('❌ 添加失败: ') + (xhr.statusText || t('网络错误')), false);
            }
        });
    }

    function addMagnetFromSearch(rawUrl) {
        const url = (rawUrl || '').trim();
        if (!url) {
            showToast(t('⚠️ 无效的下载链接'), false);
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
        showToast(t('正在解析下载页，提取磁力链接...'));
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
                    showToast(t('⚠️ 该资源为下载页链接，可能无法自动添加。已尝试添加，若任务未出现请用磁力链接手动添加。'), false);
                    addTorrentUrl(url, false);
                }
            },
            error: function () {
                showToast(t('⚠️ 该资源为下载页链接，可能无法自动添加。已尝试添加，若任务未出现请用磁力链接手动添加。'), false);
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
        $('#search-status-text').text(`${t('已恢复上次检索结果')} (${saved.results.length}${t(' 条)')}`);
        return true;
    }

    // Restore previous search results once DOM is ready
    $(function () {
        restoreSearchState();
    });

    // Persist state when the page is about to be refreshed
    window.addEventListener('beforeunload', saveSearchState);

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
            container.html(`<div class="card" style="text-align:center; color:var(--text-sec); font-size:13px;">${t('暂无订阅源，请点击上方按钮添加 RSS 订阅 URL')}</div>`);
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
                        <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${t('URL: ')}${escapeHtml(feed.url || key)} · ${t('文章数: ')}${articles.length}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn secondary" style="padding:6px 12px; font-size:12px;" onclick="viewRssArticles('${escapeHtml(key)}')">${t('浏览文章')}</button>
                        <button class="btn secondary" style="padding:6px 12px; font-size:12px;" onclick="refreshRssFeed('${escapeHtml(key)}')">${t('刷新')}</button>
                        <button class="icon-btn danger" style="width:30px; height:30px;" title="${t('删除订阅源')}" onclick="deleteRssFeed('${escapeHtml(key)}')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
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

            $('#rss-active-feed-title').text(`📡 ${feed.title || feedKey} (${t('共 ')}${feed.articles.length}${t(' 篇)')}`);
            let html = '';
            feed.articles.forEach(art => {
                html += `
                <div class="list-row">
                    <div style="flex:1; overflow:hidden; margin-right:10px;">
                        <div style="font-weight:600; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${escapeHtml(art.title)}">${escapeHtml(art.title)}</div>
                        <div style="font-size:11px; color:var(--text-sec); margin-top:2px;">${t('发布时间: ')}${art.date ? formatTimestamp(art.date) : '--'}</div>
                    </div>
                    <button class="btn" style="padding:6px 12px; font-size:11px;" onclick="addMagnetFromSearch('${escapeHtml(art.torrentURL || art.link)}')">${t('下载')}</button>
                </div>`;
            });
            $('#rss-articles-list').html(html);
            $('#rss-articles-container').slideDown();
        });
    }

    function refreshRssFeed(feedPath) {
        $.post('/api/v2/rss/refreshItem', { itemPath: feedPath }, function() {
            showToast(t('已发起 RSS 订阅源刷新请求！'));
            fetchRssData();
        });
    }

    function refreshAllRssFeeds() {
        $.post('/api/v2/rss/refreshItem', { itemPath: '' }, function() {
            showToast(t('已发起全部 RSS 订阅刷新！'));
            fetchRssData();
        });
    }

    function deleteRssFeed(feedPath) {
        if (!confirm(`${t('确定要删除 RSS 订阅源 ')}[${feedPath}]${t(' 吗？')}`)) return;
        $.post('/api/v2/rss/removeItem', { path: feedPath }, function() {
            showToast(t('已删除订阅源'));
            fetchRssData();
        });
    }

    function submitAddRssFeed() {
        const url = $('#feed-url').val().trim();
        const path = $('#feed-path').val().trim();
        if (!url) return showToast(t('请输入有效的 RSS 订阅链接！'), false);

        $.post('/api/v2/rss/addFeed', { url: url, path: path }, function() {
            closeModal('add-rss-feed-modal');
            $('#feed-url').val('');
            $('#feed-path').val('');
            showToast(t('已添加 RSS 订阅源'));
            fetchRssData();
        });
    }

    function renderRssRules(rules) {
        const container = $('#rss-rules-container');
        if (!rules || Object.keys(rules).length === 0) {
            container.html(`<div class="card" style="text-align:center; color:var(--text-sec); font-size:13px;">${t('暂无自动下载规则')}</div>`);
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
                            ${t('包含: ')}<code>${escapeHtml(r.mustContain || t('所有'))}</code> · ${t('排除: ')}<code>${escapeHtml(r.mustNotContain || t('无'))}</code> · ${t('· 分类: ')}${r.assignedCategory ? `🏷 ${escapeHtml(r.assignedCategory)}` : t('无')}
                        </div>
                    </div>
                    <button class="icon-btn danger" onclick="deleteRssRule('${escapeHtml(name)}')" title="${t('删除规则')}"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
                </div>
            </div>`;
        });
        container.html(html);
    }

    function openRssRuleModal() {
        let optHtml = `<option value="">${t('(分配分类: 无)')}</option>`;
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
        if (!name) return showToast(t('请输入规则名称！'), false);

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
            showToast(t('已保存自动下载规则'));
            fetchRssData();
        });
    }

    function deleteRssRule(name) {
        if (!confirm(`${t('确定要删除规则 ')}[${name}]${t(' 吗？')}`)) return;
        $.post('/api/v2/rss/removeRule', { ruleName: name }, function() {
            showToast(t('已删除规则'));
            fetchRssData();
        });
    }

    function renderCategories() {
        const container = $('#categories-container');
        if (!allCategories || Object.keys(allCategories).length === 0) {
            container.html(`<div class="card" style="text-align:center; color:var(--text-sec); font-size:13px;">${t('暂无分类数据')}</div>`);
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
        if (!name) return showToast(t('请输入分类名称！'), false);

        $.post('/api/v2/torrents/createCategory', { category: name, savePath: path }, function() {
            closeModal('add-category-modal');
            $('#new-cat-name').val('');
            $('#new-cat-path').val('');
            showToast(t('已成功创建分类'));
            pollSlowData();
        });
    }

    function updateCategoryDropdowns() {
        let filterHtml = `<option value="all">${t('📁 全部分类')}</option>`;
        let addHtml = `<option value="">${t('(无分类)')}</option>`;

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
            return showToast(t('❌ 两次输入的新密码不一致，请重新核对！'), false);
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
            showToast(t('✅ 系统配置与安全凭据已全量保存！'));
            loadAllSystemPreferences();
        }).fail(function() {
            showToast(t('保存配置失败，请检查网络或权限'), false);
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
        if (!rawLogs || rawLogs.length === 0) return showToast(t('暂无日志记录可复制'), false);
        const textLines = rawLogs.map(l => `[${formatTimestamp(l.timestamp)}] [${l.type}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(textLines).then(() => {
            showToast(t('✅ 已复制全部日志到剪贴板！'));
        }).catch(() => {
            showToast(t('复制失败，请手动选择复制'), false);
        });
    }

    function renderSystemLogs(logs) {
        const container = $('#sys-logs-container');
        if (!logs || logs.length === 0) {
            container.html(`<div style="color:var(--text-sec); text-align:center; padding:20px;">${t('暂无日志记录')}</div>`);
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
        const labels = { auto: t('自动'), light: t('浅色'), dark: t('深色') };
        $('#theme-icon').text(icons[mode] || '🌓');
        $('#theme-label').text(labels[mode] || t('自动'));
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
            $('#alt-speed-label').text(t('备用速率'));
        } else {
            $('#btn-alt-speed').removeClass('alt-speed-active');
            $('#alt-speed-icon').text('⚡');
            $('#alt-speed-label').text(t('常规速率'));
        }
    }

    function toggleAltSpeedMode() {
        $.post('/api/v2/transfer/toggleSpeedLimitsMode', function() {
            isAltSpeedEnabled = !isAltSpeedEnabled;
            updateAltSpeedUI();
            showToast(isAltSpeedEnabled ? t('已激活备用限速模式') : t('已恢复常规全局全速模式'));
        });
    }

// --- Tab Navigation ---
    function switchTab(pageId, title, btn) {
        $('.page').removeClass('active');
        $(`#${pageId}`).addClass('active');
        $('.dock-btn').removeClass('active');
        $(btn).addClass('active');
        $('#page-title').text(window.t(title, title));

        window.scrollTo(0, 0);

        if (pageId === 'p-search') fetchSearchPlugins();
        if (pageId === 'p-rss') fetchRssData();
        if (pageId === 'p-system') {
            loadAllSystemPreferences();
            fetchSystemLogs();
        }
    }

    // Re-apply dynamic labels when language changes
    window.onLanguageChanged = function () {
        if (typeof updateAltSpeedUI === 'function') updateAltSpeedUI();
        if (typeof setTheme === 'function') setTheme(themeMode);
        const activeBtn = document.querySelector('.dock-btn.active');
        if (activeBtn) {
            const span = activeBtn.querySelector('span[data-i18n]');
            $('#page-title').text(window.t(span ? span.getAttribute('data-i18n') : activeBtn.textContent.trim()));
        }
    };

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
            showToast(t('⚠️ 请输入完整的 WebUI 用户名与密码'), false);
            if (!username) $('#login-user').focus();
            else $('#login-pass').focus();
            return;
        }

        const loginBtn = $('#login-modal button.btn.w-full');
        const origText = loginBtn.text();
        loginBtn.prop('disabled', true).text(t('正在核验中...'));

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
                    showToast(t('✅ 身份验证通过，已成功登录！'));
                    if (typeof checkAuthStatus === 'function') {
                        checkAuthStatus();
                    }
                } else {
                    showToast(t('❌ 用户名或密码错误，请核对后重试！'), false);
                    $('#login-pass').val('').focus();
                }
            },
            error: function(xhr) {
                loginBtn.prop('disabled', false).text(origText);
                if (xhr.status === 403 || xhr.status === 401) {
                    showToast(t('❌ 登录失败：用户名或密码错误 / 尝试过多被临时锁定'), false);
                } else {
            showToast(t('❌ 连接 qBittorrent 登录接口失败 (') + xhr.status + ')', false);
                }
                $('#login-pass').val('').focus();
            }
        });
    }

    function logout() {
        if (typeof fastPollTimer !== 'undefined' && fastPollTimer) clearInterval(fastPollTimer);
        if (typeof slowPollTimer !== 'undefined' && slowPollTimer) clearInterval(slowPollTimer);
        $.post('/api/v2/auth/logout', function() {
            showToast(t('已退出登录'));
            $('#qbt-dot').addClass('offline');
            $('#qbt-status-text').text(t('未登录 / 需鉴权'));
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
            $('#qbt-status-text').text(t('已在线'));

            const dlSpeed = formatBytes(info.dl_info_speed);
            const upSpeed = formatBytes(info.up_info_speed);
            $('#v-dl-speed').text(dlSpeed + '/s');
            $('#v-up-speed').text(upSpeed + '/s');

            const statusMap = {
                "connected": t('🟢 连接就绪'),
                "firewalled": t('🟡 处于防火墙后'),
                "disconnected": t('🔴 未连接')
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
            $('#qbt-status-text').text(t('离线/未登入'));
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
        const days = [t('星期日'), t('星期一'), t('星期二'), t('星期三'), t('星期四'), t('星期五'), t('星期六')];
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
