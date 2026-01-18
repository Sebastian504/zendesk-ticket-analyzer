# Zendesk Ticket Analyzer – Product Requirements Document (PRD)

---
**Product Name:** Zendesk Ticket Analyzer
**Owner:** Sebastian Bossung
**Date:** January 18, 2026
**Objective:** Develop a browser-based application to fetch, store, and analyze Zendesk tickets using local storage and AI classification.

---

## 1. Introduction

### 1.1 Background
Sebastian Bossung wants to create an application that allows fetching Zendesk tickets from the last 4 weeks (including subject, text, and comments), storing them locally in the browser, and classifying them by topic and sentiment (positive/negative) using a Large Language Model (LLM).

### 1.2 Goals
- **Data Retrieval:** Automatically fetch tickets and comments via the Zendesk API.
- **Local Storage:** Store all data exclusively in the browser (localStorage).
- **AI Classification:** Use an LLM endpoint to classify tickets by topic and sentiment.
- **User-Friendliness:** Simple operation without server or backend requirements.

---

## 2. Requirements

### 2.1 Functional Requirements

| **ID** | **Requirement**                                      | **Details**                                                                                     |
|--------|------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| FR-01  | Fetch Zendesk Tickets                                | Tickets from the last 4 weeks (by creation date) including subject, description, and comments. |
| FR-02  | Local Browser Storage                                | Use `localStorage` for all data.                                                               |
| FR-03  | LLM Endpoint Integration                             | Classify tickets by topic and sentiment (positive/negative).                                    |
| FR-04  | User Interface                                       | Buttons to fetch, display, and classify tickets.                                               |
| FR-05  | Authentication                                       | Zendesk API: API Token auth (`{email}/token:{api_token}`) or OAuth Bearer token. LLM API: API Key. Zendesk subdomain configurable in UI. |
| FR-06  | Prompt definition by user                            | user able to change prompts for LLM classification and summarization in UI                      |

### 2.2 Technical Requirements

| **ID** | **Requirement**                                      | **Technology/Implementation**                                                                   |
|--------|------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| TR-01  | Ticket Retrieval                                     | `fetch` API with filter `created_after=[date 4 weeks ago]`                                      |
| TR-02  | Comment Retrieval                                    | Endpoint: `/api/v2/tickets/{ticket_id}/comments.json`                                           |
| TR-03  | Local Data Storage                                   | `localStorage.setItem('zendeskTickets', JSON.stringify(tickets))`                              |
| TR-04  | LLM Integration                                      | `fetch` call to user-defined LLM endpoint (configurable in UI, runs in own cloud). Rate limit: 5 requests/second (configurable constant in code). |
| TR-05  | Error Handling                                       | User-friendly error messages for API issues.                                                   |

---

## 3. Data Model

### 3.1 Ticket Data Structure
```json
{
  "tickets": [
    {
      "id": 12345,
      "subject": "Ticket Subject",
      "description": "Ticket description text",
      "comments": [
        {
          "id": 1,
          "body": "Comment text",
          "author_id": 123,
          "created_at": "2026-01-01T12:00:00Z"
        }
      ]
    }
  ]
}
```

### 3.2 Classification Output
```json
{
  "topic": ["Technical Support", "Billing"],
  "sentiment": "positive" | "negative" | "neutral"
}
```

---

## 4. User Flow

1. **Fetch Tickets:**
   - User clicks "Fetch Tickets".
   - Application retrieves tickets and comments, stores them in `localStorage`.
2. **Display Tickets:**
   - User clicks "Show Stored Tickets".
   - Application displays tickets in a readable format.
3. **Classify Tickets:**
   - User selects ticket(s) and initiates classification.
   - Application sends ticket data to the LLM endpoint.
   - Result is displayed and optionally stored.

---

## 5. Clarifications & Decisions

| **Question** | **Decision** |
|--------------|-------------|
| LLM endpoint | User-configurable in UI (runs in own cloud) |
| Classification trigger | On-demand (user-initiated) |
| Topic taxonomy | Free-form (LLM decides) |
| Sentiment classes | Three: positive, negative, neutral |
| Classification scope | Ticket description + all comments |
| Tech stack | Plain HTML/JS/CSS (no frameworks) |
| Expected data volume | ~500 tickets (localStorage sufficient) |
| Fetch behavior | Replace existing data on each fetch |

## 6. Open Questions
- [ ] CORS: If browser-based Zendesk API calls fail, add a local proxy server

---

## 7. UI Features

| **Feature** | **Details** |
|-------------|-------------|
| Sentiment chart | Visual chart showing distribution of positive/negative/neutral |
| Topic list | List of all topics with click-through to view tickets under each topic |
| Configuration panel | Zendesk subdomain, API credentials, LLM endpoint all configurable in UI |

---

## 8. Mock Server (Development)

A mock Zendesk API server for development/testing without real API credentials.

### 8.1 Endpoints

| **Endpoint** | **Method** | **Description** |
|--------------|------------|----------------|
| `/api/v2/tickets.json` | GET | Returns list of tickets (supports `created_after` filter) |
| `/api/v2/tickets/{id}/comments.json` | GET | Returns comments for a specific ticket |

### 8.2 Authentication
Supports both Zendesk authentication methods:
- **API Token**: Basic Auth with `{email}/token:{api_token}` format
- **OAuth**: Bearer token in Authorization header
- Mock accepts any valid format credentials
- Returns 401 if no auth header provided

### 8.3 Mock Data Scenario
- **Context**: Jobboard company that just launched a new B2B admin system with ATS (Applicant Tracking System) functionality
- **Tickets**: 12 realistic customer support tickets
- **Sentiment mix**: Mix of positive, negative, and neutral feedback
- **Topics**: ATS bugs, UI complaints, feature requests, onboarding issues, praise for new features

### 8.4 Running the Mock Server
```bash
cd server
npm install
npm start
# Server runs on http://localhost:3001
```

---

## 9. Out of Scope
- Server-side processing or storage.
- Real-time updates or webhooks.
- Multi-user functionality.

---
