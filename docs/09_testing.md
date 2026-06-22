# Testing Strategy

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

Comprehensive testing strategy for CIVIQ covering functional testing, UI/UX testing, AI response validation, error scenarios, and edge cases. All tests prioritize user experience, data integrity, and system reliability.

---

## Testing Pyramid

```
                       /\
                      /  \
                     / E2E \
                    /  (10%) \
                   /___________\
                  /             \
                 /  Integration   \
                /     (25%)       \
               /___________________\
              /                     \
             /      Unit Tests       \
            /         (65%)         \
           /___________________________\
```

---

## 1. Unit Tests (65%)

### Authentication

**Test Suite: Google OAuth**
- ✓ Valid Google token callback
- ✓ Invalid token rejection
- ✓ Token expiration handling
- ✓ Refresh token rotation
- ✓ Session persistence

**Test Suite: JWT Token Management**
- ✓ Token generation with correct claims
- ✓ Token expiration validation
- ✓ Token refresh without re-authentication
- ✓ Malformed token rejection
- ✓ Revoked token detection

### Report Creation

**Test Suite: Input Validation**
- ✓ Valid report submission
- ✓ Missing required fields rejected
- ✓ Invalid coordinates handled
- ✓ Oversized image rejected (>10MB)
- ✓ Unsupported image format rejected

**Test Suite: Data Transformation**
- ✓ Coordinates converted to geographic type
- ✓ Timestamp properly set
- ✓ User ID linked correctly
- ✓ Defaults applied (status='open', impact_score=0)

**Test Suite: AI Integration**
- ✓ Gemini API called with correct payload
- ✓ Response parsed correctly
- ✓ Schema validation passed
- ✓ Fallback triggered on timeout
- ✓ Error response handled gracefully

### Vote/Validation

**Test Suite: Vote Logic**
- ✓ First vote creates record
- ✓ Duplicate vote rejected (409 conflict)
- ✓ Vote count incremented
- ✓ Impact score recalculated
- ✓ Vote removal decrements count

### Impact Scoring

**Test Suite: Score Calculation**
- ✓ Base severity applied (0.3 weight)
- ✓ Validation multiplier (0.4 weight)
- ✓ Geographic weight calculated (0.2 weight)
- ✓ Recency boost applied (0.1 weight)
- ✓ Trend multiplier applied
- ✓ Final score in expected range [0-100]

### Database Queries

**Test Suite: Geographic Queries**
- ✓ Radius search returns correct nearby issues
- ✓ Bounding box query works
- ✓ Distance calculation accurate
- ✓ Spatial index improves performance

**Test Suite: Filtering**
- ✓ Category filter works
- ✓ Severity filter works
- ✓ Status filter works
- ✓ Date range filter works
- ✓ Composite filters work

---

## 2. Integration Tests (25%)

### API Endpoints

**Test Suite: Authentication Flow**
```
1. POST /auth/callback/google
   ├─ Google code → JWT token generation
   ├─ User lookup/creation
   └─ Verify response contains token and user
   
2. GET /auth/me
   ├─ Valid token → User profile returned
   ├─ Invalid token → 401 unauthorized
   └─ Verify all user fields present
```

**Test Suite: Report Creation Flow**
```
1. POST /reports (authenticated)
   ├─ Validate input accepted
   ├─ Image uploaded to storage
   ├─ Gemini API called
   ├─ AI results stored
   ├─ Real-time broadcast triggered
   └─ Verify response complete

2. GET /reports/{id}
   ├─ Report with AI analysis returned
   ├─ Validation count included
   ├─ User votes included
   └─ All fields present
```

**Test Suite: Vote & Ranking Flow**
```
1. POST /reports/{id}/vote
   ├─ Vote stored
   ├─ Count incremented
   ├─ Impact score updated
   └─ Real-time update broadcast

2. GET /reports?sort_by=impact_score
   ├─ Results sorted by new score
   ├─ Pagination correct
   └─ Vote change reflected immediately
```

### Real-time Subscriptions

