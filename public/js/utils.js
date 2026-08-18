/**
 * @file utils.js
 * @description Formatting, sanitization, time parsing, toast notifications and torrent status parsers
 */

// --- Helpers ---
    function formatBytes(bytes) {
        if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '--';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatEta(seconds) {
        if (!seconds || seconds < 0 || seconds >= 8640000) return '∞';
        if (seconds < 60) return `${seconds}${window.t('秒')}`;
        const m = Math.floor(seconds / 60);
        if (m < 60) return `${m}${window.t('分')} ${seconds % 60}${window.t('秒')}`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}${window.t('时')} ${m % 60}${window.t('分')}`;
        const d = Math.floor(h / 24);
        return `${d}${window.t('天')} ${h % 24}${window.t('时')}`;
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
        let stateName = window.t('已暂停');

        if (isError) {
            stateClass = 'error';
            stateName = window.t('错误/文件丢失');
        } else if (state === 'metadl') {
            stateClass = 'downloading';
            stateName = window.t('获取元数据');
        } else if (state === 'allocating') {
            stateClass = 'downloading';
            stateName = window.t('分配磁盘空间');
        } else if (isChecking) {
            stateClass = 'queued';
            stateName = window.t('校验中');
        } else if (state === 'downloading' || state === 'forceddl') {
            stateClass = 'downloading';
            stateName = state === 'forceddl' ? window.t('强制下载') : window.t('下载中');
        } else if (state === 'stalleddl') {
            stateClass = 'downloading';
            stateName = window.t('等待下载');
        } else if (state === 'queueddl') {
            stateClass = 'queued';
            stateName = window.t('排队下载');
        } else if (state === 'pauseddl') {
            stateClass = 'paused';
            stateName = window.t('下载暂停');
        } else if (state === 'uploading' || state === 'forcedup') {
            stateClass = 'completed';
            stateName = state === 'forcedup' ? window.t('强制做种') : window.t('做种中');
        } else if (state === 'stalledup') {
            stateClass = 'completed';
            stateName = window.t('做种空闲');
        } else if (state === 'queuedup') {
            stateClass = 'queued';
            stateName = window.t('排队做种');
        } else if (state === 'pausedup') {
            stateClass = 'paused';
            stateName = window.t('做种暂停 (已完成)');
        } else if (isCompleted) {
            stateClass = 'completed';
            stateName = window.t('已完成');
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

    // --- Abit Icon Web Component & Vector Assets ---
    const ABIT_ICON_SVG = `<svg viewBox="0 0 1024 1024" width="100%" height="100%" style="display:block;">
  <defs>
    <linearGradient id="abit-ic-bg" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#4aa9ff"/>
      <stop offset="28%" stop-color="#2b8bf4"/>
      <stop offset="68%" stop-color="#106ce9"/>
      <stop offset="100%" stop-color="#0246d6"/>
    </linearGradient>
    <radialGradient id="abit-ic-top" cx="50%" cy="12%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="abit-ic-ring" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#d8ebff" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#a8d0ff" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="abit-ic-glyph" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
      <stop offset="42%" stop-color="#eaf3ff" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="#cbe0ff" stop-opacity="0.75"/>
    </linearGradient>
    <filter id="abit-ic-shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#002d99" flood-opacity="0.32"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="230" ry="230" fill="url(#abit-ic-bg)"/>
  <rect width="1024" height="1024" rx="230" ry="230" fill="url(#abit-ic-top)"/>
  <circle cx="512" cy="512" r="352" fill="none" stroke="url(#abit-ic-ring)" stroke-width="34" filter="url(#abit-ic-shadow)"/>
  <circle cx="512" cy="512" r="352" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.45"/>
  <g filter="url(#abit-ic-shadow)" fill="url(#abit-ic-glyph)">
    <path d="M 512,246 C 536.3,246 556,265.7 556,290 L 556,482 L 588.6,449.4 C 605.8,432.2 633.7,432.2 650.9,449.4 C 668.1,466.6 668.1,494.5 650.9,511.7 L 538.7,623.9 C 524,638.6 500,638.6 485.3,623.9 L 373.1,511.7 C 355.9,494.5 355.9,466.6 373.1,449.4 C 390.3,432.2 418.2,432.2 435.4,449.4 L 468,482 L 468,290 C 468,265.7 487.7,246 512,246 Z"/>
    <path d="M 338,584 C 354.6,584 368,597.4 368,614 L 368,628 C 368,645.7 382.3,660 400,660 L 624,660 C 641.7,660 656,645.7 656,628 L 656,614 C 656,597.4 669.4,584 686,584 C 702.6,584 716,597.4 716,614 L 716,632 C 716,680.6 676.6,720 628,720 L 396,720 C 347.4,720 308,680.6 308,632 L 308,614 C 308,597.4 321.4,584 338,584 Z"/>
  </g>
</svg>`;

    const ABIT_SYMBOL_SVG = `<svg viewBox="0 0 1024 1024" width="100%" height="100%" fill="currentColor" style="display:block;">
  <path fill-rule="evenodd" d="M 512,126 C 298.8,126 126,298.8 126,512 C 126,725.2 298.8,898 512,898 C 725.2,898 898,725.2 898,512 C 898,298.8 725.2,126 512,126 Z M 512,194 C 687.6,194 830,336.4 830,512 C 830,687.6 687.6,830 512,830 C 336.4,830 194,687.6 194,512 C 194,336.4 336.4,194 512,194 Z"/>
  <path d="M 512,246 C 536.3,246 556,265.7 556,290 L 556,482 L 588.6,449.4 C 605.8,432.2 633.7,432.2 650.9,449.4 C 668.1,466.6 668.1,494.5 650.9,511.7 L 538.7,623.9 C 524,638.6 500,638.6 485.3,623.9 L 373.1,511.7 C 355.9,494.5 355.9,466.6 373.1,449.4 C 390.3,432.2 418.2,432.2 435.4,449.4 L 468,482 L 468,290 C 468,265.7 487.7,246 512,246 Z"/>
  <path d="M 338,584 C 354.6,584 368,597.4 368,614 L 368,628 C 368,645.7 382.3,660 400,660 L 624,660 C 641.7,660 656,645.7 656,628 L 656,614 C 656,597.4 669.4,584 686,584 C 702.6,584 716,597.4 716,614 L 716,632 C 716,680.6 676.6,720 628,720 L 396,720 C 347.4,720 308,680.6 308,632 L 308,614 C 308,597.4 321.4,584 338,584 Z"/>
</svg>`;

    window.AbitIcon = {
        appSvg: ABIT_ICON_SVG,
        symbolSvg: ABIT_SYMBOL_SVG
    };

    if (typeof customElements !== 'undefined' && !customElements.get('abit-icon')) {
        customElements.define('abit-icon', class extends HTMLElement {
            connectedCallback() {
                const size = this.getAttribute('size') || '36';
                const variant = this.getAttribute('variant') || 'app';
                this.style.display = 'inline-block';
                this.style.width = isNaN(size) ? size : `${size}px`;
                this.style.height = isNaN(size) ? size : `${size}px`;
                this.style.lineHeight = '0';
                this.style.verticalAlign = 'middle';
                this.innerHTML = variant === 'symbol' ? ABIT_SYMBOL_SVG : ABIT_ICON_SVG;
            }
        });
    }
