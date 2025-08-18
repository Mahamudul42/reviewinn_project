// Utility functions for safely accessing environment variables

export const isDevelopment = (): boolean => {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
};

export const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  // Check Vite environment variables first (import.meta.env)
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    const viteValue = import.meta.env[key];
    if (viteValue !== undefined) {
      return viteValue;
    }
  }
  
  // Fallback to process.env for Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};