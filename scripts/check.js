#!/usr/bin/env node

/**
 * @file check.js
 * @description Project integrity, syntax validation, and module consistency checker
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

let errors = 0;

console.log('🔍 Running project integrity & syntax checks...\n');

// 1. Check CSS Modules
console.log('📋 [1/3] Checking CSS modules...');
const cssDir = path.join(SRC_DIR, 'css');
if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    console.log(`   Found ${cssFiles.length} CSS files: ${cssFiles.join(', ')}`);
    cssFiles.forEach(file => {
        const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
        if (content.length === 0) {
            console.error(`   ❌ Warning: Empty CSS file: ${file}`);
            errors++;
        }
    });
} else {
    console.error('   ❌ Error: src/css directory missing!');
    errors++;
}

// 2. Check JS Modules
console.log('\n📋 [2/3] Checking JS modules syntax & structure...');
const jsDir = path.join(SRC_DIR, 'js');
if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    console.log(`   Found ${jsFiles.length} JS files: ${jsFiles.join(', ')}`);
    jsFiles.forEach(file => {
        const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
        try {
            // Check syntax with VM Script
            new vm.Script(content);
            console.log(`   ✅ ${file} (Valid JavaScript syntax)`);
        } catch (e) {
            console.error(`   ❌ Syntax Error in ${file}: ${e.message}`);
            errors++;
        }
    });
} else {
    console.error('   ❌ Error: src/js directory missing!');
    errors++;
}

// 3. Check HTML Template
console.log('\n📋 [3/3] Checking HTML template (src/index.html)...');
const srcHtmlPath = path.join(SRC_DIR, 'index.html');
if (fs.existsSync(srcHtmlPath)) {
    const htmlContent = fs.readFileSync(srcHtmlPath, 'utf8');
    if (htmlContent.includes('id="p-dash"') && htmlContent.includes('id="p-torrents"')) {
        console.log('   ✅ src/index.html verified successfully.');
    } else {
        console.error('   ❌ src/index.html is missing essential root pages!');
        errors++;
    }
} else {
    console.error('   ❌ Error: src/index.html missing!');
    errors++;
}

console.log('\n----------------------------------------');
if (errors === 0) {
    console.log('🎉 All checks passed! Project is clean and sound.\n');
    process.exit(0);
} else {
    console.error(`❌ Check completed with ${errors} issue(s).\n`);
    process.exit(1);
}
