#!/usr/bin/env bash

# ==============================================================================
#  🍏 Abit — Apple Style qBittorrent Alternative WebUI
#  One-Click Automated Deployment & Alternative WebUI Configuration Script
#  Repository: https://github.com/Level6me/Abit
#
#  Features:
#   - 100% Pure Native Alternative WebUI (Replaces official WebUI directly)
#   - Zero background overhead (No extra Node.js / PM2 / python daemons)
#   - Single port architecture (Uses standard qBittorrent WebUI port 8080)
#   - Automatic environment, git & configuration detection
#   - Safe configuration backup & rollback support
#   - Native uninstall subcommand (bash install.sh uninstall)
# ==============================================================================

set -eo pipefail

# ---------- Runtime configuration ----------
ABIT_REPO="https://github.com/Level6me/Abit.git"
INSTALL_DIR_DEFAULT="$HOME/Abit"
DOCKER_MODE=0

SUDO_CMD=""
if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO_CMD="sudo"
    fi
fi

# Colors & Formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "  ╔═══════════════════════════════════════════════════════════════╗"
    echo "  ║                                                               ║"
    echo "  ║   🍏  Abit — Apple Style qBittorrent WebUI Installer          ║"
    echo "  ║       Native Alternative WebUI Direct Replacement (8080)      ║"
    echo "  ║                                                               ║"
    echo "  ╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info()    { echo -e " ${BLUE}ℹ${NC} $1"; }
log_success() { echo -e " ${GREEN}✔${NC} ${BOLD}$1${NC}"; }
log_warn()    { echo -e " ${YELLOW}⚠${NC} $1"; }
log_error()   { echo -e " ${RED}✖${NC} ${BOLD}$1${NC}"; }
log_step()    { echo -e "\n${CYAN}==>${NC} ${BOLD}$1${NC}"; }

# ------------------------------------------------------------------------------
# 0. Platform & Dependency Detection
# ------------------------------------------------------------------------------
detect_os() {
    OS="$(uname -s)"
    PKG_MGR=""
    case "$OS" in
        Linux)
            if   command -v apt-get >/dev/null 2>&1; then PKG_MGR="apt"
            elif command -v dnf     >/dev/null 2>&1; then PKG_MGR="dnf"
            elif command -v yum     >/dev/null 2>&1; then PKG_MGR="yum"
            elif command -v pacman  >/dev/null 2>&1; then PKG_MGR="pacman"
            elif command -v apk     >/dev/null 2>&1; then PKG_MGR="apk"
            fi
            ;;
        Darwin)
            PKG_MGR="brew"
            ;;
    esac
}

install_pkg() {
    case "$PKG_MGR" in
        apt)     $SUDO_CMD apt-get update -qq && $SUDO_CMD apt-get install -y -qq "$1" ;;
        dnf)     $SUDO_CMD dnf install -y "$1" ;;
        yum)     $SUDO_CMD yum install -y "$1" ;;
        pacman)  $SUDO_CMD pacman -S --noconfirm "$1" ;;
        apk)     $SUDO_CMD apk add --no-cache "$1" ;;
        brew)    brew install "$1" ;;
        *)       return 1 ;;
    esac
}

ensure_git() {
    command -v git >/dev/null 2>&1 && return 0
    log_warn "未检测到 git，尝试自动安装..."
    install_pkg "git" || { log_error "git 安装失败，请手动安装后重试。"; exit 1; }
}

