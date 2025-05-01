import dotenv from 'dotenv';
import createLogger from './logger.js';
import process from 'process';

dotenv.config();

export const log = createLogger('GitHubAPI');
export const GITHUB_API = process.env.GITHUB_API_URL || 'https://api.github.com';
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const GITHUB_ORG = process.env.GITHUB_ORGANIZATION;

// GitHub Authentication headers
export const getHeaders = () => ({
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
});

// Helper functions for commonly used environment values
export const getBasePath = () => process.env.BASE_PATH || 'C:/Users/pc790/whatsfresh/Projects';
export const getRequirementsSuffix = () => process.env.REQUIREMENTS_SUFFIX || '-requirements';