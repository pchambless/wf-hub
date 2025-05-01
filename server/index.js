import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
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

// Replace the current dynamic import with this approach
async function startServer() {
  try {
    // Import routes first
    const githubModule = await import('./routes/github/index.js');
    
    
    // Register routes
    app.use('/api/github', githubModule.default);

    
    // Register error handlers and other middleware
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });
    // eslint-disable-next-line no-unused-vars
    app.use((req, res, next) => {
      console.log(`Route not found: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'Not found' });
    });
    
    // Start the server AFTER all routes are registered
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`GitHub API available at http://localhost:${PORT}/api/github`);

      
      if (process.env.GITHUB_TOKEN) {
        console.log('GitHub token is configured');
      } else {
        console.warn('GitHub token is not configured');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Call the async function to start the server
startServer();

// Basic route
app.get('/', (req, res) => {
  res.send('WhatsFresh GitHub API Server');
});

export default app;