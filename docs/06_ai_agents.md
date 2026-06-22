# AI Agents

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

CIVIQ uses multiple specialized AI agents powered by Google Gemini to enable intelligent issue understanding, validation, prioritization, and user support. This document outlines each agent's purpose, inputs, outputs, and responsibilities.

---

## Agent Architecture

```
User Input
    ↓
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST ROUTER                            │
│  Determines which agent(s) should handle the request         │
└─────────────────────────────────────────────────────────────┘
    ↓
    ├──→ Vision Analysis Agent (Image → Category + Severity)
    ├──→ Classification Agent (Multi-class categorization)
    ├──→ Community Assistant Agent (Natural language Q&A)
    ├──→ Validation Agent (Verify issue credibility)
    ├──→ Priority Agent (Calculate impact scores)
    └──→ Recommendation Agent (Suggest actions)
    ↓
    Result Aggregation & Response
    ↓
User Receives Insights
```

---

## Agent 1: Vision Analysis Agent

**Purpose:** Automatically analyze images to understand and categorize issues

**Capabilities:**
- Object detection (pothole, water leak, streetlight, garbage pile, etc.)
- Severity assessment (visual damage indicators)
- Quality scoring (image usefulness)
- Spatial information extraction

**Inputs:**
- Image (JPEG, PNG, WebP)
- Image metadata (timestamp, coordinates)
- Optional description (user-provided)
- Optional location context

**Outputs:**
```json
{
  "category": "pothole",
  "category_alternatives": [
    {"name": "road_damage", "confidence": 0.92},
    {"name": "pavement_issue", "confidence": 0.88}
  ],
  "severity": "high",
  "severity_indicators": ["crack_pattern", "depth_apparent", "expansion"],
  "confidence_score": 0.94,
  "estimated_area_sqm": 2.5,
  "environmental_factors": ["wet", "urban_area"],
  "suggested_description": "Large pothole with visible expansion, approximately 2.5 sqm, appears active",
  "hazard_assessment": "High traffic hazard - potential vehicle damage",
  "image_quality_score": 0.87,
  "recommendation": "Immediate repair recommended"
}
```

**Responsibilities:**
- Real-time image understanding
- Consistent categorization
- Confidence scoring
- Description generation
- Hazard identification

**Error Handling:**
- Low confidence threshold trigger (< 60%) → Flag for human review
- Multiple category matches → Return top 3 alternatives
- Ambiguous image → Request additional context
- Invalid image → User-friendly error message

---

## Agent 2: Classification Agent

**Purpose:** Provide multi-class categorization of issues with confidence scores

**Capabilities:**
- Primary category prediction
- Secondary category suggestions
- Contextual categorization (based on location)
- Category hierarchy understanding

**Inputs:**
- Issue image
- Description text
- Location coordinates
- Historical similar issues
- User history/expertise

**Outputs:**
```json
{
  "primary_category": {
    "name": "pothole",
    "confidence": 0.94,
    "reasoning": "Circular depression in road surface with visible damage"
  },
  "secondary_categories": [
    {"name": "road_damage", "confidence": 0.88},
    {"name": "pavement_safety", "confidence": 0.82}
  ],
  "category_confidence_matrix": {
    "pothole": 0.94,
    "water_leak": 0.05,
    "streetlight": 0.01,
    "garbage": 0.00
  },
  "suggested_tags": ["infrastructure", "traffic_hazard", "repair_needed"],
  "severity_classification": {
    "low": 0.02,
    "medium": 0.08,
    "high": 0.75,
    "critical": 0.15
  }
}
```

**Responsibilities:**
- Precise categorization
- Hierarchy awareness (parent/child categories)
- Contextual classification
- Tag suggestion
- Multi-label support (future)

**Category List:**
- **Pavement:** Pothole, Crack, Uneven surface, Erosion
- **Water:** Leak, Flood, Stagnation, Drainage issue
- **Lighting:** Broken streetlight, Dark area, Flashing light
- **Waste:** Garbage pile, Littering, Debris
- **Other:** Infrastructure damage, Safety hazard, Vegetation overgrowth

---

## Agent 3: Community Assistant Agent

