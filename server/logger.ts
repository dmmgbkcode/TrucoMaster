// Logger utility for detailed logs
import { log as viteLog } from './vite';

// Define debug levels
const DEBUG_LEVELS: Record<string, boolean> = {
  'socket-debug': true, // Enable detailed socket debugging
  'game-debug': true    // Enable detailed game debugging
};

/**
 * Enhanced logging function that respects debug levels
 */
export function log(message: string, source = "express") {
  // Skip debug logs if the debug level is not enabled
  if (source.endsWith('-debug') && !DEBUG_LEVELS[source]) {
    return;
  }
  
  // Use original log function from vite.ts
  viteLog(message, source);
}

/**
 * Log detailed debug information
 */
export function logDebug(message: string, source = "debug") {
  log(message, `${source}-debug`);
}

/**
 * Log error information
 */
export function logError(message: string, error?: any, source = "error") {
  let errorMessage = message;
  
  // Add error details if provided
  if (error) {
    if (error instanceof Error) {
      errorMessage += ` - ${error.message}`;
      if (error.stack) {
        errorMessage += `\n${error.stack}`;
      }
    } else {
      errorMessage += ` - ${String(error)}`;
    }
  }
  
  log(errorMessage, source);
}