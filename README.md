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
- **Sentiment**: positive, negative, or neutral
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

## License

MIT
