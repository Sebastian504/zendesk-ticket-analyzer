# Zendesk Mock Server

A mock Zendesk API server for developing and testing the Zendesk Ticket Analyzer without real API credentials. Implements the Zendesk REST API format per [official documentation](https://developer.zendesk.com/api-reference/).

## Quick Start

```bash
npm install
npm start
```

Server runs on **http://localhost:3001**

## Authentication

The mock server supports both Zendesk authentication methods:

### 1. API Token (recommended)
Format: `{email}/token:{api_token}` as Basic Auth credentials.

```bash
curl -u "user@example.com/token:your_api_token" "http://localhost:3001/api/v2/tickets.json"
```

### 2. OAuth Bearer Token
```bash
curl -H "Authorization: Bearer your_oauth_token" "http://localhost:3001/api/v2/tickets.json"
```

**Note:** The mock accepts any credentials for development purposes. Requests without an `Authorization` header receive `401 Unauthorized`.

## Endpoints

All endpoints support both `/api/v2/resource` and `/api/v2/resource.json` formats.

### GET `/api/v2/tickets`

Returns a list of tickets. Supports query parameter `created_after` (ISO date string) to filter tickets.

```bash
curl -u "user@example.com/token:abc123" "http://localhost:3001/api/v2/tickets.json"
```

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "url": "https://mockcompany.zendesk.com/api/v2/tickets/1.json",
      "subject": "ATS candidate pipeline not saving changes",
      "raw_subject": "ATS candidate pipeline not saving changes",
      "description": "Every time I try to move a candidate...",
      "created_at": "2026-01-15T09:23:00Z",
      "updated_at": "2026-01-15T14:30:00Z",
      "status": "open",
      "priority": "high",
      "type": "problem",
      "requester_id": 101,
      "submitter_id": 101,
      "assignee_id": 201,
      "organization_id": 301,
      "group_id": 401,
      "tags": ["ats", "bug", "pipeline"],
      "via": { "channel": "web" },
      "is_public": true,
      "has_incidents": false
    }
  ],
  "next_page": null,
  "previous_page": null,
  "count": 12
}
```

### GET `/api/v2/tickets/:id`

Returns a single ticket by ID.

```bash
curl -u "user@example.com/token:abc123" "http://localhost:3001/api/v2/tickets/1.json"
```

### GET `/api/v2/tickets/:id/comments`

Returns comments for a specific ticket.

```bash
curl -u "user@example.com/token:abc123" "http://localhost:3001/api/v2/tickets/1/comments.json"
```

**Response:**
```json
{
  "comments": [
    {
      "id": 1001,
      "type": "Comment",
      "body": "Thank you for reporting this...",
      "html_body": "<p>Thank you for reporting this...</p>",
      "plain_body": "Thank you for reporting this...",
      "author_id": 201,
      "created_at": "2026-01-15T10:00:00Z",
      "public": true,
      "attachments": [],
      "via": { "channel": "web" }
    }
  ],
  "next_page": null,
  "previous_page": null,
  "count": 3
}
```

### GET `/api/v2/search`

Simplified search API. Supports `query` parameter with `type:ticket` and `created>YYYY-MM-DD`.

```bash
curl -u "user@example.com/token:abc123" "http://localhost:3001/api/v2/search.json?query=type:ticket%20created%3E2026-01-10"
```

## Mock Data Scenario

The mock data simulates a **jobboard company** that recently launched a new **B2B admin system** with **ATS (Applicant Tracking System)** functionality. The 12 tickets include:

| Ticket Type | Count | Sentiment |
|-------------|-------|-----------|
| ATS bugs/issues | 3 | Negative |
| UI/UX complaints | 2 | Negative |
| Feature requests | 2 | Neutral |
| Onboarding questions | 2 | Neutral |
| Positive feedback | 3 | Positive |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |

## CORS

CORS is enabled for all origins to allow browser-based requests during development.

## Differences from Real Zendesk API

| Feature | Mock | Real Zendesk |
|---------|------|-------------|
| Authentication | Accepts any valid format | Validates credentials |
| Pagination | Returns all results | Max 100 per page with cursor/offset |
| Date filtering | `created_after` param on tickets endpoint | Use Search API with `created>` query |
| Rate limiting | None | Has rate limits per endpoint |
