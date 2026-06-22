# Database Schema

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

This document outlines the database schema for CIVIQ. All tables are normalized for performance, with strategic denormalization for frequently accessed queries. The schema supports real-time operations through Supabase's PostgreSQL backend.

---

## Core Tables

### 1. Users Table

**Purpose:** Store user accounts and profile information

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address (from Google OAuth) |
| name | VARCHAR(255) | NOT NULL | User's full name |
| avatar_url | VARCHAR(500) | NULLABLE | Profile picture URL |
| bio | TEXT | NULLABLE | User bio/about |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last profile update |
| last_login | TIMESTAMP | NULLABLE | Last authentication |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| metadata | JSONB | NULLABLE | Additional user data (preferences, settings) |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- PRIMARY: id
- UNIQUE: email
- INDEX: created_at (for sorting, analytics)

**Relationships:**
- One user → Many reports
- One user → Many votes
- One user → Many comments

---

### 2. Reports Table

**Purpose:** Store issue reports submitted by users

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique report identifier |
| user_id | UUID | FK → users.id, NOT NULL | Reporter (owner) |
| title | VARCHAR(255) | NOT NULL | Issue title (auto-generated or custom) |
| description | TEXT | NOT NULL | Issue description |
| category | VARCHAR(50) | NOT NULL | Issue type (enum: pothole, water, light, garbage, other) |
| severity | VARCHAR(20) | NOT NULL | Severity level (enum: low, medium, high, critical) |
| latitude | DECIMAL(10,8) | NOT NULL | Geographic latitude |
| longitude | DECIMAL(11,8) | NOT NULL | Geographic longitude |
| location_name | VARCHAR(255) | NULLABLE | Human-readable location |
| image_url | VARCHAR(500) | NOT NULL | Main issue image |
| video_url | VARCHAR(500) | NULLABLE | Optional video evidence |
| ai_category | VARCHAR(50) | NOT NULL | AI-predicted category |
| ai_severity | VARCHAR(20) | NOT NULL | AI-predicted severity |
| ai_confidence | FLOAT | NOT NULL | AI confidence score (0-100) |
| ai_description | TEXT | NULLABLE | AI-generated description |
| ai_analysis | JSONB | NULLABLE | Full AI response data |
| status | VARCHAR(20) | DEFAULT 'open' | Status (enum: open, in-progress, resolved, duplicate) |
| impact_score | INTEGER | DEFAULT 0 | Calculated prioritization score |
| validation_count | INTEGER | DEFAULT 0 | Number of user validations |
| comment_count | INTEGER | DEFAULT 0 | Number of comments |
| duplicate_of | UUID | FK → reports.id, NULLABLE | If duplicate, links to original |
| created_at | TIMESTAMP | DEFAULT NOW() | Report submission time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| resolved_at | TIMESTAMP | NULLABLE | Resolution date |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete |
| metadata | JSONB | NULLABLE | Additional data (tags, resolution notes) |

**Indexes:**
- PRIMARY: id
- FK: user_id
- SPATIAL: GIST(ST_GeomFromText(...)) on coordinates for geospatial queries
- INDEX: category, severity (for filtering)
- INDEX: created_at (for sorting)
- INDEX: impact_score DESC (for ranking)
- COMPOSITE: (category, severity, created_at)

**Relationships:**
- Many-to-one: Many reports → One user
- One report → Many votes
- One report → Many comments
- Optional self-reference: duplicate_of

**Geospatial Support:**
- Coordinates stored as geography type for accurate distance calculations
- Supports spatial indexing for efficient "nearby" queries

---

### 3. Votes Table

**Purpose:** Track user validations/upvotes on issues

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique vote identifier |
| user_id | UUID | FK → users.id, NOT NULL | Voting user |
| report_id | UUID | FK → reports.id, NOT NULL | Voted report |
| vote_type | VARCHAR(20) | NOT NULL | Type (enum: upvote, downvote) |
| created_at | TIMESTAMP | DEFAULT NOW() | Vote timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete (vote removed) |

**Indexes:**
- PRIMARY: id
- FK: user_id, report_id
- UNIQUE CONSTRAINT: (user_id, report_id) - One vote per user per issue
- COMPOSITE: (report_id, created_at)

**Relationships:**
- Many-to-one: Many votes → One user
- Many-to-one: Many votes → One report

**Notes:**
- UNIQUE constraint prevents double-voting
- Soft delete allows historical tracking
- Aggregated into reports.validation_count for performance

---

### 4. Comments Table

**Purpose:** Store discussion threads on issues

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique comment identifier |
| user_id | UUID | FK → users.id, NOT NULL | Commenter |
| report_id | UUID | FK → reports.id, NOT NULL | Issue being commented on |
| parent_id | UUID | FK → comments.id, NULLABLE | Reply to another comment (threading) |
| content | TEXT | NOT NULL | Comment text |
| sentiment | VARCHAR(20) | NULLABLE | Detected sentiment (positive, neutral, negative) |
| created_at | TIMESTAMP | DEFAULT NOW() | Comment timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last edit |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete |
| metadata | JSONB | NULLABLE | Additional data |

