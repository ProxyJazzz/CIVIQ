# API Documentation

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

This document provides a conceptual overview of the CIVIQ API endpoints. These are organized by feature domain and describe the request/response patterns, authentication requirements, and business logic flow. Detailed OpenAPI/Swagger documentation will be generated at implementation.

---

## Base Information

**Base URL:** `https://civiq.vercel.app/api`  
**Authentication:** Google OAuth 2.0 + JWT Bearer Token  
**Response Format:** JSON  
**Rate Limiting:** 100 requests/minute per user  

**Error Response Format:**
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "timestamp": "2026-06-22T10:30:00Z",
  "request_id": "uuid"
}
```

---

## Authentication Endpoints

### POST /auth/callback/google

**Purpose:** Handle Google OAuth callback and create/update user session

**Request:**
```json
{
  "code": "google_authorization_code",
  "state": "state_parameter"
}
```

**Response (Success):**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_jwt_token",
  "expires_in": 3600,
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://..."
  }
}
```

**Business Logic:**
- Validate Google authorization code
- Look up or create user in database
- Generate JWT tokens
- Set secure cookies
- Return user profile

---

### POST /auth/logout

**Purpose:** Terminate user session and revoke tokens

**Request:**
```json
{
  "refresh_token": "refresh_jwt_token"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

**Business Logic:**
- Invalidate refresh token
- Clear session cookies
- Log logout event

---

### GET /auth/me

**Purpose:** Get current authenticated user profile

**Request:** 
- No body (authorization header required)

**Response:**
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatar_url": "https://...",
  "bio": "User bio",
  "created_at": "2026-06-22T10:00:00Z",
  "last_login": "2026-06-22T14:30:00Z",
  "stats": {
    "reports_count": 15,
    "validations_count": 42,
    "rank": 12
  }
}
```

**Business Logic:**
- Validate JWT token
- Return user data from database
- Update last_login timestamp

---

## Report Endpoints

### POST /reports

**Purpose:** Create a new issue report

**Request:**
```json
{
  "title": "Large pothole blocking traffic",
  "description": "Deep pothole on Main Street affecting commuters",
  "category": "pothole",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "image_url": "https://storage.example.com/image.jpg",
  "location_name": "Main Street & 5th Avenue"
}
```

**Response (Success):**
```json
{
  "id": "report_uuid",
  "user_id": "user_uuid",
  "title": "Large pothole blocking traffic",
  "category": "pothole",
  "severity": "high",
  "ai_confidence": 0.94,
  "ai_analysis": {
    "category": "pothole",
    "suggested_description": "...",
    "hazard_assessment": "High traffic hazard"
  },
  "impact_score": 45,
  "created_at": "2026-06-22T14:35:00Z",
  "status": "open"
}
```

**Business Logic:**
1. Validate user authentication
2. Validate request data
3. Upload image to storage
4. Call Gemini Vision API
5. Receive AI categorization & severity
6. Create report in database
7. Calculate initial impact score
8. Broadcast to real-time subscribers
9. Return report with AI analysis

**Response Codes:**
- 201: Report created successfully
- 400: Invalid input data
- 401: Unauthorized
- 413: Image too large

---

### GET /reports

**Purpose:** Retrieve reports with filtering and pagination

**Query Parameters:**
```
?page=1
&limit=20
&category=pothole
&severity=high
&status=open
&created_after=2026-06-20T00:00:00Z
&latitude=40.7128
&longitude=-74.0060
&radius_km=5
&sort_by=impact_score
```

**Response:**
```json
{
  "data": [
    {
      "id": "report_uuid",
      "title": "...",
      "category": "pothole",
      "severity": "high",
      "image_url": "https://...",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "impact_score": 78,
      "validation_count": 12,
      "created_at": "2026-06-22T14:35:00Z",
      "distance_km": 0.5
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 98,
    "has_next": true
  }
}
```

**Business Logic:**
- Parse and validate query parameters
- Apply filters (category, severity, status, geographic bounds)
- Execute database query with pagination
- Calculate distances from user location
- Retrieve validation counts (cached)
- Return sorted results

**Response Codes:**
- 200: Success
- 400: Invalid parameters
- 401: Unauthorized

---

### GET /reports/{id}

**Purpose:** Get single report with full details

**Response:**
```json
{
  "id": "report_uuid",
  "user_id": "user_uuid",
  "reporter": {
    "name": "John Doe",
    "avatar_url": "https://..."
  },
  "title": "...",
  "description": "...",
  "category": "pothole",
  "severity": "high",
  "image_url": "https://...",
  "ai_analysis": {
    "confidence": 0.94,
    "analysis_json": {...}
  },
  "impact_score": 78,
  "validation_count": 12,
  "has_user_voted": true,
  "comments": [
    {
      "id": "comment_uuid",
      "user": {...},
      "content": "I see this too!",
      "created_at": "2026-06-22T15:00:00Z"
    }
  ],
  "created_at": "2026-06-22T14:35:00Z",
  "status": "open"
}
```

---

### PUT /reports/{id}

**Purpose:** Update own report (owner only)

