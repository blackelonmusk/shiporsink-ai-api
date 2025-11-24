# Ship or Sink AI API

AI coaching endpoint for the Ship or Sink Change Management app.

## What it does

This serverless API connects to Claude to provide intelligent change management coaching based on:
- Prosci's ADKAR model
- Real project and stakeholder data
- Conversation preparation and objection handling

## Endpoint

**POST** `/api/chat`

### Request body:

```json
{
  "question": "How do I handle a resistant stakeholder?",
  "projectContext": {
    "projectName": "Digital Transformation",
    "status": "active",
    "riskLevel": 45,
    "totalEngagement": 180,
    "stakeholders": [
      {
        "name": "Sarah Johnson",
        "role": "VP Operations",
        "engagement": 35,
        "performance": 60,
        "comments": "Concerned about team workload"
      }
    ]
  }
}
```

### Response:

```json
{
  "response": "Based on Sarah's profile, she appears to be stuck at the Desire stage of ADKAR..."
}
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Your Claude API key (set in Vercel dashboard)

## Part of Ship or Sink

This is a supporting service for the Ship or Sink Change Management app.

- Main app: [shiporsink-change-management](https://github.com/blackelonmusk/shiporsink-change-management)
- Campaign: [shiporsink.ai](https://shiporsink.ai)
