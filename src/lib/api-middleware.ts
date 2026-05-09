import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler, ErrorType, AppError, createErrorResponse } from '@/src/lib/error-handler';

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): AppError | null {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    return ErrorHandler.createError(
      `Missing required fields: ${missingFields.join(', ')}`,
      ErrorType.VALIDATION,
      400,
      { missingFields, providedFields: Object.keys(body) }
    );
  }

  return null;
}

/**
 * Validates request body with JSON parsing
 */
export async function parseAndValidateBody<T = any>(
  request: NextRequest,
  schema?: { safeParse: (data: any) => { success: boolean; error?: any; data?: T } }
): Promise<T> {
  try {
    const body = await request.json();

    if (schema) {
      const validationResult = schema.safeParse(body);
      if (!validationResult.success) {
        throw ErrorHandler.handleValidationError(
          validationResult.error.issues,
          { requestBody: body }
        );
      }
      return validationResult.data as T;
    }

    return body as T;
  } catch (error) {
    if (error instanceof Error && (error as AppError).type === ErrorType.VALIDATION) {
      throw error;
    }

    throw ErrorHandler.createError(
      'Invalid JSON in request body',
      ErrorType.VALIDATION,
      400,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Wraps API route handlers with consistent error handling
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    rateLimitKey?: string;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const appError = error instanceof Error
        ? error as AppError
        : ErrorHandler.createError(
            'An unexpected error occurred',
            ErrorType.INTERNAL,
            500,
            { path: request.nextUrl.pathname }
          );

      ErrorHandler.logError(appError, {
        method: request.method,
        path: request.nextUrl.pathname,
        headers: Object.fromEntries(request.headers.entries()),
      });

      return createErrorResponse(appError) as any;
    }
  };
}

/**
 * Validates query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  requiredParams: string[]
): AppError | null {
  const params = Object.fromEntries(searchParams.entries());
  const missingParams = requiredParams.filter(param => !params[param]);

  if (missingParams.length > 0) {
    return ErrorHandler.createError(
      `Missing required query parameters: ${missingParams.join(', ')}`,
      ErrorType.VALIDATION,
      400,
      { missingParams, providedParams: Object.keys(params) }
    );
  }

  return null;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  const responseBody: Record<string, any> = {
    success: true,
    data,
  };

  if (message) {
    responseBody.message = message;
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * Creates a standardized paginated response
 */
export function createPaginatedResponse(
  items: any[],
  total: number,
  page: number,
  pageSize: number
): NextResponse {
  return createSuccessResponse({
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
    },
  });
}
