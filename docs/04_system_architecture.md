# System Architecture

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Architecture Overview

CIVIQ is built on a modern, scalable architecture combining a Next.js frontend, Supabase backend, and Google AI services. This document describes the high-level system design, component interactions, and data flow.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Next.js 15   │  │   Tailwind     │  │    Shadcn      │    │
│  │   App Router   │  │     CSS        │  │  Components    │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Framer Motion - Animations & Transitions                 │ │
│  │  React Query - Data Synchronization                       │ │
│  │  Zustand - Client State Management                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Edge)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Next.js API Routes (Serverless)                  │ │
│  │  ├─ /api/auth/*                                           │ │
│  │  ├─ /api/reports/*                                        │ │
│  │  ├─ /api/votes/*                                          │ │
│  │  ├─ /api/dashboard/*                                      │ │
│  │  ├─ /api/ai/*                                             │ │
│  │  └─ /api/map/*                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        ↙                    ↓                    ↘
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Supabase   │  │  Google AI Layer │  │      Mapbox      │
│   Backend    │  │   (Gemini APIs)  │  │    Maps API      │
└──────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Layer-by-Layer Architecture

### 1. Client Layer

**Technology Stack:**
- **Next.js 15** — React framework with App Router for modern, efficient routing
- **Tailwind CSS** — Utility-first CSS for rapid UI development
- **Shadcn Components** — Accessible, unstyled component library
- **Framer Motion** — Smooth animations and transitions
- **React Query** — Data synchronization and caching
- **Zustand** — Lightweight state management

**Responsibilities:**
- User interface rendering
- Client-side state management
- Real-time UI updates
- Image/video capture and preview
- Map visualization (client-side rendering of Mapbox)
- Form validation
- Offline capabilities (React Query cache)

**Key Pages:**
- `/` — Landing/Dashboard
- `/report` — Issue reporting interface
- `/feed` — Community issue feed
- `/map` — Geographic visualization
- `/dashboard` — Analytics and statistics
- `/chat` — AI assistant interface
- `/auth/login` — Authentication

---

### 2. API Layer (Next.js Edge Functions)

**Technology:**
- Next.js Serverless Functions (deployed to Vercel Edge Runtime)
- CORS-enabled for cross-origin requests
- Authentication middleware (JWT tokens)
- Rate limiting and abuse prevention

**API Endpoints:**

**Authentication:**
- `POST /api/auth/callback/google` — Google OAuth callback
- `POST /api/auth/logout` — Session termination
- `GET /api/auth/me` — Current user info
- `POST /api/auth/refresh` — Token refresh

**Reports:**
- `POST /api/reports` — Create new issue report
- `GET /api/reports` — Get reports (paginated, filtered)
- `GET /api/reports/{id}` — Get single report details
- `PUT /api/reports/{id}` — Update report (own reports only)
- `DELETE /api/reports/{id}` — Delete report (own reports only)

**Votes & Validation:**
- `POST /api/reports/{id}/vote` — Upvote/validate issue
- `DELETE /api/reports/{id}/vote` — Remove vote
- `GET /api/reports/{id}/votes` — Get vote count and details

**Dashboard & Analytics:**
- `GET /api/dashboard/stats` — Personal statistics
- `GET /api/dashboard/community` — Community-wide statistics
- `GET /api/dashboard/trending` — Trending issues
- `GET /api/dashboard/heatmap` — Geographic data

**AI Services:**
- `POST /api/ai/analyze` — Send image to Gemini Vision
- `POST /api/ai/chat` — Natural language query processing
- `POST /api/ai/classify` — Batch classification

**Maps:**
- `GET /api/map/issues` — Get issues for map view (geospatial query)
- `GET /api/map/heatmap` — Heatmap data (aggregated)

---

### 3. Backend Layer (Supabase)

**Technology Stack:**
- **Supabase (PostgreSQL)** — Primary data store
- **Real-time subscriptions** — Live updates to clients
- **Row-level security** — Granular permission control
- **Vector search** (future) — Semantic search capabilities

**Core Database Structure:**

```
users
├── id (UUID, PK)
├── email (VARCHAR)
├── name (VARCHAR)
├── avatar_url (VARCHAR)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── metadata (JSONB)

reports
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── category (VARCHAR) [pothole, water, light, garbage, etc.]
├── severity (ENUM) [low, medium, high, critical]
├── description (TEXT)
├── location (GEOGRAPHY)
├── latitude (FLOAT)
├── longitude (FLOAT)
├── image_url (VARCHAR)
├── video_url (VARCHAR)
├── ai_confidence (FLOAT)
├── ai_analysis (JSONB)
├── status (ENUM) [open, in-progress, resolved, duplicate]
├── impact_score (INTEGER)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── metadata (JSONB)

votes
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── report_id (UUID, FK → reports)
├── vote_type (ENUM) [upvote, downvote]
├── created_at (TIMESTAMP)
└── UNIQUE(user_id, report_id)

comments
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── report_id (UUID, FK → reports)
├── content (TEXT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── metadata (JSONB)

locations
├── id (UUID, PK)
├── name (VARCHAR)
├── latitude (FLOAT)
├── longitude (FLOAT)
├── neighborhood (VARCHAR)
├── area_id (UUID)
└── metadata (JSONB)

analytics_cache
├── id (UUID, PK)
├── metric_type (VARCHAR)
├── date (DATE)
├── data (JSONB)
└── updated_at (TIMESTAMP)
```

**Key Features:**
- Real-time subscriptions for live updates
- Row-level security (users see only own reports, editable)
- Automated timestamp management
- Geospatial indexing for map queries
- Denormalized data for performance

---

### 4. AI Layer (Google Gemini)

**Technology:**
- **Gemini 2.5 Pro** — Advanced reasoning and language understanding
- **Gemini Vision** — Multimodal image analysis
- **Structured Outputs** — Consistent JSON responses
- **Google AI Studio** — API access and monitoring

**AI Agents:**

**Vision Analysis Agent**
- Input: Image (from user report)
- Process: Gemini Vision analyzes image
- Output: Category, severity, confidence, suggested description

**Classification Agent**
- Input: Image + description
- Process: Classify into predefined categories
- Output: Primary category + alternatives with confidence

**Community Assistant Agent**
- Input: Natural language query
- Process: Gemini processes intent, queries database
- Output: Relevant recommendations, statistics, guidance

**Impact Assessment Agent** (Future)
- Input: Issue + resolution
- Process: Estimate community impact
- Output: Impact score, affected population estimate

**Data Flow:**
```
User Uploads Image
    ↓
Backend Receives Request
    ↓
Image Stored in Supabase Storage
    ↓
Image URL Passed to Gemini Vision API
    ↓
Gemini Analyzes
    ├─ Object detection (pothole, water, light, etc.)
    ├─ Severity assessment
    ├─ Confidence scoring
    └─ Description generation
    ↓
API Response (JSON with structured outputs)
    ↓
Backend Stores Results in Database
    ↓
Real-time Notification to Client
    ↓
User Sees AI Analysis
```

---

### 5. Maps Layer (Mapbox)

**Technology:**
- **Mapbox GL JS** — Client-side interactive maps
- **Geospatial queries** — Supabase PostGIS integration
- **Clustering** — Efficient visualization of many pins

**Features:**
- Interactive map with issue pins
- Color-coded severity indicators
- Clustering at various zoom levels
- Filter by category, severity, time
- Real-time pin updates
- Geographic hotspot visualization

**Data Flow:**
```
User Opens Map View
    ↓
Client Requests Issues for Viewport
    ↓
Backend Query: PostGIS Geospatial
    ├─ Location bounds
    ├─ Category filter
    └─ Severity filter
    ↓
Issues Returned with Coordinates
    ↓
Mapbox Renders Pins
    ├─ Color by severity
    ├─ Size by validation count
    └─ Cluster similar
    ↓
User Interactions
    ├─ Zoom → Expand clusters
    ├─ Pan → Load new issues
    ├─ Filter → Update query
    └─ Click → Show details
```

---

### 6. Storage Architecture

**Image & Video Storage:**
- **Supabase Storage** (built-in S3-compatible)
- **CDN delivery** for fast image loading
- **Compression** on upload
- **Access control** via RLS policies

**Upload Flow:**
```
User Selects Image
    ↓
Client-Side Compression
    ↓
Upload to Supabase Storage
    ↓
Generate Public URL
    ↓
Store URL in Database
    ↓
CDN Caches for Delivery
```

---

## Data Flow Examples

### Complete Report Creation Flow

```
1. User Takes Photo
   └─ Stored in browser memory
   
2. User Confirms Location
   └─ Auto-detected or manually adjusted
   
3. User Clicks Submit
   └─ Client validates form
   
4. API Request Sent
   ├─ Image → Supabase Storage
   ├─ Report metadata → Supabase DB
   └─ Reference stored
   
5. Backend Processes
   ├─ Receive image URL
   ├─ Call Gemini Vision API
   ├─ Receive category/severity/confidence
   └─ Update report with AI results
   
6. Real-time Update
   ├─ Supabase broadcasts to subscribed clients
   ├─ Issue appears in feed
   ├─ Map updates with new pin
   └─ Community sees new report
```

### Real-time Vote & Impact Score Update

```
1. User Upvotes Issue
   └─ Client sends vote request
   
2. Backend Receives Vote
   ├─ Validates user hasn't voted twice
   ├─ Creates vote record
   └─ Increments vote count
   
3. Impact Score Recalculated
   ├─ Base (AI severity)
   ├─ Validation multiplier (+vote count)
   ├─ Time decay (if old)
   └─ Geographic weight
   
4. Real-time Broadcast
   ├─ All subscribed clients notified
   ├─ Vote count updates
   ├─ Impact score updates
   ├─ Feed re-ranks
   └─ Map pin appearance changes
```

---

## Deployment Architecture

**Frontend Deployment:**
- **Vercel** — Next.js optimized deployment
- **CDN** — Global edge network
- **Auto-deployments** from main branch
- **Environment variables** for API keys

**Backend Deployment:**
- **Supabase** — Managed PostgreSQL
- **Automatic backups** and recovery
- **Scalable** connection pooling
- **Real-time** subscription management

**API Deployment:**
- **Vercel Edge Functions** — Low-latency API
- **Automatic scaling** with load
- **Environment isolation** (dev, staging, prod)

---

## Security Considerations

**Authentication:**
- Google OAuth 2.0
- JWT tokens stored securely
- Refresh token rotation
- Session invalidation on logout

**Data Protection:**
- Row-level security (RLS)
- Users only access own reports
- API rate limiting
- Input validation and sanitization

**AI Integration:**
- API key management via environment variables
- Request signing and verification
- Rate limiting per user
- Monitoring for abuse

---

## Performance Optimization

**Client-Side:**
- Code splitting by route
- Image lazy loading
- Component memoization
- Service worker caching

**Server-Side:**
- Database query optimization
- Connection pooling
- Caching layer (Redis future)
- CDN for static assets

**AI Services:**
- Request batching
- Response caching
- Fallback responses
- Error handling and retries

---

## Scalability Considerations

**Current Hackathon Scale:**
- 100-500 concurrent users
- 1000s of reports
- Real-time sync across ~50 active connections

**Production Scale (Future):**
- 10,000+ concurrent users
- Millions of reports
- Sharding strategy for geospatial data
- Caching layer (Redis)
- Load balancing
- Database read replicas

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Initial architecture |

---

**Created By:** Engineering Team  
**Last Updated:** June 22, 2026
