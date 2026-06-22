# Google Technologies

**Version:** 1.0  
**Date:** June 2026  
**Status:** Phase 0 — Foundation

---

## Overview

CIVIQ leverages three key Google technologies to power its intelligent infrastructure issue understanding and community features. This document explains each technology, its role in CIVIQ, and integration approach.

---

## 1. Gemini 2.5 Pro

### What It Is

Gemini 2.5 Pro is Google's latest large language model with advanced reasoning capabilities, multimodal support, and structured output generation. It represents the cutting edge of Google's AI research applied to practical applications.

### Key Capabilities

**Advanced Reasoning:**
- Complex multi-step problem solving
- Contextual understanding of infrastructure issues
- Inference from incomplete information
- Risk assessment and prioritization

**Real-time Processing:**
- Sub-second response times
- Streaming output for interactive experiences
- Batch processing for efficiency
- API optimization for cost/performance

**Multimodal Understanding:**
- Image analysis (vision)
- Text comprehension
- Context synthesis
- Cross-modal reasoning

### Role in CIVIQ

**1. Vision Analysis (Primary)**
- Analyze citizen-submitted photos
- Identify issue type, severity, confidence
- Generate description from visual analysis
- Flag potential hazards

**2. Community Assistance**
- Answer natural language queries
- Provide guidance on reporting
- Explain statistics and trends
- Offer recommendations

**3. Content Understanding**
- Analyze user descriptions
- Identify key information
- Detect anomalies or spam
- Categorize by context

### Integration Pattern

```
User Action
    ↓
Backend Receives Request
    ↓
Check Cache (Recent Similar Analysis)
    ↓
If Cache Hit → Return Cached Result
    ↓
If Cache Miss:
    ├─ Prepare Input (Image/Text)
    ├─ Call Gemini 2.5 Pro API
    ├─ Receive Structured Response
    ├─ Store in Cache
    └─ Return to User
```

### Example Usage

**Input (Image Analysis):**
```
Image: [Pothole photo]
Context: "Location: Main Street, User: resident"
Task: "Categorize this infrastructure issue"
```

**Output:**
```json
{
  "category": "pothole",
  "severity": "high",
  "confidence": 0.94,
  "description": "Large circular pothole approximately 2.5m diameter with visible deterioration at edges. Suitable for immediate repair.",
  "hazard_level": "high",
  "recommended_action": "Priority repair - poses vehicle damage and safety risks"
}
```

### Cost Optimization

**Strategies:**
- Cache common analyses (5-minute window)
- Use structured outputs (efficient parsing)
- Batch process similar images
- Regional result aggregation

**Estimated Costs:**
- Per image analysis: ~$0.003-0.005
- Per chat query: ~$0.001-0.002
- Scaling to 10K users: ~$50-100/day

---

## 2. Gemini Vision

### What It Is

Gemini Vision is the multimodal component of Gemini that specializes in understanding images, videos, and visual context. It can recognize objects, read text, understand spatial relationships, and assess image quality.

### Specialized Capabilities

**Object Detection:**
- Identify infrastructure issues (potholes, water damage, broken lights, garbage)
- Recognize environmental context (urban, rural, weather conditions)
- Locate objects within images
- Detect multiple issues in one image

**Text Recognition (OCR):**
- Read signs and labels
- Extract text from documents
- Understand written context

**Spatial Analysis:**
- Estimate object dimensions
- Assess depth and perspective
- Understand relationships between elements
- Judge image quality and usefulness

**Quality Assessment:**
- Evaluate image sharpness and clarity
- Assess lighting conditions
- Judge whether image is relevant to reported issue
- Flag low-quality or irrelevant submissions

### Role in CIVIQ

**Primary Tasks:**

**1. Automatic Categorization**
```
Input: Citizen photo
Process: Vision analysis
Output: Category (pothole, water, light, garbage, etc.)
Accuracy: 92-96% for clear images
```

**2. Severity Estimation**
```
Input: Categorized issue image
Process: Damage assessment
Output: Severity level (low/medium/high/critical)
Based on: Size, visibility, accessibility, safety impact
```

