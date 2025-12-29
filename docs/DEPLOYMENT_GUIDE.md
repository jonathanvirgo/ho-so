# 🚀 Deployment Guide - Hướng dẫn Triển khai

## 📋 Tổng quan Deployment

Hệ thống hỗ trợ nhiều môi trường triển khai:
- **Development**: Local development environment
- **Staging**: Testing environment
- **Production**: Live production environment

## 🔧 System Requirements

### Server Requirements
```
- Node.js: >= 16.x
- MySQL: >= 8.0
- Memory: >= 4GB RAM
- Storage: >= 20GB SSD
- OS: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
```

### Dependencies
```json
{
  "node": ">=16.0.0",
  "mysql": ">=8.0.0",
  "nginx": ">=1.18.0" (optional),
  "pm2": ">=5.0.0" (recommended)
}
```

## 🔐 Environment Configuration

### Environment Variables (.env)
```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=patients_user
DATABASE_PASSWORD=secure_password
DATABASE_URL=patients_db
DATABASE_CONNECTION_LIMIT=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-session-secret
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload Configuration
UPLOAD_PATH=/var/www/patients/uploads
MAX_FILE_SIZE=50MB

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
```

## 🗄️ Database Setup

### MySQL Database Creation
```sql
-- Create database
CREATE DATABASE patients_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'patients_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON patients_db.* TO 'patients_user'@'localhost';
FLUSH PRIVILEGES;

-- For remote access (if needed)
CREATE USER 'patients_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON patients_db.* TO 'patients_user'@'%';
FLUSH PRIVILEGES;
```

### Database Migration
```bash
# Run database migrations
cd /path/to/patients
mysql -u patients_user -p patients_db < database/migrations/2025_08_19_survey_system.sql
mysql -u patients_user -p patients_db < database/migrations/2025_08_28_create_automation_tables.sql

# Import initial data (if any)
mysql -u patients_user -p patients_db < database/initial_data.sql
```

### SQLite Setup
```bash
# Create SQLite storage directory
mkdir -p /var/www/patients/storage/sqlite
chown -R www-data:www-data /var/www/patients/storage
chmod 755 /var/www/patients/storage/sqlite
```

## 📦 Application Deployment

### 1. Clone Repository
```bash
# Clone the repository
git clone https://github.com/your-org/patients.git
cd patients

# Install dependencies
npm install --production

# Create necessary directories
mkdir -p logs uploads storage/sqlite
```

### 2. Build Assets (if applicable)
```bash
# Build frontend assets
npm run build

# Optimize images
npm run optimize-images

# Minify CSS/JS
npm run minify
```

### 3. PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'patients-app',
    script: './bin/www',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 4. Start Application
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

## 🌐 Nginx Configuration

### Nginx Virtual Host
```nginx
# /etc/nginx/sites-available/patients
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static Files
    location /css/ {
        alias /var/www/patients/public/css/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        alias /var/www/patients/public/js/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        alias /var/www/patients/public/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File Uploads
    location /uploads/ {
        alias /var/www/patients/uploads/;
        expires 1d;
    }

    # Main Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File Upload Size
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/patients_access.log;
    error_log /var/log/nginx/patients_error.log;
}
```

### Enable Nginx Site
```bash
# Enable site
ln -s /etc/nginx/sites-available/patients /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

## 🔒 SSL Certificate Setup

### Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logging

### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs patients-app

# Restart application
pm2 restart patients-app

# Reload application (zero-downtime)
pm2 reload patients-app
```

### Log Rotation
```bash
# /etc/logrotate.d/patients
/var/www/patients/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop

# Monitor disk I/O
iotop

# Monitor network usage
nethogs
```

## 🔄 Backup Strategy

### Database Backup
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/patients"
DB_NAME="patients_db"
DB_USER="patients_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# MySQL backup
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/mysql_backup_$DATE.sql

# SQLite backups
cp -r /var/www/patients/storage/sqlite $BACKUP_DIR/sqlite_backup_$DATE

# Compress backups
tar -czf $BACKUP_DIR/patients_backup_$DATE.tar.gz $BACKUP_DIR/*_backup_$DATE*

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/patients_backup_$DATE.tar.gz s3://your-backup-bucket/
```

### Application Backup
```bash
#!/bin/bash
# backup-application.sh

DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/patients"
BACKUP_DIR="/var/backups/patients"

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz $APP_DIR/uploads

# Backup configuration
cp $APP_DIR/.env $BACKUP_DIR/env_backup_$DATE

# Backup logs
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz $APP_DIR/logs
```

## 🔧 Maintenance Tasks

### Regular Maintenance Script
```bash
#!/bin/bash
# maintenance.sh

echo "Starting maintenance tasks..."

# Clear old sessions
mysql -u patients_user -p patients_db -e "DELETE FROM user_tokens WHERE expires_at < NOW();"

# Clear old audit logs (keep 90 days)
mysql -u patients_user -p patients_db -e "DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);"

# Clear old webhook logs (keep 30 days)
mysql -u patients_user -p patients_db -e "DELETE FROM webhook_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);"

# Optimize database tables
mysql -u patients_user -p patients_db -e "OPTIMIZE TABLE users, user_tokens, audit_logs, webhook_logs;"

# Clear application cache
pm2 sendSignal SIGUSR2 patients-app

# Restart application (if needed)
# pm2 restart patients-app

echo "Maintenance tasks completed."
```

### Cron Jobs
```bash
# crontab -e

# Daily database backup at 2 AM
0 2 * * * /var/www/patients/scripts/backup-database.sh

# Weekly application backup on Sunday at 3 AM
0 3 * * 0 /var/www/patients/scripts/backup-application.sh

# Daily maintenance at 4 AM
0 4 * * * /var/www/patients/scripts/maintenance.sh

# Log rotation check
0 1 * * * /usr/sbin/logrotate /etc/logrotate.d/patients
```

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection Issues**
   - Check MySQL service status
   - Verify credentials in .env
   - Check firewall settings

2. **Application Won't Start**
   - Check PM2 logs: `pm2 logs`
   - Verify Node.js version
   - Check file permissions

3. **High Memory Usage**
   - Monitor with `pm2 monit`
   - Adjust PM2 max_memory_restart
   - Check for memory leaks

4. **Slow Performance**
   - Enable database query logging
   - Check Nginx access logs
   - Monitor system resources

### Health Check Endpoint
```javascript
// Add to routes/api.js
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version
    });
});
```
