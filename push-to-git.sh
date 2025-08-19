#!/bin/bash

# Push to Git for easy deployment on server

echo "📤 Pushing to Git repository..."

# Add all production files
git add .
git add docker-compose.nginx.yml
git add .env.prod
git add nginx/conf.d/bachnvse.me.conf
git add ssl/
git add deploy-nginx.sh
git add deploy-nginx.ps1
git add *.md

# Commit changes
git commit -m "🚀 Production deployment files for bachnvse.me with HTTPS"

# Push to deploy branch
git push origin deploy

echo "✅ Files pushed to Git repository"
echo "🌐 Now you can clone on server: git clone https://github.com/bachnvse1/HolaSmile_DMS.git"
