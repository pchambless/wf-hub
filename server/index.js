import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import router from './routes/github.js';
import fetch from 'node-fetch';  // You may need to install this

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3006;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// GitHub API helper function
const fetchFromGitHub = async (url) => {
  console.log(`GitHub API request: ${url}`);
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    console.log('Using GitHub token for authentication');
  } else {
    console.log('Warning: No GitHub token provided');
  }
  
  return fetch(url, { headers });
};

// GitHub API routes
app.use('/api/github', router);

// Add direct issues endpoint
app.get('/api/github/issues/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  
  try {
    console.log(`Fetching issues for ${owner}/${repo}`);
    const response = await fetchFromGitHub(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error ${response.status}: ${errorText}`);
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const issues = await response.json();
    console.log(`Retrieved ${issues.length} issues`);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues from GitHub:', error);
    res.status(500).json({ error: 'Failed to fetch issues', message: error.message });
  }
});

// Replace this line:
let workflow;
import('./routes/workflow.js').then(module => {
  workflow = module.default || module;
  
  // If you're setting up routes with this module, do it here
  app.use('/api/workflow', workflow);
}).catch(err => {
  console.error('Failed to import workflow module:', err);
});

// Basic route
app.get('/', (req, res) => {
  res.send('WhatsFresh GitHub API Server');
});

// General error handler
app.use((err, req, res) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Catch-all route for unhandled paths
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GitHub API available at http://localhost:${PORT}/api/github`);
  console.log(`GitHub token ${GITHUB_TOKEN ? 'is' : 'is not'} configured`);
}).on('error', (err) => {
  console.error('Failed to start server:', err.message);
});

export default server;