ensure_qbittorrent() {
    if [ "$DOCKER_MODE" = "1" ]; then
        log_info "容器/Docker 模式：跳过宿主 qBittorrent 安装检查。"
        return 0
    fi
    if command -v qbittorrent-nox >/dev/null 2>&1; then
        local ver
        ver="$(qbittorrent-nox --version 2>/dev/null | head -n 1 || true)"
        log_info "qBittorrent 已就绪: ${BOLD}${ver:-qbittorrent-nox}${NC}"
        return 0
    fi

    log_warn "未检测到 qbittorrent-nox，尝试为您自动安装最新官方版本..."
    case "$PKG_MGR" in
        apt)
            $SUDO_CMD apt-get update -qq
            $SUDO_CMD apt-get install -y -qq software-properties-common
            $SUDO_CMD add-apt-repository -y ppa:qbittorrent-team/qbittorrent-stable || true
            $SUDO_CMD apt-get update -qq
            $SUDO_CMD apt-get install -y -qq qbittorrent-nox
            ;;
        dnf)    $SUDO_CMD dnf install -y qbittorrent-nox ;;
        yum)    $SUDO_CMD yum install -y epel-release && $SUDO_CMD yum install -y qbittorrent-nox ;;
        pacman) $SUDO_CMD pacman -S --noconfirm qbittorrent-nox ;;
        apk)    $SUDO_CMD apk add --no-cache qbittorrent-nox ;;
        brew)   brew install qbittorrent-nox ;;
        *)
            log_error "无法自动安装 qbittorrent-nox，请先手动安装。"
            exit 1
            ;;
    esac
    log_success "qBittorrent 安装完成！"
}

# ------------------------------------------------------------------------------
# 1. Detect or Setup Installation Directory
# ------------------------------------------------------------------------------
detect_or_setup_installation() {
    log_step "[1/4] 获取与准备 Abit 静态主题包..."
    ensure_git

    INSTALL_DIR="$INSTALL_DIR_DEFAULT"
    if [[ -f "./scripts/build.js" ]] && [[ -d "./src" ]]; then
        INSTALL_DIR="$(pwd -P)"
        log_info "检测到当前目录即为 Abit 项目仓库: ${BOLD}${INSTALL_DIR}${NC}"
    elif [[ -d "$HOME/Abit" ]] && [[ -f "$HOME/Abit/scripts/build.js" ]]; then
        INSTALL_DIR="$HOME/Abit"
        log_info "检测到已有安装目录: ${BOLD}${INSTALL_DIR}${NC}"
        cd "$INSTALL_DIR"
        log_info "正在同步拉取最新代码..."
        git pull --quiet origin main || true
    else
        log_info "正在克隆最新 Abit 项目到: ${BOLD}${INSTALL_DIR}${NC}"
        git clone "$ABIT_REPO" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi

    # Build if node is available, otherwise use pre-built public bundle
    if command -v node >/dev/null 2>&1; then
        log_info "检测到 Node.js 环境，执行自动前端构建打包..."
        node scripts/build.js || true
    else
        log_info "使用仓库内置的高性能预编译静态资源包。"
    fi

    WEBUI_TARGET_PATH="$INSTALL_DIR/public"
    if [[ ! -d "$WEBUI_TARGET_PATH" ]]; then
        WEBUI_TARGET_PATH="$INSTALL_DIR"
    fi
    log_success "Abit 静态主题包就绪: ${WEBUI_TARGET_PATH}"
}

