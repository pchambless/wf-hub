import createLogger from '../utils/logger';
import { process } from '../config';
import { logApiRequest } from '../components/Debug/DebugPanel';

const log = createLogger('GitHubService');
const API_BASE_URL = 'http://localhost:3006/api/github'; // Base URL for the GitHub API
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub token from environment variables

// We'll fetch this from the API
let organizationName = '';

/**
 * Initialize service by fetching configuration
 */
export async function initGitHubService() {
  try {
    // Fix URL construction - make sure to use the full path
    const configUrl = `${API_BASE_URL}/config`;
    const requestId = logApiRequest(configUrl);
    const response = await fetch(configUrl);
    
    // Rest of function remains unchanged
    if (response.ok) {
      const config = await response.json();
      organizationName = config.organization;
      log.info('GitHub service initialized', { organization: organizationName });
      
      // Update request log with status
      requestId.status = response.status;
      requestId.response = config;
    } else {
      log.warn('Server responded with error:', response.status);
      organizationName = 'pchambless'; // Fallback
    }
  } catch (error) {
    log.error('Failed to initialize GitHub service', error);
    organizationName = 'pchambless'; // Fallback
  }
}

/**
 * Get available repositories (targeted list using org from env)
 */
export function getAvailableRepos() {
  return [
    { name: 'wf-client', owner: 'pchambless', description: 'WhatsFresh Client' },
    { name: 'wf-server', owner: 'pchambless', description: 'WhatsFresh Server API' },
    { name: 'wf-hub', owner: 'pchambless', description: 'GitHub Integration Hub' }
  ];
}

/**
 * Fetch all repositories for the organization
 */
export async function fetchRepos() {  // Renamed for consistency
  log.info('Fetching repos');
  try {
    const response = await fetch(`${API_BASE_URL}/repos`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    log.info('Repos fetched', { count: data.length });
    return data;
  } catch (error) {
    log.error('Error fetching repos', error);
    throw error;
  }
}

/**
 * Fetch issues for a specific repository
 */
export const fetchIssues = async (owner, repo) => {
  try {
    const response = await fetch(`/api/github/issues/${owner}/${repo}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    let data = await response.json();
    
    // Log the raw data
    console.log('Raw API response:', data);
    
    // Transform data if needed to match component expectations
    // For example, if data isn't an array or needs property remapping
    if (!Array.isArray(data)) {
      data = data.issues || [];
    }
    
    // Add any missing properties your components might expect
    return data.map(issue => ({
      ...issue,
      number: issue.number || issue.id, // Ensure number property exists
      title: issue.title || 'No title',
      state: issue.state || 'open'
    }));
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
};

/**
 * Fetch a specific issue with its details
 */
export async function fetchIssueDetails(owner, repo, issueNumber) {
  log.info('Fetching issue details', { owner, repo, issueNumber });
  
  try {
    const url = `${API_BASE_URL}/issues/${owner}/${repo}/${issueNumber}`;
    const requestId = logApiRequest(url);
    const response = await fetch(url);
    
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const issueData = await response.json();
    requestId.response = issueData;
    
    log.info('Issue details fetched', { id: issueData.id });
    return issueData;
  } catch (error) {
    log.error('Error fetching issue details', error);
    throw error;
  }
}

/**
 * Fetch comments for a specific issue
 */
export const fetchIssueComments = async (owner, repo, issueNumber) => {
  try {
    const response = await fetch(`/api/github/issues/${owner}/${repo}/${issueNumber}/comments`);
    
    if (!response.ok) {
      throw new Error(`Error fetching comments: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch issue comments:', error);
    throw error;
  }
};

/**
 * Create a comment on an issue
 */
export async function createIssueComment(owner, repo, issueNumber, body) {
  log.info('Creating issue comment', { owner, repo, issueNumber });
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${owner}/${repo}/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    log.info('Comment created', { id: data.id });
    return data;
  } catch (error) {
    log.error('Error creating comment', error);
    throw error;
  }
}

/**
 * Create a new issue in a repository
 */
export async function createIssue(owner, repo, title, body, labels = []) {
  log.info('Creating issue', { owner, repo, title });
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    log.info('Issue created', { number: data.number });
    return data;
  } catch (error) {
    log.error('Error creating issue', error);
    throw error;
  }
}

/**
 * Update an existing issue in a repository
 */
export const updateIssue = async (owner, repo, issueNumber, issueData) => {
  try {
    const response = await fetch(`/api/github/issues/${owner}/${repo}/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issueData)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating issue: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to update issue:', error);
    throw error;
  }
};

