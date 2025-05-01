import { ENDPOINTS } from './config.js';
import createLogger from '../../utils/logger.js';

const log = createLogger('githubComments');

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
 * Fetch comments for a specific issue
 * @returns {Promise<Array>} Comments array
 */
export async function fetchComments(owner, repo, issueNumber) {
  log.info('Fetching comments', { owner, repo, issueNumber });
  
  try {
    const url = ENDPOINTS.listComments(owner, repo, issueNumber);
    const requestId = logApiRequest(url);
    const response = await fetch(url);
    
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const comments = await response.json();
    requestId.response = { count: comments.length };
    
    log.info(`Retrieved ${comments.length} comments`, { issueNumber });
    return comments;
  } catch (error) {
    log.error('Error fetching comments', { error: error.message });
    throw error;
  }
}

/**
 * Create a new comment on an issue
 * @returns {Promise<Object>} Created comment
 */
export async function createIssueComment(owner, repo, issueNumber, body) {
  log.info('Creating issue comment', { owner, repo, issueNumber });
  
  try {
    const url = ENDPOINTS.createComment(owner, repo, issueNumber);
    const requestId = logApiRequest(url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body })
    });
    
    requestId.status = response.status;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const commentData = await response.json();
    requestId.response = { id: commentData.id };
    
    log.info('Comment created successfully', { id: commentData.id });
    return commentData;
  } catch (error) {
    log.error('Error creating comment', { error: error.message });
    throw error;
  }
}

/**
 * Update an existing comment
 * @returns {Promise<Object>} Updated comment
 */
export async function updateIssueComment(owner, repo, commentId, body) {
  log.info('Updating comment', { owner, repo, commentId });
  
  try {
    const url = ENDPOINTS.updateComment(owner, repo, commentId);
    const requestId = logApiRequest(url);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body })
    });
    
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const updatedComment = await response.json();
    requestId.response = { id: updatedComment.id };
    
    log.info('Comment updated successfully', { id: updatedComment.id });
    return updatedComment;
  } catch (error) {
    log.error('Error updating comment', { error: error.message });
    throw error;
  }
}

/**
 * Delete a comment
 * @returns {Promise<boolean>} Success status
 */
export async function deleteIssueComment(owner, repo, commentId) {
  log.info('Deleting comment', { owner, repo, commentId });
  
  try {
    const url = ENDPOINTS.deleteComment(owner, repo, commentId);
    const requestId = logApiRequest(url);
    
    const response = await fetch(url, {
      method: 'DELETE'
    });
    
    requestId.status = response.status;
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    log.info('Comment deleted successfully', { id: commentId });
    return true;
  } catch (error) {
    log.error('Error deleting comment', { error: error.message });
    throw error;
  }
}

// For backwards compatibility
export const fetchIssueComments = fetchComments;