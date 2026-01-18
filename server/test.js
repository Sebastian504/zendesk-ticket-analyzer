/**
 * Test suite for Zendesk Mock Server
 * Run with: node test.js
 * Requires the mock server to be running on http://localhost:3001
 */

const BASE_URL = 'http://localhost:3001';

// Test results tracking
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ ${testName}`);
    passed++;
  } else {
    console.log(`✗ ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== Zendesk Mock Server Tests ===\n');

  // Test 1: No auth returns 401
  console.log('--- Authentication Tests ---');
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets.json`);
    assert(res.status === 401, 'No auth header returns 401');
  } catch (e) {
    assert(false, `No auth header returns 401 (Error: ${e.message})`);
  }

  // Test 2: API Token auth works
  try {
    const credentials = Buffer.from('user@example.com/token:abc123').toString('base64');
    const res = await fetch(`${BASE_URL}/api/v2/tickets.json`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    assert(res.status === 200, 'API Token auth (Basic) returns 200');
  } catch (e) {
    assert(false, `API Token auth (Basic) returns 200 (Error: ${e.message})`);
  }

  // Test 3: Bearer token auth works
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets.json`, {
      headers: { 'Authorization': 'Bearer some_oauth_token' }
    });
    assert(res.status === 200, 'OAuth Bearer token returns 200');
  } catch (e) {
    assert(false, `OAuth Bearer token returns 200 (Error: ${e.message})`);
  }

  // Helper for authenticated requests
  const authHeaders = {
    'Authorization': `Basic ${Buffer.from('user@example.com/token:abc123').toString('base64')}`
  };

  // Test 4: GET /api/v2/tickets returns tickets array
  console.log('\n--- Tickets Endpoint Tests ---');
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets.json`, { headers: authHeaders });
    const data = await res.json();
    assert(Array.isArray(data.tickets), 'GET /api/v2/tickets.json returns tickets array');
    assert(data.tickets.length === 12, 'Returns 12 tickets');
    assert(data.count === 12, 'Response includes count field');
    assert(data.next_page === null, 'Response includes next_page field');
  } catch (e) {
    assert(false, `GET /api/v2/tickets.json (Error: ${e.message})`);
  }

  // Test 5: Endpoint works without .json extension
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets`, { headers: authHeaders });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.tickets), 'GET /api/v2/tickets (no .json) works');
  } catch (e) {
    assert(false, `GET /api/v2/tickets (no .json) works (Error: ${e.message})`);
  }

  // Test 6: Ticket has required Zendesk fields
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets.json`, { headers: authHeaders });
    const data = await res.json();
    const ticket = data.tickets[0];
    const requiredFields = ['id', 'url', 'subject', 'description', 'created_at', 'updated_at', 
                           'status', 'priority', 'type', 'requester_id', 'assignee_id', 
                           'organization_id', 'group_id', 'tags', 'via'];
    const hasAllFields = requiredFields.every(f => ticket.hasOwnProperty(f));
    assert(hasAllFields, 'Ticket has all required Zendesk fields');
  } catch (e) {
    assert(false, `Ticket has all required Zendesk fields (Error: ${e.message})`);
  }

  // Test 7: GET /api/v2/tickets/:id returns single ticket
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets/1.json`, { headers: authHeaders });
    const data = await res.json();
    assert(data.ticket && data.ticket.id === 1, 'GET /api/v2/tickets/1.json returns ticket with id 1');
  } catch (e) {
    assert(false, `GET /api/v2/tickets/1.json (Error: ${e.message})`);
  }

  // Test 8: GET /api/v2/tickets/:id returns 404 for non-existent ticket
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets/999.json`, { headers: authHeaders });
    assert(res.status === 404, 'GET /api/v2/tickets/999.json returns 404');
  } catch (e) {
    assert(false, `GET /api/v2/tickets/999.json returns 404 (Error: ${e.message})`);
  }

  // Test 9: created_after filter works
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets.json?created_after=2026-01-10`, { headers: authHeaders });
    const data = await res.json();
    const allAfterDate = data.tickets.every(t => new Date(t.created_at) >= new Date('2026-01-10'));
    assert(allAfterDate && data.tickets.length < 12, 'created_after filter works correctly');
  } catch (e) {
    assert(false, `created_after filter works correctly (Error: ${e.message})`);
  }

  // Test 10: GET /api/v2/tickets/:id/comments returns comments
  console.log('\n--- Comments Endpoint Tests ---');
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets/1/comments.json`, { headers: authHeaders });
    const data = await res.json();
    assert(Array.isArray(data.comments), 'GET /api/v2/tickets/1/comments.json returns comments array');
    assert(data.comments.length === 3, 'Ticket 1 has 3 comments');
    assert(data.count === 3, 'Response includes count field');
  } catch (e) {
    assert(false, `GET /api/v2/tickets/1/comments.json (Error: ${e.message})`);
  }

  // Test 11: Comment has required Zendesk fields
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets/1/comments.json`, { headers: authHeaders });
    const data = await res.json();
    const comment = data.comments[0];
    const requiredFields = ['id', 'type', 'body', 'html_body', 'plain_body', 'author_id', 
                           'created_at', 'public', 'attachments', 'via'];
    const hasAllFields = requiredFields.every(f => comment.hasOwnProperty(f));
    assert(hasAllFields, 'Comment has all required Zendesk fields');
  } catch (e) {
    assert(false, `Comment has all required Zendesk fields (Error: ${e.message})`);
  }

  // Test 12: Comments for non-existent ticket returns empty array
  try {
    const res = await fetch(`${BASE_URL}/api/v2/tickets/999/comments.json`, { headers: authHeaders });
    const data = await res.json();
    assert(Array.isArray(data.comments) && data.comments.length === 0, 'Non-existent ticket returns empty comments array');
  } catch (e) {
    assert(false, `Non-existent ticket returns empty comments array (Error: ${e.message})`);
  }

  // Test 13: Search API works
  console.log('\n--- Search Endpoint Tests ---');
  try {
    const res = await fetch(`${BASE_URL}/api/v2/search.json?query=type:ticket`, { headers: authHeaders });
    const data = await res.json();
    assert(Array.isArray(data.results), 'GET /api/v2/search.json returns results array');
    assert(data.results.length === 12, 'Search returns all 12 tickets');
  } catch (e) {
    assert(false, `GET /api/v2/search.json (Error: ${e.message})`);
  }

  // Test 14: Search with date filter
  try {
    const res = await fetch(`${BASE_URL}/api/v2/search.json?query=type:ticket%20created%3E2026-01-10`, { headers: authHeaders });
    const data = await res.json();
    assert(data.results.length < 12, 'Search with created> filter returns fewer results');
  } catch (e) {
    assert(false, `Search with created> filter (Error: ${e.message})`);
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
