/**
 * Auth System Initialization
 * 
 * This module initializes the unified auth system and provides the auth manager
 * instance that useUnifiedAuth depends on.
 */

import { initializeAuthManager, getAuthManager } from './authInterface';
import { ReviewInnAuthService } from './ReviewInnAuthService';

let isInitialized = false;

export const initializeAuthSystem = () => {
  if (isInitialized) {
    return getAuthManager();
  }

  console.log('AuthInit: Initializing unified auth system...');
  
  // Create the ReviewInn auth service instance
  const reviewInnAuthService = new ReviewInnAuthService();
  
  // Initialize the auth manager with the ReviewInn service
  const authManager = initializeAuthManager(reviewInnAuthService);
  
  isInitialized = true;
  console.log('AuthInit: Unified auth system initialized successfully');
  
  return authManager;
};

// Auto-initialize when this module is loaded
export const authManager = initializeAuthSystem();