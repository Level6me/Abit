/**
 * @file app.js
 * @description Application polling loops, lifecycle bootstrap and event bindings
 */

// --- Data Synchronization ---
    function syncServerState() {
        $.getJSON(`/api/v2/sync/maindata?rid=${syncMainDataRid}`, function(data) {
            if (!data) return;
            if (data.rid !== undefined) syncMainDataRid = data.rid;
            if (data.server_state) {
                if (data.server_state.free_space_on_disk !== undefined) {
                    lastFreeSpaceOnDisk = data.server_state.free_space_on_disk;
                    if (lastFreeSpaceOnDisk !== null && lastFreeSpaceOnDisk >= 0) {
                        $('#v-disk-free').text(formatBytes(lastFreeSpaceOnDisk));
                        if (typeof checkLowDiskSpaceNotification === 'function') {
                            checkLowDiskSpaceNotification(lastFreeSpaceOnDisk);
                        }
                    } else {
                        $('#v-disk-free').text('--');
                    }
                }
            }
        }).fail(function() {
            syncMainDataRid = 0;
        });
    }

    function pollFastData() {
        // 1. Transfer Rates & Status
        $.getJSON('/api/v2/transfer/info', function(info) {
            if (!info) return;
            $('#qbt-dot').removeClass('offline');
            $('#qbt-status-text').text(window.t('已在线'));

            const dlSpeed = formatBytes(info.dl_info_speed);
            const upSpeed = formatBytes(info.up_info_speed);
            $('#v-dl-speed').text(dlSpeed + '/s');
            $('#v-up-speed').text(upSpeed + '/s');

            if (typeof updatePipMonitor === 'function') {
                updatePipMonitor(dlSpeed + '/s', upSpeed + '/s', allTorrents.length);
            }

            const statusMap = {
                "connected": window.t('🟢 连接就绪'),
                "firewalled": window.t('🟡 处于防火墙后'),
                "disconnected": window.t('🔴 未连接')
            };
            $('#v-conn-status').text(statusMap[info.connection_status] || info.connection_status);
            $('#v-dht-nodes').text(`DHT 节点: ${info.dht_nodes}`);
            
            if (lastFreeSpaceOnDisk !== null && lastFreeSpaceOnDisk >= 0) {
                $('#v-disk-free').text(formatBytes(lastFreeSpaceOnDisk));
            } else if (info.free_space_on_disk !== undefined && info.free_space_on_disk >= 0) {
                lastFreeSpaceOnDisk = info.free_space_on_disk;
                $('#v-disk-free').text(formatBytes(info.free_space_on_disk));
            } else {
                $('#v-disk-free').text('--');
            }

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
            $('#qbt-status-text').text(window.t('离线/未登入'));
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
        syncServerState();
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
        const days = [window.t('星期日'), window.t('星期一'), window.t('星期二'), window.t('星期三'), window.t('星期四'), window.t('星期五'), window.t('星期六')];
        $('#date-now').text(`${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]}`);

        // Initialize PWA Service Worker & Install Event Handlers
        initPwaSupport();

        // Initialize App Metadata & Versions
        if (typeof APP_VERSION !== 'undefined') {
            $('#sys-abit-version-text').text(APP_VERSION);
        }
        if (typeof APP_REPO_URL !== 'undefined') {
            $('#sys-abit-repo-url').attr('href', APP_REPO_URL).text(APP_REPO_URL);
        }

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
            $('#qbt-status-text').text(window.t('未登录 / 需鉴权'));
            openLoginModal(true);
        });
    }

