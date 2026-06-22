# User Flow

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

This document describes the complete user journey through CIVIQ, from initial access through issue resolution and community engagement. The flow encompasses all primary use cases and feature interactions.

---

## Complete User Journey

### Phase 1: Authentication & Onboarding

```
User Opens App
    ↓
Authentication Check
    ├─ New User → Google OAuth Sign-Up
    │   ├─ Complete Profile (Optional)
    │   ├─ Permission Request (Camera, Location)
    │   └─ Onboarding Tutorial
    │
    └─ Existing User → Auto-Login / Quick Auth
        └─ Redirect to Dashboard
```

**Key Interactions:**
- One-tap Google OAuth login
- Camera and location permissions requested
- Optional user profile completion
- Guided tutorial for first-time users
- Automatic profile picture from Google account

**Outcome:** User authenticated and ready to report or explore issues

---

### Phase 2: Report Issue

```
User Selects "Report Issue"
    ↓
Camera Interface Opens
    ├─ Take Photo
    │   ├─ Review & Retake
    │   └─ Confirm Selection
    │
    └─ Upload from Gallery
        └─ Select Existing Photo
    ↓
Location Confirmation
    ├─ Auto-Detect Current Location
    │   └─ Show on Map
    │
    └─ Manual Location Adjustment
        ├─ Drag Pin on Map
        └─ Search by Address
    ↓
Add Description (Optional)
    ├─ Text Input
    ├─ Voice Input (Future)
    └─ Skip (Use AI Suggestion)
    ↓
Submit Report
    ├─ Confirm Details
    ├─ Add Tags (Optional)
    └─ Submit to Backend
    ↓
Confirmation Screen
    ├─ Report Created Successfully
    ├─ Show Issue ID & Map Preview
    ├─ Options:
    │   ├─ Report Another Issue
    │   ├─ View in Feed
    │   └─ Share with Community
    └─ Return to Dashboard
```

**Key Interactions:**
- Photo capture with immediate preview
- Automatic location detection (with manual override)
- Optional description text or voice input
- Real-time map preview of issue location
- Immediate confirmation and next action options

**Technical Flow:**
1. Image uploaded to Supabase storage
2. Image passed to Gemini Vision API
3. AI response: category, severity, confidence
4. Issue record created in database
5. Confirmation sent to user

**Outcome:** Issue reported and ready for community analysis

---

### Phase 3: AI Analysis

```
Backend Process (User Sees "Analyzing...")
    ↓
Gemini Vision Analysis
    ├─ Image Processing
    ├─ Feature Extraction
    └─ Classification
    ↓
Output Generation
    ├─ Issue Category (Pothole, Water, Light, Garbage, etc.)
    ├─ Severity (Low, Medium, High, Critical)
    ├─ Confidence Score (0-100%)
    └─ Suggested Description
    ↓
Database Update
    ├─ Store AI Outputs
    ├─ Set Initial Impact Score
    └─ Flag Low-Confidence Results
    ↓
User Notification
    ├─ Analysis Complete
    ├─ Show Categorization & Severity
    ├─ Display Confidence Score
    └─ Display Suggested Description
```

**User Experience:**
- Loading screen during analysis
- Results displayed with visual confidence indicators
- AI suggestions presented as editable defaults
- Option to report incorrect categorization
- Real-time confidence feedback

**Outcome:** Issue automatically categorized and severity assessed

---

### Phase 4: Community Feed & Verification

```
Issue Appears in Community Feed
    ↓
User Discovers Issue
    ├─ Scrolls Nearby Issues
    ├─ Searches by Category/Area
    └─ Views Trending Issues
    ↓
Issue Card Display
    ├─ Image Thumbnail
    ├─ Location & Distance
    ├─ AI Category Badge
    ├─ Severity Indicator
    ├─ Validation Count
    ├─ Report Time
    └─ Reporter Name (Optional)
    ↓
User Interaction
    ├─ Upvote / Validate Issue
    │   ├─ Single Tap Upvote
    │   ├─ Increment Validation Count
    │   └─ Update Impact Score
    │
    ├─ Add Comment (Optional)
    │   ├─ Free-form text
    │   └─ Tag Other Users
    │
    ├─ View Full Details
    │   ├─ Full Image
    │   ├─ Reporter Description
    │   ├─ AI Analysis Details
    │   ├─ All Validations & Comments
    │   └─ Location on Map
    │
    └─ Share Issue
        ├─ Copy Link
        ├─ Share to Social Media
        └─ Send to Contacts
```

**Key Interactions:**
- One-tap upvote/validation
- Real-time vote count updates
- Comment threads for discussion
- Location context with map preview
- Share options to external platforms

