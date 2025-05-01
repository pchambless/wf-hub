// Values from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006/api';
export const DEFAULT_OWNER = import.meta.env.VITE_DEFAULT_OWNER || 'pchambless';
export const DEFAULT_REPO = import.meta.env.VITE_DEFAULT_REPO || 'wf-client';

// Default values when environment variables are not set
export const DEFAULT_REQUIREMENTS_PATH = 'docs/requirements';
export const DEFAULT_INCLUDE_COMMENTS = true;

// Application settings
export const PAGE_SIZE = 10;
export const MAX_TITLE_LENGTH = 100;
export const REFRESH_INTERVAL = 60000; // 1 minute in milliseconds

// Feature flags
export const FEATURES = {
  enableAutoRefresh: true,
  enableCommentEditing: true,
  enableDownloads: true,
  enableDarkMode: true
};

// API endpoints
export const ENDPOINTS = {
  config: `${API_BASE_URL}/github/config`,
  issues: `${API_BASE_URL}/github/issues`,
  download: `${API_BASE_URL}/github/download-issue`,
  comments: (owner, repo, issueNumber) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/${issueNumber}/comments`,
  // Add these new endpoints:
  createComment: (owner, repo, issueNumber) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/${issueNumber}/comments`,
  updateComment: (owner, repo, commentId) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/comments/${commentId}`,
  deleteComment: (owner, repo, commentId) => 
    `${API_BASE_URL}/github/issues/${owner}/${repo}/comments/${commentId}`
};

// Log levels (matching your backend)
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Current environment
export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const IS_PRODUCTION = import.meta.env.MODE === 'production';