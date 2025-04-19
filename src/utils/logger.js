// Configuration object for logger
const loggerConfig = {
  // Global log level
  defaultLevel: 'info',
  // Component-specific log levels - only include exceptions to the default
  componentLevels: {
    // Just keep the non-default settings
    'ComponentLife': 'warn',
    'Router': 'warn'
  },
  // Other settings remain the same
  groupByOperation: true,
  dedupeTimeWindow: 500,
  collapseTraces: true,
  showTimestamps: false
};

// Log level numeric values
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Keep track of recent logs to deduplicate
const recentLogs = {};

// Should this log message be displayed based on configured levels?
const shouldLog = (component, level) => {
  // Get component level or default
  const configuredLevel = loggerConfig.componentLevels[component] || loggerConfig.defaultLevel;
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
};

// Check if this is a duplicate log
const isDuplicate = (component, level, message, args) => {
  if (!loggerConfig.dedupeTimeWindow) return false;
  
  const now = Date.now();
  const key = `${component}:${level}:${message}:${JSON.stringify(args)}`;
  
  if (recentLogs[key] && now - recentLogs[key] < loggerConfig.dedupeTimeWindow) {
    // Update timestamp but return true (is duplicate)
    recentLogs[key] = now;
    return true;
  }
  
  // Not a duplicate, update timestamp
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

// Format log message with optional timestamp
const formatMessage = (message) => {
  if (!loggerConfig.showTimestamps) return message;
  
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${
    now.getMinutes().toString().padStart(2, '0')}:${
    now.getSeconds().toString().padStart(2, '0')}.${
    now.getMilliseconds().toString().padStart(3, '0')}`;
  
  return `[${timestamp}] ${message}`;
};

/**
 * Create a logger for a specific component
 * Supports both function-style and method-style logging
 */
const createLogger = (component) => {
  // For improved browser console display
  const componentStyle = 'color: #0078d4; font-weight: bold';
  const levelStyles = {
    debug: 'color: #6B6B6B',
    info: 'color: #0078D4',
    warn: 'color: #FFA500; font-weight: bold',
    error: 'color: #FF0000; font-weight: bold'
  };
  
  // Check if in development mode
  const isDev = window?.process?.env?.NODE_ENV === 'development' || false;

  // Create the actual logger functions
  const debugFn = (message, ...args) => {
    if (isDev && shouldLog(component, 'debug')) {
      if (isDuplicate(component, 'debug', message, args)) return;
      
      console.debug(
        `%c[${component}]%c DEBUG:`, 
        componentStyle, 
        levelStyles.debug, 
        formatMessage(message), 
        ...args
      );
    }
  };
  
  const infoFn = (message, ...args) => {
    if (shouldLog(component, 'info')) {
      if (isDuplicate(component, 'info', message, args)) return;
      
      console.info(
        `%c[${component}]%c INFO:`, 
        componentStyle, 
        levelStyles.info, 
        formatMessage(message), 
        ...args
      );
    }
  };
  
  const warnFn = (message, ...args) => {
    if (isDuplicate(component, 'warn', message, args)) return;
    
    console.warn(
      `%c[${component}]%c WARN:`, 
      componentStyle, 
      levelStyles.warn, 
      formatMessage(message), 
      ...args
    );
  };
  
  const errorFn = (message, ...args) => {
    // Don't deduplicate errors
    console.error(
      `%c[${component}]%c ERROR:`, 
      componentStyle, 
      levelStyles.error, 
      formatMessage(message), 
      ...args
    );
  };
  
  const groupFn = (operationId, title) => {
    if (loggerConfig.groupByOperation) {
      console.group(`%c[${component}]%c ${title}`, componentStyle, 'font-weight: normal');
      activeGroups[operationId] = true;
    }
  };
  
  const groupEndFn = (operationId) => {
    if (loggerConfig.groupByOperation && activeGroups[operationId]) {
      console.groupEnd();
      delete activeGroups[operationId];
    }
  };

  // Setup lifecycle tracking for mounting/unmounting
  let mountState = 'none';
  
  // Create a callable function that also has properties
  const logger = function(message, ...args) {
    // When called directly as a function, use the default level (info)
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
    if (isDev && shouldLog(component, 'debug')) {
      console.groupCollapsed(`%c[${component}]%c TRACE:`, componentStyle, 'color: #888', message);
      console.trace(...args);
      console.groupEnd();
    }
  };
  
  return logger;
};

export default createLogger;

// Export configuration - allows dynamic adjustment of log levels
export const configureLogger = (newConfig) => {
  Object.assign(loggerConfig, newConfig);
};


