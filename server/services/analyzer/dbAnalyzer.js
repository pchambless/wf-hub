import { promises as fs } from 'fs';
import path from 'path';
import createLogger from '../../utils/logger';

const log = createLogger('DbAnalyzer');

/**
 * Find database queries related to the server handlers
 */
async function findDbQueries(serverHandlers) {
  const queries = [];
  
  try {
    log.info(`Analyzing ${serverHandlers.length} handlers for DB queries`);
    
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

export {
  findDbQueries
};