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

        // Backdrop click to close modals
        $(document).on('click', '.modal-overlay', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });

        // Global Keyboard Shortcuts
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModal = $('.modal-overlay.active').last();
                if (activeModal.length > 0) {
                    closeModal(activeModal.attr('id'));
                }
            } else if (!$(e.target).is('input, textarea, select')) {
                if (e.key === '1') switchTab('p-dash', '下载总览', $('.dock-btn:nth-child(1)'));
                else if (e.key === '2') switchTab('p-torrents', '任务管理', $('.dock-btn:nth-child(2)'));
                else if (e.key === '3') switchTab('p-search', '资源搜索', $('.dock-btn:nth-child(3)'));
                else if (e.key === '4') switchTab('p-rss', 'RSS订阅', $('.dock-btn:nth-child(4)'));
                else if (e.key === '5') switchTab('p-system', '系统与日志', $('.dock-btn:nth-child(5)'));
                else if (e.key === '/' || e.key === 'f' || e.key === 'F') {
                    e.preventDefault();
                    switchTab('p-torrents', '任务管理', $('.dock-btn:nth-child(2)'));
                    setTimeout(() => $('#torrent-search-input').focus().select(), 100);
                } else if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    openAddModal();
                }
            }
        });

        // Fetch version
        $.get('/api/v2/app/version', function(ver) {
            qbtVersion = ver;
            $('#sys-qbt-version-text').text(`qBittorrent ${ver}`);
        });
        $.get('/api/v2/app/webapiVersion', function(ver) {
            webapiVersion = ver;
            $('#sys-webapi-version-text').text(`v${ver}`);
        });

        // Set Date
        const now = new Date();
        const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        $('#date-now').text(`${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]}`);

        // Initial Data Poll
        pollFastData();
        pollSlowData();

        // High frequency (1.8s) only for lightweight transfer rates & torrents
        fastPollTimer = setInterval(pollFastData, 1800);
        // Low frequency (15s) for static categories & preferences
        slowPollTimer = setInterval(pollSlowData, 15000);
    });