**3. Automatic Description Generation**
```
Input: Image analysis results
Process: Synthesis of visual findings
Output: Human-readable description
Benefit: Speeds up reporting process
```

**4. Spam/Quality Detection**
```
Input: User submission
Process: Quality and relevance assessment
Output: Quality score, flag if inappropriate
Prevents: Low-quality or off-topic submissions
```

### Integration Example

**Flow:**

```
Step 1: User Captures Photo
        └─ Store temporarily in memory

Step 2: User Confirms Submit
        └─ Validate form completeness

Step 3: Backend Processes
        ├─ Upload image to Supabase Storage
        ├─ Generate public URL
        ├─ Call Gemini Vision with:
        │  ├─ Image URL
        │  ├─ Prompt: "Analyze this infrastructure issue"
        │  └─ Context: Location, area type
        └─ Receive structured analysis

Step 4: Results Stored
        ├─ Category stored
        ├─ Severity stored
        ├─ Confidence score stored
        ├─ Generated description stored
        └─ Full response stored as JSON

Step 5: Real-time Update
        └─ Notify user with analysis
```

### Example Input/Output

**Input:**
```
Image URL: https://storage.example.com/report_xyz.jpg
Prompt: "This is a citizen report of an infrastructure issue. 
         Analyze the image and categorize as:
         - pothole
         - water_leak
         - broken_streetlight
         - garbage_pile
         - other
         Provide severity (low/medium/high/critical) and confidence."
Location Context: "Urban area, main street"
```

**Output:**
```json
{
  "category": "pothole",
  "category_confidence": 0.96,
  "severity": "high",
  "severity_confidence": 0.92,
  "visual_indicators": [
    "circular depression in pavement",
    "visible crack expansion at edges",
    "depth appears 8-10cm",
    "traffic exposure"
  ],
  "image_quality": {
    "clarity": 0.89,
    "lighting": 0.85,
    "relevance": 0.99,
    "overall": 0.91
  },
  "safety_assessment": "HIGH - Vehicle damage risk, pedestrian trip hazard",
  "estimated_area_sqm": 2.5,
  "priority": "urgent"
}
```

---

## 3. Structured Outputs

### What It Is

Structured Outputs is a Gemini feature that ensures API responses conform to predefined JSON schemas. Instead of receiving free-form text, you specify the exact JSON structure you expect, and Gemini guarantees conformance.

### Key Benefits

**Reliability:**
- No parsing errors (schema-enforced)
- Consistent response format
- Type safety
- Predictable behavior

**Efficiency:**
- Faster response processing
- Reduced error handling code
- More accurate results
- Better logging and debugging

**Cost:**
- Slightly lower token usage
- Fewer processing steps
- More tokens for structured data, but more useful

### How It Works

**Traditional Approach:**
```
Prompt: "Analyze this image. Return a JSON object with..."
Response: "Sure! Here's the analysis: {...}"
Processing: Parse, validate, error handling
Risk: Hallucination, formatting errors
```

**Structured Outputs Approach:**
```
Schema: Define exact JSON structure
Prompt: "Analyze this image"
Response: {"field": "value", ...} (guaranteed)
Processing: Direct use (no parsing)
Risk: Minimal (schema enforced)
```

### CIVIQ Application

**Schema Example 1: Issue Analysis**

```json
{
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "enum": ["pothole", "water", "light", "garbage", "other"]
    },
    "severity": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "visual_indicators": {
      "type": "array",
      "items": {"type": "string"},
      "maxItems": 5
    }
  },
  "required": ["category", "severity", "confidence", "description"]
}
```

**Schema Example 2: Chat Response**

```json
{
  "type": "object",
  "properties": {
    "response_text": {"type": "string"},
    "intent": {
      "type": "string",
      "enum": ["query", "guidance", "discovery", "statistics"]
    },
    "suggested_actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action_id": {"type": "string"},
          "label": {"type": "string"}
        }
      }
    },
    "confidence": {"type": "number"}
  },
  "required": ["response_text", "intent"]
}
```