**User Feedback:**
- Immediate confirmation of upvote
- Updated validation count
- New comments notification
- Badge for reaching validation thresholds

**Outcome:** Community validates and prioritizes issues

---

### Phase 5: Impact Score & Ranking

```
Issue Receives Engagement
    ↓
Impact Score Calculation
    ├─ Base Score (Severity from AI)
    ├─ Validation Multiplier
    │   ├─ +1 point per validation
    │   └─ Cap at 100
    │
    ├─ Time Decay
    │   ├─ Reduce engagement impact over time
    │   └─ Keep recent issues fresh
    │
    ├─ Geographic Weight
    │   ├─ High density area = higher priority
    │   └─ Underreported area = boost
    │
    └─ Comment Sentiment
        ├─ Analyze comment text
        └─ Adjust score based on urgency
    ↓
Ranking Update
    ├─ Issue Re-ranked in Feed
    ├─ Move Up Feed Based on Score
    ├─ Update Heatmap Position
    └─ Trigger Notifications (if trending)
    ↓
Display Updates
    ├─ Issue Position in Feed Changes
    ├─ "Trending Now" Badge Appears
    ├─ Notifications to Interested Users
    └─ Dashboard Statistics Update
```

**Algorithmic Transparency:**
- Users see impact score publicly
- Understand why issues rank higher
- See contribution to prioritization
- Predictable reward system for validation

**Outcome:** Issues auto-prioritize based on community consensus

---

### Phase 6: Map View

```
User Selects "Map View"
    ↓
Map Initialization
    ├─ Center on User Location
    ├─ Load Issue Pins
    ├─ Color-Code by Severity
    └─ Cluster at Zoom Out
    ↓
Map Interactions
    ├─ Zoom
    │   ├─ Zoom In → Expand Clusters
    │   ├─ Zoom Out → Aggregate Issues
    │   └─ Dynamic Pin Count Update
    │
    ├─ Pan
    │   ├─ Explore Neighborhood
    │   ├─ Adjust Center Point
    │   └─ Load New Issues as Needed
    │
    ├─ Filter
    │   ├─ By Category (Pothole, Water, etc.)
    │   ├─ By Severity (Low, Medium, High, Critical)
    │   ├─ By Time Range (24h, 7d, 30d)
    │   └─ Apply Multiple Filters
    │
    └─ Click Pin
        ├─ Show Issue Preview
        ├─ Display Image Thumbnail
        ├─ Show Category & Severity
        ├─ Display Validation Count
        └─ "View Details" Option
    ↓
Detailed View
    ├─ Full Issue Card Appears
    ├─ Image Expands
    ├─ Validation & Comment Activity
    ├─ Option to Upvote
    └─ Navigate to Full Details or Close
```

**Visualization Features:**
- Color-coded pins (Red=Critical, Orange=High, Yellow=Medium, Green=Low)
- Pin size based on validation count
- Cluster badges showing count
- Heatmap overlay showing density
- Geographic trend identification

**Outcome:** Geographic visualization of community problems

---

### Phase 7: Dashboard & Analytics

```
User Selects "Dashboard"
    ↓
Load Personal Statistics
    ├─ Total Reports (Lifetime)
    ├─ Reports This Month
    ├─ Validations Received
    ├─ Validation Streak
    └─ Community Rank
    ↓
Community Overview
    ├─ Total Active Issues
    ├─ Issues Reported Today/Week/Month
    ├─ Top Categories (Bar Chart)
    │   ├─ Potholes
    │   ├─ Water Issues
    │   ├─ Streetlights
    │   └─ Garbage
    │
    ├─ Severity Distribution (Pie Chart)
    │   ├─ Critical Count
    │   ├─ High Count
    │   ├─ Medium Count
    │   └─ Low Count
    │
    ├─ Geographic Heatmap
    │   ├─ Issue Density Map
    │   ├─ Hotspot Identification
    │   └─ Neighborhood Comparison
    │
    └─ Trending Issues
        ├─ Top Validated Issues
        ├─ Recent Hotspots
        └─ Emerging Trends
    ↓
Dashboard Filtering
    ├─ Time Period Selection (Today/Week/Month/Year)
    ├─ Category Filter
    ├─ Neighborhood/Area Filter
    ├─ Severity Filter
    └─ Export Report (Future)
    ↓
Personal Insights
    ├─ "You're in the Top 10% of Contributors"
    ├─ "5 New Issues Reported in Your Area"
    ├─ "Your Reports Have 45 Validations"
    └─ "Recommended Action: Garbage Cleanup Day"
```

