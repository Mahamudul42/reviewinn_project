#!/bin/bash
# === ReviewInn Final Unified Manager ===
# Handles: Deploy | Restart | Telegram Monitoring

# === Hardcoded Domain & Config ===
VPS_IP="150.230.140.7"
VPS_USER="ubuntu"
UNI_USER="hasan181"
EMAIL="reviewinn.com@gmail.com"

# Domains (Hardcoded - No Variable Bug)
DOMAIN_MAIN="reviewinn.com"
DOMAIN_API="api.reviewinn.com"
DOMAIN_ADMIN="admin.reviewinn.com"

deploy() {
    echo "🚀 [STEP 1] Using existing SSH keys for Tunnel..."
    
    echo "🔹 Installing autossh..."
    sudo apt update && sudo apt install autossh -y
    
    echo "🔹 Creating Tunnel Script..."
    sudo tee /usr/local/bin/reviewinn-tunnel.sh > /dev/null <<EOL
#!/bin/bash
AUTOSSH_PORT=0
AUTOSSH_GATETIME=0
while true; do
/usr/bin/autossh -M 0 -N \
  -o "ServerAliveInterval 30" \
  -o "ServerAliveCountMax 3" \
  -i /home/$UNI_USER/.ssh/reviewinn_key \
  -R 127.0.0.1:9010:localhost:5173 \
  -R 127.0.0.1:9020:localhost:8000 \
  -R 127.0.0.1:9030:localhost:8001 \
  $VPS_USER@$VPS_IP
sleep 10
done
EOL
    sudo chmod +x /usr/local/bin/reviewinn-tunnel.sh

    echo "🔹 Creating systemd Service..."
    sudo tee /etc/systemd/system/reviewinn-tunnel.service > /dev/null <<EOL
[Unit]
Description=ReviewInn Reverse SSH Tunnel
After=network.target

[Service]
ExecStart=/usr/local/bin/reviewinn-tunnel.sh
Restart=always
RestartSec=5
User=$UNI_USER

[Install]
WantedBy=multi-user.target
EOL

    sudo systemctl daemon-reload
    sudo systemctl enable reviewinn-tunnel
    sudo systemctl restart reviewinn-tunnel
    echo "✅ Tunnel Active on University Side"

    echo "🔹 Configuring VPS..."
    ssh -i /home/$UNI_USER/.ssh/reviewinn_key $VPS_USER@$VPS_IP "bash -s" <<'VPS_SETUP'
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y

# Correct Nginx Reverse Proxy
sudo tee /etc/nginx/sites-enabled/reviewinn.conf > /dev/null <<CONF
server {
    listen 80;
    server_name reviewinn.com www.reviewinn.com;
    location / { proxy_pass http://127.0.0.1:9010; }
}
server {
    listen 80;
    server_name api.reviewinn.com;
    location / { proxy_pass http://127.0.0.1:9020; }
}
server {
    listen 80;
    server_name admin.reviewinn.com;
    location / { proxy_pass http://127.0.0.1:9030; }
}
CONF

sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Proper SSL without Variable Bug
sudo certbot --nginx \
  -d reviewinn.com -d www.reviewinn.com \
  -d api.reviewinn.com -d admin.reviewinn.com \
  --non-interactive --agree-tos -m reviewinn.com@gmail.com

sudo systemctl enable certbot.timer && sudo systemctl start certbot.timer
VPS_SETUP

    echo "✅ Deployment Completed! Visit: https://$DOMAIN_MAIN"
}

restart_all() {
    echo "🔹 Restarting Tunnel..."
    sudo systemctl restart reviewinn-tunnel
    echo "🔹 Restarting VPS Services..."
    ssh -i /home/$UNI_USER/.ssh/reviewinn_key $VPS_USER@$VPS_IP "sudo systemctl restart nginx && sudo systemctl restart certbot.timer"
    echo "✅ All Services Restarted"
}

setup_telegram_monitor() {
    echo "🔹 Enabling Telegram Alerts..."
    ssh -i /home/$UNI_USER/.ssh/reviewinn_key $VPS_USER@$VPS_IP "bash -s" <<'MONITOR'
TOKEN="your_bot_token"
CHAT="your_chat_id"
sudo tee /usr/local/bin/reviewinn-monitor.sh > /dev/null <<'SCRIPT'
#!/bin/bash
URL="https://reviewinn.com"
TOKEN="your_bot_token"
CHAT="your_chat_id"
if ! curl -Is \$URL | grep 200 > /dev/null; then
    curl -s -X POST https://api.telegram.org/bot\$TOKEN/sendMessage -d chat_id=\$CHAT -d text="🚨 ReviewInn Down!"
fi
SCRIPT
sudo chmod +x /usr/local/bin/reviewinn-monitor.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/reviewinn-monitor.sh") | crontab -
MONITOR
    echo "✅ Telegram Monitoring Set"
}

case $1 in
    deploy) deploy ;;
    restart) restart_all ;;
    telegram-monitor) setup_telegram_monitor ;;
    *) echo "Usage: $0 {deploy|restart|telegram-monitor}" ;;
esac