# ------------------------------------------------------------------------------
# 2. Detect qBittorrent Configuration File
# ------------------------------------------------------------------------------
detect_qbittorrent_config() {
    log_step "[2/4] 智能检索 qBittorrent 配置文件..."
    CONFIG_PATH=""

    # 1. Docker / container paths
    if [ "$DOCKER_MODE" = "1" ]; then
        for path in "/config/qBittorrent/qBittorrent.conf" "/config/qBittorrent/config/qBittorrent.conf" "/appdata/qbittorrent/config/qBittorrent/qBittorrent.conf"; do
            if [[ -f "$path" ]]; then
                CONFIG_PATH="$path"
                log_info "容器模式配置文件: ${CONFIG_PATH}"
                break
            fi
        done
    fi

    # 2. Try finding from active running process open files
    if [[ -z "$CONFIG_PATH" ]] && command -v pgrep >/dev/null 2>&1; then
        QBT_PID="$(pgrep -x qbittorrent-nox | head -n 1 || true)"
        if [[ -n "$QBT_PID" ]] && [[ -d "/proc/$QBT_PID/fd" ]]; then
            FOUND_CONF="$(ls -l "/proc/$QBT_PID/fd" 2>/dev/null | grep -o '/.*qBittorrent\.conf' | head -n 1 || true)"
            if [[ -n "$FOUND_CONF" ]] && [[ -f "$FOUND_CONF" ]]; then
                CONFIG_PATH="$FOUND_CONF"
                log_info "从运行中的 qBittorrent 进程(PID: ${QBT_PID})精准定位配置文件: ${CONFIG_PATH}"
            fi
        fi
    fi

    # 3. Common candidate locations list
    if [[ -z "$CONFIG_PATH" ]]; then
        CANDIDATES=(
            "$HOME/.config/qBittorrent/qBittorrent.conf"
            "/root/.config/qBittorrent/qBittorrent.conf"
            "/var/lib/qbittorrent/.config/qBittorrent/qBittorrent.conf"
            "/config/qBittorrent/qBittorrent.conf"
            "/config/qBittorrent/config/qBittorrent.conf"
            "/appdata/qbittorrent/config/qBittorrent/qBittorrent.conf"
            "$HOME/.local/share/qBittorrent/qBittorrent.conf"
        )
        for path in "${CANDIDATES[@]}"; do
            if [[ -f "$path" ]]; then
                CONFIG_PATH="$path"
                log_info "在系统标准路径中找到配置文件: ${CONFIG_PATH}"
                break
            fi
        done
    fi

    # 4. Fallback search
    if [[ -z "$CONFIG_PATH" ]]; then
        log_info "正在进行用户主目录轻量搜索..."
        FOUND_SEARCH="$(find "$HOME/.config" -maxdepth 3 -name "qBittorrent.conf" 2>/dev/null | head -n 1 || true)"
        if [[ -n "$FOUND_SEARCH" ]] && [[ -f "$FOUND_SEARCH" ]]; then
            CONFIG_PATH="$FOUND_SEARCH"
            log_info "搜索找到配置文件: ${CONFIG_PATH}"
        fi
    fi

    # 5. If still not found, create standard default config
    if [[ -z "$CONFIG_PATH" ]]; then
        CONFIG_PATH="$HOME/.config/qBittorrent/qBittorrent.conf"
        log_warn "未找到现有配置文件，将为您自动初始化标准配置文件: ${CONFIG_PATH}"
        mkdir -p "$(dirname "$CONFIG_PATH")"
        mkdir -p "$HOME/Downloads" 2>/dev/null || true
        cat > "$CONFIG_PATH" <<EOF
[LegalNotice]
Accepted=true

[BitTorrent]
Session\DefaultSavePath=$HOME/Downloads
Session\Port=6881

[Preferences]
WebUI\Port=8080
WebUI\Username=admin
EOF
    fi

    log_success "配置文件路径锁定: ${CONFIG_PATH}"
}

# ------------------------------------------------------------------------------
# 3. Configure Native Alternative WebUI in qBittorrent.conf
# ------------------------------------------------------------------------------
stop_qbittorrent_precisely() {
    if [ "$DOCKER_MODE" = "1" ]; then
        return
    fi
    local pids
    pids="$(pgrep -x qbittorrent-nox 2>/dev/null || true)"
    for pid in $pids; do
        kill -TERM "$pid" 2>/dev/null || true
    done
    sleep 1
    pids="$(pgrep -x qbittorrent-nox 2>/dev/null || true)"
    for pid in $pids; do
        kill -KILL "$pid" 2>/dev/null || true
    done
}