**Indexes:**
- PRIMARY: id
- FK: user_id, report_id, parent_id
- COMPOSITE: (report_id, created_at)

**Relationships:**
- Many-to-one: Many comments → One user
- Many-to-one: Many comments → One report
- Self-reference: parent_id allows threading

**Notes:**
- Supports nested replies via parent_id
- Soft delete preserves comment history
- Sentiment analysis for future trending

---

### 5. Locations Table

**Purpose:** Pre-computed location metadata for performance

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique location identifier |
| name | VARCHAR(255) | NOT NULL | Location name (neighborhood, area) |
| latitude | DECIMAL(10,8) | NOT NULL | Center latitude |
| longitude | DECIMAL(11,8) | NOT NULL | Center longitude |
| neighborhood | VARCHAR(255) | NOT NULL | Neighborhood name |
| city | VARCHAR(255) | NOT NULL | City |
| area_level | VARCHAR(50) | NOT NULL | Geographic level (neighborhood, district, city) |
| bounds | JSONB | NOT NULL | GeoJSON polygon boundaries |
| report_count | INTEGER | DEFAULT 0 | Cached report count |
| active_issues | INTEGER | DEFAULT 0 | Cached active issue count |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last cached data update |
| metadata | JSONB | NULLABLE | Additional geographic data |

**Indexes:**
- PRIMARY: id
- INDEX: neighborhood
- SPATIAL: GIST on bounds polygon

**Relationships:**
- One location → Many reports (through geographic proximity)

**Notes:**
- Denormalized for fast aggregation queries
- Cached counts updated periodically
- Supports geographic hierarchy

---

## Supporting Tables (Future)

### Analytics Cache Table

**Purpose:** Pre-computed analytics for dashboard performance

| Field | Data Type | Description |
|-------|-----------|-------------|
| id | UUID | PRIMARY KEY |
| metric_type | VARCHAR(50) | Type (total_issues, by_category, by_severity, etc.) |
| date | DATE | Date of metric |
| location_id | UUID | Geographic scope (NULL for global) |
| value | JSONB | Metric data (counts, percentages, etc.) |
| updated_at | TIMESTAMP | When cache was last updated |

**Purpose:** Dramatically speed up dashboard queries by pre-computing aggregations

---

### Audit Log Table

**Purpose:** Track changes for compliance and debugging

| Field | Data Type | Description |
|-------|-----------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | User who made change |
| action | VARCHAR(50) | Type (create, update, delete) |
| table_name | VARCHAR(50) | Table affected |
| record_id | UUID | Record affected |
| changes | JSONB | Before/after values |
| created_at | TIMESTAMP | When change occurred |

---

## Data Relationships

```
users (1) ─────────────────── (Many) reports
          ├──────────────────── (Many) votes
          └──────────────────── (Many) comments

reports (1) ────────────────── (Many) votes
         ├────────────────── (Many) comments
         └────────────────── (0..1) reports (duplicate_of)

locations (1) ──────────────── (Many) reports (geospatial)

comments (1) ──────────────── (0..1) comments (parent_id - threading)
```

---

## Query Patterns

### Frequent Queries

**Get nearby issues:**
```
SELECT * FROM reports
WHERE ST_Distance(location, user_location) < 1000
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY impact_score DESC
LIMIT 20
```

**Get trending issues:**
```
SELECT * FROM reports
WHERE status = 'open'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY (validation_count * ai_confidence / age_in_hours) DESC
LIMIT 10
```

**Get category statistics:**
```
SELECT category, COUNT(*) as count, AVG(ai_severity) as avg_severity
FROM reports
WHERE created_at > DATE_TRUNC('month', NOW())
GROUP BY category
ORDER BY count DESC
```

---

## Performance Considerations

**Indexing Strategy:**
- GiST index on coordinates for spatial queries
- Composite indexes for common filter combinations
- Covering indexes for frequently read columns

**Denormalization:**
- validation_count stored in reports (avoids COUNT aggregation)
- location_name stored in reports (avoids JOIN for display)
- comment_count cached (refreshed periodically)

**Partitioning (Future):**
- Time-based partitioning by month for large tables
- Geographic partitioning for multi-region setup

---

## Data Integrity

**Constraints:**
- Foreign key constraints ensure referential integrity
- UNIQUE constraints prevent duplicate votes/entries
- CHECK constraints on enums
- NOT NULL constraints on critical fields

**Triggers (Future):**
- Auto-update `updated_at` timestamp
- Maintain cache counts (validation_count, comment_count)
- Enforce business rules (e.g., no duplicate votes)

---

## Security & Privacy

**Row-Level Security (RLS):**
- Users can only see/edit own reports
- Votes are private (not shown by user)
- Comments visible to all (but editable only by author)

**Data Retention:**
- User data: Retained indefinitely unless deleted
- Reports: Retained indefinitely (soft delete available)
- Votes: Soft deleted, kept for historical analysis
- Logs: Retained for 90 days (compliance)

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Initial schema design |

---

**Created By:** Engineering Team  
**Last Updated:** June 22, 2026
