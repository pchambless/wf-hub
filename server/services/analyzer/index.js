import createLogger from '../../../utils/logger';
import { findMenuItems } from './menuAnalyzer';
import { findRelatedClientComponents } from './componentAnalyzer';
import { findApiCalls } from './apiAnalyzer';
import { findServerHandlers, findEventTypes } from './serverAnalyzer';
import { findDbQueries } from './dbAnalyzer';
import { buildWorkflowSteps } from './workflowBuilder';
import { generateMermaidDiagram } from './diagramGenerator';
import { getProjectPaths, updateProjectPaths } from '../pathHelper';

const log = createLogger('WorkflowAnalyzer');

/**
 * Scans the codebase to discover navigation flows
 */
async function discoverWorkflows() {
  log.info('Starting workflow discovery');
  
  // List of discovered flows
  const workflows = [];
  
  try {
    // Start with menu items
    const menuItems = await findMenuItems();
    log.info(`Found ${menuItems.length} menu items`);
    
    // For each menu item, trace navigation paths
    for (const menuItem of menuItems) {
      const flow = {
        id: menuItem.id,
        title: menuItem.label,
        startPoint: menuItem.path,
        steps: []
      };
      
      // Find related components based on route
      const relatedComponents = await findRelatedClientComponents(menuItem.path);
      log.info(`Found ${relatedComponents.length} components for ${menuItem.label}`);
      
      // Look for API calls in those components
      const apiCalls = await findApiCalls(relatedComponents);
      
      // Find server-side handlers for those API calls
      const serverHandlers = await findServerHandlers(apiCalls);
      
      // Find DB queries triggered by those handlers
      const dbQueries = await findDbQueries(serverHandlers);
      
      // Build the workflow steps
      flow.steps = buildWorkflowSteps(menuItem, relatedComponents, apiCalls, serverHandlers, dbQueries);
      
      workflows.push(flow);
    }
    
    return workflows;
  } catch (error) {
    log.error('Error discovering workflows:', error);
    throw error;
  }
}

/**
 * Progressive discovery - allows getting partial results
 */
async function discoverWorkflowStep(step, params = {}) {
  switch (step) {
    case 'menu':
      return await findMenuItems();
      
    case 'components':
      if (!params.path) {
        throw new Error("Path parameter is required for components step");
      }
      return await findRelatedClientComponents(params.path);
      
    case 'api':
      if (!params.components) {
        throw new Error("Components parameter is required for API step");
      }
      return await findApiCalls(params.components);
      
    case 'server':
      if (!params.apiCalls) {
        throw new Error("API calls parameter is required for server step");
      }
      return await findServerHandlers(params.apiCalls);
      
    case 'db':
      if (!params.serverHandlers) {
        throw new Error("Server handlers parameter is required for DB step");
      }
      return await findDbQueries(params.serverHandlers);
      
    case 'eventTypes':
      return await findEventTypes();
      
    default:
      throw new Error(`Unknown discovery step: ${step}`);
  }
}

export {
  discoverWorkflows,
  discoverWorkflowStep,
  generateMermaidDiagram,
  findEventTypes,
  getProjectPaths,
  updateProjectPaths
};