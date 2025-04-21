import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import process from 'process';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { formatRequirementMarkdown } from '../utils/requirementUtils.js';

const router = express.Router();

dotenv.config();

// GitHub API configuration
const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// GitHub Authentication headers
const getHeaders = () => ({
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
});

// GitHub configuration endpoint
router.get('/config', (req, res) => {
  res.json({
    organization: process.env.GITHUB_ORG || 'pchambless'
  });
});

// Get issues for a specific repository
router.get('/issues/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    console.log(`Fetching issues for ${owner}/${repo}`);
    
    const response = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all`,
      { headers: getHeaders() }
    );
    
    console.log(`Fetched ${response.data.length} issues`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add this route handler for single issue details

// Add route for fetching a single issue
router.get('/issues/:owner/:repo/:issueNumber', async (req, res) => {
  const { owner, repo, issueNumber } = req.params;
  
  try {
    console.log(`Fetching issue details for ${owner}/${repo}#${issueNumber}`);
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      console.log('Using GitHub token for authentication');
    } else {
      console.log('Warning: No GitHub token provided');
    }
    
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Retrieved issue details for #${issueNumber}`);
      res.json(data);
    } else {
      console.error(`GitHub API error ${response.status} for issue #${issueNumber}`);
      res.status(response.status).json({ 
        error: `GitHub API error: ${response.status}`,
        message: `Failed to fetch issue #${issueNumber}` 
      });
    }
  } catch (error) {
    console.error(`Error fetching issue details: ${error.message}`);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Add this route handler for issue comments

// Route for fetching comments on an issue
router.get('/issues/:owner/:repo/:issueNumber/comments', async (req, res) => {
  const { owner, repo, issueNumber } = req.params;
  
  try {
    console.log(`Fetching comments for ${owner}/${repo}#${issueNumber}`);
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Retrieved ${data.length} comments for issue #${issueNumber}`);
      res.json(data);
    } else {
      console.error(`GitHub API error ${response.status} fetching comments for issue #${issueNumber}`);
      res.status(response.status).json({ 
        error: `GitHub API error: ${response.status}`,
        message: `Failed to fetch comments for issue #${issueNumber}` 
      });
    }
  } catch (error) {
    console.error(`Error fetching comments: ${error.message}`);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Make sure to include a route for posting comments too
router.post('/issues/:owner/:repo/:issueNumber/comments', async (req, res) => {
  const { owner, repo, issueNumber } = req.params;
  const { body } = req.body;
  
  if (!body) {
    return res.status(400).json({ error: 'Comment body is required' });
  }
  
  try {
    console.log(`Creating comment on ${owner}/${repo}#${issueNumber}`);
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    } else {
      return res.status(401).json({ error: 'GitHub token required to post comments' });
    }
    
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Comment created on issue #${issueNumber}`);
      res.json(data);
    } else {
      console.error(`GitHub API error ${response.status} creating comment`);
      res.status(response.status).json({ 
        error: `GitHub API error: ${response.status}`,
        message: `Failed to create comment on issue #${issueNumber}` 
      });
    }
  } catch (error) {
    console.error(`Error creating comment: ${error.message}`);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Download issues endpoint
router.post('/download-issues', async (req, res) => {
  try {
    const { repo, issueNumbers, token } = req.body;
    
    if (!repo || !issueNumbers || !issueNumbers.length) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Base directory - modify this to match your local repo structure
    const repoDir = path.join(process.env.REPOS_DIR || '../..', repo.name);
    const docsDir = path.join(repoDir, 'docs', 'requirements');
    
    // Create directory if it doesn't exist
    await fs.ensureDir(docsDir);
    
    const results = {
      files: [],
      path: docsDir
    };
    
    // Process each issue
    for (const issueNumber of issueNumbers) {
      // Fetch issue details
      const issueResponse = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues/${issueNumber}`, {
        headers: {
          'Authorization': token ? `token ${token}` : '',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!issueResponse.ok) {
        throw new Error(`Failed to fetch issue #${issueNumber}: ${issueResponse.statusText}`);
      }
      
      const issue = await issueResponse.json();
      
      // Fetch comments
      const commentsResponse = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues/${issueNumber}/comments`, {
        headers: {
          'Authorization': token ? `token ${token}` : '',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!commentsResponse.ok) {
        throw new Error(`Failed to fetch comments for issue #${issueNumber}: ${commentsResponse.statusText}`);
      }
      
      const comments = await commentsResponse.json();
      
      // Generate markdown
      const markdown = formatRequirementMarkdown(issue, comments);
      
      // Create filename: REQ-issue_number-truncated_title.md
      const safeTitle = issue.title
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .substring(0, 50);         // Limit length
      
      const filename = `REQ-${issue.number}-${safeTitle}.md`;
      const filePath = path.join(docsDir, filename);
      
      // Write file
      await fs.writeFile(filePath, markdown, 'utf8');
      
      results.files.push({
        issueNumber,
        filename,
        path: filePath
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error downloading issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add these routes to your github.cjs file

// Create a new issue
router.post('/issues/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, labels } = req.body;
    
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
    res.json(data);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an existing issue
router.patch('/issues/:owner/:repo/:issue_number', async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { title, body, state, labels } = req.body;
    
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
    res.json(data);
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add all the other GitHub API routes here
// Issues details, comments, etc.

export default router;