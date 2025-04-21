import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import createLogger from '../utils/logger';
const log = createLogger('CodeAnalyzer');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurable paths to other projects
const PROJECT_PATHS = {
  client: path.resolve(__dirname, '../../../../wf-client'),
  server: path.resolve(__dirname, '../../../../wf-server'),
  apiSQL: path.resolve(__dirname, '../../../../wf-apiSQL')
};

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
 * Find menu items in the MenuStrip component
 */
async function findMenuItems() {
  try {
    const menuStripPath = path.join(PROJECT_PATHS.client, 'src/components/page/MenuStrip.js');
    
    // Check if file exists
    try {
      await fs.access(menuStripPath);
      log.info('MenuStrip.js found at:', menuStripPath);
    } catch {
      log.info('MenuStrip.js not found, using demo data');
      return getDemoMenuItems();
    }
    
    const content = await fs.readFile(menuStripPath, 'utf8');
    
    // Extract navigation actions from the code
    const menuItems = [];
    const buttonRegex = new RegExp(
      'onClick=\\s*\\(\\)\\s*=>\\s*handleMenuItemClick\\s*\\(\\s*' +
      '[\'"]([^\'"]+)[\'"]\\s*,\\s*[\'"]([^\'"]+)[\'"]\\s*\\)', 'g'
    );
    
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      const path = match[1];
      const label = match[2];
      
      menuItems.push({
        id: `menu-${label.toLowerCase()}`,
        path,
        label,
        type: 'navigation'
      });
      
      log.info(`Found menu item: ${label} -> ${path}`);
    }
    
    return menuItems.length ? menuItems : getDemoMenuItems();
  } catch (error) {
    log.error('Error finding menu items:', error);
    return getDemoMenuItems();
  }
}

/**
 * Find components related to a specific route
 */
async function findRelatedClientComponents(route) {
  // Extract the main path segment
  const mainPath = route.split('/')[1];
  const components = [];
  
  try {
    // Look for components in the page directory first
    const pagesDir = path.join(PROJECT_PATHS.client, 'src/pages');
    
    try {
      await fs.access(pagesDir);
      const pages = await findMatchingComponents(pagesDir, mainPath);
      components.push(...pages);
    } catch (err) {
      log.info('No pages directory found:', err.message);
    }
    
    // Then look in the components directory
    const componentsDir = path.join(PROJECT_PATHS.client, 'src/components');
    
    try {
      await fs.access(componentsDir);
      
      // Look in subdirectories that might match our route
      const dirs = await fs.readdir(componentsDir);
      
      for (const dir of dirs) {
        if (dir.toLowerCase().includes(mainPath) || 
            mainPath.includes(dir.toLowerCase())) {
          const fullPath = path.join(componentsDir, dir);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory()) {
            const files = await findMatchingComponents(fullPath, mainPath);
            components.push(...files);
          }
        }
      }
    } catch (err) {
      log.info('Error searching component directories:', err.message);
    }
    
    return components;
  } catch (error) {
    log.error('Error finding related components:', error);
    return [];
  }
}

/**
 * Helper function to find components in a directory that match a keyword
 */
async function findMatchingComponents(directory, keyword) {
  const components = [];
  
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        const subComponents = await findMatchingComponents(fullPath, keyword);
        components.push(...subComponents);
      } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && 
                (file.toLowerCase().includes(keyword) || keyword === '*')) {
        components.push({
          name: file.replace(/\.(js|jsx)$/, ''),
          path: path.relative(PROJECT_PATHS.client, fullPath),
          fullPath
        });
        
        log.info(`Found component: ${file} for keyword: ${keyword}`);
      }
    }
  } catch (err) {
    log.info(`Error searching directory ${directory}:`, err.message);
  }
  
  return components;
}

/**
 * Find API calls in the specified components
 */
