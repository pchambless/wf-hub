/**
 * Browser-specific logger implementation
 */
import { loggerConfig, shouldLog } from './loggerBase';

// Keep track of recent logs to deduplicate
const recentLogs = {};

// Check if this is a duplicate log
const isDuplicate = (component, level, message, args) => {
  if (!loggerConfig.dedupeTimeWindow) return false;
  
  const now = Date.now();
  const key = `${component}:${level}:${message}:${JSON.stringify(args)}`;
  
  if (recentLogs[key] && now - recentLogs[key] < loggerConfig.dedupeTimeWindow) {
    recentLogs[key] = now;
    return true;
  }
  
  recentLogs[key] = now;
  return false;
};

// Clean up old entries in recentLogs
setInterval(() => {
  const now = Date.now();
  Object.keys(recentLogs).forEach(key => {
    if (now - recentLogs[key] > loggerConfig.dedupeTimeWindow * 2) {
      delete recentLogs[key];
    }
  });
}, loggerConfig.dedupeTimeWindow * 10);

// Active log groups
const activeGroups = {};

// Environment detection for development mode
const isDev = (window?.process?.env?.NODE_ENV === 'development') || true;

/**
 * Create a logger for a specific component
 */
export default function createLogger(component) {
  // For improved browser console display in browser environment
  const componentStyle = 'color: #0078d4; font-weight: bold';
  const levelStyles = {
    debug: 'color: #6B6B6B',
    info: 'color: #0078D4',
    warn: 'color: #FFA500; font-weight: bold',
    error: 'color: #FF0000; font-weight: bold'
  };
  
  // Create logging functions
  const debugFn = (message, ...args) => {
    if (!shouldLog(component, 'debug')) return;
    if (isDuplicate(component, 'debug', message, args)) return;
    
    if (isDev) {
      console.debug(
        `%c[${component}]%c DEBUG:`, 
        componentStyle, 
        levelStyles.debug, 
        message, 
        ...args
      );
    }
  };
  
  const infoFn = (message, ...args) => {
    if (!shouldLog(component, 'info')) return;
    if (isDuplicate(component, 'info', message, args)) return;
    
    console.info(
      `%c[${component}]%c INFO:`, 
      componentStyle, 
      levelStyles.info, 
      message, 
      ...args
    );
  };
  
  const warnFn = (message, ...args) => {
    if (!shouldLog(component, 'warn')) return;
    if (isDuplicate(component, 'warn', message, args)) return;
    
    console.warn(
      `%c[${component}]%c WARN:`, 
      componentStyle, 
      levelStyles.warn, 
      message, 
      ...args
    );
  };
  
  const errorFn = (message, error, ...args) => {
    console.error(
      `%c[${component}]%c ERROR:`, 
      componentStyle, 
      levelStyles.error, 
      message, 
      error || '', 
      ...args
    );
  };
  
  const groupFn = (operationId, title) => {
    if (!loggerConfig.groupByOperation) return;
    console.group(`%c[${component}]%c ${title}`, componentStyle, 'font-weight: normal');
    activeGroups[operationId] = true;
  };
  
  const groupEndFn = (operationId) => {
    if (!loggerConfig.groupByOperation || !activeGroups[operationId]) return;
    console.groupEnd();
    delete activeGroups[operationId];
  };
  
  // Setup lifecycle tracking for mounting/unmounting
  let mountState = 'none';

  // Create a callable function that also has properties
  const logger = function(message, ...args) {
    // When called directly as a function, use info level
    infoFn(message, ...args);
  };
  
  // Add the methods as properties
  logger.debug = debugFn;
  logger.info = infoFn;
  logger.warn = warnFn;
  logger.error = errorFn;
  logger.group = groupFn;
  logger.groupEnd = groupEndFn;
  
  // Add lifecycle tracking helpers
  logger.mount = () => {
    if (mountState === 'mounted') return;
    mountState = 'mounted';
    debugFn(`Component mounted`);
  };
  
  logger.unmount = () => {
    if (mountState === 'unmounted') return;
    mountState = 'unmounted';
    debugFn(`Component unmounted`);
  };
  
  // Add utility method for stack traces
  logger.trace = (message, ...args) => {
    if (!isDev || !shouldLog(component, 'debug')) return;
    
    console.groupCollapsed(`%c[${component}]%c TRACE:`, componentStyle, 'color: #888', message);
    console.trace(...args);
    console.groupEnd();
  };
  
  return logger;
}

// Configuration utility
createLogger.configureLogger = (newConfig) => {
  Object.assign(loggerConfig, newConfig);
};