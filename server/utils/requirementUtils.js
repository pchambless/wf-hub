import createLogger from './logger.js';

const log = createLogger('requirementUtils');
/**
 * Format a GitHub issue as a markdown requirement document
 */
export function formatRequirementMarkdown(issue, comments = []) {
  // Basic validation
  log('Issue', { issue });
  if (!issue) throw new Error('Issue data is required');
  
  // Fix 1: Ensure the body is a string (sometimes GitHub returns null)
  const issueBody = issue.body || '';
  const title = issue.title || 'Untitled Requirement';
  
  // Create the markdown content
  let markdown = `# ${title}\n\n`;
  markdown += `> Issue #${issue.number} | Created by ${issue.user?.login || 'unknown'} | ${new Date(issue.created_at).toLocaleDateString()}\n\n`;
  
  // Fix 2: Make sure we're working with a string before calling replace
  if (issueBody) {
    // Convert the issue body to markdown
    markdown += String(issueBody)
      .replace(/\r\n/g, '\n')
      .replace(/\n\n\n+/g, '\n\n');
  }
  
  // Only add comments section if there are comments
  if (comments && comments.length > 0) {
    markdown += `\n\n## Discussion\n\n`;
    
    // Process each comment
    comments.forEach(comment => {
      // Fix 3: Ensure comment body is a string
      const commentBody = comment.body || '';
      
      markdown += `### ${comment.user?.login || 'Anonymous'} commented on ${new Date(comment.created_at).toLocaleDateString()}\n\n`;
      
      if (commentBody) {
        markdown += String(commentBody)
          .replace(/\r\n/g, '\n')
          .replace(/\n\n\n+/g, '\n\n');
      }
      
      markdown += '\n\n';
    });
  }
  
  return markdown;
}