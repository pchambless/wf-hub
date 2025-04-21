import { promises as fs } from 'fs';
import path from 'path';
import createLogger from '../../utils/logger';
import { PROJECT_PATHS } from '../pathHelper';

const log = createLogger('ComponentAnalyzer');

/**
 * Find components related to a specific route
 */
async function findRelatedClientComponents(route) {
  // Extract the main path segment
  const mainPath = route.split('/')[1];
  const components = [];
  
  try {
    log.debug(`Finding components for path segment: ${mainPath}`);
    
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
      
      // If we still don't have components, try searching all component directories
      if (components.length === 0) {
        log.info(`No matching components found for ${mainPath}, searching all directories`);
        for (const dir of dirs) {
          const fullPath = path.join(componentsDir, dir);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory()) {
            const files = await findMatchingComponents(fullPath, '*');
            
            // Filter to only include components with naming related to the path
            const relevantFiles = files.filter(f => 
              f.name.toLowerCase().includes(mainPath) || 
              mainPath.includes(f.name.toLowerCase())
            );
            
            components.push(...relevantFiles);
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
        
        log.debug(`Found component: ${file} for keyword: ${keyword}`);
      }
    }
  } catch (err) {
    log.info(`Error searching directory ${directory}:`, err.message);
  }
  
  return components;
}

export {
  findRelatedClientComponents,
  findMatchingComponents
};