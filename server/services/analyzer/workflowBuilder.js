import createLogger from '../../utils/logger';

const log = createLogger('WorkflowBuilder');

/**
 * Build workflow steps from all collected data
 */
function buildWorkflowSteps(menuItem, components, apiCalls, serverHandlers, dbQueries) {
  log.debug(`Building workflow steps for ${menuItem.label}`);
  
  const steps = [];
  
  // First step is always the menu navigation
  steps.push({
    id: `step-navigation-${menuItem.id}`,
    type: 'navigation',
    name: `Navigate to ${menuItem.label}`,
    description: `User clicks on ${menuItem.label} in the MenuStrip`,
    path: menuItem.path
  });
  
  // Group API calls by component
  const callsByComponent = {};
  
  for (const call of apiCalls) {
    if (!callsByComponent[call.component]) {
      callsByComponent[call.component] = [];
    }
    callsByComponent[call.component].push(call);
  }
  
  // For each component, create steps
  for (const component of components) {
    const componentStep = {
      id: `step-component-${component.name.toLowerCase()}`,
      type: 'component',
      name: component.name,
      description: `User interacts with ${component.name} component`,
      path: component.path
    };
    
    // Add API calls for this component
    const calls = callsByComponent[component.name] || [];
    if (calls.length > 0) {
      componentStep.apiCalls = calls;
    }
    
    steps.push(componentStep);
    
    // For each API call, add server handler steps
    for (const call of calls) {
      const matchingHandlers = serverHandlers.filter(h => h.apiCall === call.endpoint && h.method === call.method);
      
      for (const handler of matchingHandlers) {
        const handlerStep = {
          id: `step-server-${handler.file}-${handler.route}`.replace(/\//g, '-'),
          type: 'server',
          name: `Server: ${handler.method.toUpperCase()} ${handler.route}`,
          description: `Server processes request in ${handler.file}`,
          file: handler.file,
          route: handler.route
        };
        
        // Find related DB queries
        const relatedQueries = dbQueries.filter(q => q.handlerFile === handler.file && q.handlerRoute === handler.route);
        if (relatedQueries.length > 0) {
          handlerStep.dbQueries = relatedQueries;
        }
        
        steps.push(handlerStep);
      }
    }
  }
  
  log.info(`Created ${steps.length} workflow steps for ${menuItem.label}`);
  return steps;
}

export {
  buildWorkflowSteps
};