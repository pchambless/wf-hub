import express from 'express';
import fetch from 'node-fetch';
import { log, GITHUB_API, getHeaders, GITHUB_TOKEN } from '../../utils/github.js';

// Missing router initialization
const router = express.Router();

// Route for fetching comments on an issue
// Route paths should NOT include /issues since router will be mounted at /issues path
router.get('/:owner/:repo/:issueNumber/comments', async (req, res) => {
    const { owner, repo, issueNumber } = req.params;
    
    try {
      log.info(`Fetching comments for issue`, { owner, repo, issueNumber });
      
      // Use the getHeaders() utility function instead of manual construction
      const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        log.info(`Retrieved comments`, { issueNumber, count: data.length });
        res.json(data);
      } else {
        log.error(`GitHub API error fetching comments`, { 
          status: response.status, 
          issueNumber,
          owner,
          repo 
        });
        res.status(response.status).json({ 
          error: `GitHub API error: ${response.status}`,
          message: `Failed to fetch comments for issue #${issueNumber}` 
        });
      }
    } catch (error) {
      log.error(`Error fetching comments`, { 
        error: error.message,
        stack: error.stack,
        issueNumber 
      });
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
});
  
// Route for posting comments
// Use consistent parameter naming (issueNumber instead of issue_number)
router.post('/:owner/:repo/:issueNumber/comments', async (req, res) => {
  try {
    const { owner, repo, issueNumber } = req.params;
    const { body } = req.body;
    
    log.info(`Creating comment on issue`, { owner, repo, issueNumber });
    
    // Use fetch for consistency with other routes
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, 
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ body })
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log.info(`Comment created successfully`, { issueNumber });
    res.json(data);
  } catch (error) {
    log.error('Comment creation error', { 
      error: error.response?.data || error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: error.message });
  }
});

// Missing export
export default router;
