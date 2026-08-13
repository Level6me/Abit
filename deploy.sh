#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="apple-torrent-dashboard"
PORT=5005

echo "🍏 Starting one-click deployment for Apple Torrent Dashboard..."

# 1. Verify python3 installation
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed. Please install Python 3 first." >&2
    exit 1
fi

# 2. Check for qBittorrent WebUI dependency
echo "🔍 Checking for qBittorrent WebUI dependency..."
QBT_DETECTED=false

# Check if qbittorrent-nox binary is available in PATH
if command -v qbittorrent-nox &> /dev/null; then
    QBT_DETECTED=true
    echo "ℹ️  Found qbittorrent-nox binary in system PATH."
fi

# Check if default port 8080 is listening
if command -v ss &> /dev/null && ss -tlnp 2>/dev/null | grep -q ":8080 "; then
    QBT_DETECTED=true
    echo "✅ Active service detected on port 8080 (qBittorrent default port)."
elif command -v netstat &> /dev/null && netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
    QBT_DETECTED=true
    echo "✅ Active service detected on port 8080 (qBittorrent default port)."
fi

if [ "$QBT_DETECTED" = false ]; then
    echo "⚠️  Warning: qBittorrent WebUI (default port 8080) was not detected on this host."
    echo "   The dashboard will deploy successfully, but will display 'offline' until qBittorrent is started."
    echo "   To install and start it on Debian/Ubuntu, you can run:"
    echo "     sudo apt update && sudo apt install -y qbittorrent-nox"
    echo "     qbittorrent-nox -d"
else
    echo "✅ qBittorrent WebUI dependency check passed."
fi

# 3. Setup virtual environment
echo "📦 Setting up Python virtual environment..."
python3 -m venv "$PROJECT_DIR/venv"

# 3. Install dependencies
echo "📥 Upgrading pip and installing dependencies..."
"$PROJECT_DIR/venv/bin/pip" install --upgrade pip
"$PROJECT_DIR/venv/bin/pip" install -r "$PROJECT_DIR/requirements.txt"

# 4. Create logs folder
echo "📁 Creating log directories..."
mkdir -p "$PROJECT_DIR/logs"

# 5. Service registration
echo "⚙️ Registering service..."

if command -v pm2 &> /dev/null; then
    echo "✅ PM2 detected. Deploying via PM2..."
    # Stop existing instance if running
    pm2 delete "$SERVICE_NAME" &> /dev/null || true
    # Start using PM2 config
    pm2 start "$PROJECT_DIR/ecosystem.config.js"
    pm2 save
    echo "🎉 Service successfully deployed and started under PM2!"
    pm2 status "$SERVICE_NAME"
else
    echo "⚠️ PM2 not found. Generating systemd service file..."
    SYSTEMD_FILE="/etc/systemd/system/$SERVICE_NAME.service"
    
    # Generate systemd file contents
    cat <<EOF > "$PROJECT_DIR/$SERVICE_NAME.service"
[Unit]
Description=Apple Torrent Dashboard Web Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/venv/bin/gunicorn -w 1 -b 0.0.0.0:$PORT app:app --preload
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    echo "=========================================================="
    echo "To run this Dashboard as a systemd service, run the following commands:"
    echo "  sudo cp $PROJECT_DIR/$SERVICE_NAME.service $SYSTEMD_FILE"
    echo "  sudo systemctl daemon-reload"
    echo "  sudo systemctl enable $SERVICE_NAME"
    echo "  sudo systemctl start $SERVICE_NAME"
    echo "=========================================================="
fi

echo "🎉 Deployment complete! Dashboard listening on port $PORT."
