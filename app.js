/**
 * Zendesk Ticket Analyzer
 * Main application logic
 */

// Configuration constants
const LLM_RATE_LIMIT = 5; // requests per second
const STORAGE_KEYS = {
  CONFIG: 'zendeskAnalyzer_config',
  TICKETS: 'zendeskAnalyzer_tickets',
  PROMPT: 'zendeskAnalyzer_prompt',
  SUMMARY_PROMPT: 'zendeskAnalyzer_summaryPrompt',
  TOPICS_SUMMARY: 'zendeskAnalyzer_topicsSummary'
};

const DEFAULT_CLASSIFICATION_PROMPT = `Analyze the following support ticket and classify it.

TICKET SUBJECT: {{ticket_subject}}

TICKET DESCRIPTION:
{{ticket_description}}

COMMENTS:
{{ticket_comments}}

Please respond with a JSON object containing:
1. "ticket_types": An array of 1-3 ticket type labels (e.g., "Bug Report", "Feature Request", "Billing", "Technical Support", "Onboarding", "UI/UX", "Performance")
2. "sentiment": One of "positive", "negative", or "neutral" based on the overall customer sentiment
3. "summary": A single sentence summarizing what the customer is asking about or reporting

Respond ONLY with the JSON object, no additional text.

Example response:
{"ticket_types": ["Bug Report", "Performance"], "sentiment": "negative", "summary": "Customer reports slow loading times on the dashboard after recent update."}`;

const DEFAULT_SUMMARY_PROMPT = `Based on the following ticket summaries, identify the 10 most important content topics that customers are discussing. Group related issues together and provide actionable insights.

TICKET SUMMARIES:
{{ticket_summaries}}

Respond with a JSON object containing an array of topics, each with:
1. "topic": A clear, descriptive name for the content topic
2. "description": A 1-2 sentence description of what customers are saying about this topic
3. "ticket_ids": Array of ticket IDs that relate to this topic
4. "priority": "high", "medium", or "low" based on frequency and customer sentiment

Example response:
{"topics": [{"topic": "Dashboard Performance Issues", "description": "Multiple customers reporting slow load times and timeouts on the main dashboard.", "ticket_ids": [1, 5, 12], "priority": "high"}]}`;

// State
let tickets = [];
let config = {};

// DOM Elements
const elements = {
  // Config
  zendeskSubdomain: document.getElementById('zendesk-subdomain'),
  zendeskEmail: document.getElementById('zendesk-email'),
  zendeskToken: document.getElementById('zendesk-token'),
  timespan: document.getElementById('timespan'),
  llmEndpoint: document.getElementById('llm-endpoint'),
  llmApiKey: document.getElementById('llm-api-key'),
  llmModel: document.getElementById('llm-model'),
  saveConfigBtn: document.getElementById('save-config-btn'),
  configStatus: document.getElementById('config-status'),
  
  // Prompts
  classificationPrompt: document.getElementById('classification-prompt'),
  resetPromptBtn: document.getElementById('reset-prompt-btn'),
  summaryPrompt: document.getElementById('summary-prompt'),
  resetSummaryPromptBtn: document.getElementById('reset-summary-prompt-btn'),
  
  // Actions
  fetchTicketsBtn: document.getElementById('fetch-tickets-btn'),
  classifyBtn: document.getElementById('classify-btn'),
  clearDataBtn: document.getElementById('clear-data-btn'),
  actionStatus: document.getElementById('action-status'),
  progressContainer: document.getElementById('progress-container'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  
  // Analytics
  analyticsSection: document.getElementById('analytics-section'),
  classificationChart: document.getElementById('classification-chart'),
  classificationLegend: document.getElementById('classification-legend'),
  ticketTypesList: document.getElementById('ticket-types-list'),
  
  // Topics Summary
  topicsSummarySection: document.getElementById('topics-summary-section'),
  topicsSummaryContent: document.getElementById('topics-summary-content'),
  
  // Tickets
  ticketsSection: document.getElementById('tickets-section'),
  ticketsCount: document.getElementById('tickets-count'),
  searchInput: document.getElementById('search-input'),
  classificationFilter: document.getElementById('classification-filter'),
  ticketTypeFilter: document.getElementById('ticket-type-filter'),
  ticketsList: document.getElementById('tickets-list'),
  
  // Modal
  ticketModal: document.getElementById('ticket-modal'),
  ticketDetail: document.getElementById('ticket-detail'),
  modalClose: document.querySelector('.modal-close')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  loadConfig();
  loadTickets();
  loadPrompt();
  setupEventListeners();
  updateUI();
}

// Event Listeners
function setupEventListeners() {
  // Config
  elements.saveConfigBtn.addEventListener('click', saveConfig);
  
  // Prompts
  elements.resetPromptBtn.addEventListener('click', resetPrompt);
  elements.classificationPrompt.addEventListener('change', savePrompt);
  elements.resetSummaryPromptBtn.addEventListener('click', resetSummaryPrompt);
  elements.summaryPrompt.addEventListener('change', saveSummaryPrompt);
  
  // Actions
  elements.fetchTicketsBtn.addEventListener('click', fetchTickets);
  elements.classifyBtn.addEventListener('click', classifyAllTickets);
  elements.clearDataBtn.addEventListener('click', clearData);
  
  // Filters
  elements.searchInput.addEventListener('input', debounce(renderTicketsList, 300));
  elements.classificationFilter.addEventListener('change', renderTicketsList);
  elements.ticketTypeFilter.addEventListener('change', renderTicketsList);
  
  // Modal
  elements.modalClose.addEventListener('click', closeModal);
  elements.ticketModal.addEventListener('click', (e) => {
    if (e.target === elements.ticketModal) closeModal();
  });
  
  // Collapsible sections
  document.querySelectorAll('.collapsible').forEach(el => {
    el.addEventListener('click', () => {
      el.closest('.card').classList.toggle('collapsed');
    });
  });
}

// Configuration
function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (saved) {
    config = JSON.parse(saved);
    elements.zendeskSubdomain.value = config.zendeskSubdomain || '';
    elements.zendeskEmail.value = config.zendeskEmail || '';
    elements.zendeskToken.value = config.zendeskToken || '';
    elements.timespan.value = config.timespan || '28';
    elements.llmEndpoint.value = config.llmEndpoint || '';
    elements.llmApiKey.value = config.llmApiKey || '';
    elements.llmModel.value = config.llmModel || '';
  }
}

