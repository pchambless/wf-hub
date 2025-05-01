// Re-export everything from individual modules

// Configuration
export * from './config.js';
export { getAvailableRepos } from './config.js'; // Add this to your existing exports:

// Issue management
export {
  fetchIssues,
  fetchIssueDetails,
  createIssue,
  updateIssue
} from './issues.js';

// Comment management
export {
  fetchComments,
  fetchIssueComments, // Alias for compatibility
  createIssueComment,
  updateIssueComment,
  deleteIssueComment
} from './comments.js';

// Downloads
export {
  downloadIssue,
  downloadSelectedIssues // Deprecated but still exported for compatibility
} from './downloads.js';

/**
 * GitHub Service initialization
 */
export async function initGitHubService() {
  console.log('GitHub service initialized with modular structure');
  // Any initialization logic can go here
  
  return {
    initialized: true,
    timestamp: new Date()
  };
}