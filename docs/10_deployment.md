# Deployment & Infrastructure

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

CIVIQ deployment strategy leverages Vercel for frontend/API hosting and Supabase for backend database and services. This document outlines the deployment pipeline, environment configuration, and operational procedures.

---

## Architecture Layers & Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET USERS                        │
└────────────────────┬────────────────────────────────────┘
                     ↓
         ┌───────────────────────┐
         │   Vercel CDN/Edge     │ (Global)
         └───────────┬───────────┘
                     ↓
  ┌──────────────────────────────────────┐
  │  Vercel (Next.js App)                │
  │  ├─ Pages (App Router)               │
  │  ├─ API Routes (Serverless)          │
  │  └─ Middleware                       │
  └──────────────┬───────────────────────┘
                 ↓
  ┌──────────────────────────────────────┐
  │  Supabase (Backend)                  │
  │  ├─ PostgreSQL (Database)            │
  │  ├─ Auth                             │
  │  ├─ Storage (Images/Videos)          │
  │  └─ Real-time (WebSocket)            │
  └──────────────┬───────────────────────┘
                 ↓
  ┌──────────────────────────────────────┐
  │  Google Cloud APIs                   │
  │  ├─ Gemini 2.5 Pro                   │
  │  ├─ Gemini Vision                    │
  │  └─ AI Studio                        │
  └──────────────────────────────────────┘
```

---

## Environment Configuration

### Development Environment

**Setup Steps:**

```bash
# 1. Clone repository
git clone https://github.com/civiq/civiq.git
cd civiq

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Run development server
npm run dev

# 5. Application ready at http://localhost:3000
```

**Environment Variables (.env.local):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API
GOOGLE_GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-pro
GEMINI_VISION_MODEL=gemini-2.5-pro-vision

# Google OAuth (Client credentials)
GOOGLE_CLIENT_ID=123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=debug
```

**Database Setup:**

```bash
# Migrations (development)
npm run db:migrate

# Seed with test data
npm run db:seed

# View database in GUI
npm run db:studio
```

---

### Staging Environment

**Deployment Process:**

```
Developer Creates PR
    ↓
GitHub Actions Runs Tests
    ↓
Tests Pass
    ↓
PR Merged to 'staging' Branch
    ↓
Vercel Detects Push
    ↓
Auto-Deploy to Staging URL
    ↓
Health Checks Run
    ↓
Staging Ready for QA Testing
```

**Environment Variables (Staging):**

```env
# Same as production, but with staging credentials
NEXT_PUBLIC_SUPABASE_URL=https://[staging-project].supabase.co
GOOGLE_CLIENT_ID=staging-client-id.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=https://staging-civiq.vercel.app
NODE_ENV=staging
LOG_LEVEL=info
```

**Vercel Staging Configuration:**

- **Branch:** `staging`
- **Auto-deploy:** Enabled on push
- **Preview:** https://staging-civiq.vercel.app
- **Database:** Separate Supabase project (staging data)
- **API Keys:** Staging API keys (limited quota)

---

### Production Environment

**Deployment Process:**

```
PR Approved and Merged to 'main'
    ↓
Vercel Detects Push
    ↓
Build Optimization
    ├─ Code splitting
    ├─ Image optimization
    ├─ Tree shaking
    └─ Minification
    ↓
Deploy to Vercel Edge
    ↓
CDN Invalidation
    ↓
Health Checks (All Regions)
    ↓
Monitoring Activated
    ↓
Production Live
```

**Environment Variables (Production):**

```env
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://civiq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_key>
SUPABASE_SERVICE_ROLE_KEY=<production_secret>

# Google APIs Production
GOOGLE_GEMINI_API_KEY=<prod_key>
GOOGLE_CLIENT_ID=civiq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<prod_secret>

# Application
NEXT_PUBLIC_APP_URL=https://civiq.app
NODE_ENV=production
LOG_LEVEL=warn
```

**Vercel Production Configuration:**

