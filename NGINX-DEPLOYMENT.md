# HolaSmile DMS - Deployment Guide for holasmile.id.vn

## 1. Chuẩn bị trên server holasmile.id.vn

### Upload các file sau lên server:
```
docker-compose.nginx.yml
.env.prod
nginx/conf.d/bachnvse.me.conf
ssl/bachnvse.me.crt
ssl/bachnvse.me.key
```

### Hoặc clone toàn bộ project:
```bash
git clone https://github.com/bachnvse1/HolaSmile_DMS.git
cd HolaSmile_DMS
git checkout deploy
```

## 2. Chạy trên server

### Dừng LiteSpeed (nếu đang chạy):
```bash
systemctl stop lsws
# hoặc
service lsws stop
```

### Chạy với Docker:
```bash
# Build và chạy containers
docker-compose -f docker-compose.nginx.yml up -d --build

# Kiểm tra status
docker ps

# Xem logs
docker logs holasmile_nginx_prod
```

## 3. Cấu hình DNS

Đảm bảo DNS của `holasmile.id.vn` trỏ về IP server: `103.18.6.39`

## 4. Truy cập

- **HTTP**: http://bachnvse.me (sẽ redirect đến HTTPS)
- **HTTPS**: https://bachnvse.me
- **API**: https://bachnvse.me/api/

## 5. SSL Certificate (Production)

Để có SSL certificate thật từ Let's Encrypt:

```bash
# Cài đặt certbot
sudo apt update
sudo apt install certbot

# Dừng nginx containers
docker-compose -f docker-compose.nginx.yml stop nginx

# Tạo certificate
sudo certbot certonly --standalone -d bachnvse.me

# Copy certificates
sudo cp /etc/letsencrypt/live/bachnvse.me/fullchain.pem ./ssl/bachnvse.me.crt
sudo cp /etc/letsencrypt/live/bachnvse.me/privkey.pem ./ssl/bachnvse.me.key

# Restart containers
docker-compose -f docker-compose.nginx.yml up -d
```

## 6. Cấu hình Firewall

```bash
# Mở ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 7. Monitoring

```bash
# Check containers
docker ps

# Check logs
docker logs -f holasmile_nginx_prod
docker logs -f holasmile_api_prod
docker logs -f holasmile_web_prod

# Check disk space
df -h

# Check memory
free -h
```

## 8. Backup Database

```bash
# Backup
docker exec holasmile_db_prod mysqldump -u holasmile_user -p HolaSmile_DMS_Prod > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i holasmile_db_prod mysql -u holasmile_user -p HolaSmile_DMS_Prod < backup_20250819.sql
```

## Ports đang sử dụng:
- **80**: HTTP (nginx proxy)
- **443**: HTTPS (nginx proxy)  
- **3000**: Frontend container
- **5000**: API container
- **3307**: MySQL container (external port)
