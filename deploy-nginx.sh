#!/bin/bash

# HolaSmile DMS Deployment Script for bachnvse.me
# Run this script on your server

echo "🚀 Starting HolaSmile DMS deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.nginx.yml down 2>/dev/null || true

# Remove old images (optional)
read -p "🔄 Do you want to remove old images to free space? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -f
fi

# Create necessary directories
mkdir -p ssl nginx/conf.d

# Check if SSL certificates exist
if [[ ! -f "ssl/bachnvse.me.crt" || ! -f "ssl/bachnvse.me.key" ]]; then
    echo "📜 SSL certificates not found. Creating self-signed certificates..."
    docker run --rm -v $(pwd)/ssl:/certs alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /certs/bachnvse.me.key \
        -out /certs/bachnvse.me.crt \
        -subj "/C=VN/ST=HCM/L=HCMC/O=HolaSmile/OU=IT/CN=bachnvse.me"
    echo "✅ Self-signed SSL certificates created."
fi

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.nginx.yml up -d --build

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose -f docker-compose.nginx.yml ps

# Check if containers are healthy
if docker ps | grep -q "holasmile_nginx_prod.*Up"; then
    echo "✅ Nginx container is running"
else
    echo "❌ Nginx container failed to start"
    docker logs holasmile_nginx_prod
    exit 1
fi

if docker ps | grep -q "holasmile_api_prod.*Up"; then
    echo "✅ API container is running"
else
    echo "❌ API container failed to start"
    docker logs holasmile_api_prod
    exit 1
fi

if docker ps | grep -q "holasmile_web_prod.*Up"; then
    echo "✅ Frontend container is running"
else
    echo "❌ Frontend container failed to start"
    docker logs holasmile_web_prod
    exit 1
fi

if docker ps | grep -q "holasmile_db_prod.*Up"; then
    echo "✅ Database container is running"
else
    echo "❌ Database container failed to start"
    docker logs holasmile_db_prod
    exit 1
fi

# Test HTTP endpoint
echo "🌐 Testing HTTP endpoint..."
if curl -s http://localhost > /dev/null; then
    echo "✅ HTTP endpoint is working"
else
    echo "⚠️  HTTP endpoint test failed (this may be normal if using HTTPS redirect)"
fi

# Display final information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   • Website: https://bachnvse.me"
echo "   • API: https://bachnvse.me/api"
echo "   • HTTP (redirects to HTTPS): http://bachnvse.me"
echo ""
echo "🔍 Useful commands:"
echo "   • Check status: docker-compose -f docker-compose.nginx.yml ps"
echo "   • View logs: docker-compose -f docker-compose.nginx.yml logs -f"
echo "   • Stop: docker-compose -f docker-compose.nginx.yml down"
echo "   • Update: git pull && docker-compose -f docker-compose.nginx.yml up -d --build"
echo ""
echo "📁 Important files:"
echo "   • Config: docker-compose.nginx.yml"
echo "   • Environment: .env.prod" 
echo "   • Nginx config: nginx/conf.d/bachnvse.me.conf"
echo "   • SSL certificates: ssl/"
echo ""

# Setup auto-renewal for SSL (if using Let's Encrypt)
if command -v certbot &> /dev/null; then
    echo "🔄 Setting up SSL auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.nginx.yml restart nginx") | crontab -
    echo "✅ SSL auto-renewal configured"
fi

echo "🏁 Deployment script finished!"
