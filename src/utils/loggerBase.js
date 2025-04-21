/**
 * Base logger configuration shared between browser and server
 */

// Common configuration
export const loggerConfig = {
  defaultLevel: 'info',
  componentLevels: {
    'ComponentLife': 'warn',
    'Router': 'warn',
    'CodeAnalyzer': 'debug'
  },
  groupByOperation: true,
  dedupeTimeWindow: 500,
  collapseTraces: true,
  showTimestamps: false
};

// Log level numeric values
export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Helper functions
export function shouldLog(component, level) {
  const configuredLevel = loggerConfig.componentLevels[component] || loggerConfig.defaultLevel;
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

export function formatTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${
    now.getMinutes().toString().padStart(2, '0')}:${
    now.getSeconds().toString().padStart(2, '0')}.${
    now.getMilliseconds().toString().padStart(3, '0')}`;
}