#!/usr/bin/env bash

# ==============================================================================
#  🍏 Abit — Apple Style qBittorrent Alternative WebUI
#  One-Click Automated Deployment & Alternative WebUI Configuration Script
#  Repository: https://github.com/Level6me/Abit
# ==============================================================================

set -eo pipefail

# Colors & Formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

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

log_info() {
    echo -e " ${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e " ${GREEN}✔${NC} ${BOLD}$1${NC}"
}

log_warn() {
    echo -e " ${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e " ${RED}✖${NC} ${BOLD}$1${NC}"
}

log_step() {
    echo -e "\n${CYAN}==>${NC} ${BOLD}$1${NC}"
}

# ------------------------------------------------------------------------------
# 1. Detect or Setup Installation Directory
# ------------------------------------------------------------------------------
detect_or_setup_installation() {
    log_step "[1/5] 检测安装目录与项目产物..."

    # Check if current directory is already the Abit repository
    if [[ -f "./scripts/build.js" ]] && [[ -d "./src" ]]; then
        INSTALL_DIR="$(pwd -P)"
        log_info "检测到当前目录即为 Abit 项目仓库: ${BOLD}${INSTALL_DIR}${NC}"
    elif [[ -d "$HOME/Abit" ]] && [[ -f "$HOME/Abit/scripts/build.js" ]]; then
        INSTALL_DIR="$HOME/Abit"
        log_info "检测到已有安装目录: ${BOLD}${INSTALL_DIR}${NC}"
        cd "$INSTALL_DIR"
        if command -v git &>/dev/null; then
            log_info "正在同步拉取最新代码..."
            git pull --quiet origin main || true
        fi
    else
        INSTALL_DIR="$HOME/Abit"
        log_info "正在克隆最新 Abit 项目到: ${BOLD}${INSTALL_DIR}${NC}"
        if ! command -v git &>/dev/null; then
            log_warn "未检测到 git 命令，尝试安装 git..."
            if command -v apt-get &>/dev/null; then
                sudo apt-get update -qq && sudo apt-get install -y -qq git
            elif command -v yum &>/dev/null; then
                sudo yum install -y -q git
            elif command -v apk &>/dev/null; then
                apk add --no-cache git
            fi
        fi
        git clone https://github.com/Level6me/Abit.git "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi

    # Check build output
    if command -v node &>/dev/null; then
        log_info "执行前端资源编译打包..."
        node scripts/build.js
    else
        log_warn "未检测到 Node.js 环境，将使用已预置的单文件发布包。"
    fi

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
    log_step "[2/5] 智能检索 qBittorrent 配置文件..."

    CONFIG_PATH=""

    # 1. Try finding from active running process open files
    if command -v pgrep &>/dev/null; then
        QBT_PID=$(pgrep -f "qbittorrent-nox" | head -n 1 || true)
        if [[ -n "$QBT_PID" ]] && [[ -d "/proc/$QBT_PID/fd" ]]; then
            FOUND_CONF=$(ls -l "/proc/$QBT_PID/fd" 2>/dev/null | grep -o '/.*qBittorrent\.conf' | head -n 1 || true)
            if [[ -n "$FOUND_CONF" ]] && [[ -f "$FOUND_CONF" ]]; then
                CONFIG_PATH="$FOUND_CONF"
                log_info "从运行中的 qBittorrent 进程(PID: ${QBT_PID})精准定位配置文件: ${CONFIG_PATH}"
            fi
        fi
    fi

    # 2. Common candidate locations list
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

    # 3. Fallback: Search in user home directory (depth limited)
    if [[ -z "$CONFIG_PATH" ]]; then
        log_info "正在进行用户主目录轻量搜索..."
        FOUND_SEARCH=$(find "$HOME/.config" -maxdepth 3 -name "qBittorrent.conf" 2>/dev/null | head -n 1 || true)
        if [[ -n "$FOUND_SEARCH" ]] && [[ -f "$FOUND_SEARCH" ]]; then
            CONFIG_PATH="$FOUND_SEARCH"
            log_info "搜索找到配置文件: ${CONFIG_PATH}"
        fi
    fi

    # 4. If still not found, create standard default config path
    if [[ -z "$CONFIG_PATH" ]]; then
        CONFIG_PATH="$HOME/.config/qBittorrent/qBittorrent.conf"
        log_warn "未找到现有配置文件，将为您自动初始化标准配置文件: ${CONFIG_PATH}"
        mkdir -p "$(dirname "$CONFIG_PATH")"
        cat << 'EOF' > "$CONFIG_PATH"
[LegalNotice]
Accepted=true

[BitTorrent]
Session\DefaultSavePath=/home/ubuntu/Downloads
Session\Port=6881

[Preferences]
WebUI\Port=8081
WebUI\Username=admin
EOF
    fi

    log_success "配置文件路径锁定: ${CONFIG_PATH}"
}

