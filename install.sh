#!/usr/bin/env bash

# ==============================================================================
#  🍏 Abit — Apple Style qBittorrent Alternative WebUI
#  One-Click Automated Deployment & Alternative WebUI Configuration Script
#  Repository: https://github.com/Level6me/Abit
#
#  Features:
#   - Multi-platform qBittorrent bootstrap (apt/dnf/yum/pacman/apk/brew + Docker)
#   - Node.js auto-install with explicit failure instead of silent mock mode
#   - Configurable ports (ABIT_EXT_PORT / ABIT_INT_PORT) with occupancy check
#   - Dynamic default save path (uses $HOME/Downloads, no hardcoded user)
#   - Precise process termination (exact process-name match, Docker-aware)
#   - PM2 startup integration for reboot persistence
#   - Security modes: default keeps qBittorrent auth; ABIT_INSECURE=1 opt-out
#   - uninstall subcommand
# ==============================================================================

set -eo pipefail

# ---------- Runtime configuration ----------
ABIT_REPO="https://github.com/Level6me/Abit.git"
INSTALL_DIR_DEFAULT="$HOME/Abit"
EXT_PORT="${ABIT_EXT_PORT:-8080}"
INT_PORT="${ABIT_INT_PORT:-8081}"
INSECURE="${ABIT_INSECURE:-0}"
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
    echo "  ║       Automated Environment Detection & Instant Setup         ║"
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
# 0. Platform detection
# ------------------------------------------------------------------------------
detect_os() {
    OS="$(uname -s)"
    DISTRO=""
    PKG_MGR=""
    case "$OS" in
        Linux)
            if   command -v apt-get >/dev/null 2>&1; then DISTRO="debian"; PKG_MGR="apt"
            elif command -v dnf     >/dev/null 2>&1; then DISTRO="fedora"; PKG_MGR="dnf"
            elif command -v yum     >/dev/null 2>&1; then DISTRO="rhel";   PKG_MGR="yum"
            elif command -v pacman  >/dev/null 2>&1; then DISTRO="arch";   PKG_MGR="pacman"
            elif command -v apk     >/dev/null 2>&1; then DISTRO="alpine"; PKG_MGR="apk"
            fi
            ;;
        Darwin)
            DISTRO="macos"; PKG_MGR="brew"
            ;;
    esac
}

install_pkg() {
    # $1: package names
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

ensure_node() {
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        log_info "Node.js $(node -v 2>/dev/null) / npm $(npm -v 2>/dev/null)"
        return 0
    fi
    log_warn "未检测到 Node.js（Abit 前端服务需要），尝试自动安装..."
    case "$PKG_MGR" in
        apt|dnf|yum|pacman|apk) install_pkg "nodejs npm" || true ;;
        brew)                   install_pkg "node" || true ;;
    esac
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js 安装失败。请手动安装后重试："
        log_error "  Debian/Ubuntu:  sudo apt-get install -y nodejs npm"
        log_error "  Fedora/RHEL:    sudo dnf install -y nodejs npm"
        log_error "  Arch:           sudo pacman -S --noconfirm nodejs npm"
        log_error "  Alpine:         sudo apk add --no-cache nodejs npm"
        log_error "  macOS:          brew install node"
        exit 1
    fi
}