**Authorization:** Owner or admin only

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "resolved"
}
```

**Response:** Updated report object

**Business Logic:**
- Verify user owns report
- Validate updates
- Update database
- Broadcast changes to real-time subscribers

---

### DELETE /reports/{id}

**Purpose:** Delete own report (soft delete)

**Authorization:** Owner or admin only

**Response:**
```json
{
  "status": "success",
  "message": "Report deleted"
}
```

---

## Vote/Validation Endpoints

### POST /reports/{id}/vote

**Purpose:** Upvote or validate an issue

**Request:**
```json
{
  "vote_type": "upvote"
}
```

**Response:**
```json
{
  "status": "success",
  "validation_count": 13,
  "user_has_voted": true,
  "updated_impact_score": 79
}
```

**Business Logic:**
1. Check if user already voted
2. Create vote record
3. Increment validation_count cache
4. Recalculate impact_score
5. Broadcast update to real-time subscribers
6. Return updated metrics

**Response Codes:**
- 201: Vote created
- 409: User already voted
- 401: Unauthorized

---

### DELETE /reports/{id}/vote

**Purpose:** Remove vote/validation

**Response:**
```json
{
  "status": "success",
  "validation_count": 12,
  "updated_impact_score": 77
}
```

**Business Logic:**
- Soft delete vote record
- Update validation_count
- Recalculate impact_score
- Broadcast update

---

### GET /reports/{id}/votes

**Purpose:** Get vote/validation details for an issue

**Response:**
```json
{
  "total_votes": 12,
  "user_has_voted": true,
  "recent_voters": [
    {
      "name": "User Name",
      "avatar_url": "https://...",
      "voted_at": "2026-06-22T15:30:00Z"
    }
  ],
  "vote_trend": {
    "last_24h": 5,
    "last_7d": 10,
    "trend_direction": "increasing"
  }
}
```

---

## Dashboard Endpoints

### GET /dashboard/stats

**Purpose:** Get user's personal statistics

**Response:**
```json
{
  "reports_created": 15,
  "reports_this_month": 8,
  "total_validations_received": 127,
  "validation_streak": 5,
  "rank": {
    "global_rank": 12,
    "area_rank": 2,
    "percentile": 88
  },
  "badges": [
    {
      "id": "badge_id",
      "name": "Local Hero",
      "description": "Created 10+ reports",
      "earned_at": "2026-06-15T10:00:00Z"
    }
  ]
}
```

**Business Logic:**
- Aggregate user's report statistics
- Calculate rank based on contributions
- Check badge eligibility
- Return personalized metrics

---

### GET /dashboard/community

**Purpose:** Get community-wide statistics

**Response:**
```json
{
  "total_issues": 342,
  "issues_this_month": 89,
  "total_validations": 2043,
  "active_users": 156,
  "statistics_by_category": {
    "pothole": {
      "count": 145,
      "percentage": 42,
      "avg_severity": 2.3
    },
    "water": {
      "count": 98,
      "percentage": 29,
      "avg_severity": 2.1
    }
  },
  "severity_distribution": {
    "low": 45,
    "medium": 120,
    "high": 150,
    "critical": 27
  }
}
```

---

### GET /dashboard/trending

**Purpose:** Get trending/priority issues

**Query Parameters:** `?limit=10&timeframe=24h`

**Response:**
```json
{
  "trending_issues": [
    {
      "id": "report_uuid",
      "title": "...",
      "category": "pothole",
      "impact_score": 95,
      "validation_count": 28,
      "trend_score": 92,
      "reason": "High validation rate in last 24h"
    }
  ]
}
```

---

### GET /dashboard/heatmap

**Purpose:** Get geographic heatmap data

**Query Parameters:** `?zoom_level=12&bounds=lat1,lon1,lat2,lon2`

**Response:**
```json
{
  "heatmap_points": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "intensity": 0.85,
      "issue_count": 12,
      "avg_severity": 2.3
    }
  ],
  "clusters": [
    {
      "center_lat": 40.7128,
      "center_lon": -74.0060,
      "count": 45,
      "primary_category": "pothole"
    }
  ]
}
```

---

## AI Assistant Endpoints

### POST /ai/chat

**Purpose:** Chat with AI assistant

**Request:**
```json
{
  "message": "What issues are reported near me?",
  "context": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "conversation_history": [...]
  }
}
```

**Response:**
```json
{
  "response": "I found 12 active issues within 1km of you...",
  "suggested_actions": [
    {
      "type": "view_on_map",
      "label": "View on Map"
    }
  ],
  "data": {
    "issues_found": 12,
    "categories": ["pothole", "water"]
  },
  "confidence": 0.95
}
```

**Business Logic:**
- Parse natural language query
- Execute AI intent recognition
- Query database based on intent
- Generate conversational response
- Return actionable recommendations

---

### POST /ai/analyze

**Purpose:** Manually analyze an image with AI

**Request:**
```json
{
  "image_url": "https://...",
  "context": "Additional context..."
}
```

**Response:**
```json
{
  "analysis": {
    "category": "pothole",
    "severity": "high",
    "confidence": 0.94,
    "description": "..."
  }
}
```

---

## Maps Endpoints

### GET /map/issues

**Purpose:** Get issues for map display

**Query Parameters:**
```
?bounds=lat1,lon1,lat2,lon2
&category=pothole
&severity=high
&limit=100
```

**Response:**
```json
{
  "issues": [
    {
      "id": "report_uuid",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "category": "pothole",
      "severity": "high",
      "validation_count": 12,
      "image_url": "https://..."
    }
  ],
  "cluster_count": 5
}
```

**Business Logic:**
- Parse geographic bounds
- Execute geospatial query
- Apply category/severity filters
- Return coordinates for map pins
- Include clustering metadata

---

### GET /map/heatmap

**Purpose:** Get aggregated heatmap data

**Response:** Geographic density data (see dashboard/heatmap)

---

## Comments Endpoints (Future)

### POST /reports/{id}/comments
Create comment on issue

### GET /reports/{id}/comments
Get issue comments with threading

### PUT /comments/{id}
Update own comment

### DELETE /comments/{id}
Delete own comment

---

## Rate Limiting

**Limits:**
- Anonymous: 10 requests/minute
- Authenticated: 100 requests/minute
- AI endpoints: 20 requests/minute

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1624356600
```

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Conceptual API design |

---

**Created By:** Engineering Team  
**Last Updated:** June 22, 2026
