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

        window.scrollTo(0, 0);

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

    function isAuthPassed() {
        return sessionStorage.getItem('omni_auth_passed') === 'true' || localStorage.getItem('omni_auth_remember') === 'true';
    }

    function setAuthPassed(passed, remember) {
        if (passed) {
            sessionStorage.setItem('omni_auth_passed', 'true');
            if (remember) {
                localStorage.setItem('omni_auth_remember', 'true');
            }
        } else {
            sessionStorage.removeItem('omni_auth_passed');
            localStorage.removeItem('omni_auth_remember');
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

    async function submitLogin() {
        const username = $('#login-user').val().trim();
        const password = $('#login-pass').val();
        const remember = $('#login-remember').is(':checked');

        if (!username || !password) {
            showToast('⚠️ 请完整输入 WebUI 登录用户名与密码', false);
            if (!username) $('#login-user').focus();
            else $('#login-pass').focus();
            return;
        }

        const inputHash = (typeof sha256 === 'function') ? await sha256(password) : '';
        const storedHash = localStorage.getItem('omni_pwd_hash');
        const storedUser = localStorage.getItem('omni_master_user');

        // 双重安全守卫：若本地已建立密码哈希特征，密码不符直接阻断，杜绝免密穿透
        if (storedHash && inputHash) {
            if (inputHash !== storedHash || (storedUser && username !== storedUser)) {
                setAuthPassed(false, false);
                showToast('❌ 用户名或密码错误，请检查后重试！', false);
                $('#login-pass').val('').focus();
                return;
            }
        }

        $.post('/api/v2/auth/login', { username: username, password: password }, function(res) {
            const respStr = (typeof res === 'string') ? res.trim() : '';
            if (respStr === 'Ok.' || respStr === 'Ok') {
                $.get('/api/v2/app/version', function() {
                    // 若尚未绑定哈希基准，首次认证通过时自动建立安全基准
                    if (!storedHash && inputHash) {
                        localStorage.setItem('omni_pwd_hash', inputHash);
                        localStorage.setItem('omni_master_user', username);
                    }

                    setAuthPassed(true, remember);
                    $('#login-modal').removeClass('forced-login');
                    closeModal('login-modal');
                    $('#login-pass').val('');
                    showToast('✅ 身份验证通过，已成功登录！');
                    if (typeof startAuthenticatedApp === 'function') {
                        startAuthenticatedApp();
                    } else {
                        pollFastData();
                        pollSlowData();
                    }
                }).fail(function() {
                    setAuthPassed(false, false);
                    showToast('❌ 凭据校验未通过，请重新输入正确的密码', false);
                    $('#login-pass').val('').focus();
                });
            } else {
                setAuthPassed(false, false);
                showToast('❌ 用户名或密码错误，请检查后重试！', false);
                $('#login-pass').val('').focus();
            }
        }).fail(function(err) {
            setAuthPassed(false, false);
            if (err.status === 403 || err.status === 401) {
                showToast('❌ 登录失败：用户名/密码不匹配或 IP 被限制', false);
            } else {
                showToast('❌ 连接 qBittorrent 服务失败，请确认服务已启动', false);
            }
        });
    }

    function logout() {
        setAuthPassed(false, false);
        if (typeof fastPollTimer !== 'undefined' && fastPollTimer) clearInterval(fastPollTimer);
        if (typeof slowPollTimer !== 'undefined' && slowPollTimer) clearInterval(slowPollTimer);
        $.post('/api/v2/auth/logout', function() {
            showToast('已退出登录');
        });
        $('#qbt-dot').addClass('offline');
        $('#qbt-status-text').text('已注销/未登录');
        openLoginModal(true);
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
