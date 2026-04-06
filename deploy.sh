#!/bin/bash
# =============================================================
# KYRON MEDICAL - EC2 DEPLOYMENT SCRIPT
# Run this once on a fresh Ubuntu 22.04 EC2 instance
# =============================================================

set -e

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "=== Installing nginx ==="
sudo apt-get install -y nginx

echo "=== Installing PM2 (process manager) ==="
sudo npm install -g pm2

echo "=== Installing Certbot for HTTPS ==="
sudo apt-get install -y certbot python3-certbot-nginx

echo "=== Cloning your repo ==="
# Replace with your actual GitHub repo URL
git clone https://github.com/YOUR_USERNAME/kyron-medical.git /home/ubuntu/kyron-medical
cd /home/ubuntu/kyron-medical

echo "=== Installing backend dependencies ==="
cd backend
npm install
# Copy your .env file here: cp .env.example .env && nano .env

echo "=== Installing frontend dependencies and building ==="
cd ../frontend
npm install
npm run build
# This creates a /dist folder with the built React app

echo "=== Setting up nginx ==="
sudo tee /etc/nginx/sites-available/kyron-medical << 'NGINX'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Serve React frontend
    root /home/ubuntu/kyron-medical/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/kyron-medical /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=== Starting backend with PM2 ==="
cd /home/ubuntu/kyron-medical/backend
pm2 start server.js --name kyron-backend
pm2 startup
pm2 save

echo ""
echo "=== NEXT: Set up HTTPS ==="
echo "Run: sudo certbot --nginx -d YOUR_DOMAIN"
echo ""
echo "=== DONE! Your app should be running ==="
echo "Frontend: http://YOUR_DOMAIN"
echo "Backend health: http://YOUR_DOMAIN/api/health"
