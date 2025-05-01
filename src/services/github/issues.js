import { ENDPOINTS, DEFAULT_OWNER, DEFAULT_REPO } from './config.js';
import createLogger from '../../utils/logger.js';

const log = createLogger('githubIssues');

/**
 * Request tracking helper
 * @private
 */
function logApiRequest(url) {
  const id = Date.now();
  log.debug('API Request', { id, url });
  return { id, url };
}

/**
 * Fetch issues from a repository
  * @returns {Promise<Array>} List of issues
 */
export async function fetchIssues(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, options = {}) {
  const { state = 'open', page = 1, perPage = 30 } = options;
  log.info('Fetching issues', { owner, repo, state, page });
  
  try {
    const url = new URL(ENDPOINTS.listIssues(owner, repo));
    url.searchParams.append('state', state);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    
    const requestId = logApiRequest(url.toString());
    const response = await fetch(url);
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const issues = await response.json();
    requestId.response = { count: issues.length };
    
    log.info(`Retrieved ${issues.length} issues`, { owner, repo, page });
    return issues;
  } catch (error) {
    log.error('Error fetching issues', { owner, repo, error: error.message });
    throw error;
  }
}

/**
 * Fetch a specific issue with its details
 * * @returns {Promise<Object>} Issue details
 */
export async function fetchIssueDetails(owner, repo, issueNumber) {
  log.info('Fetching issue details', { owner, repo, issueNumber });
  
  try {
    const url = ENDPOINTS.getIssue(owner, repo, issueNumber);
    const requestId = logApiRequest(url);
    const response = await fetch(url);
    
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const issueData = await response.json();
    requestId.response = { id: issueData.id };
    
    log.info('Issue details fetched', { id: issueData.id });
    return issueData;
  } catch (error) {
    log.error('Error fetching issue details', { error: error.message });
    throw error;
  }
}

/**
 * Create a new issue in the repository
 * @returns {Promise<Object>} Created issue
 */
export async function createIssue(owner, repo, { title, body, labels = [] }) {
  log.info('Creating new issue', { owner, repo, title });
  
  try {
    const url = ENDPOINTS.createIssue(owner, repo);
    const requestId = logApiRequest(url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        labels
      })
    });
    
    requestId.status = response.status;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create issue: ${errorData.message || response.statusText}`);
    }
    
    const issue = await response.json();
    requestId.response = { id: issue.id, number: issue.number };
    
    log.info('Issue created successfully', { number: issue.number });
    return issue;
  } catch (error) {
    log.error('Error creating issue', { error: error.message });
    throw error;
  }
}

/**
 * Update an existing issue
 * @returns {Promise<Object>} Updated issue
 */
export async function updateIssue(owner, repo, issueNumber, updateData) {
  log.info('Updating issue', { owner, repo, issueNumber });
  
  try {
    const url = ENDPOINTS.updateIssue(owner, repo, issueNumber);
    const requestId = logApiRequest(url);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const issue = await response.json();
    requestId.response = { id: issue.id };
    
    log.info('Issue updated successfully', { number: issue.number });
    return issue;
  } catch (error) {
    log.error('Error updating issue', { error: error.message });
    throw error;
  }
}