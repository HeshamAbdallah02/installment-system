# Deployment Guide

## Overview

This guide provides a comprehensive checklist for deploying the Backend Authentication System to production. Follow these steps carefully to ensure a secure and successful deployment.

---

## Pre-Deployment Checklist

### 1. Environment Setup

- [ ] Production server provisioned (minimum 2GB RAM, 2 CPU cores)
- [ ] Node.js 18+ installed on production server
- [ ] PostgreSQL 14+ database provisioned (or Supabase project created)
- [ ] SSL/TLS certificate obtained for HTTPS
- [ ] Domain name configured and DNS records updated
- [ ] Firewall rules configured (allow ports 443, 80, and database port)

### 2. Code Preparation

- [ ] All tests passing locally (`npm test`)
- [ ] Code reviewed and approved
- [ ] Latest changes merged to main/production branch
- [ ] Version tagged in git (e.g., `v1.0.0`)
- [ ] Dependencies audited for vulnerabilities (`npm audit`)
- [ ] Production build tested locally

### 3. Database Preparation

- [ ] Production database created
- [ ] Database backup strategy configured
- [ ] Database connection tested from production server
- [ ] Database user with appropriate permissions created
- [ ] Connection pooling configured

---

## Environment Variables

### Required Environment Variables

Create a `.env` file on the production server with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# JWT Configuration
JWT_SECRET="<GENERATE_STRONG_SECRET_HERE>"
JWT_EXPIRATION="8h"

# Server Configuration
NODE_ENV="production"
PORT=4000

# CORS Configuration
FRONTEND_URL="https://your-frontend-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5

# Optional: Logging
LOG_LEVEL="info"
LOG_FILE_PATH="/var/log/sabaya-api/app.log"
```

### Generating JWT_SECRET

The JWT_SECRET must be a strong, random 256-bit (32-byte) string. Use one of these methods:

**Method 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Method 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Method 3: Using Online Generator**
- Visit: https://www.grc.com/passwords.htm
- Use the "63 random alpha-numeric characters" option
- Copy the generated string

**Example Output:**
```
a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b5a3f7e2d8c4b1a6e9f5d2c8b4a1e7
```

⚠️ **IMPORTANT:** 
- Never commit JWT_SECRET to version control
- Use different secrets for development, staging, and production
- Store secrets securely (use secret management service if available)
- Rotate secrets periodically (every 90 days recommended)

### Environment Variable Validation

Add validation to ensure all required variables are set:

```typescript
// src/config/env.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
  'FRONTEND_URL'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}
```

---

## Database Migration Steps

### 1. Backup Existing Database (if applicable)

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Supabase backup (via dashboard or CLI)
supabase db dump -f backup.sql
```

### 2. Run Prisma Migrations

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations (production mode)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 3. Seed Initial Data (First Deployment Only)

```bash
# Seed database with initial users and data
npx prisma db seed
```

⚠️ **WARNING:** Only run seed command on first deployment. This will create default users with default passwords.

### 4. Verify Database Schema

```bash
# Check database schema
npx prisma db pull

# Validate schema matches Prisma schema
npx prisma validate
```

---

## CORS Configuration

### Development CORS Settings

```typescript
// src/server.ts (development)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Production CORS Settings

```typescript
// src/server.ts (production)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://your-frontend-domain.com',
  'https://www.your-frontend-domain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400 // 24 hours
}));
```

### CORS Checklist

- [ ] Frontend URL added to FRONTEND_URL environment variable
- [ ] CORS middleware configured with production origins
- [ ] Credentials enabled if using cookies
- [ ] Preflight requests handled (OPTIONS method)
- [ ] CORS tested from production frontend domain

---

## Deployment Steps

### Option 1: Manual Deployment

1. **Clone Repository on Server**
   ```bash
   git clone https://github.com/your-org/sabaya-backend.git
   cd sabaya-backend/backend
   ```

2. **Install Dependencies**
   ```bash
   npm ci --production
   ```

3. **Set Environment Variables**
   ```bash
   # Create .env file
   nano .env
   # Paste environment variables (see above)
   ```

4. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Start Application**
   ```bash
   # Using PM2 (recommended)
   npm install -g pm2
   pm2 start dist/server.js --name sabaya-api
   pm2 save
   pm2 startup
   
   # Or using systemd (see below)
   ```

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t sabaya-backend:latest -f backend/Dockerfile .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name sabaya-api \
     -p 4000:4000 \
     --env-file backend/.env \
     sabaya-backend:latest
   ```

3. **Run Migrations**
   ```bash
   docker exec sabaya-api npx prisma migrate deploy
   ```

### Option 3: Platform-as-a-Service (Heroku, Railway, Render)

1. **Connect Repository**
   - Link GitHub repository to platform
   - Select backend directory as root

2. **Configure Environment Variables**
   - Add all required environment variables in platform dashboard
   - Generate and set JWT_SECRET

3. **Configure Build Command**
   ```bash
   cd backend && npm install && npx prisma generate && npm run build
   ```

4. **Configure Start Command**
   ```bash
   cd backend && npx prisma migrate deploy && npm start
   ```

5. **Deploy**
   - Trigger deployment from platform dashboard
   - Monitor build logs for errors

---

## Post-Deployment Checklist

### 1. Verify Deployment

- [ ] API server is running and accessible
- [ ] Health check endpoint responds (if implemented)
- [ ] Database connection successful
- [ ] Logs are being written correctly

