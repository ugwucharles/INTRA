# INTRA Deployment Guide

## Frontend Deployment (Cloudflare Pages)

### Prerequisites
- Cloudflare account
- Git repository with your code

### Steps

1. **Connect your repository to Cloudflare Pages**
   - Go to Cloudflare Dashboard > Pages
   - Click "Create a project"
   - Connect your Git repository

2. **Configure build settings**
   ```
   Build command: cd frontend && npm install && npm run build
   Build output directory: frontend/.next
   Root directory: / (or leave empty)
   ```

3. **Environment variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will build and deploy your Next.js app

## Backend Deployment Options

### Option 1: Railway (Recommended - Always-on)

**Why Railway?**
- Always-on (no sleep)
- Easy deployment
- Good for Node.js apps
- Supports WebSockets
- Free tier available

**Steps:**
1. Create Railway account
2. Connect your repository
3. Add environment variables:
   ```
   DATABASE_URL=your_neon_database_url
   REDIS_URL=your_redis_url
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   STRIPE_PRICE_STARTER=price_id
   STRIPE_PRICE_GROWTH=price_id
   STRIPE_PRICE_BUSINESS=price_id
   META_VERIFY_TOKEN=your_token
   META_APP_SECRET=your_secret
   META_PAGE_ACCESS_TOKEN=your_token
   SENTRY_DSN=your_sentry_dsn
   SUPER_ADMIN_EMAIL=your_admin_email
   ALLOWED_ORIGINS=https://your-frontend-url.com
   ```
4. Deploy

### Option 2: Fly.io (Recommended - Always-on)

**Why Fly.io?**
- Always-on
- Global deployment
- Good for Node.js
- Supports WebSockets
- Competitive pricing

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Initialize: `fly launch`
4. Configure environment variables
5. Deploy: `fly deploy`

### Option 3: DigitalOcean App Platform

**Why DigitalOcean?**
- Always-on
- Simple pricing
- Good documentation
- Supports Node.js

**Steps:**
1. Create DigitalOcean account
2. Create an App
3. Connect your repository
4. Configure build and run commands
5. Add environment variables
6. Deploy

## Database

### Neon PostgreSQL (Recommended)
- Already configured in your project
- Serverless PostgreSQL
- Auto-scaling
- Free tier available

### Backup Strategy
Run backup script regularly:
```bash
npm run db:backup
```

Set up automated backups via cron job or your hosting provider's backup feature.

## Stripe Setup

1. Create Stripe account
2. Get API keys from Stripe Dashboard
3. Create products and prices:
   - Starter plan: $29/month
   - Growth plan: $79/month
   - Business plan: $199/month
4. Add price IDs to environment variables
5. Configure webhook endpoint: `https://your-backend-url.com/billing/webhook`

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random string
- `META_VERIFY_TOKEN` - Meta webhook verification
- `META_APP_SECRET` - Meta app secret
- `META_PAGE_ACCESS_TOKEN` - Meta page access token

### Recommended
- `SENTRY_DSN` - Sentry error tracking
- `REDIS_URL` - Redis for queues
- `SUPER_ADMIN_EMAIL` - Admin email
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_PRICE_STARTER` - Stripe price ID
- `STRIPE_PRICE_GROWTH` - Stripe price ID
- `STRIPE_PRICE_BUSINESS` - Stripe price ID

## Post-Deployment Checklist

- [ ] Test health check endpoint: `/health`
- [ ] Test authentication flow
- [ ] Test subscription upgrade flow
- [ ] Test Stripe webhook
- [ ] Configure Sentry
- [ ] Set up database backups
- [ ] Configure domain and SSL
- [ ] Set up monitoring and alerts
- [ ] Test WebSocket connections
- [ ] Verify all features are gated correctly

## Monitoring

### Sentry (Already configured)
- Error tracking
- Performance monitoring
- Release tracking

### Additional Monitoring
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (Logtail, Papertrail)
- APM (New Relic, Datadog)

## Scaling

### Horizontal Scaling
- Use load balancer
- Deploy multiple instances
- Use Redis for session storage

### Vertical Scaling
- Upgrade server resources
- Optimize database queries
- Add caching layer