### Implementation Benefits

**For Image Analysis:**
- Guaranteed category, severity, confidence
- Consistent JSON format
- No post-processing needed
- Direct database insertion

**For Chat Responses:**
- Structured intent recognition
- Guaranteed action suggestions
- Reliable confidence scoring
- Predictable frontend handling

---

## 4. Google AI Studio

### What It Is

Google AI Studio is Google's free web interface for interacting with Gemini models. It provides:
- Interactive testing
- Prompt engineering
- API key management
- Documentation
- Cost tracking

### URL
https://aistudio.google.com

### Role in CIVIQ Development

**1. Prompt Development**
- Test and refine prompts
- Experiment with different phrasings
- Validate structured outputs schema
- Understand model behavior

**2. Testing & Validation**
- Test image analysis on sample photos
- Verify response quality
- Check edge cases
- Validate handling of ambiguous inputs

**3. Cost Estimation**
- Estimate token usage
- Calculate costs per query
- Optimize expensive queries
- Monitor spending

**4. Documentation**
- Generate example responses
- Document expected outputs
- Create integration guides
- Share with team

### Example Workflow

**Step 1: Open AI Studio**
```
https://aistudio.google.com
Create new project "CIVIQ Testing"
```

**Step 2: Create Prompt**
```
Model: Gemini 2.5 Pro
Prompt: "Analyze this infrastructure issue image.
         Categorize as: pothole, water, light, garbage, other.
         Rate severity: low, medium, high, critical.
         Provide 0-100 confidence score."
```

**Step 3: Upload Test Image**
```
Select pothole image
Submit
Observe response
```

**Step 4: Refine Based on Results**
```
If response format off → Adjust prompt/schema
If accuracy low → Add examples
If too slow → Simplify task
```

**Step 5: Export Settings**
```
Copy schema
Copy final prompt
Export to codebase
Use in API calls
```

---

## Integration Architecture

### API Endpoints Used

```
Google AI Endpoints:
├─ generateContent (Gemini 2.5 Pro)
├─ uploadFile (Vision image input)
└─ streamGenerateContent (Real-time responses)
```

### Request/Response Pattern

```
Request:
{
  "contents": [{
    "parts": [
      {"text": "Analyze this issue..."},
      {"inline_data": {"mime_type": "image/jpeg", "data": "<base64>"}}
    ]
  }],
  "generation_config": {
    "response_schema": {...},
    "temperature": 0.7
  }
}

Response:
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "{\"category\": \"pothole\", \"severity\": \"high\", ...}"
      }]
    }
  }]
}
```

### Environment Configuration

```env
GOOGLE_GEMINI_API_KEY=<key_from_aistudio>
GEMINI_MODEL=gemini-2.5-pro
GEMINI_VISION_MODEL=gemini-2.5-pro-vision
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
```

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Latency | 1-5 sec | Varies by image size |
| Model Update | Monthly | New versions periodically |
| Availability | 99.9% | Google SLA |
| Rate Limit | 10,000/min | Per project |
| Cost | $0.003-0.015 per query | Depends on model and tokens |

---

## Security Considerations

**API Key Management:**
- Stored in environment variables
- Never exposed in client code
- Rotated quarterly
- Monitored for unusual activity

**Data Privacy:**
- User images sent to Google
- Processed for analysis only
- Not stored by Google (unless configured)
- Compliance: GDPR, CCPA, etc.

**Request Validation:**
- Rate limiting per user
- Request signing (future)
- Abuse detection
- Quota management

---

## Future Enhancements

**Potential Upgrades:**
- Gemini 3.0 when released (better reasoning)
- Video analysis (for before/after issue resolution)
- Multi-language support (translate descriptions)
- Fine-tuning (custom model for CIVIQ)
- Batch processing (analyze 1000+ images overnight)

---

## Document History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | June 22, 2026 | Draft | Initial Google tech integration guide |

---

**Created By:** Engineering Team  
**Last Updated:** June 22, 2026
