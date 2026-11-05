# SmartSpend — Production Deployment & DevOps Guide (DEPLOYMENT.md)

**Target Environment:** Production Linux (Ubuntu 22.04 LTS / Debian 12)  
**Process Manager:** PM2 / Docker Containerization  
**Reverse Proxy:** Nginx with SSL/TLS (Let's Encrypt Certbot)  
**Database:** MongoDB 7.x Cluster with Automated Backups

---

## 1. Production Architecture Overview

In production, SmartSpend is deployed as a secure, containerized or PM2-managed 3-tier architecture:

```mermaid
flowchart TD
    Internet([Public Internet]) --> Nginx["Nginx Reverse Proxy (Port 443 HTTPS / TLS 1.3)"]
    Nginx -- "/ (Static Assets)" --> ClientDist["/var/www/smartspend/client/dist (React SPA)"]
    Nginx -- "/api/v1/*" --> NodeCluster["Node.js Express Cluster (PM2 / Port 5000)"]
    NodeCluster --> Cron["node-cron Daemon (Single leader instance)"]
    NodeCluster -- "Internal Network (TLS)" --> MongoCluster[("MongoDB 7.x Cluster (Port 27017)")]
```

---

## 2. Docker & Containerized Deployment

### Multi-Container Setup (`docker-compose.yml`)

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: smartspend-db
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: smartspend_admin
      MONGO_INITDB_ROOT_PASSWORD: SecureMongoPassword2026!
      MONGO_INITDB_DATABASE: smartspend
    volumes:
      - mongo_data:/data/db
    networks:
      - smartspend-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: smartspend-api
    restart: always
    environment:
      PORT: 5000
      NODE_ENV: production
      MONGODB_URI: mongodb://smartspend_admin:SecureMongoPassword2026!@mongodb:27017/smartspend?authSource=admin
      JWT_SECRET: ProductionGradeUltraSecureJWTSecretKey_SmartSpend_2026!
      JWT_EXPIRES_IN: 7d
      CLIENT_URL: https://smartspend.io
    depends_on:
      - mongodb
    networks:
      - smartspend-network

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: smartspend-web
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server
    networks:
      - smartspend-network

volumes:
  mongo_data:

networks:
  smartspend-network:
    driver: bridge
```

### Server Dockerfile (`server/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Client Dockerfile (`client/Dockerfile`)

```dockerfile
# Stage 1: Build React SPA
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Bare-Metal & VM Deployment with PM2

### 1. Build Client Assets
```bash
cd client
npm ci
npm run build
# Built files placed in client/dist/
```

### 2. Configure PM2 (`server/ecosystem.config.cjs`)
Create `server/ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'smartspend-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
```

Launch with PM2:
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy & Security Configuration

Create `/etc/nginx/sites-available/smartspend.conf`:

```nginx
server {
    listen 80;
    server_name smartspend.io www.smartspend.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartspend.io www.smartspend.io;

    # SSL / TLS Certificates (Let's Encrypt Certbot)
    ssl_certificate /etc/letsencrypt/live/smartspend.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartspend.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # React Client Static SPA
    root /var/www/smartspend/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Gateway Reverse Proxy
    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Upload limit for CSV statements
        client_max_body_size 10M;
    }
}
```

Enable configuration and reload:
```bash
sudo ln -s /etc/nginx/sites-available/smartspend.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Automated Database Backup Strategy

Create a daily MongoDB backup cron script at `/usr/local/bin/backup-smartspend.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/smartspend"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEST="$BACKUP_DIR/mongo_backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Execute mongodump with gzip compression
mongodump --uri="mongodb://localhost:27017/smartspend" --gzip --out="$DEST"

# Retain backups for 30 days
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed successfully at $DEST"
```

Make executable and add to crontab:
```bash
chmod +x /usr/local/bin/backup-smartspend.sh
(crontab -l ; echo "0 2 * * * /usr/local/bin/backup-smartspend.sh >> /var/log/smartspend-backup.log 2>&1") | crontab -
```
