import createLogger from '../utils/logger';

const log = createLogger('WorkflowService');

/**
 * Get project paths
 */
export async function getProjectPaths() {
  try {
    // Use the full URL including the port where your server is running
    const response = await fetch('http://localhost:3006/api/workflow/paths');
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.paths;
  } catch (error) {
    log.error('Failed to get project paths', error);
    throw error;
  }
}

/**
 * Update project paths
 */
export async function updateProjectPaths(paths) {
  try {
    const response = await fetch('/api/workflow/paths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paths })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.paths;
  } catch (error) {
    log.error('Failed to update project paths', error);
    throw error;
  }
}

/**
 * Analyze workflows
 */
export async function analyzeWorkflows() {
  try {
    const response = await fetch('/api/workflow/analyze');
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.workflows;
  } catch (error) {
    log.error('Failed to analyze workflows', error);
    throw error;
  }
}

/**
 * Generate a workflow diagram
 */
export async function generateWorkflowDiagram() {
  try {
    const response = await fetch('/api/workflow/diagram');
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.mermaidCode;
  } catch (error) {
    log.error('Failed to generate diagram', error);
    throw error;
  }
}

/**
 * Analyze a specific workflow step
 */
export async function analyzeWorkflowStep(step, params = {}) {
  try {
    const response = await fetch('/api/workflow/analyze-step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ step, params })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    log.error(`Failed to analyze step: ${step}`, error);
    throw error;
  }
}

/**
 * Get event types
 */
export async function getEventTypes() {
  try {
    const response = await fetch('/api/workflow/eventtypes');
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.eventTypes;
  } catch (error) {
    log.error('Failed to get event types', error);
    throw error;
  }
}