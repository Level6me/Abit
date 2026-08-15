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
        log_info "检测到 Node.js 环境，执行自动编译构建..."
        node scripts/build.js
    else
        log_warn "未检测到 Node.js 环境，将使用已预置的静态资源包。"
    fi

    # Verify public directory and files
    if [[ ! -f "$INSTALL_DIR/public/index.html" ]] && [[ ! -f "$INSTALL_DIR/index.html" ]]; then
        log_error "未在 ${INSTALL_DIR} 找到有效的 WebUI 页面文件！"
        exit 1
    fi

    WEBUI_TARGET_PATH="$INSTALL_DIR/public"
    if [[ ! -d "$WEBUI_TARGET_PATH" ]]; then
        WEBUI_TARGET_PATH="$INSTALL_DIR"
    fi

    log_success "安装目录确认完成: ${WEBUI_TARGET_PATH}"
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
WebUI\Port=8080
WebUI\Username=admin
EOF
    fi

    log_success "配置文件路径锁定: ${CONFIG_PATH}"
}

# ------------------------------------------------------------------------------
# 3. Configure Alternative WebUI in qBittorrent.conf
# ------------------------------------------------------------------------------
configure_alternative_webui() {
    log_step "[3/5] 写入备用 WebUI 主题配置..."

    # Create timestamped backup
    BACKUP_PATH="${CONFIG_PATH}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$CONFIG_PATH" "$BACKUP_PATH"
    log_info "已自动创建配置备份: ${BACKUP_PATH}"

    # Use Python for reliable INI modification if available
    if command -v python3 &>/dev/null; then
        python3 -c "
import os, re

conf_path = '$CONFIG_PATH'
root_folder = '$WEBUI_TARGET_PATH'

with open(conf_path, 'r', encoding='utf-8', errors='ignore') as f:
    conf = f.read()

# Helper to update or set key in [Preferences]
def set_preference(content, key, val):
    # Regex to find existing key anywhere in config
    pattern = rf'({re.escape(key)}\s*=).*'
    if re.search(pattern, content):
        return re.sub(pattern, rf'\1{val}', content)
    else:
        if '[Preferences]' in content:
            return content.replace('[Preferences]', f'[Preferences]\n{key}={val}')
        else:
            return content + f'\n[Preferences]\n{key}={val}'

conf = set_preference(conf, 'WebUI\\AlternativeUIEnabled', 'true')
conf = set_preference(conf, 'WebUI\\RootFolder', root_folder)
conf = set_preference(conf, 'WebUI\\LocalHostAuth', 'false')

# Clean duplicate consecutive newlines
conf = re.sub(r'\n{3,}', '\n\n', conf)

with open(conf_path, 'w', encoding='utf-8') as f:
    f.write(conf)
"
    else
        # Fallback to AWK/Sed manipulation
        sed -i '/WebUI\\AlternativeUIEnabled/d' "$CONFIG_PATH"
        sed -i '/WebUI\\RootFolder/d' "$CONFIG_PATH"
        sed -i '/WebUI\\LocalHostAuth/d' "$CONFIG_PATH"

        if grep -q "\[Preferences\]" "$CONFIG_PATH"; then
            sed -i "/\[Preferences\]/a WebUI\\\\AlternativeUIEnabled=true\nWebUI\\\\RootFolder=$WEBUI_TARGET_PATH\nWebUI\\\\LocalHostAuth=false" "$CONFIG_PATH"
        else
            echo -e "\n[Preferences]\nWebUI\\AlternativeUIEnabled=true\nWebUI\\RootFolder=$WEBUI_TARGET_PATH\nWebUI\\LocalHostAuth=false" >> "$CONFIG_PATH"
        fi
    fi

    log_success "备用 WebUI 参数写入成功："
    echo -e "   ├─ ${BOLD}WebUI\\AlternativeUIEnabled${NC} = ${GREEN}true${NC}"
    echo -e "   ├─ ${BOLD}WebUI\\RootFolder${NC}           = ${GREEN}${WEBUI_TARGET_PATH}${NC}"
    echo -e "   └─ ${BOLD}WebUI\\LocalHostAuth${NC}           = ${GREEN}false${NC}"
}

