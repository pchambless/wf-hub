import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import express from 'express';
import { formatRequirementMarkdown } from '../../utils/requirementUtils.js';
import { log, getHeaders, getBasePath, GITHUB_API } from '../../utils/github.js';

const router = express.Router();
// Single requirement download endpoint
router.post('/', async (req, res) => {
  const { owner, repo, issueNumber, includeComments = true, destination = 'docs/requirements' } = req.body;
  
  try {
    if (!owner || !repo || !issueNumber) {
      log.warn('Missing required parameters for download', { owner, repo, issueNumber });
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    log.info(`Downloading requirement`, { owner, repo, issueNumber });
    
    // Base directory from environment with fallback
    const basePath = getBasePath();
    
    // Fetch the issue first to get its title
    const issueResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`, {
      headers: getHeaders()
    });
    
    if (!issueResponse.ok) {
      throw new Error(`GitHub API error: ${issueResponse.status}`);
    }
    
    const issue = await issueResponse.json();
    log.debug('Fetched issue for download', { title: issue.title, number: issue.number });
    
    // Format the filename using issue number and title
    const fileName = `${issueNumber} ${issue.title}.md`;
    
    // Clean the filename to remove invalid characters
    const safeFileName = sanitizeFilename(fileName);
    
    // Always fetch comments
    let comments = [];
    if (includeComments) {
      const commentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        headers: getHeaders()
      });
      
      if (!commentsResponse.ok) {
        log.error('Failed to fetch comments for download', { 
          status: commentsResponse.status, 
          issueNumber 
        });
        throw new Error(`Failed to fetch comments for issue #${issueNumber}: ${commentsResponse.statusText}`);
      }
      
      comments = await commentsResponse.json();
      log.debug('Fetched comments for download', { count: comments.length });
    }
    
    // Generate markdown
    const markdown = formatRequirementMarkdown(issue, comments);
    
    // Create the directory path
    const targetDir = path.join(basePath, repo, destination);
    
    // Create the full file path
    const filePath = path.join(targetDir, safeFileName);
    
    // Make directories
    await fs.promises.mkdir(targetDir, { recursive: true });
    
    // Write file
    await fs.promises.writeFile(filePath, markdown, 'utf8');
    log.info('Requirement file created', { filename: safeFileName, path: filePath });
    
    // Return consistent paths
    res.json({
      success: true,
      message: `Downloaded requirement #${issueNumber} to ${filePath}`,
      path: targetDir,
      files: [{
        issueNumber,
        filename: safeFileName,
        path: filePath
      }]
    });
  } catch (error) {
    log.error('Error downloading requirement', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sanitize a string to be used as a filename
 * @param {string} filename The raw filename
 * @returns {string} The sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename) return '';
  
  // Define invalid characters
  const invalidChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
  
  // Use character-by-character filtering to avoid regex escape sequences
  return filename
    .split('')
    .filter(char => {
      // Filter out control characters (ASCII 0-31)
      const code = char.charCodeAt(0);
      // Keep only characters that are not control chars and not in invalid list
      return code > 31 && !invalidChars.includes(char);
    })
    .join('')
    .trim();
}

export default router;