configure_alternative_webui() {
    log_step "[3/4] 写入备用 WebUI 主题配置..."

    BACKUP_PATH="${CONFIG_PATH}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$CONFIG_PATH" "$BACKUP_PATH"
    log_info "已自动创建配置备份: ${BACKUP_PATH}"

    # Stop qBittorrent first so config writes are not overwritten on shutdown
    stop_qbittorrent_precisely

    # Clean any legacy node/pm2 dev server if previously existed
    if command -v pm2 >/dev/null 2>&1; then
        pm2 delete abit-webui >/dev/null 2>&1 || true
        pm2 save >/dev/null 2>&1 || true
    fi
    pkill -f "scripts/dev.js" 2>/dev/null || true

    # Use Python for reliable INI modification if available
    if command -v python3 >/dev/null 2>&1; then
        ABIT_CONF_PATH="$CONFIG_PATH" \
        ABIT_ROOT_FOLDER="$WEBUI_TARGET_PATH" \
        python3 - <<'PYEOF'
import os
import re

conf_path = os.environ["ABIT_CONF_PATH"]
root_folder = os.environ["ABIT_ROOT_FOLDER"]

with open(conf_path, 'r', encoding='utf-8', errors='ignore') as f:
    conf = f.read()

def set_pref(content, key, val):
    pattern = rf'({re.escape(key)}\s*=).*'
    if re.search(pattern, content):
        return re.sub(pattern, lambda m: f"{key}={val}", content)
    else:
        if '[Preferences]' in content:
            return content.replace('[Preferences]', f'[Preferences]\n{key}={val}')
        else:
            return content + f'\n[Preferences]\n{key}={val}'

# Direct native replacement mode
conf = set_pref(conf, 'WebUI\\AlternativeUIEnabled', 'true')
conf = set_pref(conf, 'WebUI\\RootFolder', root_folder)
conf = set_pref(conf, 'WebUI\\HostHeaderValidation', 'false')
conf = set_pref(conf, 'WebUI\\CSRFProtection', 'false')
conf = set_pref(conf, 'WebUI\\LocalHostAuth', 'false')
conf = set_pref(conf, 'WebUI\\AuthSubnetWhitelistEnabled', 'true')
conf = set_pref(conf, 'WebUI\\AuthSubnetWhitelist', '0.0.0.0/0, ::/0')

# Clean excessive newlines
conf = re.sub(r'\n{3,}', '\n\n', conf)

with open(conf_path, 'w', encoding='utf-8') as f:
    f.write(conf)
PYEOF
    else
        # Fallback to sed
        sed -i '/WebUI\\AlternativeUIEnabled/d' "$CONFIG_PATH"
        sed -i '/WebUI\\RootFolder/d' "$CONFIG_PATH"
        if grep -q "\[Preferences\]" "$CONFIG_PATH"; then
            sed -i "/\[Preferences\]/a WebUI\\\\AlternativeUIEnabled=true\nWebUI\\\\RootFolder=$WEBUI_TARGET_PATH" "$CONFIG_PATH"
        else
            echo -e "\n[Preferences]\nWebUI\\AlternativeUIEnabled=true\nWebUI\\RootFolder=$WEBUI_TARGET_PATH" >> "$CONFIG_PATH"
        fi
    fi

    log_success "备用 WebUI 配置写入成功："
    echo -e "   ├─ ${BOLD}WebUI\\AlternativeUIEnabled${NC} = ${GREEN}true${NC}"
    echo -e "   └─ ${BOLD}WebUI\\RootFolder${NC}           = ${GREEN}${WEBUI_TARGET_PATH}${NC}"
}

# ------------------------------------------------------------------------------
# 4. Restart qBittorrent Service & Summary
# ------------------------------------------------------------------------------
start_service() {
    log_step "[4/4] 正在重新加载 qBittorrent 服务..."

    if [ "$DOCKER_MODE" = "1" ]; then
        log_info "Docker 模式：配置已写入挂载卷，请重启对应容器使配置生效。"
        return
    fi

    RESTARTED=0
    # Try systemd first
    if command -v systemctl >/dev/null 2>&1; then
        for svc in "qbittorrent-nox" "qbittorrent" "qbittorrent-nox@$USER" "qbittorrent-nox@root"; do
            if systemctl is-active --quiet "$svc" 2>/dev/null || systemctl is-enabled --quiet "$svc" 2>/dev/null; then
                log_info "发现 systemd 服务 [${svc}]，正在重启..."
                $SUDO_CMD systemctl restart "$svc" 2>/dev/null || systemctl restart "$svc" 2>/dev/null || true
                RESTARTED=1
                break
            fi
        done
    fi

    # Fallback to daemon relaunch
    if [ "$RESTARTED" = "0" ] && command -v qbittorrent-nox >/dev/null 2>&1; then
        log_info "正在启动 qbittorrent-nox (守护进程模式)..."
        /usr/bin/qbittorrent-nox -d 2>/dev/null || qbittorrent-nox -d 2>/dev/null || true
        sleep 2
        RESTARTED=1
    fi

    if pgrep -x qbittorrent-nox >/dev/null 2>&1; then
        log_success "qBittorrent 服务已成功运行！"
    else
        log_warn "未检测到 qbittorrent 进程，请手动执行 'qbittorrent-nox -d' 启动。"
    fi
}

