/**
 * Professional Messaging Service Response Handler
 * Centralized response processing and error handling
 */

import { ProfessionalMessagingResponse, MessagingErrorCodes } from './types';

export class MessagingResponseHandler {
  /**
   * Standardize API response handling with proper typing
   */
  static handleResponse<T>(response: unknown, options?: {
    fallbackData?: T;
    operation?: string;
    requireData?: boolean;
  }): ProfessionalMessagingResponse<T> {
    const { fallbackData, operation = 'operation', requireData = false } = options || {};

    try {
      // If response is already in the correct format
      if (response && typeof response.success === 'boolean') {
        return response as ProfessionalMessagingResponse<T>;
      }

      // If response has nested data structure (common API pattern)
      if (response?.data?.success !== undefined) {
        return {
          success: response.data.success,
          message: response.data.message || `${operation} successful`,
          data: response.data.data || response.data
        };
      }

      // If response has direct data
      if (response?.data) {
        return {
          success: true,
          message: `${operation} successful`,
          data: response.data
        };
      }

      // Direct response case
      if (response && !requireData) {
        return {
          success: true,
          message: `${operation} successful`,
          data: response
        };
      }

      // Fallback response
      if (fallbackData !== undefined) {
        return {
          success: true,
          message: `${operation} successful`,
          data: fallbackData
        };
      }

      // If we require data but don't have it
      if (requireData) {
        throw new Error(`${operation} failed: No data received`);
      }

      // Default success response
      return {
        success: true,
        message: `${operation} successful`,
        data: response as T
      };
    } catch (error) {
      return this.handleError(error, operation);
    }
  }

  /**
   * Enhanced error handling with specific error codes
   */
  static handleError<T>(error: unknown, operation: string = 'operation'): ProfessionalMessagingResponse<T> {
    // Log error for debugging (can be disabled in production)

    if (error instanceof Error) {
      // Map common HTTP errors to messaging-specific error codes
      const errorCode = this.mapErrorToCode(error.message);
      
      return {
        success: false,
        message: this.getErrorMessage(errorCode, operation),
        error: error.message
      };
    }

    // Handle network/fetch errors
    if (typeof error === 'object' && error !== null) {
      const anyError = error as { name?: string; message?: string; status?: number };
      
      if (anyError.name === 'TypeError' && anyError.message.includes('fetch')) {
        return {
          success: false,
          message: 'Network error. Please check your connection.',
          error: 'NETWORK_ERROR'
        };
      }

      if (anyError.status) {
        const statusCode = Number(anyError.status);
        const errorCode = this.mapStatusToCode(statusCode);
        
        return {
          success: false,
          message: this.getErrorMessage(errorCode, operation),
          error: `HTTP_${statusCode}`
        };
      }
    }

    return {
      success: false,
      message: `${operation} failed: Unknown error occurred`,
      error: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Map error messages to specific error codes
   */
  private static mapErrorToCode(errorMessage: string): MessagingErrorCodes {
    const message = errorMessage.toLowerCase();

    if (message.includes('conversation') && message.includes('not found')) {
      return MessagingErrorCodes.CONVERSATION_NOT_FOUND;
    }
    if (message.includes('message') && message.includes('not found')) {
      return MessagingErrorCodes.MESSAGE_NOT_FOUND;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return MessagingErrorCodes.PERMISSION_DENIED;
    }
    if (message.includes('not in conversation') || message.includes('not a member')) {
      return MessagingErrorCodes.USER_NOT_IN_CONVERSATION;
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return MessagingErrorCodes.RATE_LIMIT_EXCEEDED;
    }
    if (message.includes('file') && message.includes('large')) {
      return MessagingErrorCodes.FILE_TOO_LARGE;
    }
    if (message.includes('websocket') || message.includes('ws')) {
      return MessagingErrorCodes.WEBSOCKET_CONNECTION_FAILED;
    }

    return MessagingErrorCodes.PERMISSION_DENIED; // Default fallback
  }

  /**
   * Map HTTP status codes to error codes
   */
  private static mapStatusToCode(status: number): MessagingErrorCodes {
    switch (status) {
      case 401:
      case 403:
        return MessagingErrorCodes.PERMISSION_DENIED;
      case 404:
        return MessagingErrorCodes.CONVERSATION_NOT_FOUND;
      case 413:
        return MessagingErrorCodes.FILE_TOO_LARGE;
      case 429:
        return MessagingErrorCodes.RATE_LIMIT_EXCEEDED;
      default:
        return MessagingErrorCodes.PERMISSION_DENIED;
    }
  }

  /**
   * Get user-friendly error messages
   */
  private static getErrorMessage(errorCode: MessagingErrorCodes, operation: string): string {
    switch (errorCode) {
      case MessagingErrorCodes.CONVERSATION_NOT_FOUND:
        return 'Conversation not found or no longer accessible';
      case MessagingErrorCodes.MESSAGE_NOT_FOUND:
        return 'Message not found or has been deleted';
      case MessagingErrorCodes.PERMISSION_DENIED:
        return 'Permission denied. Please check your access rights';
      case MessagingErrorCodes.USER_NOT_IN_CONVERSATION:
        return 'You are not a member of this conversation';
      case MessagingErrorCodes.INVALID_MESSAGE_TYPE:
        return 'Invalid message type provided';
      case MessagingErrorCodes.FILE_TOO_LARGE:
        return 'File size exceeds the maximum limit';
      case MessagingErrorCodes.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please wait a moment before trying again';
      case MessagingErrorCodes.WEBSOCKET_CONNECTION_FAILED:
        return 'Real-time connection failed. Messages may not update automatically';
      default:
        return `${operation} failed. Please try again`;
    }
  }

  /**
   * Create mock response for development
   */
  static createMockResponse<T>(data: T, options?: {
    success?: boolean;
    message?: string;
    delay?: number;
  }): Promise<ProfessionalMessagingResponse<T>> {
    const { success = true, message = 'Mock operation successful', delay = 0 } = options || {};

    const response: ProfessionalMessagingResponse<T> = {
      success,
      message,
      data
    };

    if (delay > 0) {
      return new Promise(resolve => setTimeout(() => resolve(response), delay));
    }

    return Promise.resolve(response);
  }

  /**
   * Validate response data structure
   */
  static validateResponse<T>(response: unknown, validator?: (data: unknown) => boolean): response is ProfessionalMessagingResponse<T> {
    if (!response || typeof response !== 'object') {
      return false;
    }

    if (typeof response.success !== 'boolean') {
      return false;
    }

    if (validator && response.data && !validator(response.data)) {
      return false;
    }

    return true;
  }
}