ensure_qbittorrent() {
    # 1. Docker container detection first (works on hosts running containerized qBittorrent)
    if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
        QBT_CT="$(docker ps --format '{{.Names}}' | grep -iE 'qbit|torrent' | head -n 1 || true)"
        if [ -n "$QBT_CT" ]; then
            DOCKER_MODE=1
            log_info "检测到 qBittorrent Docker 容器: ${BOLD}${QBT_CT}${NC}（将使用容器端口映射模式）"
            return 0
        fi
    fi
    if [ -f /.dockerenv ]; then
        DOCKER_MODE=1
        log_info "检测到当前运行于容器内部，将使用容器配置路径模式"
        return 0
    fi

    # 2. Already installed?
    if command -v qbittorrent-nox >/dev/null 2>&1; then
        log_info "qBittorrent 已存在: $(qbittorrent-nox --version 2>/dev/null | head -n 1)"
        return 0
    fi

    # 3. Try package manager bootstrap
    log_info "未检测到 qbittorrent-nox，尝试自动安装..."
    case "$PKG_MGR" in
        apt)    install_pkg "qbittorrent-nox" || true ;;
        dnf)    install_pkg "qbittorrent-nox" || log_warn "Fedora/RHEL 若提示找不到包，请先: sudo dnf install -y epel-release 再重试" ;;
        yum)    install_pkg "qbittorrent-nox" || log_warn "RHEL/CentOS 若提示找不到包，请先: sudo yum install -y epel-release 再重试" ;;
        pacman) install_pkg "qbittorrent-nox" || true ;;
        apk)    install_pkg "qbittorrent-nox" || true ;;
        brew)   install_pkg "qbittorrent" || true ;;
        *)      log_warn "未能识别的平台，跳过自动安装" ;;
    esac

    if ! command -v qbittorrent-nox >/dev/null 2>&1; then
        log_error "qBittorrent 安装失败或平台不受支持。请任选一种方式后重试："
        log_error "  apt:    sudo apt-get install -y qbittorrent-nox"
        log_error "  dnf:    sudo dnf install -y epel-release && sudo dnf install -y qbittorrent-nox"
        log_error "  pacman: sudo pacman -S --noconfirm qbittorrent-nox"
        log_error "  apk:    sudo apk add --no-cache qbittorrent-nox"
        log_error "  Docker: docker run -d --name qbittorrent -p ${INT_PORT}:8080 -v /config:/config linuxserver/qbittorrent"
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# 1. Detect or Setup Installation Directory
# ------------------------------------------------------------------------------
detect_or_setup_installation() {
    log_step "[1/6] 检测安装目录与项目产物..."
    ensure_git

    INSTALL_DIR="$INSTALL_DIR_DEFAULT"
    if [[ -f "./scripts/build.js" ]] && [[ -d "./src" ]]; then
        INSTALL_DIR="$(pwd -P)"
        log_info "检测到当前目录即为 Abit 项目仓库: ${BOLD}${INSTALL_DIR}${NC}"
    elif [[ -d "$HOME/Abit" ]] && [[ -f "$HOME/Abit/scripts/build.js" ]]; then
        log_info "检测到已有安装目录: ${BOLD}${INSTALL_DIR}${NC}"
        cd "$INSTALL_DIR"
        log_info "正在同步拉取最新代码..."
        git pull --quiet origin main || true
    else
        log_info "正在克隆最新 Abit 项目到: ${BOLD}${INSTALL_DIR}${NC}"
        git clone "$ABIT_REPO" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi

    log_info "执行前端资源编译打包..."
    node scripts/build.js

    WEBUI_TARGET_PATH="$INSTALL_DIR/public"
    if [[ ! -d "$WEBUI_TARGET_PATH" ]]; then
        WEBUI_TARGET_PATH="$INSTALL_DIR"
    fi
    log_success "安装目录准备就绪: ${INSTALL_DIR}"
}

# ------------------------------------------------------------------------------
# 2. Detect qBittorrent Configuration File
# ------------------------------------------------------------------------------
detect_qbittorrent_config() {
    log_step "[2/6] 智能检索 qBittorrent 配置文件..."
    CONFIG_PATH=""

    # 1. Docker / container paths take priority when in container mode
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
                log_info "从运行中的 qBittorrent 进程(PID: ${QBT_PID})定位配置文件: ${CONFIG_PATH}"
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

    # 4. Fallback: search in user home directory
    if [[ -z "$CONFIG_PATH" ]]; then
        log_info "正在进行用户主目录轻量搜索..."
        FOUND_SEARCH="$(find "$HOME/.config" -maxdepth 3 -name "qBittorrent.conf" 2>/dev/null | head -n 1 || true)"
        if [[ -n "$FOUND_SEARCH" ]] && [[ -f "$FOUND_SEARCH" ]]; then
            CONFIG_PATH="$FOUND_SEARCH"
            log_info "搜索找到配置文件: ${CONFIG_PATH}"
        fi
    fi

    # 5. If still not found, create standard default config with dynamic paths
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
WebUI\Port=$INT_PORT
WebUI\Username=admin
EOF
    fi

    log_success "配置文件路径锁定: ${CONFIG_PATH}"
}

