/**
 * Server-specific logger implementation
 */
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Common configuration - keep in sync with client version
const loggerConfig = {
  defaultLevel: 'info',
  componentLevels: {
    'ComponentLife': 'warn',
    'Router': 'warn',
    'CodeAnalyzer': 'debug'
  },
  groupByOperation: true,
  showTimestamps: true
};

// Log level numeric values
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Should this log message be displayed based on configured levels?
const shouldLog = (component, level) => {
  const configuredLevel = loggerConfig.componentLevels[component] || loggerConfig.defaultLevel;
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
};

// Ensure logs directory exists
const logDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: loggerConfig.defaultLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, component, ...meta }) => {
      return `[${timestamp}] [${component || 'Server'}] ${level.toUpperCase()}: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
      }`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

/**
 * Create a logger for a specific component
 */
function createLogger(component) {
  // Helper to format args for Winston
  const formatNodeArgs = (args) => {
    if (!args || args.length === 0) return {};
    
    // If the first arg is an object, use it as metadata
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      return args[0];
    }
    
    // Otherwise convert to a data property
    return { data: args };
  };

  const logger = function(message, ...args) {
    // When called directly as a function, use info level
    if (shouldLog(component, 'info')) {
      winstonLogger.info(message, { component, ...formatNodeArgs(args) });
    }
  };
  
  logger.debug = (message, ...args) => {
    if (shouldLog(component, 'debug')) {
      winstonLogger.debug(message, { component, ...formatNodeArgs(args) });
    }
  };
  
  logger.info = (message, ...args) => {
    if (shouldLog(component, 'info')) {
      winstonLogger.info(message, { component, ...formatNodeArgs(args) });
    }
  };
  
  logger.warn = (message, ...args) => {
    if (shouldLog(component, 'warn')) {
      winstonLogger.warn(message, { component, ...formatNodeArgs(args) });
    }
  };
  
  logger.error = (message, error, ...args) => {
    // Don't filter errors by level - they're important
    const errorData = error ? { errorMessage: error.message, stack: error.stack } : {};
    winstonLogger.error(message, { component, ...errorData, ...formatNodeArgs(args) });
  };
  
  logger.group = (operationId, title) => {
    if (loggerConfig.groupByOperation) {
      winstonLogger.info(`GROUP: ${title}`, { component, operationId });
    }
  };
  
  logger.groupEnd = (operationId) => {
    if (loggerConfig.groupByOperation) {
      winstonLogger.info(`GROUP END`, { component, operationId });
    }
  };
  
  logger.trace = (message, ...args) => {
    winstonLogger.debug(`TRACE: ${message}`, { component, trace: new Error().stack, ...formatNodeArgs(args) });
  };
  
  return logger;
}

// Configuration utility
createLogger.configureLogger = (newConfig) => {
  Object.assign(loggerConfig, newConfig);
  // Update Winston logger level if default changed
  if (newConfig.defaultLevel) {
    winstonLogger.level = newConfig.defaultLevel;
  }
};

// Make sure it's exporting correctly for ES modules:
export default createLogger;