// Browser-compatible process env variables
export const process = {
  env: {
    NODE_ENV: import.meta.env.NODE_ENV || 'development',
    GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN
  }
};

// API configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3006',
  GITHUB_API: '/api/github'
};