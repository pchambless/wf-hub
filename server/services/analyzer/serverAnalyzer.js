import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import createLogger from '../../utils/logger';
import { PROJECT_PATHS } from '../pathHelper';

const log = createLogger('ServerAnalyzer');

/**
 * Find server handlers for the API calls
 */
async function findServerHandlers(apiCalls) {
  const handlers = [];
  
  try {
    log.info(`Analyzing server handlers for ${apiCalls.length} API calls`);
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

export {
  findServerHandlers,
  findEventTypes
};