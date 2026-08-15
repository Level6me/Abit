#!/usr/bin/env node

/**
 * @file build.js
 * @description Zero-dependency build & bundle pipeline for Apple Torrent Dashboard (Torrent Omni)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const CSS_ORDER = [
    'variables.css',
    'base.css',
    'layout.css',
    'components.css',
    'torrents.css',
    'dock.css',
    'modal.css'
];

const JS_ORDER = [
    'i18n.js',
    'constants.js',
    'state.js',
    'utils.js',
    'api.js',
    'chart.js',
    'torrents.js',
    'search.js',
    'rss.js',
    'system.js',
    'ui.js',
    'app.js'
];

function formatKB(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB';
}

function build() {
    const startTime = Date.now();
    console.log('🍏 Starting build process for Apple Torrent Dashboard (Torrent Omni)...\n');

    // Ensure output directories exist
    [DIST_DIR, path.join(DIST_DIR, 'css'), path.join(DIST_DIR, 'js'), PUBLIC_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // 1. Bundle CSS Modules
    console.log('📦 [1/4] Bundling modular CSS files...');
    let combinedCss = '/* Apple Torrent Dashboard (Torrent Omni) — Bundled Stylesheet */\n\n';
    for (const file of CSS_ORDER) {
        const filePath = path.join(SRC_DIR, 'css', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8').trim();
            combinedCss += `/* --- [Module: ${file}] --- */\n${content}\n\n`;
        } else {
            console.warn(`⚠️ Warning: Missing CSS module: ${file}`);
        }
    }
    const distCssPath = path.join(DIST_DIR, 'css', 'style.css');
    fs.writeFileSync(distCssPath, combinedCss.trim() + '\n');
    console.log(`   └─ dist/css/style.css (${formatKB(Buffer.byteLength(combinedCss))})`);

    // 2. Bundle JS Modules
    console.log('📦 [2/4] Bundling modular JS files...');
    let combinedJs = '/**\n * Apple Torrent Dashboard (Torrent Omni) — Bundled Application Logic\n */\n\n';
    for (const file of JS_ORDER) {
        const filePath = path.join(SRC_DIR, 'js', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8').trim();
            combinedJs += `// --- [Module: ${file}] ---\n${content}\n\n`;
        } else {
            console.warn(`⚠️ Warning: Missing JS module: ${file}`);
        }
    }
    const distJsPath = path.join(DIST_DIR, 'js', 'app.bundle.js');
    fs.writeFileSync(distJsPath, combinedJs.trim() + '\n');
    console.log(`   └─ dist/js/app.bundle.js (${formatKB(Buffer.byteLength(combinedJs))})`);

    // 3. Generate Standalone Single-File dist/index.html from src/index.html
    console.log('🔨 [3/4] Generating standalone single-file distribution (dist/index.html)...');
    const srcIndexPath = path.join(SRC_DIR, 'index.html');
    if (!fs.existsSync(srcIndexPath)) {
        console.error('❌ Error: src/index.html template not found!');
        process.exit(1);
    }

    let srcHtml = fs.readFileSync(srcIndexPath, 'utf8');

    // Replace modular CSS link tag with inlined CSS
    const inlineCss = `<style>\n${combinedCss.trim()}\n</style>`;
    srcHtml = srcHtml.replace(/<link\s+rel="stylesheet"\s+href="[^"]*css\/style\.css"[^>]*>/i, inlineCss);

    // Replace all modular script tags with single inlined script
    const modularScriptTagsRegex = /(?:[ \t]*<script\s+src="js\/[a-zA-Z0-9_\.-]+\.js"><\/script>\s*\n?)+/gi;
    const inlineJs = `<script>\n${combinedJs.trim()}\n</script>`;
    
    let standaloneHtml = srcHtml.replace(modularScriptTagsRegex, inlineJs + '\n');
    if (!standaloneHtml.includes('<script>\n/**\n * Apple Torrent Dashboard')) {
        // Fallback injection before </body>
        standaloneHtml = standaloneHtml.replace('</body>', `${inlineJs}\n</body>`);
    }

    const distIndexPath = path.join(DIST_DIR, 'index.html');
    fs.writeFileSync(distIndexPath, standaloneHtml);
    console.log(`   └─ dist/index.html (${formatKB(Buffer.byteLength(standaloneHtml))})`);

    // 4. Generate & Synchronize Modular Multi-File Distribution into public/
    console.log('📂 [4/4] Generating modular multi-file distribution in public/...');
    const publicCssDir = path.join(PUBLIC_DIR, 'css');
    const publicJsDir = path.join(PUBLIC_DIR, 'js');
    if (!fs.existsSync(publicCssDir)) fs.mkdirSync(publicCssDir, { recursive: true });
    if (!fs.existsSync(publicJsDir)) fs.mkdirSync(publicJsDir, { recursive: true });

    // Copy all individual CSS modules to public/css/
    let publicCssCount = 0;
    const srcCssDir = path.join(SRC_DIR, 'css');
    fs.readdirSync(srcCssDir).forEach(file => {
        if (file.endsWith('.css')) {
            fs.copyFileSync(path.join(srcCssDir, file), path.join(publicCssDir, file));
            publicCssCount++;
        }
    });

    // Copy all individual JS modules to public/js/
    let publicJsCount = 0;
    const srcJsDir = path.join(SRC_DIR, 'js');
    fs.readdirSync(srcJsDir).forEach(file => {
        if (file.endsWith('.js')) {
            fs.copyFileSync(path.join(srcJsDir, file), path.join(publicJsDir, file));
            publicJsCount++;
        }
    });

    // Generate public/index.html with granular modular CSS link tags and cache-busting timestamp
    const versionStamp = Date.now();
    const modularCssLinks = CSS_ORDER
        .map(file => `    <link rel="stylesheet" href="css/${file}?v=${versionStamp}">`)
        .join('\n');

    let publicHtml = fs.readFileSync(srcIndexPath, 'utf8');
    publicHtml = publicHtml.replace(
        /<link\s+rel="stylesheet"\s+href="[^"]*css\/style\.css"[^>]*>/i,
        `<!-- Modular Granular Stylesheets -->\n${modularCssLinks}`
    );
    publicHtml = publicHtml.replace(
        /<script\s+src="js\/([a-zA-Z0-9_\.-]+\.js)"><\/script>/gi,
        `<script src="js/$1?v=${versionStamp}"></script>`
    );
    const publicIndexPath = path.join(PUBLIC_DIR, 'index.html');
    fs.writeFileSync(publicIndexPath, publicHtml);

    // Sync Standalone Output to Root index.html
    const rootIndexPath = path.join(ROOT_DIR, 'index.html');
    fs.writeFileSync(rootIndexPath, standaloneHtml);

    console.log(`   ├─ public/index.html (Modular Structure Entry) (${formatKB(Buffer.byteLength(publicHtml))})`);
    console.log(`   ├─ public/css/ (${publicCssCount} Granular CSS Files)`);
    console.log(`   ├─ public/js/ (${publicJsCount} Granular JS Files)`);
    console.log(`   └─ index.html (Root WebUI Standalone Entry) (${formatKB(Buffer.byteLength(standaloneHtml))})`);

    const elapsed = Date.now() - startTime;
    console.log(`\n🎉 Build successfully completed in ${elapsed}ms!\n`);
}

if (require.main === module) {
    build();
}

module.exports = { build };
