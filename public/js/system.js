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
            return showToast('❌ 两次输入的新密码不一致，请重新核对！', false);
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

        if (newUsername) {
            prefs.web_ui_username = newUsername;
            localStorage.setItem('omni_master_user', newUsername);
        }
        if (newPassword) {
            prefs.web_ui_password = newPassword;
            if (typeof sha256 === 'function') {
                sha256(newPassword).then(hash => {
                    localStorage.setItem('omni_pwd_hash', hash);
                });
            }
        }

        $.post('/api/v2/transfer/setDownloadLimit', { limit: dl });
        $.post('/api/v2/transfer/setUploadLimit', { limit: up });
        $.post('/api/v2/app/setPreferences', { json: JSON.stringify(prefs) }, function() {
            $('#pref-webui-password').val('');
            $('#pref-webui-password-confirm').val('');
            showToast('✅ 系统配置与安全凭据已全量保存！');
            loadAllSystemPreferences();
        }).fail(function() {
            showToast('保存配置失败，请检查网络或权限', false);
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
        if (!rawLogs || rawLogs.length === 0) return showToast('暂无日志记录可复制', false);
        const textLines = rawLogs.map(l => `[${formatTimestamp(l.timestamp)}] [${l.type}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(textLines).then(() => {
            showToast('✅ 已复制全部日志到剪贴板！');
        }).catch(() => {
            showToast('复制失败，请手动选择复制', false);
        });
    }

    function renderSystemLogs(logs) {
        const container = $('#sys-logs-container');
        if (!logs || logs.length === 0) {
            container.html('<div style="color:var(--text-sec); text-align:center; padding:20px;">暂无日志记录</div>');
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