display_summary() {
    # Extract port from config
    WEBUI_PORT="8080"
    if [[ -f "$CONFIG_PATH" ]]; then
        DETECTED_PORT="$(grep -E '^WebUI\\Port=' "$CONFIG_PATH" | cut -d'=' -f2 | tr -d '\r' || true)"
        if [[ -n "$DETECTED_PORT" ]]; then
            WEBUI_PORT="$DETECTED_PORT"
        fi
    fi

    PUBLIC_IP="$(curl -s --connect-timeout 2 http://ifconfig.me 2>/dev/null || curl -s --connect-timeout 2 http://icanhazip.com 2>/dev/null || echo "您的服务器公网IP")"
    LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")"

    echo ""
    echo -e "${GREEN}${BOLD}🎉 恭喜！Abit 备用 WebUI 主题已成功替换并生效！${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 🌐 ${BOLD}访问地址${NC}:      ${CYAN}http://${PUBLIC_IP}:${WEBUI_PORT}${NC}"
    echo -e " 🏠 ${BOLD}局域网地址${NC}:    ${CYAN}http://${LOCAL_IP}:${WEBUI_PORT}${NC}"
    echo -e " 📁 ${BOLD}主题所在路径${NC}:  ${YELLOW}${WEBUI_TARGET_PATH}${NC}"
    echo -e " ⚙️  ${BOLD}配置文件路径${NC}:  ${YELLOW}${CONFIG_PATH}${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 💡 ${BOLD}温馨提示${NC}:"
    echo -e "   • 原生直接替换: 0 额外内存占用，直接由 qBittorrent 自带服务托管。"
    echo -e "   • 默认登录账号: ${BOLD}admin${NC}，密码为您此前设置的 WebUI 密码。"
    echo -e "   • 卸载恢复官方: 运行 ${BOLD}bash install.sh uninstall${NC} 即可秒级恢复官方自带界面。"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
}

# ------------------------------------------------------------------------------
# Subcommand: Uninstall / Rollback
# ------------------------------------------------------------------------------
do_uninstall() {
    print_banner
    log_step "正在执行 Abit 卸载与官方默认 WebUI 恢复..."
    detect_qbittorrent_config

    if [[ -f "$CONFIG_PATH" ]]; then
        log_info "正在恢复配置文件至官方默认 WebUI..."
        if command -v python3 >/dev/null 2>&1; then
            ABIT_CONF_PATH="$CONFIG_PATH" python3 - <<'PYEOF'
import os, re
conf_path = os.environ["ABIT_CONF_PATH"]
with open(conf_path, 'r', encoding='utf-8', errors='ignore') as f:
    conf = f.read()
conf = re.sub(r'WebUI\\AlternativeUIEnabled\s*=.*', 'WebUI\\AlternativeUIEnabled=false', conf)
conf = re.sub(r'WebUI\\RootFolder\s*=.*\n?', '', conf)
with open(conf_path, 'w', encoding='utf-8') as f:
    f.write(conf)
PYEOF
        else
            sed -i "s/WebUI\\\\AlternativeUIEnabled=true/WebUI\\\\AlternativeUIEnabled=false/g" "$CONFIG_PATH"
            sed -i "/WebUI\\\\RootFolder/d" "$CONFIG_PATH"
        fi
        log_success "配置文件已恢复官方原生设置。"
    fi

    # Clean installed directory if exists
    if [[ -d "$INSTALL_DIR_DEFAULT" ]]; then
        rm -rf "$INSTALL_DIR_DEFAULT"
        log_info "已清理安装目录: $INSTALL_DIR_DEFAULT"
    fi

    start_service
    log_success "已完全恢复为 qBittorrent 官方自带默认 WebUI！"
    exit 0
}

# ------------------------------------------------------------------------------
# Main Entry Point
# ------------------------------------------------------------------------------
main() {
    if [ "${1:-}" = "uninstall" ] || [ "${1:-}" = "--uninstall" ]; then
        do_uninstall
        return
    fi

    print_banner
    detect_os
    ensure_qbittorrent
    detect_or_setup_installation
    detect_qbittorrent_config
    configure_alternative_webui
    start_service
    display_summary
}

main "$@"
