import { API_BASE_URL } from '../../config.js';

// Default values
export const DEFAULT_OWNER = import.meta.env.VITE_DEFAULT_OWNER || 'pchambless';
export const DEFAULT_REPO = import.meta.env.VITE_DEFAULT_REPO || 'wf-client';
export const REQUIREMENTS_PATH = 'docs/requirements';

/**
 * GitHub API endpoints
 * Centralized endpoint configuration for all GitHub-related requests
 */
export const ENDPOINTS = {
  // Configuration
  getConfig: `${API_BASE_URL}/github/config`,
  
  // Issues
  listIssues: (owner, repo) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}`,
  getIssue: (owner, repo, issueNumber) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/${issueNumber}`,
  createIssue: (owner, repo) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}`,
  updateIssue: (owner, repo, issueNumber) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/${issueNumber}`,
  
  // Comments
  listComments: (owner, repo, issueNumber) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/${issueNumber}/comments`,
  createComment: (owner, repo, issueNumber) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/${issueNumber}/comments`,
  updateComment: (owner, repo, commentId) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/comments/${commentId}`,
  deleteComment: (owner, repo, commentId) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/comments/${commentId}`,
  
  // Downloads
  downloadIssue: `${API_BASE_URL}/github/download-issue`
};

/**
 * GitHub service configuration
 */
export const GitHubConfig = {
  // Service behavior
  requestTimeout: 15000, // 15 seconds
  retryCount: 3,
  
  // Feature flags
  features: {
    enableCommentEditing: true,
    enableDownloads: true
  }
};

/**
 * Get available repositories for the user
 * @returns {Promise<Array>} List of fixed repositories
 */
export async function getAvailableRepos() {
  // Just return the 4 fixed repositories you want
  return [
    { name: 'wf-client', owner: DEFAULT_OWNER, description: 'wf-client' },
    { name: 'wf-server', owner: DEFAULT_OWNER, description: 'wf-server' },
    { name: 'wf-hub', owner: DEFAULT_OWNER, description: 'wf-hub' },
    { name: 'wf-analyzer', owner: DEFAULT_OWNER, description: 'wf-analyzer' }
  ];
}