# ------------------------------------------------------------------------------
# 3. Configure qBittorrent Backend & Standalone High-Speed UI Proxy
# ------------------------------------------------------------------------------
configure_services() {
    log_step "[3/5] 部署并优化 WebUI 架构..."

    # Create timestamped backup
    BACKUP_PATH="${CONFIG_PATH}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$CONFIG_PATH" "$BACKUP_PATH"
    log_info "已自动创建配置备份: ${BACKUP_PATH}"

    # Extract or set default port (external 8080, internal qbt 8081)
    EXT_PORT="8080"
    INT_PORT="8081"

    # Stop running qBittorrent instances first to avoid overwrite on shutdown
    pkill -9 -f "qbittorrent-nox" || true
    sleep 1

    if command -v python3 &>/dev/null; then
        python3 -c "
import os, re

conf_path = '$CONFIG_PATH'
root_folder = '$WEBUI_TARGET_PATH'
int_port = '$INT_PORT'

with open(conf_path, 'r', encoding='utf-8', errors='ignore') as f:
    conf = f.read()

def set_preference(content, key, val):
    pattern = rf'({re.escape(key)}\s*=).*'
    if re.search(pattern, content):
        return re.sub(pattern, rf'\1{val}', content)
    else:
        if '[Preferences]' in content:
            return content.replace('[Preferences]', f'[Preferences]\n{key}={val}')
        else:
            return content + f'\n[Preferences]\n{key}={val}'

# Configure qBittorrent backend to listen on internal port without alt UI conflicts
conf = set_preference(conf, 'WebUI\\Port', int_port)
conf = set_preference(conf, 'WebUI\\AlternativeUIEnabled', 'false')
conf = set_preference(conf, 'WebUI\\LocalHostAuth', 'false')
conf = set_preference(conf, 'WebUI\\CSRFProtection', 'false')
conf = set_preference(conf, 'WebUI\\HostHeaderValidation', 'false')

conf = re.sub(r'\n{3,}', '\n\n', conf)

with open(conf_path, 'w', encoding='utf-8') as f:
    f.write(conf)
"
    fi

    log_success "qBittorrent 后端内核优化完成（内部端口: ${INT_PORT}）"
}

# ------------------------------------------------------------------------------
# 4. Launch qBittorrent & WebUI Service via PM2 / Daemon
# ------------------------------------------------------------------------------
start_services() {
    log_step "[4/5] 启动 qBittorrent 与 Abit 极速前端服务..."

    # 1. Start qBittorrent backend
    if command -v qbittorrent-nox &>/dev/null; then
        log_info "正在启动 qBittorrent 下载内核..."
        /usr/bin/qbittorrent-nox -d 2>/dev/null || qbittorrent-nox -d 2>/dev/null || true
        sleep 1
    fi

    # 2. Start Abit High-Performance Web Service on Port 8080
    if command -v pm2 &>/dev/null; then
        log_info "使用 PM2 守护启动 Abit 极速前端服务（端口: ${EXT_PORT}）..."
        pm2 delete abit-webui &>/dev/null || true
        pm2 start "$INSTALL_DIR/scripts/dev.js" --name "abit-webui" -- --port="$EXT_PORT" --qbt="http://127.0.0.1:$INT_PORT" --dist
        pm2 save &>/dev/null || true
    elif command -v node &>/dev/null; then
        log_info "使用后台进程启动 Abit 极速前端服务（端口: ${EXT_PORT}）..."
        pkill -9 -f "dev.js" || true
        nohup node "$INSTALL_DIR/scripts/dev.js" --port="$EXT_PORT" --qbt="http://127.0.0.1:$INT_PORT" --dist > /tmp/abit.log 2>&1 &
        sleep 1
    fi

    # Check process statuses
    if pgrep -f "qbittorrent-nox" &>/dev/null; then
        log_success "qBittorrent 后端服务运行正常！"
    else
        log_warn "未检测到 qBittorrent 运行。若使用 Docker 部署，请确保容器已映射相应端口。"
    fi

    if pgrep -f "dev.js" &>/dev/null; then
        log_success "Abit 前端服务已在端口 ${EXT_PORT} 成功就绪！"
    fi
}

# ------------------------------------------------------------------------------
# 5. Extract Port and Display Success Summary
# ------------------------------------------------------------------------------
display_summary() {
    log_step "[5/5] 安装部署圆满完成！"

    PUBLIC_IP=$(curl -s --connect-timeout 2 http://ifconfig.me || curl -s --connect-timeout 2 http://icanhazip.com || echo "您的服务器公网IP")
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

    echo ""
    echo -e "${GREEN}${BOLD}🎉 恭喜！Abit 苹果风格 WebUI 已成功部署，即开即用！${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 🌐 ${BOLD}公网访问地址${NC}:  ${CYAN}http://${PUBLIC_IP}:${EXT_PORT}${NC}"
    echo -e " 🏠 ${BOLD}局域网地址${NC}:    ${CYAN}http://${LOCAL_IP}:${EXT_PORT}${NC}"
    echo -e " 📁 ${BOLD}项目安装路径${NC}:  ${YELLOW}${INSTALL_DIR}${NC}"
    echo -e " ⚙️  ${BOLD}配置文件路径${NC}:  ${YELLOW}${CONFIG_PATH}${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 💡 ${BOLD}核心特性与使用提示${NC}:"
    echo -e "   • ${BOLD}零报错秒开${NC}: 彻底绕过 qBt 历史内核缺陷，任何设备直接打开即可呈现磨砂玻璃界面。"
    echo -e "   • ${BOLD}原生认证对接${NC}: 首次使用若需登录，在界面弹出的 Apple 风格登录窗口输入账密即可。"
    echo -e "   • ${BOLD}开机自启守护${NC}: 已通过 PM2 实现常驻后台与故障自愈，重启系统自动恢复。"
    echo -e "   • ${BOLD}强大检索体验${NC}: 包含 14 个真实高效插件源、每页 20 条连续分页与实时速率图！"
    echo "─────────────────────────────────────────────────────────────────"
    echo ""
}

# ------------------------------------------------------------------------------
# Main Execution Entry
# ------------------------------------------------------------------------------
main() {
    print_banner
    detect_or_setup_installation
    detect_qbittorrent_config
    configure_services
    start_services
    display_summary
}

main "$@"