- **Domain:** civiq.app
- **SSL/TLS:** Automatic (Let's Encrypt)
- **CDN:** Global edge caching
- **Regions:** us-east-1 (primary), eu-west-1 (backup)
- **Auto-scaling:** Enabled
- **Database replicas:** us-east-1, eu-west-1
- **Backup:** Hourly, 30-day retention

---

## Deployment Checklist

### Pre-Deployment (Development)

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review approved
- [ ] No console errors
- [ ] Performance benchmarks acceptable
- [ ] Security scan passed
- [ ] Dependencies up-to-date
- [ ] Commit message clear
- [ ] Version number updated

### Pre-Deployment (Staging)

- [ ] Staging tests all pass
- [ ] QA testing complete
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Database migrations tested
- [ ] Email templates reviewed
- [ ] Error handling verified

### Pre-Production

- [ ] Final code review
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

### Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring data flowing
- [ ] Error rates normal
- [ ] Performance metrics acceptable
- [ ] User testing spot-check
- [ ] Documentation updated
- [ ] Incident response team on standby

---

## Database Deployment & Migrations

### Schema Migrations

**Development Flow:**

```bash
# Make schema changes in schema.prisma
# Generate migration
npm run db:migrate:dev -- --name add_sentiment_to_comments

# Review generated migration
cat prisma/migrations/[timestamp]_add_sentiment_to_comments/migration.sql

# Apply to dev database
# (automatic with migrate:dev)
```

**Staging/Production Flow:**

```bash
# Migration pre-created and tested in dev

# On staging branch:
npm run db:migrate:deploy

# Verify migration successful
npm run db:validate

# On main branch (production):
# Same process
npm run db:migrate:deploy
```

**Zero-Downtime Migrations:**

- Add new columns as nullable
- Deploy code that uses new column
- Backfill data
- Add NOT NULL constraint
- Deploy removal of old code

**Example: Renaming Column**

```sql
-- Step 1: Add new column
ALTER TABLE reports ADD COLUMN impact_score_v2 INTEGER;

-- Step 2: Backfill data
UPDATE reports SET impact_score_v2 = impact_score;

-- Step 3: Deploy code to use new column
-- Step 4: Delete old column
ALTER TABLE reports DROP COLUMN impact_score;
ALTER TABLE reports RENAME COLUMN impact_score_v2 TO impact_score;
```

---

## Monitoring & Observability

### Vercel Monitoring

**Built-in Metrics:**
- Page load time
- Core Web Vitals (LCP, FID, CLS)
- API response time
- Error rate
- Request rate

**Dashboard:** https://vercel.com/civiq

### Supabase Monitoring

**Metrics:**
- Database connections
- Query performance
- Storage usage
- API rate limiting
- Backup status

**Dashboard:** https://app.supabase.com

### Custom Monitoring

**Error Tracking:**
- Sentry integration for frontend/API errors
- Alert on error spike
- Stack trace analysis

**Performance:**
- Google PageSpeed Insights
- Lighthouse CI
- Custom analytics

**Uptime:**
- Periodic health checks
- Response time tracking
- Availability percentage

### Alerting

**Critical Alerts (Page on-call):**
- Service down/503 errors
- Database connection failure
- API latency >5s (sustained)
- Error rate >5%

**Warning Alerts (Slack notification):**
- API latency >1s (sustained)
- Error rate >1%
- Database CPU >80%
- Storage quota >75%

---

## Rollback Procedures

### Quick Rollback (Vercel)

**If critical issue in last 24 hours:**

```bash
# View recent deployments
vercel deployments ls

# Rollback to previous version
vercel rollback [deployment-id]

# Or use web console
# https://vercel.com/civiq/civiq/deployments
```

**Duration:** 2-5 minutes

### Database Rollback

**If migration fails:**

```bash
# View migrations
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:resolve -- --rolled-back [migration-id]

# Restore from backup (if needed)
# Use Supabase dashboard or CLI
supabase db:pull --backup
```

**Duration:** 5-15 minutes

### Complete Rollback

**If both code and schema need rollback:**

1. Supabase restores to previous snapshot
2. Vercel rolls back to previous deployment
3. Environment variables verified
4. Health checks re-run
5. Incident post-mortem scheduled

**Duration:** 15-30 minutes

---

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Automatic: Every hour
- Retention: 30 days
- Location: Geographic redundancy (us-east, eu-west)
- Test restore: Weekly

**Storage Backups:**
- Automatic: Daily
- Retention: 7 days
- Location: S3 cross-region replication

**Code Backups:**
- Git repository: GitHub (primary)
- Backup: Mirrored to GitLab
- Disaster recovery: Complete history

### Recovery Time Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Frontend | 5 min | 0 (no state) |
| API | 10 min | 5 min |
| Database | 30 min | 1 hour |
| Storage | 1 hour | 24 hours |

---

## Scaling Strategy

### Horizontal Scaling

**Frontend (Vercel):**
- Automatic: Scale to thousands of concurrent users
- No action needed: Vercel handles load balancing

**API (Vercel Functions):**
- Automatic: Scale function instances
- Regional distribution: Auto-routed to nearest edge

**Database (Supabase):**
- Connection pooling: PgBouncer enabled
- Read replicas: Enable for heavy read workloads
- Vertical scaling: Upgrade tier if needed

### Performance Optimization (Current)

**Code Level:**
- Code splitting: Automatic
- Image optimization: Next.js Image component
- API route caching: Configurable
- Database query optimization: Indexed queries

**Infrastructure Level:**
- CDN caching: Vercel Edge Network
- Database caching: Implemented (future)
- Redis cache: Can be added

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Usage | Cost |
|---------|-------|------|
| Vercel | 100K requests/month | $20 |
| Supabase | 10GB database, 1TB transfer | $100 |
| Google Gemini API | 10K analyses | $50 |
| Mapbox | 50K requests/month | $30 |
| Storage | 50GB images | $5 |
| **Total** | | **~$205** |

### Cost Optimization Tips

- Implement caching (reduce API calls)
- Optimize images (reduce storage)
- Batch process AI requests (reduce per-unit cost)
- Use dedicated database plan (better rate than base)
- Schedule non-urgent tasks (use batch pricing)

---

## Security Deployment

### SSL/TLS Certificates

- Automatic via Let's Encrypt
- Renewed automatically
- HTTPS only (redirects enforced)

### Environment Secrets

- Stored in Vercel/Supabase dashboard (encrypted)
- Never committed to git
- Rotated quarterly
- Audit log maintained

### API Security

- Rate limiting: 100 requests/minute per user
- CORS: Configured for civiq.app only
- JWT validation: On every request
- Input sanitization: All user inputs validated

---

## Maintenance Windows

**Scheduled Maintenance:**
- No more than 1 per month
- Announced 1 week prior
- Scheduled during low-traffic hours (3-5 AM UTC)
- Estimated duration: <30 minutes
- Status page updated during

**Emergency Maintenance:**
- Unplanned outages handled immediately
- Incident response team activated
- Post-mortem within 24 hours

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Deployment and infrastructure guide |

---

**Created By:** DevOps Team  
**Last Updated:** June 22, 2026