**Test Suite: Real-time Updates**
- ✓ New report appears in feed instantly
- ✓ Vote update reflected in real-time
- ✓ New comment appears immediately
- ✓ Status changes broadcast
- ✓ Multiple concurrent clients synchronized

### AI Integration

**Test Suite: Vision Analysis**
```
Input: Sample pothole image
├─ Call Gemini API
├─ Parse response
├─ Validate schema
├─ Store results
└─ Verify accuracy matches expected category/severity
```

**Test Suite: Chat Assistant**
```
Query: "What issues are near me?"
├─ Intent recognized as geographic_query
├─ Database queried correctly
├─ Response generated
├─ Suggested actions provided
└─ Verify relevance to query
```

---

## 3. UI/UX Tests (10%)

### Component Tests

**Test Suite: Report Form**
- ✓ Image upload triggers preview
- ✓ Location picker works (manual + auto)
- ✓ Form validation shows errors
- ✓ Submit disabled until valid
- ✓ Loading state shown during upload
- ✓ Success message on completion

**Test Suite: Feed View**
- ✓ Reports load in feed
- ✓ Infinite scroll triggers load more
- ✓ Upvote button updates immediately
- ✓ Like count updates in real-time
- ✓ Filters work (category, severity)
- ✓ Sort options work (trending, new, score)

**Test Suite: Map View**
- ✓ Map renders with pins
- ✓ Pins color-coded by severity
- ✓ Clusters appear at low zoom
- ✓ Click pin shows details
- ✓ Filter applies to map
- ✓ Performance acceptable (1000+ pins)

### Accessibility Tests

**Test Suite: Keyboard Navigation**
- ✓ Tab order logical
- ✓ Enter activates buttons
- ✓ Escape closes modals
- ✓ All interactive elements keyboard accessible

**Test Suite: Screen Reader**
- ✓ Images have alt text
- ✓ Form labels associated
- ✓ Errors announced
- ✓ Dynamic updates announced
- ✓ Headings logical

**Test Suite: Color Contrast**
- ✓ Text meets WCAG AA standards
- ✓ Icon color combinations sufficient
- ✓ Severity colors not sole indicator

### Responsive Design

**Test Suite: Mobile (375px)**
- ✓ Layout adapts
- ✓ Touch targets ≥44px
- ✓ Forms usable
- ✓ Map functional
- ✓ Performance acceptable

**Test Suite: Tablet (768px)**
- ✓ Layout utilizes space
- ✓ Two-column layouts work
- ✓ Map interactive

**Test Suite: Desktop (1920px)**
- ✓ Layout utilizes space
- ✓ No horizontal scroll
- ✓ Multi-column layouts

---

## 4. AI Response Validation

### Accuracy Tests

**Test Suite: Image Classification**
```
Prepare test dataset:
├─ 20 pothole images → expect 95%+ accuracy
├─ 20 water leak images
├─ 20 streetlight images
├─ 20 garbage pile images
├─ 20 ambiguous/mixed images

Run analysis:
├─ For each image, call Gemini Vision
├─ Compare predicted category to ground truth
├─ Track accuracy and confidence distribution
└─ Measure performance: >90% accuracy target
```

**Test Suite: Severity Estimation**
```
Prepare labeled dataset:
├─ 10 low severity images
├─ 10 medium severity
├─ 10 high severity
├─ 10 critical severity

Validate:
├─ Low severity predictions within 0.2 of ground truth
├─ Medium severity predictions within 0.2
├─ High/critical severity predictions within 0.2
└─ Measure: >85% accuracy target
```

### Response Consistency

**Test Suite: Determinism**
- Analyze same image 3 times
- ✓ Category prediction consistent
- ✓ Severity prediction consistent (±0.1)
- ✓ Confidence score similar (±5%)

**Test Suite: Schema Compliance**
- 100 API calls to Gemini Vision
- ✓ All responses match schema
- ✓ No unexpected fields
- ✓ All required fields present
- ✓ No malformed JSON

### Edge Cases

