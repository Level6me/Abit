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

    // Polling System
    let netHistory = Array(20).fill(null).map(() => ({ down: 0, up: 0 }));
    let qbtVersion = '--';
    let webapiVersion = '--';
    let fastPollTimer = null;
    let slowPollTimer = null;
    let rawLogs = [];