// --- PWA Service Worker & Installation Handlers ---
    let deferredPwaInstallPrompt = null;

    function initPwaSupport() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('./sw.js')
                    .then(function(reg) {
                        console.log('[Abit PWA] Service Worker registered with scope:', reg.scope);
                    })
                    .catch(function(err) {
                        console.debug('[Abit PWA] Service Worker registration skipped/failed:', err);
                    });
            });
        }

        window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            deferredPwaInstallPrompt = e;
            console.log('[Abit PWA] beforeinstallprompt event captured');
            $('#btn-pwa-install').fadeIn(200).css('display', 'inline-flex');
        });

        window.addEventListener('appinstalled', function() {
            console.log('[Abit PWA] App installed successfully');
            deferredPwaInstallPrompt = null;
            $('#btn-pwa-install').fadeOut(200);
            if (typeof showToast === 'function') {
                showToast(window.t('Abit 已成功安装到主屏幕 / 本地应用列表'));
            }
        });

        // 1. StorageManager Persistence Request (Prevent browser auto-eviction)
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then(function(persistent) {
                if (persistent) console.log('[Abit PWA] Persistent Storage granted');
            }).catch(function() {});
        }

        // 2. Screen Wake Lock Bootstrap
        if (typeof isWakeLockEnabled === 'function' && isWakeLockEnabled()) {
            requestScreenWakeLock();
        }

        // 3. File Handling API (LaunchQueue for double-clicking .torrent files)
        if ('launchQueue' in window && typeof window.LaunchParams !== 'undefined') {
            try {
                window.launchQueue.setConsumer(async function(launchParams) {
                    if (!launchParams.files || !launchParams.files.length) return;
                    for (const fileHandle of launchParams.files) {
                        const file = await fileHandle.getFile();
                        if (file && (file.name.endsWith('.torrent') || file.type === 'application/x-bittorrent')) {
                            if (typeof handleSelectedTorrentFile === 'function') {
                                handleSelectedTorrentFile(file);
                                break;
                            }
                        }
                    }
                });
            } catch (e) {
                console.debug('[Abit PWA] LaunchQueue consumer init error:', e);
            }
        }

        // 4. Handle PWA Launch Query Parameters (Shortcuts, Magnet protocol & Share Target)
        handlePwaLaunchParams();
    }

    function handlePwaLaunchParams() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const magnetParam = urlParams.get('magnet') || urlParams.get('url') || urlParams.get('text');
            const actionParam = urlParams.get('action');

            if (magnetParam) {
                let cleanUrl = decodeURIComponent(magnetParam).trim();
                // If protocol handler encoded extra prefix, strip it if needed
                if (cleanUrl.startsWith('magnet:?') || cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
                    setTimeout(function() {
                        if (typeof openAddModal === 'function') {
                            openAddModal(cleanUrl);
                        }
                    }, 400);
                }
            } else if (actionParam === 'add') {
                setTimeout(function() {
                    if (typeof openAddModal === 'function') openAddModal();
                }, 400);
            } else if (actionParam === 'search') {
                setTimeout(function() {
                    if (typeof switchTab === 'function') {
                        switchTab('p-search', '搜索', $('.dock-btn:nth-child(3)'));
                    }
                }, 400);
            } else if (actionParam === 'pause_all') {
                setTimeout(function() {
                    $.post('/api/v2/torrents/pause', { hashes: 'all' }, function() {
                        if (typeof showToast === 'function') showToast(window.t('已暂停全部活动任务'));
                        if (typeof pollFastData === 'function') pollFastData();
                    });
                }, 400);
            } else if (actionParam === 'resume_all') {
                setTimeout(function() {
                    $.post('/api/v2/torrents/resume', { hashes: 'all' }, function() {
                        if (typeof showToast === 'function') showToast(window.t('已恢复全部任务'));
                        if (typeof pollFastData === 'function') pollFastData();
                    });
                }, 400);
            }

            // Clean up query string from address bar without reloading
            if (magnetParam || actionParam) {
                const cleanLocation = window.location.pathname;
                window.history.replaceState({}, document.title, cleanLocation);
            }
        } catch (e) {
            console.debug('[Abit PWA] Failed to parse launch query params:', e);
        }
    }

    function promptPwaInstall() {
        if (deferredPwaInstallPrompt) {
            deferredPwaInstallPrompt.prompt();
            deferredPwaInstallPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[Abit PWA] User accepted installation prompt');
                } else {
                    console.log('[Abit PWA] User dismissed installation prompt');
                }
                deferredPwaInstallPrompt = null;
            });
        } else {
            if (typeof showToast === 'function') {
                showToast(window.t('当前浏览器可点击地址栏安装图标或菜单中的“添加到主屏幕”'));
            }
        }
    }

    // --- Smart Clipboard Magnet Detection ---
    let lastDetectedClipboardMagnet = '';
    let clipboardBannerTimer = null;

    function checkClipboardForMagnet() {
        if (typeof isClipboardDetectEnabled === 'function' && !isClipboardDetectEnabled()) return;
        if (!navigator.clipboard || !navigator.clipboard.readText) return;
        if ($('.modal-overlay.active').length > 0) return;

        navigator.clipboard.readText().then(function(text) {
            if (!text) return;
            const trimmed = text.trim();
            if (trimmed.startsWith('magnet:?xt=') && trimmed !== lastDetectedClipboardMagnet) {
                lastDetectedClipboardMagnet = trimmed;
                showClipboardBanner(trimmed);
            }
        }).catch(function() {});
    }

    function showClipboardBanner(magnetUrl) {
        $('#clipboard-detected-url').text(magnetUrl);
        $('#clipboard-smart-banner').fadeIn(200);
        if (typeof hapticFeedback === 'function') hapticFeedback(15);

        if (clipboardBannerTimer) clearTimeout(clipboardBannerTimer);
        clipboardBannerTimer = setTimeout(function() {
            $('#clipboard-smart-banner').fadeOut(200);
        }, 8000);
    }

    function acceptClipboardMagnet() {
        const url = $('#clipboard-detected-url').text();
        $('#clipboard-smart-banner').hide();
        if (url) {
            if (typeof openAddModal === 'function') {
                openAddModal(url);
            }
        }
    }

    function dismissClipboardBanner() {
        $('#clipboard-smart-banner').fadeOut(150);
        if (clipboardBannerTimer) clearTimeout(clipboardBannerTimer);
    }

    // Window Focus & Visibility Listener for Clipboard Check
    window.addEventListener('focus', function() {
        setTimeout(checkClipboardForMagnet, 300);
    });

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            setTimeout(checkClipboardForMagnet, 300);
        }
    });

    // Network Online / Offline Listeners
    window.addEventListener('online', function() {
        $('#qbt-dot').removeClass('offline');
        $('#qbt-status-text').text(window.t('已在线'));
        if (typeof showToast === 'function') showToast(window.t('网络连接已恢复'), true);
        pollFastData();
        pollSlowData();
    });

    window.addEventListener('offline', function() {
        $('#qbt-dot').addClass('offline');
        $('#qbt-status-text').text(window.t('离线模式 (只读快照)'));
        if (typeof showToast === 'function') showToast(window.t('网络已断开，进入离线快照模式'), false);
    });

