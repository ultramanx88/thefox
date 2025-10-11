#!/bin/bash

# SSL setup script for theFOX application
set -e

echo "🔒 Setting up SSL for theFOX application..."

# Configuration
DOMAIN=""
EMAIL=""
PROJECT_ID=""

# Get domain from user
if [ -z "$DOMAIN" ]; then
    echo "📋 Please enter your domain name:"
    read -p "Domain: " DOMAIN
fi

# Get email from user
if [ -z "$EMAIL" ]; then
    echo "📧 Please enter your email address:"
    read -p "Email: " EMAIL
fi

# Get project ID from user
if [ -z "$PROJECT_ID" ]; then
    echo "📋 Please enter your Google Cloud Project ID:"
    read -p "Project ID: " PROJECT_ID
fi

# Install certbot
echo "🔧 Installing certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Generate SSL certificate
echo "🔐 Generating SSL certificate..."
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Update nginx configuration
echo "📝 Updating nginx configuration..."
cat > /etc/nginx/sites-available/thefox << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to theFOX application
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/thefox /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ SSL setup completed!"
echo "🔗 Your application is now available at: https://$DOMAIN"
