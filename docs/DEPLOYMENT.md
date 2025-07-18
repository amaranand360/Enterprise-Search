# Deployment Guide

This guide covers deploying the Enterprise Search application to various platforms and environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring and Logging](#monitoring-and-logging)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Access to Google Cloud Console
- Domain name (for production)
- SSL certificate (for production)

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following variables:

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Additional Tool Integrations
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
JIRA_CLIENT_ID=your-jira-client-id
JIRA_CLIENT_SECRET=your-jira-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (if using external storage)
DATABASE_URL=your-database-connection-string

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

### Google Cloud Setup

1. **Create a Google Cloud Project**
   ```bash
   gcloud projects create enterprise-search-prod
   gcloud config set project enterprise-search-prod
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable gmail.googleapis.com
   gcloud services enable calendar-json.googleapis.com
   gcloud services enable drive.googleapis.com
   gcloud services enable sheets.googleapis.com
   ```

3. **Create OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add your production domain to authorized origins

## Vercel Deployment

Vercel is the recommended platform for Next.js applications.

### Automatic Deployment

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all required environment variables
   - Set `NODE_ENV=production`

3. **Custom Domain**
   - Add your custom domain in Project Settings > Domains
   - Configure DNS records as instructed

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod --env NODE_ENV=production
```

### Vercel Configuration

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Docker Deployment

### Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://your-domain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Build and Deploy

```bash
# Build the Docker image
docker build -t enterprise-search .

# Run with Docker Compose
docker-compose up -d

# Or run directly
docker run -p 3000:3000 --env-file .env.production enterprise-search
```

## AWS Deployment

### Using AWS Amplify

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   amplify add hosting
   amplify publish
   ```

### Using EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (ports 22, 80, 443)
   - Create or use existing key pair

2. **Setup Server**
   ```bash
   # Connect to instance
   ssh -i your-key.pem ubuntu@your-instance-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Clone repository
   git clone https://github.com/your-org/enterprise-search.git
   cd enterprise-search
   
   # Install dependencies and build
   npm install
   npm run build
   
   # Start with PM2
   pm2 start npm --name "enterprise-search" -- start
   pm2 startup
   pm2 save
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
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
       }
   }
   ```

## Production Considerations

### Performance Optimization

1. **Enable Compression**
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
     poweredByHeader: false,
     generateEtags: false,
   }
   ```

2. **Image Optimization**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['your-domain.com'],
       formats: ['image/webp', 'image/avif'],
     },
   }
   ```

3. **Bundle Analysis**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

### Security

1. **Content Security Policy**
   ```javascript
   // next.config.js
   const securityHeaders = [
     {
       key: 'Content-Security-Policy',
       value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline';"
     }
   ]
   
   module.exports = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: securityHeaders,
         },
       ]
     },
   }
   ```

2. **Rate Limiting**
   ```javascript
   // middleware.js
   import { NextResponse } from 'next/server'
   import { Ratelimit } from '@upstash/ratelimit'
   
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'),
   })
   
   export async function middleware(request) {
     const ip = request.ip ?? '127.0.0.1'
     const { success } = await ratelimit.limit(ip)
     
     if (!success) {
       return new NextResponse('Too Many Requests', { status: 429 })
     }
     
     return NextResponse.next()
   }
   ```

### Database Setup (Optional)

If you need persistent storage:

```sql
-- PostgreSQL schema
CREATE TABLE connections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  tool_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  credentials JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring and Logging

### Health Checks

Create `/api/health`:

```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

### Logging

```javascript
// lib/logger.js
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

### Error Tracking

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

## Backup and Recovery

### Database Backups

```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d database_name > backup.sql

# Restore
psql -h localhost -U username -d database_name < backup.sql
```

### File Backups

```bash
# Backup application files
tar -czf enterprise-search-backup.tar.gz /path/to/app

# Backup with rsync
rsync -av --delete /path/to/app/ backup-server:/backups/enterprise-search/
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Clear `.next` directory and rebuild
   - Verify all environment variables are set

2. **OAuth Issues**
   - Verify redirect URIs in Google Console
   - Check domain configuration
   - Ensure HTTPS in production

3. **Performance Issues**
   - Enable Next.js analytics
   - Monitor bundle size
   - Check database query performance

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
NEXT_DEBUG=true
```

## Scaling

### Horizontal Scaling

```yaml
# kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enterprise-search
spec:
  replicas: 3
  selector:
    matchLabels:
      app: enterprise-search
  template:
    metadata:
      labels:
        app: enterprise-search
    spec:
      containers:
      - name: app
        image: enterprise-search:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

### Load Balancing

```nginx
upstream enterprise_search {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://enterprise_search;
    }
}
```
