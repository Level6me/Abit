# 🍏 Abit — Apple Style qBittorrent Alternative WebUI

> **Language:** English (this file) · **中文** ([README.zh-CN.md](README.zh-CN.md))

> *An Apple-style alternative Web UI for qBittorrent — beautiful, lightweight, frosted-glass design.*

<p align="center">
  <img src="assets/preview.jpg" alt="Abit Preview" width="800" />
</p>

A polished, lightweight, high-fidelity **alternative Web UI for qBittorrent**, designed with a modern Apple iOS / macOS frosted-glass aesthetic.

It talks directly to the qBittorrent native Web API and runs entirely in the browser sandbox — no Python/Node backend service required. Open it and it just works.

---

## 📐 Architecture & Directory Layout

The project follows a standard split between **modular source code (`src/`)** and **standalone zero-dependency build output (`dist/` / `public/`)**:

```
Abit/
├── src/                    # Modular source code
│   ├── index.html          # Development template entry
│   ├── css/                # Modular stylesheets
│   │   ├── variables.css   # Theme palette & CSS variables
│   │   ├── base.css        # Reset & typography
│   │   ├── layout.css      # Grid & containers
│   │   ├── components.css  # Buttons, cards, toasts, pagination
│   │   ├── torrents.css    # Torrents UI
│   │   ├── dock.css        # Bottom frosted-glass dock
│   │   ├── modal.css       # Modals & drawers
│   │   └── style.css       # CSS module entry
│   └── js/                 # Modular JavaScript
│       ├── i18n.js         # zh/en internationalization & persistence
│       ├── constants.js    # Global constants & preset plugins
│       ├── state.js        # Global application state
│       ├── utils.js        # Formatters, debounce, XSS-safe helpers
│       ├── api.js          # API layer & authentication
│       ├── chart.js        # Live transfer speed chart
│       ├── torrents.js     # Torrent management / filtering / details
│       ├── search.js       # Web-wide search & plugin system
│       ├── rss.js          # RSS subscriptions & auto-download rules
│       ├── system.js       # Preferences / categories / trackers / logs
│       ├── ui.js           # Navigation / theme / shortcuts / drag-drop
│       └── app.js          # Entry point & adaptive polling
├── scripts/                # Build & dev tooling
│   ├── build.js            # Zero-dependency bundler
│   ├── dev.js              # Zero-dependency local dev server
│   └── check.js            # Syntax & integrity checks
├── dist/                   # Standalone single-file production build
│   ├── index.html          # Single-file standalone WebUI
│   ├── css/style.css       # Bundled CSS
│   └── js/app.bundle.js    # Bundled JS
├── public/                 # Modular multi-file static output (recommended WebUI target)
│   ├── index.html          # Modular HTML entry
│   ├── css/                # Individual CSS modules
│   └── js/                 # Individual JS modules
├── index.html              # Root single-file mirror entry
├── package.json            # NPM project manifest
├── .gitignore
├── README.md               # Project guide (English)
└── README.zh-CN.md         # 项目指南（中文）
```

---

## 🌟 Features

1. **Zero overhead**: everything runs in the browser; the server needs no extra Python/Node daemons or ports.
2. **Native API driven**: torrents, magnet adds, speed limits, RSS rules and web search all use qBittorrent's native Web API.
3. **Rich data views**:
   - Live connection status and DHT node count.
   - Smooth real-time download/upload rate chart.
   - Free disk space and lifetime transfer totals.
4. **Modern interactions**:
   - 🌓 Auto / light / dark theme.
   - 🌐 Bilingual UI (简体中文 / English) — the chosen language is persisted automatically.
   - 🗂️ Seamless card grid ↔ compact table views.
   - ⚡ Batch actions, safe-confirm dialogs, right-click & drag-drop torrent adds, clipboard magnet detection.
   - ⌨️ Shortcuts: `1-5` navigation, `/` or `F` filter, `N` new torrent, `Esc` close modal.
   - 🔍 Web-wide search with 14 verified official/community plugins, 20-per-page pagination and sequential numbering; search results are persisted so they survive page refreshes.

---

## 🛠️ Local Development & Build

The project ships a pure Node.js, zero-dependency toolchain:

```bash
# 1. Syntax & integrity check
npm run check
# or
node scripts/check.js

# 2. Local dev server (offline mock preview or proxy to a real qBittorrent)
npm run dev
# or proxy to a real qBittorrent:
node scripts/dev.js --qbt=http://127.0.0.1:8080

# 3. Production build (bundles CSS/JS and syncs dist/ + public/)
npm run build
# or
node scripts/build.js
```

---

## ⚡ One-Click Install & Configuration (Recommended)

Run the one-click installer on your server — it auto-detects the install path, locates the qBittorrent config, writes the alternative-WebUI settings and restarts everything cleanly:

```bash
# Option A: remote one-liner (no manual clone needed)
curl -sSL https://raw.githubusercontent.com/Level6me/Abit/main/install.sh | bash

# Option B: from a local checkout
bash install.sh
```

`install.sh` supports multiple platforms (Debian/Ubuntu, Fedora/RHEL, Arch, Alpine, macOS) and Docker deployments, and includes:
- Automatic qBittorrent / Node.js bootstrap via the platform package manager
- Configurable ports: `ABIT_EXT_PORT=8090 bash install.sh`
- Security modes: `ABIT_INSECURE=1 bash install.sh` disables CSRF/local-host auth checks (do **not** expose to the public internet)
- PM2 startup persistence, re-runnable updates, and uninstall via `bash install.sh uninstall`

---

## 🚀 Manual Deployment & Alternative WebUI Setup

Prefer to configure manually:

1. **Clone and build**:
   ```bash
   git clone https://github.com/Level6me/Abit.git /home/ubuntu/Abit
   cd /home/ubuntu/Abit
   node scripts/build.js
   ```
2. **Enable the alternative Web UI**:
   - Open your qBittorrent web console (or edit `~/.config/qBittorrent/qBittorrent.conf`).
   - Under **“Use alternative Web UI”**, point **“Files path”** to the project root directory (e.g. `/home/ubuntu/Abit`):
     ```ini
     WebUI\AlternativeUIEnabled=true
     WebUI\RootFolder=/home/ubuntu/Abit
     ```
3. **Save and restart qBittorrent**, then refresh the browser to enjoy the Apple-style Abit panel.

---

## ❓ FAQ

* **Q: I get `Unacceptable file type, only regular file is allowed`.**
  * **A**: Ensure `WebUI\RootFolder` points to the project root `/home/ubuntu/Abit` (containing the `public/` directory). qBittorrent native WebUI automatically resolves routes within `RootFolder/public/`.
* **Q: The page shows “Offline / Not logged in”.**
  * **A**: The theme talks to the API through your browser session. Log in with your qBittorrent credentials when prompted, and it will reconnect.
* **Q: The search “Download” button does nothing / no task appears.**
  * **A**: If the search result only provides a download-page link (not a magnet or `.torrent` direct link), qBittorrent cannot resolve it. The page now tries to parse the page and extract a magnet automatically; if that still fails, copy the magnet link and add it via “New torrent”.
* **Q: How do I apply changes made in `src/`?**
  * **A**: Run `npm run build` (or `node scripts/build.js`); the bundler regenerates the latest `dist/` and `public/` output.
