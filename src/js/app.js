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
