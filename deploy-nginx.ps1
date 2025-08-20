# HolaSmile DMS Deployment Script for Windows/PowerShell
# Run this script on your Windows server

Write-Host "🚀 Starting HolaSmile DMS deployment..." -ForegroundColor Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.nginx.yml down
} catch {
    Write-Host "No existing containers to stop." -ForegroundColor Gray
}

# Remove old images (optional)
$removeImages = Read-Host "🔄 Do you want to remove old images to free space? (y/N)"
if ($removeImages -eq "y" -or $removeImages -eq "Y") {
    docker system prune -f
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path "ssl", "nginx\conf.d" | Out-Null

# Check if SSL certificates exist
if (-not (Test-Path "ssl\bachnvse.me.crt") -or -not (Test-Path "ssl\bachnvse.me.key")) {
    Write-Host "📜 SSL certificates not found. Creating self-signed certificates..." -ForegroundColor Yellow
    
    docker run --rm -v "${PWD}/ssl:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/bachnvse.me.key -out /certs/bachnvse.me.crt -subj "/C=VN/ST=HCM/L=HCMC/O=HolaSmile/OU=IT/CN=bachnvse.me"
    
    Write-Host "✅ Self-signed SSL certificates created." -ForegroundColor Green
}

# Build and start containers
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.nginx.yml up -d --build

# Wait for containers to start
Write-Host "⏳ Waiting for containers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check container status
Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose -f docker-compose.nginx.yml ps

# Check if containers are healthy
$nginxRunning = docker ps | Select-String "holasmile_nginx_prod.*Up"
$apiRunning = docker ps | Select-String "holasmile_api_prod.*Up"
$webRunning = docker ps | Select-String "holasmile_web_prod.*Up"
$dbRunning = docker ps | Select-String "holasmile_db_prod.*Up"

if ($nginxRunning) {
    Write-Host "✅ Nginx container is running" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx container failed to start" -ForegroundColor Red
    docker logs holasmile_nginx_prod
    exit 1
}

if ($apiRunning) {
    Write-Host "✅ API container is running" -ForegroundColor Green
} else {
    Write-Host "❌ API container failed to start" -ForegroundColor Red
    docker logs holasmile_api_prod
    exit 1
}

if ($webRunning) {
    Write-Host "✅ Frontend container is running" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend container failed to start" -ForegroundColor Red
    docker logs holasmile_web_prod
    exit 1
}

if ($dbRunning) {
    Write-Host "✅ Database container is running" -ForegroundColor Green
} else {
    Write-Host "❌ Database container failed to start" -ForegroundColor Red
    docker logs holasmile_db_prod
    exit 1
}

# Test HTTP endpoint
Write-Host "🌐 Testing HTTP endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ HTTP endpoint is working" -ForegroundColor Green
} catch {
    Write-Host "⚠️  HTTP endpoint test failed (this may be normal if using HTTPS redirect)" -ForegroundColor Yellow
}

# Display final information
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Information:" -ForegroundColor Cyan
Write-Host "   • Website: https://bachnvse.me" -ForegroundColor White
Write-Host "   • API: https://bachnvse.me/api" -ForegroundColor White
Write-Host "   • HTTP (redirects to HTTPS): http://bachnvse.me" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Useful commands:" -ForegroundColor Cyan
Write-Host "   • Check status: docker-compose -f docker-compose.nginx.yml ps" -ForegroundColor Gray
Write-Host "   • View logs: docker-compose -f docker-compose.nginx.yml logs -f" -ForegroundColor Gray
Write-Host "   • Stop: docker-compose -f docker-compose.nginx.yml down" -ForegroundColor Gray
Write-Host "   • Update: git pull; docker-compose -f docker-compose.nginx.yml up -d --build" -ForegroundColor Gray
Write-Host ""
Write-Host "📁 Important files:" -ForegroundColor Cyan
Write-Host "   • Config: docker-compose.nginx.yml" -ForegroundColor Gray
Write-Host "   • Environment: .env.prod" -ForegroundColor Gray
Write-Host "   • Nginx config: nginx\conf.d\bachnvse.me.conf" -ForegroundColor Gray
Write-Host "   • SSL certificates: ssl\" -ForegroundColor Gray
Write-Host ""
Write-Host "🏁 Deployment script finished!" -ForegroundColor Green

# Open browser to test
$openBrowser = Read-Host "🌐 Do you want to open the website in browser? (y/N)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "https://bachnvse.me"
}
