import { useState, useEffect } from 'react';  // Remove 'React' since no JSX
import { configureStore } from '@reduxjs/toolkit';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import createLogger from './logger';

const log = createLogger('ExternalStore');

const initialState = {};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_VARS':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const store = configureStore({
  reducer: reducer
});

const setVars = (vars) => {
  const prevState = store.getState();
  store.dispatch({ type: 'SET_VARS', payload: vars });
  const updatedState = store.getState();
  
  if (process.env.NODE_ENV === 'development') {
    Object.keys(vars).forEach(key => {
      const newValue = updatedState[key];
      const oldValue = prevState[key];
      
      if (oldValue !== newValue) {
        if (key.toLowerCase().includes('mode')) {
          log.info(`Mode changed: ${key}`, {
            newValue,
            previousValue: oldValue || 'undefined'
          });
        } else if (Array.isArray(newValue)) {
          const oldLength = oldValue ? oldValue.length : 0;
          const newLength = newValue.length;
          if (oldLength !== newLength) {
            log.info(`Array changed: ${key}`, { 
              previousLength: oldLength, 
              newLength 
            });
          }
        } else if (key === 'formMode') {
          log.info(`Form mode changed`, {
            newValue,
            previousValue: oldValue || 'undefined'
          });
        } else {
          log.info(`Variable set: ${key}`, { value: newValue });
        }
      }
    });
  }
};

const getVars = (vars) => {
  const state = store.getState();
  
  if (!Array.isArray(vars)) {
    log.error('getVars expects an array of variable names');
    return {};
  }

  return vars.reduce((acc, key) => {
    if (state.hasOwnProperty(key)) {
      acc[key] = state[key];
    }
    return acc;
  }, {});
};

const getVar = (variableName) => {
  const state = store.getState();
  return state.hasOwnProperty(variableName) ? state[variableName] : null;
};

const setVar = (key, value) => {
  setVars({ [key]: value });
  return getVar(key);
};

// Subscribers map for managing subscriptions
const subscribers = {};

// Updated subscribe function for better error handling
const subscribe = (key, listener) => {
  // Validate listener is a function
  if (typeof listener !== 'function') {
    console.error('Subscribe requires a function listener', { key, listener });
    return () => {}; // Return no-op unsubscribe function
  }
  
  // Create a unique ID for this subscription
  const subscriptionId = `${key}_${Date.now()}_${Math.random()}`;
  
  // Store both the listener and subscription ID
  const subscription = {
    listener,
    id: subscriptionId
  };
  
  // Add to subscribers
  if (!subscribers[key]) {
    subscribers[key] = new Map();
  }
  subscribers[key].set(subscriptionId, subscription);
  
  // Return unsubscribe function with better cleanup
  return () => {
    if (subscribers[key]) {
      subscribers[key].delete(subscriptionId);
      
      // Clean up empty maps
      if (subscribers[key].size === 0) {
        delete subscribers[key];
      }
    }
  };
};

const listVars = () => {
  const state = store.getState();
  
  const formattedState = Object.entries(state).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = `[Array with ${value.length} items]`;
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = '{Object}';
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  log.info('Current state variables', formattedState);
  return state;
};

const useExternalStore = () => {
  return useSyncExternalStore(
    () => store.subscribe(() => {}),
    () => store.getState(),
    () => store.getState()
  );
};

const clearAllVars = () => {
  // Dispatch clear action directly without trying to notify listeners
  // Redux's built-in subscribe will handle notification
  store.dispatch({ type: 'SET_VARS', payload: {} });
  log.info('All variables cleared');
};

// Rename to follow React hook naming convention
const usePollVar = (varName, defaultValue = null, interval = 100, debug = false) => {
  const [value, valueue] = useState(() => {
    const initialValue = getVar(varName);
    return initialValue !== null ? initialValue : defaultValue;
  });
  
  useEffect(() => {
    // Only log when debug is enabled
    if (debug) {
      log.debug(`Started polling: ${varName}`, { 
        initialValue: value,
        interval
      });
    }
    
    const intervalId = setInterval(() => {
      const currentValue = getVar(varName);
      
      valueue(prevValue => {
        if (currentValue !== prevValue) {
          if (debug) {
            log.debug(`${varName} changed via polling`, {
              from: prevValue,
              to: currentValue
            });
          }
          return currentValue !== null ? currentValue : defaultValue;
        }
        return prevValue;
      });
    }, interval);
    
    return () => {
      if (debug) {
        log.debug(`Stopped polling: ${varName}`);
      }
      clearInterval(intervalId);
    };
  }, [varName, interval, defaultValue, debug, value]); // Added 'value' to dependencies
  
  return value;
};

const triggerAction = (actionName, payload = Date.now()) => {
  setVar(`%${actionName}`, payload);
};

const useActionTrigger = (actionName, defaultValue = null) => {
  return usePollVar(`%${actionName}`, defaultValue);
};

const getActionValue = (actionName) => {
  return getVar(`%${actionName}`);
};

// Add a new function that combines subscription with effect
const useActionEffect = (actionName, effect, dependencies = []) => {
  useEffect(() => {
    // Create the subscription
    const unsubscribe = subscribe(`%${actionName}`, (payload) => {
      effect(payload);
    });
    
    // Clean up on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

export { 
  setVars, 
  listVars, 
  getVar, 
  setVar,
  useExternalStore, 
  subscribe, 
  getVars,
  clearAllVars,
  usePollVar,
  triggerAction,
  useActionTrigger,
  getActionValue,
  useActionEffect
};

export default store;