function saveConfig() {
  config = {
    zendeskSubdomain: elements.zendeskSubdomain.value.trim(),
    zendeskEmail: elements.zendeskEmail.value.trim(),
    zendeskToken: elements.zendeskToken.value.trim(),
    timespan: elements.timespan.value,
    llmEndpoint: elements.llmEndpoint.value.trim(),
    llmApiKey: elements.llmApiKey.value.trim(),
    llmModel: elements.llmModel.value.trim()
  };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  showStatus(elements.configStatus, 'Configuration saved!', 'success');
}

// Prompt management
function loadPrompt() {
  const savedClassification = localStorage.getItem(STORAGE_KEYS.PROMPT);
  elements.classificationPrompt.value = savedClassification || DEFAULT_CLASSIFICATION_PROMPT;
  
  const savedSummary = localStorage.getItem(STORAGE_KEYS.SUMMARY_PROMPT);
  elements.summaryPrompt.value = savedSummary || DEFAULT_SUMMARY_PROMPT;
}

function savePrompt() {
  localStorage.setItem(STORAGE_KEYS.PROMPT, elements.classificationPrompt.value);
}

function saveSummaryPrompt() {
  localStorage.setItem(STORAGE_KEYS.SUMMARY_PROMPT, elements.summaryPrompt.value);
}

function resetPrompt() {
  elements.classificationPrompt.value = DEFAULT_CLASSIFICATION_PROMPT;
  savePrompt();
  showStatus(elements.configStatus, 'Classification prompt reset to default', 'success');
}

function resetSummaryPrompt() {
  elements.summaryPrompt.value = DEFAULT_SUMMARY_PROMPT;
  saveSummaryPrompt();
  showStatus(elements.configStatus, 'Summary prompt reset to default', 'success');
}

// Tickets storage
function loadTickets() {
  const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
  if (saved) {
    tickets = JSON.parse(saved);
  }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
}

function clearData() {
  if (confirm('Are you sure you want to clear all stored ticket data?')) {
    tickets = [];
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    updateUI();
    showStatus(elements.actionStatus, 'All data cleared', 'success');
  }
}

