#!/bin/bash

# Quick deployment script for holasmile.id.vn server
# Run this single command on your server

echo "🚀 HolaSmile DMS - Quick Production Deploy"
echo "🌍 Target: holasmile.id.vn (103.18.6.39)"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script should be run as root or with sudo"
    echo "💡 Run: sudo $0"
    exit 1
fi

# Stop LiteSpeed if running
echo "🛑 Stopping LiteSpeed Web Server..."
systemctl stop lsws 2>/dev/null || service lsws stop 2>/dev/null || echo "LiteSpeed not running"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Clone or update repository
if [ -d "HolaSmile_DMS" ]; then
    echo "🔄 Updating existing repository..."
    cd HolaSmile_DMS
    git pull origin deploy
else
    echo "📥 Cloning repository..."
    git clone https://github.com/bachnvse1/HolaSmile_DMS.git
    cd HolaSmile_DMS
    git checkout deploy
fi

# Set execute permissions
chmod +x deploy-nginx.sh

# Run deployment
echo "🚀 Starting deployment..."
./deploy-nginx.sh

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# Add to startup
echo "⚙️  Configuring auto-start..."
cat > /etc/systemd/system/holasmile.service << EOF
[Unit]
Description=HolaSmile DMS
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/HolaSmile_DMS
ExecStart=/usr/local/bin/docker-compose -f docker-compose.nginx.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.nginx.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable holasmile.service

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Access your application:"
echo "   🌐 Website: https://holasmile.id.vn"
echo "   🔌 API: https://holasmile.id.vn/api"
echo ""
echo "🔍 Management commands:"
echo "   📊 Status: docker ps"
echo "   📋 Logs: docker-compose -f docker-compose.nginx.yml logs -f"
echo "   🔄 Restart: systemctl restart holasmile"
echo "   🛑 Stop: systemctl stop holasmile"
echo ""
echo "✅ HolaSmile DMS is now running on holasmile.id.vn!"
