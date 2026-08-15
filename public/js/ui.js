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