// Zendesk API
async function fetchTickets() {
  if (!config.zendeskEmail || !config.zendeskToken) {
    showStatus(elements.actionStatus, 'Please configure Zendesk API credentials first', 'error');
    return;
  }
  
  elements.fetchTicketsBtn.disabled = true;
  showStatus(elements.actionStatus, '<span class="loading"></span>Fetching tickets...', 'info');
  
  try {
    // Calculate date based on configured timespan
    const days = parseInt(config.timespan) || 28;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateFilter = startDate.toISOString().split('T')[0];
    
    // Build API URL
    const baseUrl = getZendeskBaseUrl();
    const ticketsUrl = `${baseUrl}/api/v2/tickets.json?created_after=${dateFilter}`;
    
    // Fetch tickets
    const ticketsResponse = await zendeskFetch(ticketsUrl);
    const ticketsData = await ticketsResponse.json();
    
    if (!ticketsData.tickets) {
      throw new Error('Invalid response from Zendesk API');
    }
    
    showStatus(elements.actionStatus, `<span class="loading"></span>Fetched ${ticketsData.tickets.length} tickets. Loading comments...`, 'info');
    
    // Fetch comments for each ticket
    const ticketsWithComments = [];
    for (let i = 0; i < ticketsData.tickets.length; i++) {
      const ticket = ticketsData.tickets[i];
      const commentsUrl = `${baseUrl}/api/v2/tickets/${ticket.id}/comments.json`;
      
      try {
        const commentsResponse = await zendeskFetch(commentsUrl);
        const commentsData = await commentsResponse.json();
        ticket.comments = commentsData.comments || [];
      } catch (e) {
        console.warn(`Failed to fetch comments for ticket ${ticket.id}:`, e);
        ticket.comments = [];
      }
      
      ticketsWithComments.push(ticket);
      
      // Update progress
      const progress = Math.round(((i + 1) / ticketsData.tickets.length) * 100);
      showStatus(elements.actionStatus, `<span class="loading"></span>Loading comments... ${i + 1}/${ticketsData.tickets.length}`, 'info');
    }
    
    // Replace stored tickets
    tickets = ticketsWithComments;
    saveTickets();
    updateUI();
    
    showStatus(elements.actionStatus, `Successfully fetched ${tickets.length} tickets with comments`, 'success');
  } catch (error) {
    console.error('Fetch error:', error);
    showStatus(elements.actionStatus, `Error: ${error.message}`, 'error');
  } finally {
    elements.fetchTicketsBtn.disabled = false;
  }
}

function getZendeskBaseUrl() {
  const subdomain = config.zendeskSubdomain;
  // Empty or 'localhost' means use current origin (for mock server)
  if (!subdomain || subdomain === 'localhost') {
    return window.location.origin;
  }
  // Check if it looks like a full URL (for mock server)
  if (subdomain.startsWith('http://') || subdomain.startsWith('https://')) {
    return subdomain.replace(/\/$/, '');
  }
  return `https://${subdomain}.zendesk.com`;
}

async function zendeskFetch(url) {
  const credentials = btoa(`${config.zendeskEmail}/token:${config.zendeskToken}`);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Check your credentials.');
    }
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

// LLM Classification
async function classifyAllTickets() {
  if (!config.llmEndpoint || !config.llmApiKey) {
    showStatus(elements.actionStatus, 'Please configure LLM API credentials first', 'error');
    return;
  }
  
  if (tickets.length === 0) {
    showStatus(elements.actionStatus, 'No tickets to classify. Fetch tickets first.', 'error');
    return;
  }
  
  elements.classifyBtn.disabled = true;
  elements.progressContainer.classList.remove('hidden');
  
  const prompt = elements.classificationPrompt.value;
  let classified = 0;
  let errors = 0;
  
  // Rate limiting: process in batches
  const delayBetweenRequests = 1000 / LLM_RATE_LIMIT;
  
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    
    // Update progress
    const progress = Math.round(((i + 1) / tickets.length) * 100);
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `${progress}%`;
    showStatus(elements.actionStatus, `<span class="loading"></span>Classifying ticket ${i + 1}/${tickets.length}...`, 'info');
    
    try {
      const classification = await classifyTicket(ticket, prompt);
      ticket.classification = classification;
      classified++;
      console.log(`Classified ticket ${ticket.id}:`, classification);
    } catch (error) {
      console.error(`Failed to classify ticket ${ticket.id}:`, error.message, error);
      showStatus(elements.actionStatus, `<span class="loading"></span>Error on ticket ${ticket.id}: ${error.message}. Continuing...`, 'error');
      errors++;
    }
    
    // Rate limiting delay
    if (i < tickets.length - 1) {
      await sleep(delayBetweenRequests);
    }
  }
  
  saveTickets();
  updateUI();
  
  // Now run the summary prompt to identify content topics
  if (classified > 0) {
    showStatus(elements.actionStatus, `<span class="loading"></span>Generating content topics summary...`, 'info');
    try {
      await generateTopicsSummary();
      showStatus(elements.actionStatus, `Classified ${classified} tickets and generated topics summary.${errors > 0 ? ` ${errors} failed.` : ''}`, 'success');
    } catch (summaryError) {
      console.error('Failed to generate topics summary:', summaryError);
      showStatus(elements.actionStatus, `Classified ${classified} tickets. Summary generation failed: ${summaryError.message}`, 'info');
    }
  } else if (errors > 0) {
    showStatus(elements.actionStatus, `Classification failed for all ${errors} tickets.`, 'error');
  }
  
  elements.progressContainer.classList.add('hidden');
  elements.classifyBtn.disabled = false;
}

