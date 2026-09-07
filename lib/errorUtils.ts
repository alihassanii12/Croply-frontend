/**
 * Error handling utilities for better user experience
 */

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

/**
 * Parse API error response and return user-friendly message
 */
export function parseApiError(error: unknown): ApiError {
  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return { message: error.message };
  }

  // Handle API response errors
  if (error && typeof error === 'object') {
    const errorObj = error as any;

    // Check for common API error formats
    if (errorObj.detail) {
      return { message: errorObj.detail };
    }

    if (errorObj.message) {
      return { message: errorObj.message };
    }

    // Handle validation errors
    if (errorObj.errors && Array.isArray(errorObj.errors)) {
      const firstError = errorObj.errors[0];
      return {
        message: firstError.message || firstError,
        field: firstError.field
      };
    }

    // Handle field-specific errors
    const fields = Object.keys(errorObj);
    if (fields.length > 0) {
      const field = fields[0];
      const fieldError = errorObj[field];
      
      let message = '';
      if (Array.isArray(fieldError)) {
        message = fieldError[0];
      } else if (typeof fieldError === 'string') {
        message = fieldError;
      }

      return {
        message: message || 'Invalid input',
        field: field
      };
    }
  }

  // Default fallback
  return { message: 'Something went wrong. Please try again.' };
}

/**
 * Get user-friendly error message for common scenarios
 */
export function getFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (lowerMessage.includes('fetch') || lowerMessage.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
    return 'Authentication failed. Please log in again.';
  }

  // Server errors
  if (lowerMessage.includes('server error') || lowerMessage.includes('500')) {
    return 'Server is temporarily unavailable. Please try again later.';
  }

  // Validation errors
  if (lowerMessage.includes('validation')) {
    return 'Please check your input and try again.';
  }

  // Model API errors
  if (lowerMessage.includes('inference service')) {
    return 'AI service is starting up. Please try again in a moment.';
  }

  // Generic 502/503 errors
  if (lowerMessage.includes('bad gateway') || lowerMessage.includes('unavailable')) {
    return 'Service is temporarily unavailable. Please try again in a moment.';
  }

  // Return original message if no friendly version found
  return message;
}

/**
 * Show toast notification for errors (if you have a toast system)
 */
export function showErrorToast(error: unknown) {
  const { message } = parseApiError(error);
  const friendlyMessage = getFriendlyErrorMessage(message);
  
  // You can integrate with your preferred toast library here
  console.error('Error:', friendlyMessage);
  
  // For now, just return the message
  return friendlyMessage;
}