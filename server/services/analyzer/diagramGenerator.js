import createLogger from '../../utils/logger';

const log = createLogger('DiagramGenerator');

/**
 * Generate a mermaid diagram from workflow data
 */
function generateMermaidDiagram(workflows) {
  log.info(`Generating diagram for ${workflows.length} workflows`);
  
  let mermaidCode = 'graph TD\n';
  const nodes = new Set();
  const connections = [];
  
  // Process each workflow
  for (const flow of workflows) {
    // Add start node
    const startId = flow.id;
    nodes.add(`${startId}["${flow.title}"]`);
    
    // Process steps
    let previousNodeId = startId;
    
    for (const step of flow.steps) {
      const nodeId = step.id;
      nodes.add(`${nodeId}["${step.name}"]`);
      
      // Add connections
      connections.push(`${previousNodeId} --> ${nodeId}`);
      
      // For next iteration
      previousNodeId = nodeId;
      
      // Add API calls if any
      if (step.apiCalls) {
        for (const call of step.apiCalls) {
          const apiNodeId = `api_${call.method}_${call.endpoint}`.replace(/\//g, '_');
          nodes.add(`${apiNodeId}["API: ${call.method.toUpperCase()} ${call.endpoint}"]`);
          connections.push(`${nodeId} -.-> ${apiNodeId}`);
        }
      }
      
      // Add DB queries if any
      if (step.dbQueries) {
        for (const query of step.dbQueries) {
          const dbNodeId = `db_${query.handlerFile}_${query.queryType}`.replace(/\//g, '_').replace(/\./g, '_');
          nodes.add(`${dbNodeId}["DB: ${query.queryType}"]`);
          connections.push(`${nodeId} -.-> ${dbNodeId}`);
        }
      }
    }
  }
  
  // Build the diagram
  for (const node of nodes) {
    mermaidCode += `    ${node}\n`;
  }
  
  for (const connection of connections) {
    mermaidCode += `    ${connection}\n`;
  }
  
  return mermaidCode;
}

export {
  generateMermaidDiagram
};