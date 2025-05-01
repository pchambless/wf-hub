import { ENDPOINTS } from './config.js';
import createLogger from '../../utils/logger.js';

const log = createLogger('githubDownloads');

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
 * Download a requirement file for a GitHub issue
 * @param {Object} repo - Repository information
 * @param {string} repo.owner - Repository owner
 * @param {string} repo.name - Repository name
 * @param {number} issueNumber - Issue number to download
 * @param {Object} options - Download options
 * @param {boolean} [options.includeComments=true] - Whether to include comments
 * @param {string} [options.destination='docs/requirements'] - Target directory
 * @returns {Promise<Object>} Download result with file information
 */
export async function downloadIssue(repo, issueNumber, options = {}) {
  const { includeComments = true, destination = 'docs/requirements' } = options;
  
  log.info('Starting requirement download', { 
    number: issueNumber,
    destination,
    includeComments
  });

  try {
    const url = ENDPOINTS.downloadIssue;
    const requestId = logApiRequest(url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner: repo.owner,
        repo: repo.name,
        issueNumber,
        includeComments,
        destination
      }),
    });
    
    requestId.status = response.status;
    
    if (!response.ok) {
      const errorText = await response.text();
      log.error('Download API error', { status: response.status, error: errorText });
      throw new Error(`Download failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    log.info('Download successful', { 
      path: result.path,
      fileCount: result.files?.length 
    });
    
    return result;
  } catch (error) {
    log.error('Download exception', { message: error.message });
    throw error;
  }
}

// Backward compatibility alias, but marked as deprecated
/**
 * @deprecated Use downloadIssue instead
 */
export const downloadSelectedIssues = (repo, issueNumbers, options = {}) => {
  log.warn('downloadSelectedIssues is deprecated, use downloadIssue instead');
  if (!issueNumbers || issueNumbers.length === 0) {
    throw new Error('No issues selected for download');
  }
  return downloadIssue(repo, issueNumbers[0], options);
};