# ------------------------------------------------------------------------------
# 4. Restart qBittorrent Service
# ------------------------------------------------------------------------------
restart_qbittorrent_service() {
    log_step "[4/5] 正在重新加载 qBittorrent 服务..."

    RESTARTED=false

    # Method 1: Systemd Service Check
    if command -v systemctl &>/dev/null; then
        SERVICES=("qbittorrent-nox" "qbittorrent" "qbittorrent-nox@ubuntu" "qbittorrent-nox@root")
        for svc in "${SERVICES[@]}"; do
            if systemctl is-active --quiet "$svc" 2>/dev/null || systemctl is-enabled --quiet "$svc" 2>/dev/null; then
                log_info "发现 systemd 服务 [${svc}]，正在重启..."
                sudo systemctl restart "$svc" || systemctl restart "$svc" || true
                RESTARTED=true
                break
            fi
        done
    fi

    # Method 2: Process Termination & Relaunch
    if [[ "$RESTARTED" == "false" ]]; then
        if pgrep -f "qbittorrent-nox" &>/dev/null; then
            log_info "正在终止现有 qbittorrent-nox 进程..."
            pkill -9 -f "qbittorrent-nox" || true
            sleep 1
        fi

        if command -v qbittorrent-nox &>/dev/null; then
            log_info "正在以守护进程模式启动 qbittorrent-nox..."
            /usr/bin/qbittorrent-nox -d 2>/dev/null || qbittorrent-nox -d 2>/dev/null || true
            sleep 1
            RESTARTED=true
        fi
    fi

    # Method 3: Check if running
    if pgrep -f "qbittorrent-nox" &>/dev/null; then
        log_success "qBittorrent 服务已成功运行！"
    else
        log_warn "未检测到 qBittorrent 运行中。若使用 Docker 部署，请重启对应容器使配置生效。"
    fi
}

# ------------------------------------------------------------------------------
# 5. Extract Port and Display Success Summary
# ------------------------------------------------------------------------------
display_summary() {
    log_step "[5/5] 安装配置完毕！"

    # Extract configured WebUI port
    PORT="8080"
    if [[ -f "$CONFIG_PATH" ]]; then
        DETECTED_PORT=$(grep -E '^WebUI\\Port=' "$CONFIG_PATH" | cut -d'=' -f2 | tr -d '\r' || true)
        if [[ -n "$DETECTED_PORT" ]]; then
            PORT="$DETECTED_PORT"
        fi
    fi

    # Extract Public & Local IP
    PUBLIC_IP=$(curl -s --connect-timeout 2 http://ifconfig.me || curl -s --connect-timeout 2 http://icanhazip.com || echo "您的服务器公网IP")
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

    echo ""
    echo -e "${GREEN}${BOLD}🎉 恭喜！Abit 备用 WebUI 主题已成功部署并生效！${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 🌐 ${BOLD}公网访问地址${NC}:  ${CYAN}http://${PUBLIC_IP}:${PORT}${NC}"
    echo -e " 🏠 ${BOLD}局域网地址${NC}:    ${CYAN}http://${LOCAL_IP}:${PORT}${NC}"
    echo -e " 📁 ${BOLD}主题所在路径${NC}:  ${YELLOW}${WEBUI_TARGET_PATH}${NC}"
    echo -e " ⚙️  ${BOLD}配置文件路径${NC}:  ${YELLOW}${CONFIG_PATH}${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    echo -e " 💡 ${BOLD}温馨提示${NC}:"
    echo -e "   • 默认登录账号: ${BOLD}admin${NC}，密码为您此前设置的 WebUI 密码。"
    echo -e "   • 首次在浏览器打开若显示旧界面，请按 ${BOLD}Ctrl + F5${NC} 强制刷新页面。"
    echo -e "   • 体验全新的 Apple 毛玻璃设计、全网检索插件、每页 20 条连续分页！"
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
    configure_alternative_webui
    restart_qbittorrent_service
    display_summary
}

main "$@"
