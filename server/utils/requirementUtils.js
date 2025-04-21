/**
 * Format requirement text as markdown
 * @param {string} text - The raw requirement text
 * @returns {string} Formatted markdown
 */
export function formatRequirementMarkdown(text) {
  // Implementation 
  // (Add your original implementation here)
  return text ? text.replace(/\n/g, '\n\n') : '';
}

// Export other functions as named exports
export function otherFunction() {
  // Implementation
}

// You can also provide a default export if needed
const requirementUtils = {
  formatRequirementMarkdown,
  otherFunction,
  // other functions...
};

export default requirementUtils;