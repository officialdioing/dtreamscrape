/**
 * Common Error Scenarios and Pre-defined Error Messages
 * Provides consistent error messages for frequent error scenarios
 */

import { ErrorHandler, ErrorType, type AppError } from './error-handler';

export const CommonErrors = {
  // Authentication & Authorization
  unauthorized: (context?: Record<string, unknown>) =>
    ErrorHandler.createError(
      'You must be logged in to perform this action',
      ErrorType.AUTHENTICATION,
      401,
      context
    ),

  forbidden: (action?: string, context?: Record<string, unknown>) =>
    ErrorHandler.createError(
      action
        ? `You do not have permission to ${action}`
        : 'You do not have permission to perform this action',
      ErrorType.AUTHORIZATION,
      403,
      context
    ),

  // Validation Errors
  invalidEmail: (email?: string) =>
    ErrorHandler.createError(
      'Please provide a valid email address',
      ErrorType.VALIDATION,
      400,
      { providedEmail: email }
    ),

  invalidPhone: (phone?: string) =>
    ErrorHandler.createError(
      'Please provide a valid phone number',
      ErrorType.VALIDATION,
      400,
      { providedPhone: phone }
    ),

  invalidDate: (date?: string, format: string = 'YYYY-MM-DD') =>
    ErrorHandler.createError(
      `Invalid date format. Please use ${format}`,
      ErrorType.VALIDATION,
      400,
      { providedDate: date, expectedFormat: format }
    ),

  missingRequiredField: (fieldName: string | string[]) =>
    ErrorHandler.createError(
      `Missing required field${Array.isArray(fieldName) && fieldName.length > 1 ? 's' : ''}: ${Array.isArray(fieldName) ? fieldName.join(', ') : fieldName}`,
      ErrorType.VALIDATION,
      400,
      { missingFields: Array.isArray(fieldName) ? fieldName : [fieldName] }
    ),

  invalidFileType: (allowedTypes: string[]) =>
    ErrorHandler.createError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorType.VALIDATION,
      400,
      { allowedTypes }
    ),

  fileTooLarge: (fileName: string, maxSize: string) =>
    ErrorHandler.createError(
      `File "${fileName}" exceeds maximum size of ${maxSize}`,
      ErrorType.VALIDATION,
      400,
      { fileName, maxSize }
    ),

  // Database Errors
  recordNotFound: (resource: string, identifier?: Record<string, unknown>) =>
    ErrorHandler.createError(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      404,
      identifier
    ),

  recordAlreadyExists: (resource: string, conflictField?: string) =>
    ErrorHandler.createError(
      `A ${resource} with this ${conflictField || 'information'} already exists`,
      ErrorType.CONFLICT,
      409,
      { resource, conflictField }
    ),

  databaseOperationFailed: (operation: string, table: string) =>
    ErrorHandler.createError(
      `Failed to ${operation} ${table}`,
      ErrorType.DATABASE,
      500,
      { operation, table }
    ),

  // Booking Errors
  slotNotAvailable: (date: string, time: string) =>
    ErrorHandler.createError(
      'This time slot is no longer available. Please choose another time.',
      ErrorType.CONFLICT,
      409,
      { date, time }
    ),

  invalidBookingDate: (date: string, reason?: string) =>
    ErrorHandler.createError(
      reason || 'Invalid booking date. Please choose a future date.',
      ErrorType.VALIDATION,
      400,
      { date, reason }
    ),

  // File Upload Errors
  fileUploadFailed: (fileName: string, reason?: string) =>
    ErrorHandler.createError(
      reason || `Failed to upload file "${fileName}"`,
      ErrorType.FILE_UPLOAD,
      500,
      { fileName, reason }
    ),

  noFilesProvided: () =>
    ErrorHandler.createError(
      'No files provided',
      ErrorType.VALIDATION,
      400,
      {}
    ),

  // Email Errors
  emailSendFailed: (recipient?: string) =>
    ErrorHandler.createError(
      'Failed to send email',
      ErrorType.EMAIL,
      500,
      { recipient }
    ),

  // Rate Limiting
  rateLimitExceeded: (limit: number, window: string) =>
    ErrorHandler.createError(
      `Too many requests. Please try again later.`,
      ErrorType.RATE_LIMIT,
      429,
      { limit, window }
    ),

  // External Service Errors
  externalServiceError: (service: string, action?: string) =>
    ErrorHandler.createError(
      `Failed to ${action || 'connect to'} ${service}. Please try again.`,
      ErrorType.INTERNAL,
      500,
      { service, action }
    ),

  googleCalendarSyncFailed: (reason?: string) =>
    ErrorHandler.createError(
      reason || 'Failed to sync with Google Calendar',
      ErrorType.INTERNAL,
      500,
      { service: 'Google Calendar', reason }
    ),

  // Generic Errors
  internalServerError: (operation?: string) =>
    ErrorHandler.createError(
      operation
        ? `An error occurred while ${operation}`
        : 'An unexpected error occurred. Please try again.',
      ErrorType.INTERNAL,
      500,
      { operation }
    ),

  invalidJson: () =>
    ErrorHandler.createError(
      'Invalid JSON in request body',
      ErrorType.VALIDATION,
      400,
      {}
    ),

  missingParameter: (param: string | string[]) =>
    ErrorHandler.createError(
      `Missing required parameter${Array.isArray(param) && param.length > 1 ? 's' : ''}: ${Array.isArray(param) ? param.join(', ') : param}`,
      ErrorType.VALIDATION,
      400,
      { missingParams: Array.isArray(param) ? param : [param] }
    ),
};

/**
 * Helper function to check if an error is of a specific type
 */
export function isErrorType(error: unknown, type: ErrorType): boolean {
  return (
    error instanceof Error &&
    (error as AppError).type === type
  );
}

/**
 * Helper function to get error status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof Error && (error as AppError).statusCode) {
    return (error as AppError).statusCode;
  }
  return 500;
}

/**
 * Helper function to check if error is recoverable (should retry)
 */
export function isRecoverableError(error: unknown): boolean {
  if (!error) return false;

  const appError = error as AppError;
  const recoverableTypes = [
    ErrorType.EMAIL,
    ErrorType.INTERNAL,
  ];

  return recoverableTypes.includes(appError.type);
}

/**
 * Helper function to get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (!error || !(error instanceof Error)) {
    return 'An unexpected error occurred';
  }

  const appError = error as AppError;

  // Map error types to user-friendly messages
  const messages: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: 'Please check your input and try again.',
    [ErrorType.DATABASE]: 'Unable to save your changes. Please try again.',
    [ErrorType.EMAIL]: 'Notification email could not be sent.',
    [ErrorType.FILE_UPLOAD]: 'Unable to upload file. Please try again.',
    [ErrorType.AUTHENTICATION]: 'Please log in to continue.',
    [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
    [ErrorType.RATE_LIMIT]: 'Please wait a moment before trying again.',
    [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorType.CONFLICT]: 'This action conflicts with existing data. Please refresh and try again.',
    [ErrorType.INTERNAL]: 'Something went wrong. Please try again.',
  };

  return messages[appError.type] || 'An unexpected error occurred. Please try again.';
}
