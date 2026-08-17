#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/shadrickvidmar/Documents/vidmarholdings/Businesses/vidmar.ai/assets/apps/freeinvoicemaker"
SERVICE_DEST="/etc/systemd/system/freeinvoicemaker.service"

echo "Setting up virtualenv and installing dependencies (if needed)..."
cd "$PROJECT_DIR"
if [ ! -d ".venv" ]; then
  python -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Creating systemd service file at $SERVICE_DEST (requires sudo)..."
cat > /tmp/freeinvoicemaker.service <<EOF
[Unit]
Description=Free Invoice Maker (FastAPI)
After=network.target

[Service]
Type=simple
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$PROJECT_DIR
Environment=PYTHONUNBUFFERED=1
ExecStart=$PROJECT_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --log-level info
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo cp /tmp/freeinvoicemaker.service "$SERVICE_DEST"
sudo systemctl daemon-reload
sudo systemctl enable --now freeinvoicemaker.service
sudo systemctl status --no-pager freeinvoicemaker.service | sed -n '1,120p'

echo "Installation complete. Use: sudo journalctl -u freeinvoicemaker.service -f to follow logs."