### 2. Test API Endpoints

```bash
# Test user list endpoint
curl https://api.your-domain.com/api/users/list

# Test login endpoint
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin", "password": "Password123"}'
```

- [ ] GET /api/users/list returns active users
- [ ] POST /api/auth/login returns JWT token
- [ ] Invalid credentials return 401 error
- [ ] Rate limiting works (5 attempts per 15 minutes)
- [ ] CORS headers present in responses

### 3. Security Verification

- [ ] HTTPS enabled (no HTTP access)
- [ ] JWT_SECRET is strong and unique
- [ ] Default passwords changed for all users
- [ ] Database credentials are secure
- [ ] Firewall rules configured correctly
- [ ] Rate limiting active on login endpoint
- [ ] Error messages don't expose sensitive information
- [ ] Audit logging working (check event_log table)

### 4. Frontend Integration

- [ ] Frontend can fetch user list
- [ ] Frontend can login successfully
- [ ] JWT token stored securely in frontend
- [ ] Token included in Authorization header for protected routes
- [ ] Token expiration handled gracefully
- [ ] CORS allows frontend requests

### 5. Monitoring Setup

- [ ] Application logs configured
- [ ] Error tracking enabled (Sentry, Rollbar, etc.)
- [ ] Performance monitoring enabled (New Relic, DataDog, etc.)
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot, etc.)
- [ ] Alert notifications configured

---

## Process Management with PM2

### Install PM2

```bash
npm install -g pm2
```

### PM2 Configuration File

Create `ecosystem.config.js` in backend directory:

```javascript
module.exports = {
  apps: [{
    name: 'sabaya-api',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# View logs
pm2 logs sabaya-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart sabaya-api

# Stop application
pm2 stop sabaya-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

---

## Systemd Service (Alternative to PM2)

Create `/etc/systemd/system/sabaya-api.service`:

```ini
[Unit]
Description=Sabaya Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sabaya-backend/backend
Environment=NODE_ENV=production
EnvironmentFile=/var/www/sabaya-backend/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sabaya-api

[Install]
WantedBy=multi-user.target
```

### Systemd Commands

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start sabaya-api

# Enable service on boot
sudo systemctl enable sabaya-api

# Check status
sudo systemctl status sabaya-api

# View logs
sudo journalctl -u sabaya-api -f
```

---

## Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/sabaya-api`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy Configuration
    location / {
        proxy_pass http://localhost:4000;
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
    
    # Rate Limiting (additional layer)
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:4000;
        # ... same proxy settings as above
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/sabaya-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

---

## Rollback Procedure

If deployment fails or issues are discovered:

1. **Stop Application**
   ```bash
   pm2 stop sabaya-api
   # or
   sudo systemctl stop sabaya-api
   ```

2. **Restore Database Backup**
   ```bash
   psql -h hostname -U username -d database_name < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Revert to Previous Version**
   ```bash
   git checkout <previous-version-tag>
   npm ci --production
   npm run build
   ```

4. **Restart Application**
   ```bash
   pm2 start sabaya-api
   # or
   sudo systemctl start sabaya-api
   ```

---

## Maintenance Tasks

### Regular Maintenance

- [ ] **Weekly:** Review application logs for errors
- [ ] **Weekly:** Check database performance and query times
- [ ] **Monthly:** Update dependencies (`npm update`)
- [ ] **Monthly:** Review and rotate JWT_SECRET
- [ ] **Monthly:** Audit user accounts and remove inactive users
- [ ] **Quarterly:** Review and update security policies
- [ ] **Quarterly:** Perform security audit and penetration testing

### Database Maintenance

```bash
# Backup database
pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d).sql

# Vacuum database (PostgreSQL)
psql -h hostname -U username -d database_name -c "VACUUM ANALYZE;"

# Check database size
psql -h hostname -U username -d database_name -c "SELECT pg_size_pretty(pg_database_size('database_name'));"
```

---

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs sabaya-api` or `sudo journalctl -u sabaya-api`
2. Verify environment variables are set correctly
3. Check database connection
4. Ensure port 4000 is not already in use: `lsof -i :4000`

### Database Connection Errors

1. Verify DATABASE_URL is correct
2. Check database server is running
3. Verify firewall allows database connections
4. Test connection: `psql $DATABASE_URL`

### CORS Errors

1. Verify FRONTEND_URL matches actual frontend domain
2. Check CORS middleware configuration
3. Ensure frontend sends correct Origin header
4. Check browser console for specific CORS error

### JWT Token Issues

1. Verify JWT_SECRET is set and consistent
2. Check token expiration time
3. Ensure Authorization header format: `Bearer <token>`
4. Verify token hasn't expired (8-hour lifetime)

---

## Support and Resources

- **Documentation:** `/backend/docs/`
- **API Reference:** `/backend/docs/API.md`
- **Default Credentials:** `/backend/docs/DEFAULT_CREDENTIALS.md`
- **Prisma Documentation:** https://www.prisma.io/docs
- **Express.js Documentation:** https://expressjs.com

---

## Changelog

### Version 1.0.0 (Initial Release)
- Initial production deployment guide
- Environment variable configuration
- Database migration procedures
- CORS configuration for production
- PM2 and systemd service setup
- Nginx reverse proxy configuration
- SSL/TLS certificate setup
- Rollback procedures
- Maintenance tasks