**Analytics Features:**
- Real-time statistics updates
- Time-series trend analysis
- Peer comparison ("You reported more issues than 70% of users")
- Actionable insights based on data
- Export functionality for community leaders

**Outcome:** Users understand personal contribution and community impact

---

### Phase 8: AI Assistant Chat

```
User Selects "Ask CIVIQ"
    ↓
Chat Interface Opens
    ├─ Message History
    ├─ Input Field
    └─ Suggested Questions
    ↓
User Types Question
    Examples:
    - "What issues are reported near me?"
    - "How do I report a pothole?"
    - "What's the most common issue type?"
    - "Show me critical issues in my area"
    - "What should I upvote?"
    ↓
Query Processing
    ├─ Intent Recognition
    ├─ Entity Extraction (location, category, time)
    ├─ Database Query Generation
    └─ Gemini API Processing
    ↓
Response Generation
    ├─ Natural Language Response
    ├─ Contextual Links to Issues/Map
    ├─ Visual Data if Applicable
    └─ Suggested Follow-Up Actions
    ↓
User Receives Response
    Examples:
    - "There are 12 water issues reported within 1km of you"
    - "To report an issue: 1) Take photo, 2) Add location, 3) Submit"
    - "Potholes are the most common (45% of issues)"
    - [Shows Map Pin to High-Priority Water Issue]
    ↓
Follow-Up Interaction
    ├─ Ask Clarifying Question
    ├─ Act on Suggestion
    │   ├─ Navigate to Map
    │   ├─ Upvote Recommended Issue
    │   ├─ Report New Issue
    │   └─ View Details
    │
    └─ End Conversation
```

**AI Assistant Capabilities:**
- Natural language understanding of community questions
- Contextual awareness (location, user history)
- Real-time data queries
- Actionable recommendations
- Guided pathways to platform actions

**Outcome:** User guidance and self-service support through conversational AI

---

### Phase 9: Issue Resolution & Closure

```
Issue Reaches Critical Threshold
    ├─ 50+ Validations
    ├─ High Impact Score
    └─ Community Consensus Reached
    ↓
Notification Sent
    ├─ To Community Leaders
    ├─ To Authorities (If Integrated)
    └─ To Original Reporter
    ↓
Resolution Tracking (Future)
    ├─ Authority Action Recorded
    ├─ Resolution Status Updated
    ├─ Photos of Fix Added
    ├─ Community Notified
    └─ Issue Marked Resolved
    ↓
User Recognition
    ├─ Reporter Awarded Points/Badge
    ├─ Top Validators Recognized
    ├─ Dashboard Updated
    └─ Leaderboard Position Changed
```

**Future Resolution Features:**
- Authority integration for status updates
- Before/after photo comparison
- Resolution confirmation by community
- Impact assessment (cost saved, lives improved)
- Success stories highlighted

**Outcome:** Complete lifecycle visibility from report to resolution

---

## Alternative Flows

### Search-Based Discovery

```
User Uses Search
    ↓
Enter Query (Category/Area/Keyword)
    ↓
Results Displayed
    ├─ Issue Cards List
    ├─ Map Preview
    └─ Filter Options
    ↓
Select Result
    └─ Navigate to Full Details
```

### Notification Flows

```
Significant Activity on Your Report
    ↓
Push Notification Received
    ├─ "Your report gained 10 new validations!"
    ├─ "Your area has 5 new critical issues"
    └─ "You're now in Top 5 Contributors!"
    ↓
User Taps Notification
    └─ Navigate to Relevant Section
        ├─ Issue Details
        ├─ Area Map
        └─ Leaderboard
```

---

## User Friction Points & Mitigations

| Friction Point | Mitigation |
|---|---|
| Complex reporting | Simplified 3-step process: Photo → Location → Submit |
| Poor AI accuracy | Show confidence score, allow corrections |
| No feedback on reports | Real-time validation counts and comments |
| Can't find issues | Search, filters, map view, AI assistant |
| Difficult authentication | One-tap Google OAuth |
| Accessibility issues | Large text, voice, simple mode for elderly |

---

## Success Metrics in Flow

- **Report Completion Rate:** % of users who successfully report (Target: 95%)
- **Time to Report:** Average seconds from app open to submit (Target: <2 min)
- **Validation Rate:** % of issues receiving 5+ validations (Target: 60%)
- **Feed Engagement:** Average issues viewed per session (Target: 5)
- **Chat Effectiveness:** % of assistant interactions resolving question (Target: 80%)
- **Map Usage:** % of sessions viewing map (Target: 40%)

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Complete user flow mapping |

---

**Created By:** Product & Design Team  
**Last Updated:** June 22, 2026
