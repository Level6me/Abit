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
            showToast(isAltSpeedEnabled ? '已切换至备用限速 (乌龟模式)' : '已恢复常规全局全速模式');
        });
    }

// --- Tab Navigation ---
    function switchTab(pageId, title, btn) {
        $('.page').removeClass('active');
        $(`#${pageId}`).addClass('active');
        $('.dock-btn').removeClass('active');
        $(btn).addClass('active');
        $('#page-title').text(title);

        window.scrollTo({ top: 0, behavior: 'smooth' });

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
        if (tabId === 'sys-sub-logs') fetchSystemLogs();
        if (tabId === 'sys-sub-config') loadAllSystemPreferences();
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
    function openLoginModal() { openModal('login-modal'); }

    function submitLogin() {
        const username = $('#login-user').val().trim() || 'admin';
        const password = $('#login-pass').val();

        $.post('/api/v2/auth/login', { username: username, password: password }, function(res) {
            if (res === 'Ok.' || res === 'Ok') {
                closeModal('login-modal');
                $('#login-pass').val('');
                showToast('已成功登入 qBittorrent 面板');
                pollFastData();
                pollSlowData();
            } else {
                showToast('登录失败，请检查用户名或密码！', false);
            }
        }).fail(function() {
            showToast('连接认证失败，请确认 qBittorrent 服务已正常启动。', false);
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
