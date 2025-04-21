import createLogger from '../utils/logger';

const log = createLogger('DownloadService');

// Download selected issues
export const downloadSelectedIssues = async (repo, issueNumbers, token) => {
  try {
    log.info(`Downloading ${issueNumbers.length} issues`, { repo: repo.name });
    
    const response = await fetch('/api/github/download-issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo,
        issueNumbers,
        token
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      log.error('Download error from server:', result.error);
      throw new Error(result.error);
    }
    
    log.info(`Successfully downloaded ${result.files.length} issues to ${result.path}`);
    return result;
  } catch (error) {
    log.error('Error downloading issues:', error);
    throw error;
  }
};