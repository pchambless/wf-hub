import express from 'express';
import fetch from 'node-fetch';
import { log, GITHUB_API, getHeaders } from '../../utils/github.js';

const router = express.Router();

// Get issues for a specific repository
router.get('/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    log.info(`Fetching issues for repository`, { owner, repo });
    
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log.info(`Fetched issues`, { count: data.length, owner, repo });
    res.json(data);
  } catch (error) {
    log.error('Error fetching issues', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get a single issue
router.get('/:owner/:repo/:issueNumber', async (req, res) => {
  const { owner, repo, issueNumber } = req.params;
  
  try {
    log.info(`Fetching issue details`, { owner, repo, issueNumber });
    
    const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`;
    const response = await fetch(url, { headers: getHeaders() });
    
    if (response.ok) {
      const data = await response.json();
      log.info(`Retrieved issue details`, { issueNumber, title: data.title });
      res.json(data);
    } else {
      log.error(`GitHub API error`, { 
        status: response.status, 
        issueNumber,
        owner,
        repo 
      });
      res.status(response.status).json({ 
        error: `GitHub API error: ${response.status}`,
        message: `Failed to fetch issue #${issueNumber}` 
      });
    }
  } catch (error) {
    log.error(`Error fetching issue details`, { 
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

// Create a new issue
router.post('/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, labels } = req.body;
    
    log.info(`Creating new issue`, { owner, repo, title });
    
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        body,
        labels: labels || []
      })
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log.info(`Issue created successfully`, { number: data.number, title });
    res.json(data);
  } catch (error) {
    log.error('Error creating issue', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Update an existing issue
router.patch('/:owner/:repo/:issue_number', async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { title, body, state, labels } = req.body;
    
    log.info(`Updating issue`, { owner, repo, issueNumber: issue_number });
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (state !== undefined) updateData.state = state;
    if (labels !== undefined) updateData.labels = labels;
    
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues/${issue_number}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log.info(`Issue updated successfully`, { issueNumber: issue_number });
    res.json(data);
  } catch (error) {
    log.error('Error updating issue', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

export default router;