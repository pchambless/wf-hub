import path from 'path';
import { fileURLToPath } from 'url';
import createLogger from '../utils/logger';

const log = createLogger('PathHelper');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurable paths to other projects
const PROJECT_PATHS = {
  client: path.resolve(__dirname, '../../../wf-client'),
  server: path.resolve(__dirname, '../../../wf-server'),
  apiSQL: path.resolve(__dirname, '../../../wf-apiSQL')
};

/**
 * Sanitizes user-provided paths to prevent path traversal attacks
 */
function sanitizePath(userPath) {
  if (typeof userPath !== 'string') return '';
  
  // Remove any null bytes or path traversal attempts
  const cleaned = userPath.replace(/\0/g, '').replace(/\.\.\//g, '');
  return path.normalize(cleaned);
}

/**
 * Get current project paths configuration
 */
function getProjectPaths() {
  return PROJECT_PATHS;
}

/**
 * Update project paths with new values
 */
function updateProjectPaths(newPaths) {
  // Validate and sanitize inputs
  if (!newPaths || typeof newPaths !== 'object') {
    return false;
  }

  // Process each path
  Object.keys(newPaths).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(PROJECT_PATHS, key) && typeof newPaths[key] === 'string') {
      PROJECT_PATHS[key] = sanitizePath(newPaths[key]);
      log.info(`Updated ${key} path to: ${PROJECT_PATHS[key]}`);
    }
  });
  
  return true;
}

export {
  PROJECT_PATHS,
  sanitizePath,
  getProjectPaths,
  updateProjectPaths
};