**Test Suite: Ambiguous Images**
- Multiple issues in one photo
  - ✓ Returns primary category
  - ✓ Confidence lower (0.6-0.8)
  - ✓ Alternatives provided
  
- Unclear/blurry images
  - ✓ Confidence <0.7
  - ✓ Flagged for review
  - ✓ Helpful error message
  
- Non-infrastructure images
  - ✓ Category rejected
  - ✓ Error message clear
  - ✓ User prompted to re-upload

**Test Suite: Chat Assistant**
- Ambiguous queries
  - ✓ Returns most likely interpretation
  - ✓ Offers clarification options
  
- Out-of-scope queries
  - ✓ Politely declines
  - ✓ Suggests related in-scope topics
  
- Multi-turn conversations
  - ✓ Context maintained
  - ✓ Coherent responses

---

## 5. Error Scenarios

### Network Errors

**Test Suite: API Failures**
- ✓ Gemini API timeout → Fallback response + retry
- ✓ Database connection lost → Graceful error + reconnect
- ✓ Storage upload fails → User notified + retry option
- ✓ Network disconnected → Offline queue + sync on reconnect

**Test Suite: Partial Failures**
- ✓ Image uploads but Gemini fails → Manual categorization UI
- ✓ Report saved but broadcast fails → Eventually consistent
- ✓ Vote saved but impact score fails → Background job retries

### Data Integrity

**Test Suite: Concurrent Operations**
- User 1 upvotes, User 2 upvotes simultaneously
  - ✓ Both votes counted
  - ✓ No race conditions
  - ✓ Count correct

- User edits report while vote incoming
  - ✓ No data loss
  - ✓ Consistent state
  - ✓ Both changes applied

**Test Suite: Data Validation**
- ✓ Coordinates outside valid range rejected
- ✓ Negative numbers in counts rejected
- ✓ Timestamps in future rejected
- ✓ Invalid enum values rejected

### Authentication/Authorization

**Test Suite: Access Control**
- ✓ Unauthenticated user cannot create report
- ✓ User cannot edit other user's report
- ✓ User cannot delete other user's report
- ✓ Admin can edit any report

**Test Suite: Token Expiration**
- ✓ Expired token rejected with 401
- ✓ Refresh token works
- ✓ Refresh token rotation happening
- ✓ Double-use of token detected

---

## 6. Performance Tests

### Load Testing

**Scenario 1: Concurrent Users**
- 100 concurrent users
  - ✓ Page load < 3 seconds
  - ✓ All requests respond within 5 seconds
  - ✓ No 5xx errors

- 500 concurrent users
  - ✓ Service remains responsive
  - ✓ Database connection pool holds
  - ✓ Graceful degradation if needed

**Scenario 2: High-Volume Report Creation**
- 100 reports/minute
  - ✓ All stored successfully
  - ✓ AI analysis completes for all
  - ✓ Real-time updates delivered
  - ✓ Database performance acceptable

### Latency Targets

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Page load | <3s | <5s |
| API call | <500ms | <2s |
| Feed scroll | <100ms | <500ms |
| Vote upvote | <200ms | <1s |
| AI analysis | <5s | <15s |
| Map render (1000 pins) | <2s | <5s |

### Database Performance

- Query for 20 nearby issues: <100ms
- Fetch trending issues: <200ms
- Calculate impact scores (1000 issues): <500ms
- Geographic bounding box (10000 issues): <300ms

---

## 7. Continuous Integration

### Test Automation

**On Every Commit:**
- Unit tests (all must pass)
- Linting (code quality)
- Type checking (TypeScript)

**On Pull Request:**
- Unit + integration tests
- Coverage report (target: >80%)
- Performance regression check

**On Main Branch:**
- Full test suite (unit + integration + UI)
- E2E tests on staging environment
- Performance benchmarking
- Accessibility audit

### Test Reporting

- Coverage reports: Public dashboard
- Performance metrics: Tracked over time
- Failure alerts: Slack notification
- Regression detection: Automated

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Comprehensive testing strategy |

---

**Created By:** QA Team  
**Last Updated:** June 22, 2026