**Purpose:** Provide intelligent conversational support and data-driven recommendations

**Capabilities:**
- Natural language understanding
- Intent recognition (query, report guidance, exploration)
- Database query generation
- Recommendation engine
- Real-time data synthesis

**Inputs:**
- User query (natural language)
- User location
- User history
- User preferences
- Real-time issue database

**Example Interactions:**

**Query 1: "What issues are reported near me?"**
```
Intent: Geographic issue discovery
Response: "I found 12 active issues within 1km of you:
- 3 water leaks (priority areas)
- 5 potholes (high hazard)
- 4 other issues
The closest is a water leak 200m north. Would you like to explore it on the map?"
```

**Query 2: "How do I report a broken streetlight?"**
```
Intent: Guidance/tutorial
Response: "Great! Here's how to report:
1. Tap 'Report Issue'
2. Take a photo of the broken light
3. Confirm your location on the map
4. Add a description (optional)
5. Submit!
Would you like to start reporting now?"
```

**Query 3: "What's most commonly reported?"**
```
Intent: Statistics
Response: "In your area this week:
- Potholes: 45% (most reported)
- Water issues: 30%
- Lighting: 20%
- Other: 5%
Potholes are causing 60% of reports. Your area needs more pothole fixes!"
```

**Outputs:**
```json
{
  "intent": "geographic_query",
  "entities": {
    "location": "user_location",
    "distance_km": 1.0,
    "category_filter": null
  },
  "response_type": "informational",
  "response_text": "I found 12 active issues...",
  "suggested_actions": [
    {"action": "view_on_map", "label": "View on Map"},
    {"action": "upvote_issue", "label": "Validate Closest Issue"},
    {"action": "report_issue", "label": "Report New Issue"}
  ],
  "confidence": 0.95,
  "data_sources": ["real_time_database", "user_preferences"]
}
```

**Responsibilities:**
- Conversational interface
- Query understanding
- Data retrieval and synthesis
- Recommendation generation
- User guidance
- Context awareness

**Supported Query Types:**
- Geographic: "Issues near me", "What's in my neighborhood?"
- Statistical: "Most common issues", "Trending problems"
- Guidance: "How to report", "What is category X?"
- Discovery: "Show me high-priority issues", "What should I validate?"
- Analysis: "Which area needs most help?", "My contribution impact"

---

## Agent 4: Validation Agent

**Purpose:** Assess credibility and quality of reported issues

**Capabilities:**
- Image quality assessment
- Duplicate detection
- Spam/abuse identification
- Report credibility scoring
- Consistency validation

**Inputs:**
- Issue report data
- Historical similar reports
- User reputation score
- Image quality metrics
- Location history

**Outputs:**
```json
{
  "credibility_score": 0.92,
  "is_valid_report": true,
  "flags": [],
  "duplicate_matches": [],
  "spam_probability": 0.02,
  "abuse_indicators": [],
  "image_quality_assessment": {
    "sharpness": 0.88,
    "lighting": 0.82,
    "framing": 0.90,
    "overall": 0.87
  },
  "location_plausibility": {
    "matches_user_pattern": true,
    "within_known_area": true,
    "confidence": 0.95
  },
  "recommendations": [
    "Good image quality - high visibility in feed",
    "Location consistent with user history"
  ]
}
```

**Responsibilities:**
- Quality assessment
- Duplicate detection
- Spam/abuse prevention
- Consistency checking
- Credibility scoring

**Validation Checks:**
- Image quality (resolution, clarity, relevance)
- Description coherence
- Location plausibility
- User reputation
- Time patterns (spam detection)
- Duplicate reports (geographic clustering)

---

## Agent 5: Priority Agent

**Purpose:** Calculate impact scores and prioritize issues for visibility

**Capabilities:**
- Algorithmic scoring
- Contextual weighting
- Temporal decay
- Geographic analysis
- Trend detection

**Inputs:**
- Report data (severity, category, age)
- Engagement metrics (votes, comments)
- Geographic data (density, location type)
- User feedback
- Historical trend data

