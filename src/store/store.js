import { createStore } from 'zustand/vanilla';
import { useStore as useZustand } from 'zustand';
import createLogger from '../utils/logger';

// Create logger for store operations
const log = createLogger('ExternalStore');

// Create a vanilla store
const store = createStore((set) => ({
  currentRepo: null,
  selectedIssues: {},
  
  // Actions to modify state
  setCurrentRepo: (repo) => {
    log.info('Variable set: currentRepo', { value: repo });
    set({ currentRepo: repo });
    // Also trigger a timestamp for repo selection events
    set({ [`%REPO_SELECTED`]: Date.now() });
  },
  
  setSelectedIssues: (issues) => {
    log.info('Variable set: selectedIssues', { value: issues });
    set({ selectedIssues: issues });
    // Also trigger a timestamp for issue selection events
    set({ [`%ISSUE_SELECTED`]: Date.now() });
  }
}));

// React hook to use the store
export const useStore = () => useZustand(store);

// Export actions for easier imports
export const { setCurrentRepo, setSelectedIssues } = store.getState();