async function classifyTicket(ticket, promptTemplate) {
  // Build prompt with ticket data
  const commentsText = ticket.comments
    .map(c => `[${c.created_at}] ${c.body || c.plain_body || ''}`)
    .join('\n\n');
  
  const prompt = promptTemplate
    .replace('{{ticket_subject}}', ticket.subject || '')
    .replace('{{ticket_description}}', ticket.description || '')
    .replace('{{ticket_comments}}', commentsText || 'No comments');
  
  // Call LLM API
  console.log('Calling LLM API:', config.llmEndpoint);
  const requestBody = {
    model: config.llmModel || undefined,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.3
  };
  
  let response;
  try {
    response = await fetch(config.llmEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.llmApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  } catch (fetchError) {
    console.error('Fetch failed:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('LLM API error response:', response.status, errorText);
    throw new Error(`LLM API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }
  
  const data = await response.json();
  console.log('LLM API response:', data);
  const content = data.choices?.[0]?.message?.content || data.content || '';
  
  // Parse JSON response
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (e) {
    console.warn('Failed to parse LLM response:', content);
    return { ticket_types: ['Unknown'], sentiment: 'neutral', summary: 'Unable to parse response' };
  }
}

// Generate topics summary from all classified tickets
async function generateTopicsSummary() {
  const classifiedTickets = tickets.filter(t => t.classification?.summary);
  
  if (classifiedTickets.length === 0) {
    console.log('No classified tickets with summaries to summarize');
    return;
  }
  
  // Build ticket summaries text
  const ticketSummaries = classifiedTickets.map(t => 
    `[Ticket #${t.id}] ${t.classification.summary} (Sentiment: ${t.classification.sentiment}, Types: ${(t.classification.ticket_types || []).join(', ')})`
  ).join('\n');
  
  const promptTemplate = elements.summaryPrompt.value || DEFAULT_SUMMARY_PROMPT;
  const prompt = promptTemplate.replace('{{ticket_summaries}}', ticketSummaries);
  
  console.log('Generating topics summary...');
  
  const requestBody = {
    model: config.llmModel || undefined,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.3
  };
  
  const response = await fetch(config.llmEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.llmApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.content || '';
  
  // Parse JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const summary = JSON.parse(jsonMatch[0]);
      localStorage.setItem(STORAGE_KEYS.TOPICS_SUMMARY, JSON.stringify(summary));
      renderTopicsSummary(summary);
      return summary;
    }
    throw new Error('No JSON found in response');
  } catch (e) {
    console.warn('Failed to parse topics summary response:', content);
    throw e;
  }
}

// UI Updates
function updateUI() {
  const hasTickets = tickets.length > 0;
  
  // Show/hide sections
  elements.analyticsSection.classList.toggle('hidden', !hasTickets);
  elements.ticketsSection.classList.toggle('hidden', !hasTickets);
  
  // Enable/disable buttons
  elements.classifyBtn.disabled = !hasTickets;
  
  if (hasTickets) {
    renderAnalytics();
    renderTicketsList();
    updateTicketTypeFilter();
    
    // Load and render saved topics summary if exists
    const savedSummary = localStorage.getItem(STORAGE_KEYS.TOPICS_SUMMARY);
    if (savedSummary) {
      try {
        renderTopicsSummary(JSON.parse(savedSummary));
      } catch (e) {
        console.warn('Failed to parse saved topics summary');
      }
    }
  }
}

function renderAnalytics() {
  // Count classifications
  const classifications = { positive: 0, neutral: 0, negative: 0, unclassified: 0 };
  const ticketTypesMap = {};
  
  tickets.forEach(ticket => {
    if (ticket.classification) {
      const classificationValue = ticket.classification.sentiment || 'neutral';
      classifications[classificationValue] = (classifications[classificationValue] || 0) + 1;
      
      // Support both old 'topics' and new 'ticket_types' field
      const types = ticket.classification.ticket_types || ticket.classification.topics || [];
      types.forEach(type => {
        ticketTypesMap[type] = (ticketTypesMap[type] || 0) + 1;
      });
    } else {
      classifications.unclassified++;
    }
  });
  
  // Render classification chart
  const total = tickets.length;
  elements.classificationChart.innerHTML = `
    <div class="chart-segment positive" style="width: ${(classifications.positive / total) * 100}%"></div>
    <div class="chart-segment neutral" style="width: ${(classifications.neutral / total) * 100}%"></div>
    <div class="chart-segment negative" style="width: ${(classifications.negative / total) * 100}%"></div>
    <div class="chart-segment unclassified" style="width: ${(classifications.unclassified / total) * 100}%"></div>
  `;
  
  elements.classificationLegend.innerHTML = `
    <div class="legend-item"><span class="legend-color positive"></span> Positive (${classifications.positive})</div>
    <div class="legend-item"><span class="legend-color neutral"></span> Neutral (${classifications.neutral})</div>
    <div class="legend-item"><span class="legend-color negative"></span> Negative (${classifications.negative})</div>
    ${classifications.unclassified > 0 ? `<div class="legend-item"><span class="legend-color unclassified"></span> Unclassified (${classifications.unclassified})</div>` : ''}
  `;
  
  // Render ticket types list
  const sortedTypes = Object.entries(ticketTypesMap).sort((a, b) => b[1] - a[1]);
  elements.ticketTypesList.innerHTML = sortedTypes.length > 0
    ? sortedTypes.map(([type, count]) => `
        <div class="topic-item" data-type="${escapeHtml(type)}">
          <span class="topic-name">${escapeHtml(type)}</span>
          <span class="topic-count">${count}</span>
        </div>
      `).join('')
    : '<div class="empty-state"><p>No ticket types yet. Classify tickets to see types.</p></div>';
  
  // Add click handlers to ticket types
  elements.ticketTypesList.querySelectorAll('.topic-item').forEach(el => {
    el.addEventListener('click', () => {
      elements.ticketTypeFilter.value = el.dataset.type;
      renderTicketsList();
    });
  });
}

// Render topics summary section
function renderTopicsSummary(summary) {
  if (!summary || !summary.topics || summary.topics.length === 0) {
    elements.topicsSummarySection.classList.add('hidden');
    return;
  }
  
  elements.topicsSummarySection.classList.remove('hidden');
  
  const priorityColors = {
    high: '#dc3545',
    medium: '#ffc107',
    low: '#28a745'
  };
  
  elements.topicsSummaryContent.innerHTML = summary.topics.map((topic, index) => `
    <div class="topic-summary-item">
      <div class="topic-summary-header">
        <span class="topic-summary-rank">#${index + 1}</span>
        <span class="topic-summary-name">${escapeHtml(topic.topic)}</span>
        <span class="topic-summary-priority" style="background-color: ${priorityColors[topic.priority] || '#6c757d'}">${topic.priority || 'unknown'}</span>
      </div>
      <p class="topic-summary-description">${escapeHtml(topic.description)}</p>
      <div class="topic-summary-tickets">
        <strong>Related tickets:</strong> 
        ${(topic.ticket_ids || []).map(id => `<a href="#" class="ticket-link" data-ticket-id="${id}">#${id}</a>`).join(', ')}
      </div>
    </div>
  `).join('');
  
  // Add click handlers to ticket links
  elements.topicsSummaryContent.querySelectorAll('.ticket-link').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const ticketId = parseInt(el.dataset.ticketId);
      showTicketDetail(ticketId);
    });
  });
}

function updateTicketTypeFilter() {
  const ticketTypes = new Set();
  tickets.forEach(ticket => {
    const types = ticket.classification?.ticket_types || ticket.classification?.topics || [];
    types.forEach(type => ticketTypes.add(type));
  });
  
  const currentValue = elements.ticketTypeFilter.value;
  elements.ticketTypeFilter.innerHTML = '<option value="">All Ticket Types</option>' +
    Array.from(ticketTypes).sort().map(type => 
      `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`
    ).join('');
  elements.ticketTypeFilter.value = currentValue;
}

function renderTicketsList() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const classificationFilterValue = elements.classificationFilter.value;
  const ticketTypeFilterValue = elements.ticketTypeFilter.value;
  
  const filtered = tickets.filter(ticket => {
    // Search filter
    if (searchTerm) {
      const searchable = `${ticket.subject} ${ticket.description} ${ticket.classification?.summary || ''}`.toLowerCase();
      if (!searchable.includes(searchTerm)) return false;
    }
    
    // Classification filter
    if (classificationFilterValue) {
      const classificationVal = ticket.classification?.sentiment;
      if (classificationVal !== classificationFilterValue) return false;
    }
    
    // Ticket type filter
    if (ticketTypeFilterValue) {
      const types = ticket.classification?.ticket_types || ticket.classification?.topics || [];
      if (!types.includes(ticketTypeFilterValue)) return false;
    }
    
    return true;
  });
  
  elements.ticketsCount.textContent = filtered.length;
  
  if (filtered.length === 0) {
    elements.ticketsList.innerHTML = '<div class="empty-state"><p>No tickets match your filters.</p></div>';
    return;
  }
  
  elements.ticketsList.innerHTML = filtered.map(ticket => {
    const classificationVal = ticket.classification?.sentiment || '';
    const ticketTypes = ticket.classification?.ticket_types || ticket.classification?.topics || [];
    const summary = ticket.classification?.summary || '';
    
    return `
      <div class="ticket-card ${classificationVal}" data-ticket-id="${ticket.id}">
        <div class="ticket-header">
          <span class="ticket-subject">${escapeHtml(ticket.subject)}</span>
          <span class="ticket-id">#${ticket.id}</span>
        </div>
        <div class="ticket-meta">
          <span>Status: ${ticket.status}</span>
          <span>Created: ${formatDate(ticket.created_at)}</span>
        </div>
        ${summary ? `<div class="ticket-summary">${escapeHtml(summary)}</div>` : `<div class="ticket-description">${escapeHtml(ticket.description)}</div>`}
        <div class="ticket-tags">
          ${classificationVal ? `<span class="ticket-tag classification ${classificationVal}">${classificationVal}</span>` : ''}
          ${ticketTypes.map(t => `<span class="ticket-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  elements.ticketsList.querySelectorAll('.ticket-card').forEach(el => {
    el.addEventListener('click', () => {
      const ticketId = parseInt(el.dataset.ticketId);
      showTicketDetail(ticketId);
    });
  });
}

function showTicketDetail(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  
  const classificationVal = ticket.classification?.sentiment || 'unclassified';
  const ticketTypes = ticket.classification?.ticket_types || ticket.classification?.topics || [];
  const summary = ticket.classification?.summary || '';
  
  elements.ticketDetail.innerHTML = `
    <h2>${escapeHtml(ticket.subject)}</h2>
    
    <div class="detail-section">
      <h3>Ticket Info</h3>
      <div class="ticket-meta">
        <span>ID: #${ticket.id}</span>
        <span>Status: ${ticket.status}</span>
        <span>Priority: ${ticket.priority || 'N/A'}</span>
        <span>Created: ${formatDate(ticket.created_at)}</span>
      </div>
    </div>
    
    ${ticket.classification ? `
      <div class="detail-section">
        <h3>Analysis</h3>
        ${summary ? `<p class="ticket-summary-detail"><strong>Summary:</strong> ${escapeHtml(summary)}</p>` : ''}
        <div class="classification-result">
          <div class="classification-item">
            <strong>Sentiment</strong>
            <span class="ticket-tag classification ${classificationVal}">${classificationVal}</span>
          </div>
          <div class="classification-item">
            <strong>Ticket Types</strong>
            ${ticketTypes.map(t => `<span class="ticket-tag">${escapeHtml(t)}</span>`).join(' ')}
          </div>
        </div>
      </div>
    ` : ''}
    
    <div class="detail-section">
      <h3>Description</h3>
      <div class="detail-content">${escapeHtml(ticket.description)}</div>
    </div>
    
    <div class="detail-section">
      <h3>Comments (${ticket.comments?.length || 0})</h3>
      ${(ticket.comments || []).map(comment => `
        <div class="comment">
          <div class="comment-meta">
            Author ID: ${comment.author_id} | ${formatDate(comment.created_at)}
          </div>
          <div class="comment-body">${escapeHtml(comment.body || comment.plain_body || '')}</div>
        </div>
      `).join('')}
    </div>
  `;
  
  elements.ticketModal.classList.remove('hidden');
}

function closeModal() {
  elements.ticketModal.classList.add('hidden');
}

// Utility functions
function showStatus(element, message, type) {
  element.innerHTML = message;
  element.className = `status-message ${type}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
