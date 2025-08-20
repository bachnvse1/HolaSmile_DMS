# HolaSmile DMS - Production Deployment Package
# Files cần upload lên server bachnvse.me

## 📁 Required Files:

### 1. Docker Configuration
- docker-compose.nginx.yml
- .env.prod

### 2. Nginx Configuration  
- nginx/conf.d/bachnvse.me.conf

### 3. SSL Certificates
- ssl/bachnvse.me.crt (✅ Updated with real certificate)
- ssl/bachnvse.me.key (✅ Updated with real certificate)

### 4. Deployment Scripts
- deploy-nginx.sh (for Linux server)
- deploy-nginx.ps1 (for Windows server)

### 5. Documentation
- NGINX-DEPLOYMENT.md

## 🚀 Upload Methods:

### Option 1: Git Clone (Recommended)
```bash
git clone https://github.com/bachnvse1/HolaSmile_DMS.git
cd HolaSmile_DMS
git checkout deploy
```

### Option 2: FTP/SFTP Upload
Upload the following files to server root directory:
- All files listed above

### Option 3: Direct Copy
If you have direct server access, copy the entire project folder.

## 📋 Server Requirements:

### Minimum Specifications:
- RAM: 4GB+ 
- Storage: 20GB+ free space
- CPU: 2+ cores
- OS: Linux (Ubuntu/CentOS) or Windows Server

### Required Software:
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (for cloning method)

### Network Requirements:
- Port 80 (HTTP) - open
- Port 443 (HTTPS) - open  
- Port 22 (SSH) - for management

## 🔧 Pre-deployment Checks:

1. ✅ Docker containers running locally
2. ✅ SSL certificates updated
3. ✅ Nginx configuration tested
4. ✅ Environment variables configured
5. ✅ Deployment scripts prepared

## ⚡ Next Actions:

1. **Stop LiteSpeed on server** (if running)
2. **Upload files to bachnvse.me**
3. **Run deployment script**
4. **Configure DNS** (if needed)
5. **Test HTTPS access**

## 📞 Support Commands:

```bash
# Check container status
docker ps

# View all logs
docker-compose -f docker-compose.nginx.yml logs -f

# Restart specific service
docker-compose -f docker-compose.nginx.yml restart nginx

# Update deployment
git pull && docker-compose -f docker-compose.nginx.yml up -d --build

# Backup database
docker exec holasmile_db_prod mysqldump -u holasmile_user -p HolaSmile_DMS_Prod > backup.sql
```
