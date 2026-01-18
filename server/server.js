const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const SUBDOMAIN = 'mockcompany'; // Mock subdomain for URL generation

app.use(cors());
app.use(express.json());

// Serve the main application from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Authentication middleware - supports both Zendesk auth methods:
// 1. API Token: Basic auth with {email}/token:{api_token}
// 2. OAuth: Bearer {access_token}
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Zendesk API"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Accept Bearer token (OAuth)
  if (authHeader.startsWith('Bearer ')) {
    // Mock accepts any bearer token
    return next();
  }
  
  // Accept Basic auth with API token format: {email}/token:{api_token}
  if (authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    // Zendesk format: email/token:api_token or just email:password
    // Mock accepts both formats
    if (credentials.includes('/token:') || credentials.includes(':')) {
      return next();
    }
  }
  
  res.setHeader('WWW-Authenticate', 'Basic realm="Zendesk API"');
  return res.status(401).json({ error: 'Invalid authentication' });
}

// Helper to generate full ticket URL
function ticketUrl(id) {
  return `https://${SUBDOMAIN}.zendesk.com/api/v2/tickets/${id}.json`;
}

// Mock ticket data - Jobboard with new B2B admin system / ATS launch
// Full Zendesk ticket format per API docs
const tickets = [
  // Negative - ATS bugs
  {
    id: 1,
    url: ticketUrl(1),
    subject: "ATS candidate pipeline not saving changes",
    raw_subject: "ATS candidate pipeline not saving changes",
    description: "Every time I try to move a candidate from 'Screening' to 'Interview' stage, the page refreshes and the candidate is back in the original stage. This is happening for all our job postings. We have 50+ candidates stuck and can't process them. This is critical for our hiring workflow.",
    created_at: "2026-01-15T09:23:00Z",
    updated_at: "2026-01-15T14:30:00Z",
    status: "open",
    priority: "high",
    type: "problem",
    requester_id: 101,
    submitter_id: 101,
    assignee_id: 201,
    organization_id: 301,
    group_id: 401,
    tags: ["ats", "bug", "pipeline"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 2,
    url: ticketUrl(2),
    subject: "Bulk email to candidates fails with error 500",
    raw_subject: "Bulk email to candidates fails with error 500",
    description: "When I select multiple candidates and try to send a bulk rejection email, I get a server error. The old system handled this perfectly. Now I have to email each candidate individually which is taking hours. Please fix ASAP.",
    created_at: "2026-01-14T11:45:00Z",
    updated_at: "2026-01-14T16:20:00Z",
    status: "open",
    priority: "high",
    type: "problem",
    requester_id: 102,
    submitter_id: 102,
    assignee_id: 202,
    organization_id: 302,
    group_id: 401,
    tags: ["email", "bug", "bulk-actions"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 3,
    url: ticketUrl(3),
    subject: "Resume parsing completely broken",
    raw_subject: "Resume parsing completely broken",
    description: "The new ATS resume parser is extracting wrong information. It's putting email addresses in the phone field and work experience dates are all wrong. We relied heavily on this feature and now our recruiters are spending double the time manually correcting entries.",
    created_at: "2026-01-13T08:15:00Z",
    updated_at: "2026-01-13T12:00:00Z",
    status: "pending",
    priority: "high",
    type: "problem",
    requester_id: 103,
    submitter_id: 103,
    assignee_id: 203,
    organization_id: 303,
    group_id: 401,
    tags: ["ats", "bug", "resume-parser"],
    via: { channel: "email" },
    is_public: true,
    has_incidents: false
  },
  // Negative - UI complaints
  {
    id: 4,
    url: ticketUrl(4),
    subject: "New dashboard is confusing and slow",
    raw_subject: "New dashboard is confusing and slow",
    description: "The new admin dashboard takes forever to load and I can't find anything anymore. Where did the quick actions menu go? The old interface was much more intuitive. My team is frustrated and productivity has dropped significantly since the update.",
    created_at: "2026-01-12T14:30:00Z",
    updated_at: "2026-01-12T15:45:00Z",
    status: "open",
    priority: "normal",
    type: "problem",
    requester_id: 104,
    submitter_id: 104,
    assignee_id: 201,
    organization_id: 304,
    group_id: 401,
    tags: ["ui", "performance", "dashboard"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 5,
    url: ticketUrl(5),
    subject: "Mobile view of admin panel is unusable",
    raw_subject: "Mobile view of admin panel is unusable",
    description: "I often review candidates on my phone during commute. The new admin panel doesn't work on mobile at all - buttons are overlapping, text is cut off, and I can't scroll through candidate lists. The previous version worked fine on mobile.",
    created_at: "2026-01-11T07:20:00Z",
    updated_at: "2026-01-11T09:00:00Z",
    status: "open",
    priority: "normal",
    type: "problem",
    requester_id: 105,
    submitter_id: 105,
    assignee_id: 202,
    organization_id: 305,
    group_id: 401,
    tags: ["ui", "mobile", "responsive"],
    via: { channel: "email" },
    is_public: true,
    has_incidents: false
  },
  // Neutral - Feature requests
  {
    id: 6,
    url: ticketUrl(6),
    subject: "Request: Integration with LinkedIn Recruiter",
    raw_subject: "Request: Integration with LinkedIn Recruiter",
    description: "Now that you have the new ATS system, it would be great to have direct integration with LinkedIn Recruiter. We'd like to import candidate profiles directly and sync messaging. Is this on the roadmap?",
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-01-10T11:30:00Z",
    status: "pending",
    priority: "normal",
    type: "question",
    requester_id: 106,
    submitter_id: 106,
    assignee_id: 203,
    organization_id: 306,
    group_id: 401,
    tags: ["feature-request", "integration", "linkedin"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 7,
    url: ticketUrl(7),
    subject: "Can we get custom pipeline stages?",
    raw_subject: "Can we get custom pipeline stages?",
    description: "The default pipeline stages (Applied, Screening, Interview, Offer, Hired) don't match our process. We have a technical assessment stage and a culture fit interview. Would be helpful to customize these stages per job posting.",
    created_at: "2026-01-09T13:45:00Z",
    updated_at: "2026-01-09T14:00:00Z",
    status: "pending",
    priority: "normal",
    type: "question",
    requester_id: 107,
    submitter_id: 107,
    assignee_id: 201,
    organization_id: 307,
    group_id: 401,
    tags: ["feature-request", "pipeline", "customization"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  // Neutral - Onboarding questions
  {
    id: 8,
    url: ticketUrl(8),
    subject: "How to migrate existing candidates to new system?",
    raw_subject: "How to migrate existing candidates to new system?",
    description: "We have about 2000 candidates in spreadsheets from before we started using your platform. Is there a way to bulk import them into the new ATS? Looking for CSV import or API documentation.",
    created_at: "2026-01-08T09:30:00Z",
    updated_at: "2026-01-08T10:15:00Z",
    status: "solved",
    priority: "normal",
    type: "question",
    requester_id: 108,
    submitter_id: 108,
    assignee_id: 202,
    organization_id: 308,
    group_id: 401,
    tags: ["onboarding", "migration", "import"],
    via: { channel: "email" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 9,
    url: ticketUrl(9),
    subject: "Training resources for new admin panel?",
    raw_subject: "Training resources for new admin panel?",
    description: "Our HR team of 5 people needs to learn the new system. Are there video tutorials or documentation available? We'd also be interested in a live training session if you offer that.",
    created_at: "2026-01-07T15:00:00Z",
    updated_at: "2026-01-07T16:30:00Z",
    status: "solved",
    priority: "low",
    type: "question",
    requester_id: 109,
    submitter_id: 109,
    assignee_id: 203,
    organization_id: 309,
    group_id: 401,
    tags: ["onboarding", "training", "documentation"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  // Positive feedback
  {
    id: 10,
    url: ticketUrl(10),
    subject: "Love the new analytics dashboard!",
    raw_subject: "Love the new analytics dashboard!",
    description: "Just wanted to say the new analytics section is fantastic! Being able to see time-to-hire metrics and source effectiveness in real-time has been a game changer for our recruiting strategy. The visualizations are beautiful and the export to PDF feature is exactly what we needed for board reports.",
    created_at: "2026-01-06T11:20:00Z",
    updated_at: "2026-01-06T11:20:00Z",
    status: "solved",
    priority: "low",
    type: "question",
    requester_id: 110,
    submitter_id: 110,
    assignee_id: 201,
    organization_id: 310,
    group_id: 401,
    tags: ["feedback", "positive", "analytics"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 11,
    url: ticketUrl(11),
    subject: "Great job on the collaborative hiring features",
    raw_subject: "Great job on the collaborative hiring features",
    description: "The new team collaboration features are excellent. Being able to @mention colleagues on candidate profiles and see everyone's feedback in one place has streamlined our hiring committee process. Interview scheduling with calendar sync also works perfectly. Thank you!",
    created_at: "2026-01-05T14:10:00Z",
    updated_at: "2026-01-05T14:10:00Z",
    status: "solved",
    priority: "low",
    type: "question",
    requester_id: 111,
    submitter_id: 111,
    assignee_id: 202,
    organization_id: 311,
    group_id: 401,
    tags: ["feedback", "positive", "collaboration"],
    via: { channel: "email" },
    is_public: true,
    has_incidents: false
  },
  {
    id: 12,
    url: ticketUrl(12),
    subject: "Impressed with the new candidate communication tools",
    raw_subject: "Impressed with the new candidate communication tools",
    description: "The automated email sequences and the new candidate portal are working great for us. Candidates can now check their application status themselves which has reduced our inbound inquiries by 40%. The email templates are professional and easy to customize. Well done on this release!",
    created_at: "2026-01-04T16:45:00Z",
    updated_at: "2026-01-04T17:00:00Z",
    status: "solved",
    priority: "low",
    type: "question",
    requester_id: 112,
    submitter_id: 112,
    assignee_id: 203,
    organization_id: 312,
    group_id: 401,
    tags: ["feedback", "positive", "communication"],
    via: { channel: "web" },
    is_public: true,
    has_incidents: false
  }
];

// Mock comments for each ticket - Full Zendesk comment format per API docs
const commentsByTicket = {
  1: [
    { id: 1001, type: "Comment", body: "Thank you for reporting this. We're investigating the pipeline save issue. Can you tell us which browser you're using?", html_body: "<p>Thank you for reporting this. We're investigating the pipeline save issue. Can you tell us which browser you're using?</p>", plain_body: "Thank you for reporting this. We're investigating the pipeline save issue. Can you tell us which browser you're using?", author_id: 201, created_at: "2026-01-15T10:00:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 1002, type: "Comment", body: "I'm using Chrome 120 on Windows 11. Same issue on Firefox too.", html_body: "<p>I'm using Chrome 120 on Windows 11. Same issue on Firefox too.</p>", plain_body: "I'm using Chrome 120 on Windows 11. Same issue on Firefox too.", author_id: 101, created_at: "2026-01-15T10:30:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 1003, type: "Comment", body: "We've identified the issue - it's related to a caching problem. A fix is being deployed today.", html_body: "<p>We've identified the issue - it's related to a caching problem. A fix is being deployed today.</p>", plain_body: "We've identified the issue - it's related to a caching problem. A fix is being deployed today.", author_id: 201, created_at: "2026-01-15T14:30:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  2: [
    { id: 2001, type: "Comment", body: "We apologize for the inconvenience. Our engineering team is looking into the bulk email error. As a workaround, could you try selecting fewer candidates at a time?", html_body: "<p>We apologize for the inconvenience. Our engineering team is looking into the bulk email error. As a workaround, could you try selecting fewer candidates at a time?</p>", plain_body: "We apologize for the inconvenience. Our engineering team is looking into the bulk email error. As a workaround, could you try selecting fewer candidates at a time?", author_id: 202, created_at: "2026-01-14T12:30:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 2002, type: "Comment", body: "I tried with just 5 candidates and still get the error. This is really impacting our ability to communicate with applicants.", html_body: "<p>I tried with just 5 candidates and still get the error. This is really impacting our ability to communicate with applicants.</p>", plain_body: "I tried with just 5 candidates and still get the error. This is really impacting our ability to communicate with applicants.", author_id: 102, created_at: "2026-01-14T13:00:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  3: [
    { id: 3001, type: "Comment", body: "We're sorry to hear about the resume parsing issues. Could you share a few example resumes (with personal info redacted) so we can reproduce the problem?", html_body: "<p>We're sorry to hear about the resume parsing issues. Could you share a few example resumes (with personal info redacted) so we can reproduce the problem?</p>", plain_body: "We're sorry to hear about the resume parsing issues. Could you share a few example resumes (with personal info redacted) so we can reproduce the problem?", author_id: 203, created_at: "2026-01-13T09:00:00Z", public: true, attachments: [], via: { channel: "email" } },
    { id: 3002, type: "Comment", body: "Attached 3 sample resumes. The dates and contact info are all mixed up after parsing.", html_body: "<p>Attached 3 sample resumes. The dates and contact info are all mixed up after parsing.</p>", plain_body: "Attached 3 sample resumes. The dates and contact info are all mixed up after parsing.", author_id: 103, created_at: "2026-01-13T09:45:00Z", public: true, attachments: [], via: { channel: "email" } },
    { id: 3003, type: "Comment", body: "Thank you. We've reproduced the issue and it's now prioritized for the next patch release.", html_body: "<p>Thank you. We've reproduced the issue and it's now prioritized for the next patch release.</p>", plain_body: "Thank you. We've reproduced the issue and it's now prioritized for the next patch release.", author_id: 203, created_at: "2026-01-13T12:00:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  4: [
    { id: 4001, type: "Comment", body: "We appreciate your feedback about the dashboard. The quick actions menu has been moved to the top-right corner. We're also working on performance improvements. Would a quick walkthrough call help?", html_body: "<p>We appreciate your feedback about the dashboard. The quick actions menu has been moved to the top-right corner. We're also working on performance improvements. Would a quick walkthrough call help?</p>", plain_body: "We appreciate your feedback about the dashboard. The quick actions menu has been moved to the top-right corner. We're also working on performance improvements. Would a quick walkthrough call help?", author_id: 201, created_at: "2026-01-12T15:00:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 4002, type: "Comment", body: "A walkthrough would help, yes. But please also consider the loading time - it takes 8-10 seconds to load now vs 2 seconds before.", html_body: "<p>A walkthrough would help, yes. But please also consider the loading time - it takes 8-10 seconds to load now vs 2 seconds before.</p>", plain_body: "A walkthrough would help, yes. But please also consider the loading time - it takes 8-10 seconds to load now vs 2 seconds before.", author_id: 104, created_at: "2026-01-12T15:45:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  5: [
    { id: 5001, type: "Comment", body: "Thank you for the mobile feedback. Mobile optimization is on our roadmap for Q1. In the meantime, we recommend using the desktop version for the best experience.", html_body: "<p>Thank you for the mobile feedback. Mobile optimization is on our roadmap for Q1. In the meantime, we recommend using the desktop version for the best experience.</p>", plain_body: "Thank you for the mobile feedback. Mobile optimization is on our roadmap for Q1. In the meantime, we recommend using the desktop version for the best experience.", author_id: 202, created_at: "2026-01-11T08:00:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 5002, type: "Comment", body: "Q1 is too long to wait. Mobile access was a key reason we chose your platform. Please prioritize this.", html_body: "<p>Q1 is too long to wait. Mobile access was a key reason we chose your platform. Please prioritize this.</p>", plain_body: "Q1 is too long to wait. Mobile access was a key reason we chose your platform. Please prioritize this.", author_id: 105, created_at: "2026-01-11T09:00:00Z", public: true, attachments: [], via: { channel: "email" } }
  ],
  6: [
    { id: 6001, type: "Comment", body: "Great suggestion! LinkedIn Recruiter integration is something we're actively exploring. I'll add your vote to the feature request. Any specific workflows you'd want to see?", html_body: "<p>Great suggestion! LinkedIn Recruiter integration is something we're actively exploring. I'll add your vote to the feature request. Any specific workflows you'd want to see?</p>", plain_body: "Great suggestion! LinkedIn Recruiter integration is something we're actively exploring. I'll add your vote to the feature request. Any specific workflows you'd want to see?", author_id: 203, created_at: "2026-01-10T10:45:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 6002, type: "Comment", body: "Mainly importing candidate profiles and syncing InMail conversations to the candidate timeline.", html_body: "<p>Mainly importing candidate profiles and syncing InMail conversations to the candidate timeline.</p>", plain_body: "Mainly importing candidate profiles and syncing InMail conversations to the candidate timeline.", author_id: 106, created_at: "2026-01-10T11:30:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  7: [
    { id: 7001, type: "Comment", body: "Custom pipeline stages is a popular request. We're planning to release this feature in version 2.1. I'll notify you when it's available.", html_body: "<p>Custom pipeline stages is a popular request. We're planning to release this feature in version 2.1. I'll notify you when it's available.</p>", plain_body: "Custom pipeline stages is a popular request. We're planning to release this feature in version 2.1. I'll notify you when it's available.", author_id: 201, created_at: "2026-01-09T14:00:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  8: [
    { id: 8001, type: "Comment", body: "Yes! We have a CSV import feature. Go to Settings > Data Import > Candidates. Here's our documentation: docs.example.com/import. The API is also available for larger migrations.", html_body: "<p>Yes! We have a CSV import feature. Go to Settings > Data Import > Candidates. Here's our documentation: docs.example.com/import. The API is also available for larger migrations.</p>", plain_body: "Yes! We have a CSV import feature. Go to Settings > Data Import > Candidates. Here's our documentation: docs.example.com/import. The API is also available for larger migrations.", author_id: 202, created_at: "2026-01-08T09:45:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 8002, type: "Comment", body: "Perfect, found it. The CSV template is very helpful. Thanks!", html_body: "<p>Perfect, found it. The CSV template is very helpful. Thanks!</p>", plain_body: "Perfect, found it. The CSV template is very helpful. Thanks!", author_id: 108, created_at: "2026-01-08T10:15:00Z", public: true, attachments: [], via: { channel: "email" } }
  ],
  9: [
    { id: 9001, type: "Comment", body: "We have a full video tutorial series at learn.example.com and we'd be happy to schedule a live training session. I'll have our customer success team reach out to set up a time.", html_body: "<p>We have a full video tutorial series at learn.example.com and we'd be happy to schedule a live training session. I'll have our customer success team reach out to set up a time.</p>", plain_body: "We have a full video tutorial series at learn.example.com and we'd be happy to schedule a live training session. I'll have our customer success team reach out to set up a time.", author_id: 203, created_at: "2026-01-07T15:30:00Z", public: true, attachments: [], via: { channel: "web" } },
    { id: 9002, type: "Comment", body: "That would be great. Looking forward to the training.", html_body: "<p>That would be great. Looking forward to the training.</p>", plain_body: "That would be great. Looking forward to the training.", author_id: 109, created_at: "2026-01-07T16:30:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  10: [
    { id: 10001, type: "Comment", body: "Thank you so much for the kind words! We're thrilled the analytics dashboard is helping your team. If you have any suggestions for additional metrics, we'd love to hear them!", html_body: "<p>Thank you so much for the kind words! We're thrilled the analytics dashboard is helping your team. If you have any suggestions for additional metrics, we'd love to hear them!</p>", plain_body: "Thank you so much for the kind words! We're thrilled the analytics dashboard is helping your team. If you have any suggestions for additional metrics, we'd love to hear them!", author_id: 201, created_at: "2026-01-06T11:45:00Z", public: true, attachments: [], via: { channel: "web" } }
  ],
  11: [
    { id: 11001, type: "Comment", body: "We really appreciate you taking the time to share this feedback! The collaboration features were a major focus for this release. Enjoy!", html_body: "<p>We really appreciate you taking the time to share this feedback! The collaboration features were a major focus for this release. Enjoy!</p>", plain_body: "We really appreciate you taking the time to share this feedback! The collaboration features were a major focus for this release. Enjoy!", author_id: 202, created_at: "2026-01-05T14:30:00Z", public: true, attachments: [], via: { channel: "email" } }
  ],
  12: [
    { id: 12001, type: "Comment", body: "Wow, 40% reduction in inquiries is fantastic! Thank you for sharing these results. We'd love to feature your success story in our newsletter if you're interested.", html_body: "<p>Wow, 40% reduction in inquiries is fantastic! Thank you for sharing these results. We'd love to feature your success story in our newsletter if you're interested.</p>", plain_body: "Wow, 40% reduction in inquiries is fantastic! Thank you for sharing these results. We'd love to feature your success story in our newsletter if you're interested.", author_id: 203, created_at: "2026-01-04T17:00:00Z", public: true, attachments: [], via: { channel: "web" } }
  ]
};

// GET /api/v2/tickets or /api/v2/tickets.json
// Note: Real Zendesk uses Search API for date filtering, but we support created_after for convenience
app.get(['/api/v2/tickets', '/api/v2/tickets.json'], authenticate, (req, res) => {
  let filteredTickets = [...tickets];
  
  // Filter by created_after if provided (convenience for mock - real Zendesk uses Search API)
  const createdAfter = req.query.created_after;
  if (createdAfter) {
    const afterDate = new Date(createdAfter);
    filteredTickets = filteredTickets.filter(t => new Date(t.created_at) >= afterDate);
  }
  
  // Pagination info (mock - always returns all in one page)
  res.json({ 
    tickets: filteredTickets,
    next_page: null,
    previous_page: null,
    count: filteredTickets.length
  });
});

// GET /api/v2/tickets/:id or /api/v2/tickets/:id.json
app.get(['/api/v2/tickets/:id', '/api/v2/tickets/:id.json'], authenticate, (req, res) => {
  const ticketId = parseInt(req.params.id);
  const ticket = tickets.find(t => t.id === ticketId);
  
  if (!ticket) {
    return res.status(404).json({ error: 'RecordNotFound', description: 'Not found' });
  }
  
  res.json({ ticket });
});

// GET /api/v2/tickets/:id/comments or /api/v2/tickets/:id/comments.json
app.get(['/api/v2/tickets/:id/comments', '/api/v2/tickets/:id/comments.json'], authenticate, (req, res) => {
  const ticketId = parseInt(req.params.id);
  const comments = commentsByTicket[ticketId] || [];
  
  // Pagination info (mock - always returns all in one page)
  res.json({ 
    comments,
    next_page: null,
    previous_page: null,
    count: comments.length
  });
});

// Search API - GET /api/v2/search.json (simplified mock)
// Real Zendesk: query=type:ticket created>2026-01-01
app.get(['/api/v2/search', '/api/v2/search.json'], authenticate, (req, res) => {
  const query = req.query.query || '';
  let results = [...tickets];
  
  // Very simplified query parsing - just support type:ticket and created>
  if (query.includes('type:ticket')) {
    // Already filtering tickets only
    const createdMatch = query.match(/created>([\d-]+)/);
    if (createdMatch) {
      const afterDate = new Date(createdMatch[1]);
      results = results.filter(t => new Date(t.created_at) >= afterDate);
    }
  }
  
  res.json({
    results,
    next_page: null,
    previous_page: null,
    count: results.length
  });
});

app.listen(PORT, () => {
  console.log(`Zendesk Mock Server running on http://localhost:${PORT}`);
  console.log(`\n→ Open http://localhost:${PORT} in your browser to use the app`);
  console.log(`\nAPI endpoints:`);
  console.log(`  GET /api/v2/tickets[.json]`);
  console.log(`  GET /api/v2/tickets/:id[.json]`);
  console.log(`  GET /api/v2/tickets/:id/comments[.json]`);
  console.log(`  GET /api/v2/search[.json]`);
  console.log(`\nAuthentication methods:`);
  console.log(`  - API Token: Basic auth with {email}/token:{api_token}`);
  console.log(`  - OAuth: Bearer {access_token}`);
});