**Outputs:**
```json
{
  "impact_score": 78,
  "score_components": {
    "base_severity": 25,
    "validation_impact": 30,
    "recency_boost": 10,
    "geographic_weight": 13,
    "trend_multiplier": 1.2
  },
  "ranking": {
    "in_area": 1,
    "in_city": 5,
    "global": 45
  },
  "trend_analysis": {
    "trending": true,
    "trend_direction": "increasing",
    "similar_issues_count": 8,
    "cluster_strength": 0.85
  },
  "recommendation": "High priority - promote to top of feed"
}
```

**Responsibilities:**
- Algorithmic scoring
- Dynamic ranking
- Trend identification
- Geographic weighting
- Temporal adjustments

**Scoring Formula:**
```
Impact Score = 
  (Base Severity × 0.3) +
  (Validation Count × 0.4) +
  (Geographic Weight × 0.2) +
  (Recency Boost × 0.1) ×
  Trend Multiplier
```

---

## Agent 6: Recommendation Agent

**Purpose:** Generate personalized recommendations for user actions

**Capabilities:**
- User preference learning
- Contextual suggestions
- Collaborative filtering
- Personalized content ranking
- Action recommendations

**Inputs:**
- User history
- User location
- User preferences
- Similar user behavior
- Issue context

**Outputs:**
```json
{
  "recommendations": [
    {
      "type": "issue_to_validate",
      "issue_id": "xyz",
      "reason": "High priority in your area",
      "relevance_score": 0.94
    },
    {
      "type": "issue_to_report",
      "suggested_category": "pothole",
      "reason": "You frequently report potholes",
      "relevance_score": 0.87
    },
    {
      "type": "area_to_explore",
      "area": "North District",
      "reason": "3 new critical issues reported",
      "relevance_score": 0.80
    }
  ],
  "personalization_level": 0.88,
  "explanation": "Based on your history and nearby activity"
}
```

**Responsibilities:**
- Personalized suggestions
- Content ranking
- User engagement
- Pattern recognition
- Collaborative intelligence

---

## Agent Orchestration

### Request Processing Pipeline

```
1. REQUEST ARRIVES
   ├─ Parse input
   ├─ Identify intent
   └─ Route to appropriate agent(s)

2. AGENT EXECUTION
   ├─ Vision Agent (if image)
   ├─ Classification Agent (if categorization needed)
   ├─ Validation Agent (if verification needed)
   ├─ Priority Agent (if ranking needed)
   └─ Assistant Agent (if query)

3. RESULT AGGREGATION
   ├─ Combine agent outputs
   ├─ Resolve conflicts
   ├─ Apply confidence weighting
   └─ Generate unified response

4. POST-PROCESSING
   ├─ Store results in database
   ├─ Update caches
   ├─ Broadcast to subscribed clients
   └─ Track analytics
```

### Multi-Agent Scenarios

**Scenario 1: New Report Submitted**
```
Agents Invoked:
1. Vision Analysis → Extract content
2. Classification → Categorize
3. Validation → Assess quality
4. Priority → Calculate score
5. Recommendation → Notify similar users

Result: Complete analysis stored, feed updated
```

**Scenario 2: User Asks Query**
```
Agents Invoked:
1. Assistant → Understand intent
2. Priority/Validation → Fetch relevant issues
3. Recommendation → Personalize response

Result: Natural language response with actions
```

---

## Performance & Scaling

**Latency Targets:**
- Vision Analysis: < 5 seconds
- Classification: < 2 seconds
- Query Processing: < 2 seconds
- Overall Response: < 5 seconds

**Optimization Strategies:**
- Parallel agent execution where possible
- Response caching for common queries
- Batch processing for bulk operations
- Fallback responses if agent timeout

**Cost Management:**
- Token usage optimization
- Structured outputs (efficient parsing)
- Caching frequent results
- User-level rate limiting

---

## Future Agent Enhancements

1. **Impact Assessment Agent** — Estimate community benefit of resolution
2. **Predictive Agent** — Forecast emerging issues
3. **Multilingual Agent** — Natural language translation
4. **Government Integration Agent** — Authority interaction
5. **Media Agent** — Generate shareable content about issues

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Initial agent specifications |

---

**Created By:** AI/ML Team  
**Last Updated:** June 22, 2026
