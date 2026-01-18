# Zendesk Ticket Analyzer

A browser-based application to fetch, store, and analyze Zendesk tickets using local storage and AI classification.

## Features

- **Fetch Tickets**: Retrieve tickets from the last 4 weeks including subject, description, and comments
- **Local Storage**: All data stored in browser localStorage (no server required)
- **AI Classification**: Classify tickets by topic and sentiment using any OpenAI-compatible LLM endpoint
- **Analytics Dashboard**: Sentiment distribution chart and clickable topic list
- **Customizable Prompts**: Edit the classification prompt to fit your needs

## Quick Start

### Using the Mock Server (Development)

1. Start the mock Zendesk server:
   ```bash
   cd mock-server
   npm install
   npm start
   ```

2. Open `index.html` in your browser (or serve it locally)

3. Configure the application:
   - **Subdomain**: Enter `http://localhost:3001` (for mock server)
   - **Email**: Any email (e.g., `user@example.com`)
   - **API Token**: Any token (e.g., `test123`)

4. Click "Fetch Tickets" to load the mock data

### Using Real Zendesk

1. Open `index.html` in your browser

2. Configure with your Zendesk credentials:
   - **Subdomain**: Your Zendesk subdomain (e.g., `yourcompany` from `yourcompany.zendesk.com`)
   - **Email**: Your Zendesk account email
   - **API Token**: Generate from Zendesk Admin > Apps and integrations > APIs > Zendesk API

3. Configure your LLM endpoint:
   - **Endpoint URL**: Your LLM API endpoint (OpenAI-compatible)
   - **API Key**: Your LLM API key
   - **Model**: (Optional) Model name

4. Click "Fetch Tickets" then "Classify All Tickets"

## Configuration

### Zendesk API
| Field | Description |
|-------|-------------|
| Subdomain | Your Zendesk subdomain or full URL for mock server |
| Email | Your Zendesk account email |
| API Token | Zendesk API token (from Admin Center) |

### LLM API
| Field | Description |
|-------|-------------|
| Endpoint URL | OpenAI-compatible chat completions endpoint |
| API Key | Bearer token for authentication |
| Model | (Optional) Model identifier |

The LLM endpoint should accept the standard OpenAI chat completions format:
```json
{
  "model": "your-model",
  "messages": [{"role": "user", "content": "..."}],
  "temperature": 0.3
}
```

## Classification

Tickets are classified with:
- **Classification**: positive, negative, or neutral
- **Topics**: 1-3 free-form topic labels

The default prompt can be customized in the "Prompt Configuration" section. Available placeholders:
- `{{ticket_subject}}` - Ticket subject line
- `{{ticket_description}}` - Ticket description/body
- `{{ticket_comments}}` - All comments concatenated

## Rate Limiting

LLM API calls are rate-limited to 5 requests per second by default. This can be changed in `app.js`:
```javascript
const LLM_RATE_LIMIT = 5; // requests per second
```

## Data Storage

All data is stored in browser localStorage:
- `zendeskAnalyzer_config` - API credentials (stored locally only)
- `zendeskAnalyzer_tickets` - Fetched tickets with classifications
- `zendeskAnalyzer_prompt` - Custom classification prompt

## Browser Compatibility

Works in all modern browsers. Requires JavaScript enabled.

**Note on CORS**: Direct browser requests to Zendesk API may be blocked by CORS. If you encounter issues:
1. Use the mock server for development
2. Consider a browser extension to bypass CORS
3. Set up a simple proxy server

## Data Flow & Privacy

### Data Processed

| Data Type | Fields | Source |
|-----------|--------|--------|
| **Tickets** | ID, subject, description, status, priority, created_at, updated_at, requester_id, assignee_id, organization_id, tags | Zendesk API |
| **Comments** | ID, body, author_id, created_at, public/private flag | Zendesk API |
| **Classification Results** | Sentiment (positive/neutral/negative), topic labels | LLM API response |
| **Configuration** | Zendesk subdomain, email, API token, LLM endpoint, LLM API key, model name | User input |

### Systems Involved

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Browser   │────▶│   Zendesk API   │     │   LLM API   │
│  (User's    │◀────│  (your-domain.  │     │  (your LLM  │
│   device)   │     │  zendesk.com)   │     │   endpoint) │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           ▲
       │                                           │
       └───────────────────────────────────────────┘
              Ticket data sent for classification
```

1. **User's Browser**: Runs the application, stores all data locally
2. **Zendesk API**: Source of ticket and comment data (read-only access)
3. **LLM API**: Receives ticket content for classification (your own endpoint)

### Data Retention

| Storage Location | Data Stored | Retention Period |
|------------------|-------------|------------------|
| Browser localStorage | Tickets, comments, classifications, config, prompts | Until user clears data or browser storage |
| Zendesk | Original tickets (not modified by this app) | Per your Zendesk retention policy |
| LLM API | Depends on your LLM provider | Per your LLM provider's policy |

**Important**: This application does NOT have its own server or database. All data remains in the user's browser localStorage until explicitly cleared via the "Clear Stored Data" button or browser settings.

### Data Storage Keys

| localStorage Key | Contents |
|------------------|----------|
| `zendeskAnalyzer_config` | API credentials, endpoint URLs |
| `zendeskAnalyzer_tickets` | Full ticket data with comments and classifications |
| `zendeskAnalyzer_prompt` | Custom classification prompt |

### PII (Personally Identifiable Information)

The following data fields may contain PII:

| Field | PII Risk | Description |
|-------|----------|-------------|
| `ticket.description` | **High** | Customer-written content, may include names, emails, phone numbers, addresses |
| `ticket.subject` | **High** | May contain customer names or identifying information |
| `comment.body` | **High** | Agent and customer messages, may include any PII |
| `requester_id` | Medium | Zendesk user ID (can be linked to email/name in Zendesk) |
| `author_id` | Medium | Comment author's Zendesk user ID |
| `assignee_id` | Low | Agent's Zendesk user ID |
| `config.zendeskEmail` | Medium | User's own email address |

**Privacy Considerations**:
- Ticket content (subject, description, comments) is sent to your LLM endpoint for classification
- Ensure your LLM endpoint complies with your organization's data handling policies
- Consider using a self-hosted LLM if PII handling is a concern
- The application does not anonymize or redact PII before sending to the LLM

## Project Structure

```
zendesk-tickets-analyzer/
├── index.html          # Main application HTML
├── styles.css          # Application styles
├── app.js              # Application logic
├── README.md           # This file
├── PRD.md              # Product requirements document
└── mock-server/        # Mock Zendesk API server
    ├── server.js       # Express server
    ├── test.js         # Server tests
    ├── package.json    # Dependencies
    └── README.md       # Mock server documentation
```

