/**
 * Formats a GitHub issue as a requirement markdown document
 * @param {Object} issue - The GitHub issue object
 * @param {Array} comments - The comments array for the issue
 * @returns {string} Formatted markdown content
 */
export const formatRequirementMarkdown = (issue, comments = []) => {
  let markdown = `# ${issue.title}\n\n`;
  markdown += `> **Issue #${issue.number}** | Created by ${issue.user.login} on ${new Date(issue.created_at).toLocaleDateString()}\n\n`;
  
  // Status and labels
  markdown += `**Status:** ${issue.state}\n`;
  if (issue.labels && issue.labels.length > 0) {
    markdown += `**Labels:** ${issue.labels.map(label => label.name).join(', ')}\n`;
  }
  markdown += '\n---\n\n';
  
  // Issue body
  markdown += issue.body || 'No description provided.';
  
  // Comments section
  if (comments.length > 0) {
    markdown += '\n\n## Comments\n\n';
    
    comments.forEach(comment => {
      markdown += `### ${comment.user.login} _(${new Date(comment.created_at).toLocaleString()})_\n\n`;
      markdown += `${comment.body}\n\n`;
      markdown += '---\n\n';
    });
  }
  
  return markdown;
};