# ------------------------------------------------------------------------------
# 3. Configure qBittorrent Backend & Standalone High-Speed UI Proxy
# ------------------------------------------------------------------------------
port_in_use() {
    local p="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -tln 2>/dev/null | awk '{print $4}' | grep -q ":$p$"
    elif command -v lsof >/dev/null 2>&1; then
        lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
    else
        if (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
            exec 3>&- 3<&- 2>/dev/null || true
            return 0
        fi
        return 1
    fi
}

stop_qbittorrent_precisely() {
    if [ "$DOCKER_MODE" = "1" ]; then
        log_info "Docker 模式：跳过宿主进程终止，容器内配置修改后由容器自行生效。"
        return
    fi
    # Exact process-name match only, avoid killing unrelated processes
    local pids
    pids="$(pgrep -x qbittorrent-nox 2>/dev/null || true)"
    for pid in $pids; do
        kill -TERM "$pid" 2>/dev/null || true
    done
    sleep 2
    pids="$(pgrep -x qbittorrent-nox 2>/dev/null || true)"
    for pid in $pids; do
        kill -KILL "$pid" 2>/dev/null || true
    done
}

configure_services() {
    log_step "[3/6] 部署并优化 WebUI 架构..."

    BACKUP_PATH="${CONFIG_PATH}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$CONFIG_PATH" "$BACKUP_PATH"
    log_info "已自动创建配置备份: ${BACKUP_PATH}"

    # Stop qBittorrent first so config writes are not overwritten on shutdown
    stop_qbittorrent_precisely

    # Port occupancy checks
    if port_in_use "$EXT_PORT"; then
        log_error "外部端口 ${EXT_PORT} 已被占用。请换端口重试，例如: ABIT_EXT_PORT=8090 bash install.sh"
        exit 1
    fi
    if [ "$DOCKER_MODE" != "1" ] && port_in_use "$INT_PORT"; then
        if pgrep -x qbittorrent-nox >/dev/null 2>&1; then
            :  # our own freshly-started instance, fine
        else
            log_error "内部端口 ${INT_PORT} 已被其他进程占用。请换端口重试，例如: ABIT_INT_PORT=8082 bash install.sh"
            exit 1
        fi
    fi

    # Rewrite configuration via python3 heredoc (no shell-quoting pitfalls)
    if command -v python3 >/dev/null 2>&1; then
        ABIT_CONF_PATH="$CONFIG_PATH" \
        ABIT_INT_PORT="$INT_PORT" \
        ABIT_INSECURE="$INSECURE" \
        python3 - <<'PYEOF'
import os
import re

conf_path = os.environ["ABIT_CONF_PATH"]
int_port = os.environ["ABIT_INT_PORT"]
insecure = os.environ.get("ABIT_INSECURE", "0") == "1"

with open(conf_path, "r", encoding="utf-8", errors="ignore") as f:
    conf = f.read()

def set_preference(content, key, val):
    pattern = re.compile(r"(?m)^(" + re.escape(key) + r")\s*=.*$")
    if pattern.search(content):
        return pattern.sub(r"\1=" + val, content)
    if "[Preferences]" in content:
        return content.replace("[Preferences]", "[Preferences]\n" + key + "=" + val)
    return content + "\n[Preferences]\n" + key + "=" + val

# Backend listens on internal port; Abit front-end proxies externally
conf = set_preference(conf, r"WebUI\Port", int_port)
conf = set_preference(conf, r"WebUI\AlternativeUIEnabled", "false")

if insecure:
    # Compatibility mode: disable auth checks so the proxy flows open instantly.
    conf = set_preference(conf, r"WebUI\LocalHostAuth", "false")
    conf = set_preference(conf, r"WebUI\CSRFProtection", "false")
    conf = set_preference(conf, r"WebUI\HostHeaderValidation", "false")
else:
    # Secure mode (default): keep qBittorrent authentication intact.
    conf = set_preference(conf, r"WebUI\LocalHostAuth", "true")

conf = re.sub(r"\n{3,}", "\n\n", conf)

with open(conf_path, "w", encoding="utf-8") as f:
    f.write(conf)
PYEOF
        log_success "qBittorrent 后端配置完成（内部端口: ${INT_PORT}，安全模式: $([ "$INSECURE" = "1" ] && echo 兼容 || echo 安全)）"
    else
        log_error "未找到 python3，无法自动改写 qBittorrent 配置。请手动安装 python3 后重试。"
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# 4. Launch qBittorrent & WebUI Service via PM2 / Daemon
# ------------------------------------------------------------------------------
verify_qbt_backend() {
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${INT_PORT}/api/v2/app/version" || true)"
    if [ "$code" = "200" ]; then
        log_success "qBittorrent 后端 API 可达（v$(curl -s --connect-timeout 3 "http://127.0.0.1:${INT_PORT}/api/v2/app/version" 2>/dev/null || echo '?')）"
        return 0
    fi
    log_warn "qBittorrent 后端 API 暂不可达（HTTP ${code:-无响应}）。"
    if [ "$DOCKER_MODE" = "1" ]; then
        log_warn "Docker 模式请确认容器端口已映射到宿主 ${INT_PORT}，例如: docker run -p ${INT_PORT}:8080 ..."
    else
        log_warn "请确认 qbittorrent-nox 已成功启动且 WebUI 端口为 ${INT_PORT}。"
    fi
    return 1
}

setup_pm2_startup() {
    command -v pm2 >/dev/null 2>&1 || return 0
    local cmd
    cmd="$(pm2 startup 2>&1 | grep -E 'sudo .*pm2 startup|pm2 startup' | tail -n 1 || true)"
    if [ -n "$cmd" ]; then
        log_info "配置 PM2 开机自启..."
        if [ "$(id -u)" -eq 0 ]; then
            eval "${cmd#sudo }" 2>/dev/null || true
        else
            eval "$cmd" 2>/dev/null || true
        fi
        pm2 save >/dev/null 2>&1 || true
        log_success "PM2 开机自启已配置（系统重启后自动恢复服务）。"
    fi
}

start_services() {
    log_step "[4/6] 启动 qBittorrent 与 Abit 极速前端服务..."

    # 1. Start qBittorrent backend (skip in Docker mode - container manages itself)
    if [ "$DOCKER_MODE" != "1" ] && command -v qbittorrent-nox >/dev/null 2>&1; then
        log_info "正在启动 qBittorrent 下载内核..."
        qbittorrent-nox -d 2>/dev/null || true
        sleep 2
    fi

    verify_qbt_backend || true

    # 2. Start Abit front-end service
    if command -v pm2 >/dev/null 2>&1; then
        log_info "使用 PM2 守护启动 Abit 极速前端服务（端口: ${EXT_PORT}）..."
        pm2 delete abit-webui >/dev/null 2>&1 || true
        pm2 start "$INSTALL_DIR/scripts/dev.js" --name "abit-webui" -- --port="$EXT_PORT" --qbt="http://127.0.0.1:${INT_PORT}" --dist
        pm2 save >/dev/null 2>&1 || true
        setup_pm2_startup
    elif command -v node >/dev/null 2>&1; then
        log_info "使用后台进程启动 Abit 极速前端服务（端口: ${EXT_PORT}）..."
        pkill -f "$INSTALL_DIR/scripts/dev.js" 2>/dev/null || true
        nohup node "$INSTALL_DIR/scripts/dev.js" --port="$EXT_PORT" --qbt="http://127.0.0.1:${INT_PORT}" --dist > /tmp/abit.log 2>&1 &
        sleep 1
    fi

    # 3. Verify front-end
    if curl -s -o /dev/null --connect-timeout 3 "http://127.0.0.1:${EXT_PORT}/" >/dev/null 2>&1; then
        log_success "Abit 前端服务已在端口 ${EXT_PORT} 成功就绪！"
    else
        log_error "Abit 前端服务未能响应，请检查日志: pm2 logs abit-webui 或 /tmp/abit.log"
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# 5. Extract Port and Display Success Summary
# ------------------------------------------------------------------------------
display_summary() {
    log_step "[5/6] 安装部署完成！"

    PUBLIC_IP="$(curl -s --connect-timeout 2 http://ifconfig.me || curl -s --connect-timeout 2 http://icanhazip.com || echo "您的服务器公网IP")"
    LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")"

    echo ""
    echo -e "${GREEN}${BOLD}🎉 恭喜！Abit 苹果风格 WebUI 已成功部署，即开即用！${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 🌐 ${BOLD}公网访问地址${NC}:  ${CYAN}http://${PUBLIC_IP}:${EXT_PORT}${NC}"
    echo -e " 🏠 ${BOLD}局域网地址${NC}:    ${CYAN}http://${LOCAL_IP}:${EXT_PORT}${NC}"
    echo -e " 📁 ${BOLD}项目安装路径${NC}:  ${YELLOW}${INSTALL_DIR}${NC}"
    echo -e " ⚙️  ${BOLD}配置文件路径${NC}:  ${YELLOW}${CONFIG_PATH}${NC}"
    if [ "$INSECURE" = "1" ]; then
        echo -e " ⚠️  ${BOLD}安全模式${NC}: ${RED}兼容模式（ABIT_INSECURE=1）已关闭 CSRF/本机认证校验，请勿直接暴露公网${NC}"
    else
        echo -e " 🔒 ${BOLD}安全模式${NC}: 保留 qBittorrent 认证；首次打开若提示登录，输入 qBittorrent 账密即可"
    fi
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 💡 ${BOLD}使用提示${NC}:"
    echo -e "   • 更新: bash install.sh（自动 git pull + 重新配置）"
    echo -e "   • 卸载: bash install.sh uninstall"
    echo -e "   • 换端口: ABIT_EXT_PORT=8090 bash install.sh"
    echo -e "   • 免登录兼容模式: ABIT_INSECURE=1 bash install.sh"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
}

# ------------------------------------------------------------------------------
# Uninstall subcommand
# ------------------------------------------------------------------------------
do_uninstall() {
    print_banner
    log_step "卸载 Abit WebUI..."
    pm2 delete abit-webui >/dev/null 2>&1 || true
    pkill -f "$INSTALL_DIR_DEFAULT/scripts/dev.js" 2>/dev/null || true
    pm2 save >/dev/null 2>&1 || true

    read -r -p "是否删除项目目录 ${INSTALL_DIR_DEFAULT}？[y/N]: " del_dir
    if [[ "$del_dir" =~ ^[Yy]$ ]]; then
        case "$INSTALL_DIR_DEFAULT" in
            *Abit|*abit)
                rm -rf "$INSTALL_DIR_DEFAULT"
                log_success "项目目录已删除。"
                ;;
            *)
                log_error "目录名异常，拒绝删除: ${INSTALL_DIR_DEFAULT}"
                ;;
        esac
    fi
    log_success "卸载完成。qBittorrent 本体与下载数据未动（如需卸载请自行处理）。"
}

# ------------------------------------------------------------------------------
# Main Execution Entry
# ------------------------------------------------------------------------------
main() {
    print_banner
    detect_os
    log_info "平台: ${DISTRO:-未知} (${PKG_MGR:-无包管理器}) | 端口: 外 ${EXT_PORT} / 内 ${INT_PORT}"
    ensure_qbittorrent
    ensure_node
    detect_or_setup_installation
    detect_qbittorrent_config
    configure_services
    start_services
    display_summary
}

case "${1:-}" in
    uninstall) do_uninstall; exit 0 ;;
    *) main "$@" ;;
esac
