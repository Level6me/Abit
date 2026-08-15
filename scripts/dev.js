#!/usr/bin/env node

/**
 * @file dev.js
 * @description Zero-dependency local development server with mock API & live qBittorrent proxy support
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = path.resolve(__dirname, '..');
const isDistMode = process.argv.includes('--dist');
const BASE_DIR = isDistMode ? path.join(ROOT_DIR, 'dist') : path.join(ROOT_DIR, 'src');

// Optional upstream qBittorrent target for live proxy (e.g., --qbt=http://127.0.0.1:8080 or env QBT_TARGET)
let qbtTarget = process.env.QBT_TARGET || null;
process.argv.forEach(arg => {
    if (arg.startsWith('--qbt=')) qbtTarget = arg.split('=')[1];
    if (arg.startsWith('--port=')) PORT = parseInt(arg.split('=')[1], 10);
});

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Realistic mock data for offline standalone development
const mockTorrents = [
    {
        hash: "3a5e8f498b201a4e5c89d71b40280193427acde1",
        name: "Ubuntu.24.04.LTS.Desktop.amd64.iso",
        size: 6124000000,
        progress: 0.854,
        state: "downloading",
        dlspeed: 24500000,
        upspeed: 1200000,
        eta: 145,
        category: "ISO / Linux",
        num_seeds: 284,
        num_leechs: 42,
        save_path: "/downloads/linux/",
        added_on: Math.floor(Date.now() / 1000) - 3600
    },
    {
        hash: "7f9b2c8a1e345d609871ab43e0129487cba65432",
        name: "OpenAI.Whisper.Large.V3.Weights.fp16.bin",
        size: 3090000000,
        progress: 1.0,
        state: "uploading",
        dlspeed: 0,
        upspeed: 5800000,
        eta: 8640000,
        category: "AI Models",
        num_seeds: 92,
        num_leechs: 18,
        save_path: "/downloads/ai/",
        added_on: Math.floor(Date.now() / 1000) - 86400
    },
    {
        hash: "bc418a09e273415cd78201a4e5c89d71b4028019",
        name: "Big.Buck.Bunny.4K.60FPS.H265.10bit.mkv",
        size: 1420000000,
        progress: 0.32,
        state: "pausedDL",
        dlspeed: 0,
        upspeed: 0,
        eta: 8640000,
        category: "Media",
        num_seeds: 15,
        num_leechs: 4,
        save_path: "/downloads/media/",
        added_on: Math.floor(Date.now() / 1000) - 172800
    }
];

function handleMockApi(req, res, pathname) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (pathname === '/api/v2/transfer/info') {
        const dlSpeed = Math.floor(20000000 + Math.random() * 8000000);
        const upSpeed = Math.floor(4000000 + Math.random() * 2000000);
        return res.end(JSON.stringify({
            connection_status: "connected",
            dht_nodes: 428,
            dl_info_data: 85942819200,
            dl_info_speed: dlSpeed,
            up_info_data: 34182910400,
            up_info_speed: upSpeed,
            free_space_on_disk: 1482910485760
        }));
    }

    if (pathname === '/api/v2/torrents/info') {
        return res.end(JSON.stringify(mockTorrents));
    }

    if (pathname === '/api/v2/torrents/categories') {
        return res.end(JSON.stringify({
            "ISO / Linux": { name: "ISO / Linux", savePath: "/downloads/linux/" },
            "AI Models": { name: "AI Models", savePath: "/downloads/ai/" },
            "Media": { name: "Media", savePath: "/downloads/media/" }
        }));
    }

    if (pathname === '/api/v2/app/version') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('v4.6.5');
    }

    if (pathname === '/api/v2/app/webapiVersion') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('2.9.3');
    }

    if (pathname === '/api/v2/transfer/speedLimitsMode') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('0');
    }

    if (pathname === '/api/v2/search/plugins') {
        return res.end(JSON.stringify([
            { name: "1337x", fullName: "1337x Engine", enabled: true, version: "2.1", url: "https://1337x.to" },
            { name: "ThePirateBay", fullName: "The Pirate Bay", enabled: true, version: "3.0", url: "https://thepiratebay.org" },
            { name: "Nyaa", fullName: "Nyaa.si ACG", enabled: true, version: "1.4", url: "https://nyaa.si" }
        ]));
    }

    if (pathname === '/api/v2/rss/items') {
        return res.end(JSON.stringify({
            "Linux Weekly Releases": {
                uid: "rss_1",
                url: "https://distrowatch.com/news/dwd.xml",
                title: "Linux Weekly Releases",
                lastBuildDate: new Date().toUTCString(),
                isLoading: false,
                articles: [
                    { id: "1", title: "Arch Linux 2026.08.01 Released", torrentURL: "magnet:?xt=urn:btih:archlinux" },
                    { id: "2", title: "Fedora 43 Workstation Beta", torrentURL: "magnet:?xt=urn:btih:fedora43" }
                ]
            }
        }));
    }

    if (pathname === '/api/v2/rss/rules') {
        return res.end(JSON.stringify({
            "Auto Ubuntu Downloads": {
                enabled: true,
                mustContain: "Ubuntu",
                mustNotContain: "Server",
                savePath: "/downloads/linux/",
                assignedCategory: "ISO / Linux"
            }
        }));
    }

    if (pathname === '/api/v2/app/preferences') {
        return res.end(JSON.stringify({
            save_path: "/downloads",
            temp_path: "/downloads/temp",
            temp_path_enabled: true,
            max_connec: 500,
            max_connec_per_torrent: 100,
            listen_port: 6881,
            up_limit: 0,
            dl_limit: 0,
            alt_up_limit: 1024000,
            alt_dl_limit: 5120000,
            dht: true,
            pex: true,
            lsd: true,
            encryption: 1,
            autorun_enabled: false,
            autorun_program: "",
            queueing_enabled: true,
            max_active_downloads: 5,
            max_active_torrents: 10,
            max_active_uploads: 5
        }));
    }

    if (pathname === '/api/v2/log/main') {
        return res.end(JSON.stringify([
            { id: 1, message: "qBittorrent WebUI session authenticated.", timestamp: Math.floor(Date.now() / 1000) - 60, type: 1 },
            { id: 2, message: "DHT nodes listening on port 6881 (428 nodes).", timestamp: Math.floor(Date.now() / 1000) - 45, type: 1 },
            { id: 3, message: "Torrent Omni WebUI theme initialized successfully.", timestamp: Math.floor(Date.now() / 1000) - 10, type: 1 }
        ]));
    }

    // Generic OK for action endpoints (pause, resume, etc.)
    return res.end(JSON.stringify({ result: "Ok" }));
}

function proxyRequest(req, res, targetUrl) {
    const parsedTarget = url.parse(targetUrl);
    const targetHost = `${parsedTarget.hostname}:${parsedTarget.port || 80}`;
    const proxyHeaders = {
        ...req.headers,
        host: targetHost,
        origin: `http://${targetHost}`,
        referer: `http://${targetHost}/`
    };
    const options = {
        hostname: parsedTarget.hostname,
        port: parsedTarget.port || (parsedTarget.protocol === 'https:' ? 443 : 80),
        path: req.url,
        method: req.method,
        headers: proxyHeaders
    };

    const client = (parsedTarget.protocol === 'https:' ? require('https') : http);
    const proxyReq = client.request(options, proxyRes => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
        console.warn(`[Proxy Fallback] Upstream unavailable (${err.message}). Falling back to Mock API.`);
        handleMockApi(req, res, url.parse(req.url).pathname);
    });

    req.pipe(proxyReq);
}

// Resolve a web page URL by fetching it and extracting magnet / .torrent links.
// Used by the search page when a plugin returns a download-page URL instead of a
// direct magnet link (qBittorrent silently ignores such URLs).
function handleResolveRequest(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 65536) req.destroy(); });
    req.on('end', () => {
        let target = '';
        try {
            const params = new URLSearchParams(body);
            target = params.get('url') || '';
        } catch (e) { /* ignore */ }
        if (!/^https?:\/\//i.test(target)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ error: 'bad url', magnets: [], torrents: [] }));
        }

        const client = (target.startsWith('https:') ? require('https') : http);
        const reqOut = client.get(target, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (Abit Bot)' } }, outRes => {
            let html = '';
            outRes.on('data', d => {
                html += d;
                if (html.length > 2097152) { outRes.destroy(); }  // 2MB cap
            });
            outRes.on('end', () => {
                const magnets = (html.match(/magnet:\?[^"'<>\s]+/gi) || [])
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 20);
                const torrents = (html.match(/https?:\/\/[^"'<>\s]+\.torrent[^"'<>\s]*/gi) || [])
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 20);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ url: target, magnets: magnets, torrents: torrents }));
            });
        });
        reqOut.on('error', () => {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'fetch failed', magnets: [], torrents: [] }));
        });
        reqOut.on('timeout', () => {
            reqOut.destroy();
            res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'timeout', magnets: [], torrents: [] }));
        });
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // CORS Headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // 1. Handle API requests
    if (pathname === '/api/v2/abit/resolve') {
        return handleResolveRequest(req, res);
    }
    if (pathname.startsWith('/api/v2/')) {
        if (qbtTarget) {
            return proxyRequest(req, res, qbtTarget);
        } else {
            return handleMockApi(req, res, pathname);
        }
    }

    // 2. Static File Serving
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    let filePath = path.join(BASE_DIR, pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        return res.end('403 Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(`404 Not Found: ${pathname}`);
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n🍏 Torrent Omni Local Development Server is running!`);
    console.log(`   ├─ Serving: ${isDistMode ? 'dist/ (Production Standalone)' : 'src/ (Modular Development Source)'}`);
    console.log(`   ├─ Mode:    ${qbtTarget ? `Live Proxy -> ${qbtTarget}` : 'Mock API (Zero-Dependency Offline Mode)'}`);
    console.log(`   └─ URL:     http://localhost:${PORT}\n`);
});
