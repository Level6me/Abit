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
