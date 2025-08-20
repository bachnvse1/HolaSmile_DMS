#!/bin/bash

# HolaSmile DMS Deployment Script for Azure Server
# Domain: bachnvse.me -> IP: 20.2.83.192

echo "🚀 Starting HolaSmile DMS deployment on Azure..."
echo "🌍 Domain: bachnvse.me"
echo "🖥️  Server IP: 20.2.83.192"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    echo "✅ Running with root privileges"
else
    echo "⚠️  This script needs sudo privileges for some operations"
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is already installed"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose is already installed"
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📚 Installing Git..."
    sudo apt install git -y
    echo "✅ Git installed successfully"
else
    echo "✅ Git is already installed"
fi

# Clone or update repository
if [ -d "HolaSmile_DMS" ]; then
    echo "🔄 Updating existing repository..."
    cd HolaSmile_DMS
    git pull origin deploy
else
    echo "📥 Cloning repository..."
    git clone https://github.com/itsbachnv/HolaSmile_DMS.git
    cd HolaSmile_DMS
    git checkout deploy
fi

# Create environment file for Azure
if [ ! -f ".env.azure" ]; then
    echo "⚙️  Creating Azure environment file..."
    cat > .env.azure << EOF
# Azure Production Environment Variables
MYSQL_DATABASE=HolaSmile_DMS_Azure
MYSQL_USER=holasmile_user
MYSQL_PASSWORD=HolaSmileAzure2025!@#
MYSQL_ROOT_PASSWORD=RootAzure2025!@#

# Production specific settings
ASPNETCORE_ENVIRONMENT=Production
DOMAIN=bachnvse.me
SERVER_IP=20.2.83.192
EOF
    echo "✅ Environment file created"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.azure.yml down 2>/dev/null || true

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.azure.yml --env-file .env.azure up -d --build

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 15

# Check container status
echo "📊 Container status:"
docker-compose -f docker-compose.azure.yml ps

# Check if containers are healthy
if docker ps | grep -q "holasmile_nginx_azure.*Up"; then
    echo "✅ Nginx container is running"
else
    echo "❌ Nginx container failed to start"
    docker logs holasmile_nginx_azure
fi

if docker ps | grep -q "holasmile_api_azure.*Up"; then
    echo "✅ API container is running"
else
    echo "❌ API container failed to start"
    docker logs holasmile_api_azure
fi

if docker ps | grep -q "holasmile_web_azure.*Up"; then
    echo "✅ Frontend container is running"
else
    echo "❌ Frontend container failed to start"
    docker logs holasmile_web_azure
fi

if docker ps | grep -q "holasmile_db_azure.*Up"; then
    echo "✅ Database container is running"
else
    echo "❌ Database container failed to start"
    docker logs holasmile_db_azure
fi

# Configure firewall
echo "🔒 Configuring Azure NSG and local firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

# Test HTTP endpoint
echo "🌐 Testing HTTP endpoint..."
sleep 5
if curl -s http://localhost > /dev/null; then
    echo "✅ Local HTTP endpoint is working"
else
    echo "⚠️  Local HTTP endpoint test failed"
fi

# Display final information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   🌐 Website: http://bachnvse.me"
echo "   🔌 API: http://bachnvse.me/api"
echo "   🖥️  Server IP: 20.2.83.192"
echo ""
echo "⚠️  DNS Configuration Required:"
echo "   Configure DNS A record: bachnvse.me -> 20.2.83.192"
echo ""
echo "🔍 Management commands:"
echo "   📊 Status: docker-compose -f docker-compose.azure.yml ps"
echo "   📋 Logs: docker-compose -f docker-compose.azure.yml logs -f"
echo "   🔄 Restart: docker-compose -f docker-compose.azure.yml restart"
echo "   🛑 Stop: docker-compose -f docker-compose.azure.yml down"
echo ""
echo "📁 Important files:"
echo "   • Config: docker-compose.azure.yml"
echo "   • Environment: .env.azure"
echo "   • Nginx config: nginx/conf.d/azure.conf"
echo ""

# Setup auto-start service
echo "⚙️  Setting up auto-start service..."
sudo tee /etc/systemd/system/holasmile-azure.service > /dev/null << EOF
[Unit]
Description=HolaSmile DMS Azure
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PWD
ExecStart=/usr/local/bin/docker-compose -f docker-compose.azure.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.azure.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable holasmile-azure.service
echo "✅ Auto-start service configured"

echo ""
echo "🏁 Azure deployment script finished!"
echo "🔗 Next step: Configure DNS to point bachnvse.me to 20.2.83.192"
