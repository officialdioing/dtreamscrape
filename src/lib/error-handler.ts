/**
 * Comprehensive Error Handling Utility
 * Provides consistent error handling across the application
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EMAIL = 'EMAIL_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL_ERROR',
}

export interface AppError extends Error {
  type: ErrorType;
  statusCode: number;
  context?: Record<string, unknown>;
  isOperational: boolean;
}

export class ErrorHandler {
  /**
   * Creates a standardized application error
   */
  static createError(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ): AppError {
    const error = new Error(message) as AppError;
    error.type = type;
    error.statusCode = statusCode;
    error.context = context;
    error.isOperational = true;
    return error;
  }

  /**
   * Logs error with context
   */
  static logError(error: Error | AppError, additionalContext?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const context = (error as AppError).context || {};

    console.error(`[${timestamp}] Error:`, {
      message: error.message,
      type: (error as AppError).type || 'UNKNOWN',
      stack: error.stack,
      ...context,
      ...additionalContext,
    });
  }

  /**
   * Handles database errors
   */
  static handleDatabaseError(error: { code?: string; message?: string }, context?: Record<string, unknown>): AppError {
    const errorMessage = error?.message || 'Database operation failed';

    // Check for specific database error codes
    if (error?.code === '23505') {
      return this.createError(
        'A record with this information already exists',
        ErrorType.CONFLICT,
        409,
        { ...context, originalError: errorMessage }
      );
    }

    if (error?.code === '23503') {
      return this.createError(
        'Referenced record does not exist',
        ErrorType.VALIDATION,
        400,
        { ...context, originalError: errorMessage }
      );
    }

    if (error?.code === 'PGRST116') {
      return this.createError(
        'Resource not found',
        ErrorType.NOT_FOUND,
        404,
        context
      );
    }

    return this.createError(
      'Database operation failed',
      ErrorType.DATABASE,
      500,
      { ...context, originalError: errorMessage }
    );
  }

  /**
   * Handles email sending errors
   */
  static handleEmailError(error: { message?: string }, recipient?: string): AppError {
    return this.createError(
      'Failed to send email',
      ErrorType.EMAIL,
      500,
      {
        recipient,
        originalError: error?.message || 'Unknown email error',
      }
    );
  }

  /**
   * Handles file upload errors
   */
  static handleFileUploadError(error: { message?: string }, fileName?: string): AppError {
    return this.createError(
      'Failed to upload file',
      ErrorType.FILE_UPLOAD,
      500,
      {
        fileName,
        originalError: error?.message || 'Unknown upload error',
      }
    );
  }

  /**
   * Handles validation errors
   */
  static handleValidationError(
    issues: Array<{ path: string[]; message: string }>,
    context?: Record<string, unknown>
  ): AppError {
    return this.createError(
      'Validation failed',
      ErrorType.VALIDATION,
      400,
      {
        ...context,
        issues,
      }
    );
  }

  /**
   * Formats error for API response
   */
  static formatErrorResponse(error: Error | AppError): {
    error: string;
    type?: string;
    context?: Record<string, unknown>;
    statusCode: number;
  } {
    const appError = error as AppError;

    return {
      error: appError.message,
      type: appError.type,
      context: appError.isOperational ? appError.context : undefined,
      statusCode: appError.statusCode || 500,
    };
  }

  /**
   * Wraps async functions with error handling
   */
  static async asyncWrapper<T>(
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        this.logError(error, context);
        throw error;
      }
      throw this.createError(
        'An unexpected error occurred',
        ErrorType.INTERNAL,
        500,
        context
      );
    }
  }

  /**
   * Retry logic for failed operations
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: Record<string, unknown>
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.logError(lastError, { ...context, attempt, maxRetries });

        if (attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError!;
  }
}

/**
 * Creates a NextResponse error response
 */
export function createErrorResponse(
  error: Error | AppError,
  includeStack: boolean = false
): Response {
  const { error: message, type, context, statusCode } = ErrorHandler.formatErrorResponse(error as AppError);

  const responseBody: Record<string, unknown> = {
    error: message,
    type,
  };

  if (context && Object.keys(context).length > 0) {
    responseBody.context = context;
  }

  if (includeStack && (error as Error).stack) {
    responseBody.stack = (error as Error).stack;
  }

  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
