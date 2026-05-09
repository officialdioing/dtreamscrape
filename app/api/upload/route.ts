import { NextRequest, NextResponse } from 'next/server';
import { uploadFiles } from '@/src/lib/supabase-storage';
import { rateLimitMiddleware } from '@/src/lib/rate-limit';
import { ErrorHandler, ErrorType, createErrorResponse } from '@/src/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 'upload');
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const formData = await request.formData().catch((error) => {
      throw ErrorHandler.createError(
        'Invalid form data',
        ErrorType.VALIDATION,
        400,
        { originalError: error.message }
      );
    });

    const files = formData.getAll('files') as File[];
    const path = formData.get('path') as string | undefined;

    // Validate that files exist
    if (!files || files.length === 0) {
      throw ErrorHandler.createError(
        'No files provided',
        ErrorType.VALIDATION,
        400,
        { receivedFiles: files?.length || 0 }
      );
    }

    // Filter out non-file values (formData.getAll might include empty strings)
    const validFiles = files.filter(file => file instanceof File && file.size > 0);

    if (validFiles.length === 0) {
      throw ErrorHandler.createError(
        'No valid files provided',
        ErrorType.VALIDATION,
        400,
        { totalFiles: files.length, validFiles: 0 }
      );
    }

    // Validate file sizes (max 10MB each)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = validFiles.filter(file => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      throw ErrorHandler.createError(
        `Files exceed maximum size of 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`,
        ErrorType.VALIDATION,
        400,
        {
          maxSize: '10MB',
          oversizedFiles: oversizedFiles.map(f => ({ name: f.name, size: f.size }))
        }
      );
    }

    // Upload files
    const { data: uploadedFiles, errors } = await uploadFiles(
      validFiles,
      'booking-files',
      path
    ).catch((error) => {
      throw ErrorHandler.handleFileUploadError(error, validFiles.map(f => f.name).join(', '));
    });

    // Return results
    return NextResponse.json({
      files: uploadedFiles,
      errors: errors,
      success: uploadedFiles.length > 0,
      message: uploadedFiles.length > 0
        ? `Successfully uploaded ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`
        : 'No files were uploaded successfully',
    });

  } catch (error) {
    const appError = error instanceof Error ? error : ErrorHandler.createError(
      'File upload failed',
      ErrorType.FILE_UPLOAD,
      500
    );
    ErrorHandler.logError(appError, { operation: 'file_upload' });
    return createErrorResponse(appError);
  }
}
