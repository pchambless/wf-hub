import { promises as fs } from 'fs';
import process from 'process';
import createLogger from '../../utils/logger';

const log = createLogger('ApiAnalyzer');

/**
 * Find API calls in the specified components
 */
async function findApiCalls(components) {
  const apiCalls = [];
  
  try {
    log.info(`Analyzing ${components.length} components for API calls`);
    
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

export {
  findApiCalls
};