async function findApiCalls(components) {
  const apiCalls = [];
  
  try {
    for (const component of components) {
      try {
        const content = await fs.readFile(component.fullPath, 'utf8');
        
        // Look for axios API calls
        const axiosRegex = /(get|post|put|delete|patch)\s*\(\s*['"](\/api\/[^'"]+)['"]/gi;
        let match;
        
        while ((match = axiosRegex.exec(content)) !== null) {
          const method = match[1].toLowerCase();
          const endpoint = match[2];
          
          apiCalls.push({
            component: component.name,
            method,
            endpoint,
            componentPath: component.path
          });
          
          log.info(`Found API call: ${method.toUpperCase()} ${endpoint} in ${component.name}`);
        }
        
        // Look for fetch API calls
        const fetchRegex = /fetch\s*\(\s*['"](\/api\/[^'"]+)['"].*?['"](GET|POST|PUT|DELETE|PATCH)['"]/gi;
        while ((match = fetchRegex.exec(content)) !== null) {
          const endpoint = match[1];
          const method = match[2].toLowerCase();
          
          apiCalls.push({
            component: component.name,
            method,
            endpoint,
            componentPath: component.path
          });
          
          log.info(`Found fetch call: ${method.toUpperCase()} ${endpoint} in ${component.name}`);
        }
      } catch (err) {
        log.warn(`Could not read component file: ${component.fullPath}`, { 
          error: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    }
    
    return apiCalls;
  } catch (error) {
    log.error('Error finding API calls:', error);
    return [];
  }
}

/**
 * Find server handlers for the API calls
 */
async function findServerHandlers(apiCalls) {
  const handlers = [];
  
  try {
    const routesDir = path.join(PROJECT_PATHS.server, 'server/routes');
    
    try {
      await fs.access(routesDir);
      
      // For each API call, look for matching route handlers
      for (const apiCall of apiCalls) {
        // Extract route base path (e.g., /api/ingredients -> ingredients)
        const routeBase = apiCall.endpoint.split('/')[2];
        
        if (!routeBase) continue;
        
        // Look for route files that might handle this endpoint
        const routeFiles = await fs.readdir(routesDir);
        
        for (const file of routeFiles) {
          if (file.toLowerCase().includes(routeBase) || 
              routeBase.includes(file.toLowerCase().replace('.js', ''))) {
            const fullPath = path.join(routesDir, file);
            
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              
              // Look for route handlers matching this endpoint
              const routerRegex = new RegExp(`router\\.(${apiCall.method})\\s*\\(['"]([^'"]*)['"](.*?)=>`, 'gi');
              let match;
              
              while ((match = routerRegex.exec(content)) !== null) {
                const handlerMethod = match[1];
                const handlerPath = match[2];
                
                // Check if this route matches our API call
                // This is a simple check and might need refinement
                if (apiCall.endpoint.includes(handlerPath) || 
                    ('/' + routeBase + handlerPath) === apiCall.endpoint) {
                  handlers.push({
                    apiCall: apiCall.endpoint,
                    method: handlerMethod,
                    route: handlerPath,
                    file,
                    fullPath
                  });
                  
                  log.info(`Found handler: ${handlerMethod.toUpperCase()} ${handlerPath} in ${file}`);
                }
              }
            } catch (err) {
              log.warn(`Could not read route file: ${fullPath}`, { 
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
              });
              log.info(`Could not read route file: ${fullPath}`);
            }
          }
        }
      }
    } catch (err) {
      log.info('No routes directory found or error accessing it:', err.message);
    }
    
    return handlers;
  } catch (error) {
    log.error('Error finding server handlers:', error);
    return [];
  }
}

/**
 * Find database queries related to the server handlers
 */
async function findDbQueries(serverHandlers) {
  const queries = [];
  
  try {
    // For each handler, look for database queries
    for (const handler of serverHandlers) {
      try {
        const content = await fs.readFile(handler.fullPath, 'utf8');
        
        // Look for SQL queries or ORM operations
        const queryRegex = /db\.(query|execute)\s*\(\s*['"]([^'"]+)['"]/gi;
        let match;
        
        while ((match = queryRegex.exec(content)) !== null) {
          const queryType = match[1];
          const queryText = match[2];
          
          queries.push({
            handlerFile: handler.file,
            handlerRoute: handler.route,
            queryType,
            queryText
          });
          
          log.info(`Found query in ${handler.file}: ${queryText.substring(0, 50)}...`);
        }
        
        // Look for imports of SQL files
        const sqlImportRegex = /require\s*\(\s*['"]([^'"]+\.sql)['"]\s*\)/gi;
        while ((match = sqlImportRegex.exec(content)) !== null) {
          const sqlFile = match[1];
          
          // Try to read the SQL file
          try {
            const sqlPath = path.join(path.dirname(handler.fullPath), sqlFile);
            const sqlContent = await fs.readFile(sqlPath, 'utf8');
            
            queries.push({
              handlerFile: handler.file,
              handlerRoute: handler.route,
              queryType: 'sql-file',
              queryText: sqlContent,
              sqlFile
            });
            
            log.info(`Found SQL file: ${sqlFile} for handler ${handler.route}`);
          } catch (err) {
            log.info(`Could not read SQL file: ${sqlFile}:`, err.message);
          }
        }
      } catch (err) {
        log.info(`Could not analyze handler file: ${handler.fullPath}:`, err.message);
      }
    }
    
    return queries;
  } catch (error) {
    log.error('Error finding database queries:', error);
    return [];
  }
}

/**
 * Look for eventTypes in the server middleware
 */
async function findEventTypes() {
  try {
    const eventTypesPath = path.join(PROJECT_PATHS.server, 'server/middleware/eventTypes.js');
    
    try {
      await fs.access(eventTypesPath);
      log.info('eventTypes.js found at:', eventTypesPath);
      
      const content = await fs.readFile(eventTypesPath, 'utf8');
      
      // Look for event type definitions
      const eventTypeRegex = /['"]([A-Z_]+)['"]:\s*['"]([^'"]+)['"]/gi;
      const eventTypes = [];
      
      let match;
      while ((match = eventTypeRegex.exec(content)) !== null) {
        const eventKey = match[1];
        const eventValue = match[2];
        
        eventTypes.push({ key: eventKey, value: eventValue });
        log.info(`Found event type: ${eventKey} = ${eventValue}`);
      }
      
      return eventTypes;
    } catch (err) {
      log.info('eventTypes.js not found or error accessing it:', err.message);
      return [];
    }
  } catch (error) {
    log.error('Error finding event types:', error);
    return [];
  }
}

/**
 * Build workflow steps from all collected data
 */
function buildWorkflowSteps(menuItem, components, apiCalls, serverHandlers, dbQueries) {
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
  
  return steps;
}

/**
 * Generate a mermaid diagram from workflow data
 */
function generateMermaidDiagram(workflows) {
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

/**
 * Provides demo menu items if actual items can't be found
 */
function getDemoMenuItems() {
  return [
    { id: 'menu-welcome', path: '/welcome', label: 'Welcome', type: 'navigation' },
    { id: 'menu-ingredients', path: '/ingredients/types', label: 'Ingredients', type: 'navigation' },
    { id: 'menu-products', path: '/products', label: 'Products', type: 'navigation' },
    { id: 'menu-account', path: '/account', label: 'Account', type: 'navigation' }
  ];
}

/**
 * Get project paths
 */
function getProjectPaths() {
  return PROJECT_PATHS;
}

/**
 * Update project paths
 */
function updateProjectPaths(newPaths) {
  Object.assign(PROJECT_PATHS, newPaths);
}

// Add this helper function:
function sanitizePath(userPath) {
  // Remove any null bytes or path traversal attempts
  const cleaned = userPath.replace(/\0/g, '').replace(/\.\.\//g, '');
  return path.normalize(cleaned);
}

// Example of how to use with external paths:
// updateProjectPaths(Object.entries(newPaths).reduce((acc, [key, value]) => {
//   acc[key] = sanitizePath(value);
//   return acc;
// }, {}));

export {
  discoverWorkflows,
  generateMermaidDiagram,
  findEventTypes,
  getProjectPaths,
  updateProjectPaths,
  sanitizePath
};