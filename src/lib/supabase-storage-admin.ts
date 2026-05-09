import { supabaseAdmin } from './supabase-admin';
import { ErrorHandler, ErrorType } from '@/src/lib/error-handler';

const BUCKET_NAME = 'media';

// File type validation
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Retry configuration for network operations
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to execute with retry logic
 */
async function withRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a validation error
      if (error instanceof Error && (
        error.message.includes('Invalid') ||
        error.message.includes('validation') ||
        error.message.includes('not found')
      )) {
        throw error;
      }

      if (attempt < retries) {
        console.warn(`⚠️  ${operation} failed (attempt ${attempt}/${retries}), retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
}

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
  contentType: string;
}

export interface FileValidationError {
  message: string;
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED';
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  path: string;
  type: string;
  mime_type: string;
  size: string;
  size_bytes: number;
  created_at: string;
  folder: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationError | null {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      message: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
      code: 'INVALID_TYPE',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      code: 'FILE_TOO_LARGE',
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      message: 'File is empty',
      code: 'FILE_TOO_LARGE',
    };
  }

  return null;
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Get media type from MIME type
 */
function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

/**
 * Initialize the media bucket
 */
export async function initializeBucket(): Promise<{ error: string | null }> {
  try {
    const { data: buckets } = await supabaseAdmin().storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabaseAdmin().storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
      });

      if (error) {
        // If bucket already exists (might have been created by another request), that's fine
        if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
          return { error: null };
        }
        ErrorHandler.logError(
          ErrorHandler.createError(
            `Failed to create bucket: ${error.message}`,
            ErrorType.INTERNAL,
            500,
            { bucket: BUCKET_NAME }
          )
        );
        return { error: error.message };
      }
    }

    return { error: null };
  } catch (error) {
    const bucketError = ErrorHandler.handleFileUploadError(
      error as Error,
      BUCKET_NAME
    );
    ErrorHandler.logError(bucketError, { operation: 'initializeBucket' });
    return {
      error: error instanceof Error ? error.message : 'Failed to initialize bucket',
    };
  }
}

/**
 * List all files in the media bucket
 */
export async function listMedia(): Promise<{ data: MediaItem[]; error: string | null }> {
  try {
    // Ensure bucket exists
    const initError = await initializeBucket();
    if (initError.error) {
      return { data: [], error: initError.error };
    }

    const result = await withRetry('List media files', async () => {
      const { data, error } = await supabaseAdmin()
        .storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return data;
    });

    const files = result || [];

    // Transform files into media items
    const mediaItems: MediaItem[] = (files || [])
      .filter(file => file.name !== '.emptyFolderPlaceholder') // Filter out placeholder
      .map(file => {
        const { data: urlData } = supabaseAdmin()
          .storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name);

        const mimeType = file.metadata?.mimetype || getMimeType(file.name);
        const size = file.metadata?.size || file.size || 0;

        return {
          id: file.name,
          name: file.name,
          url: urlData.publicUrl,
          path: file.name,
          type: getMediaType(mimeType),
          mime_type: mimeType,
          size: formatFileSize(size),
          size_bytes: size,
          created_at: file.created_at || new Date().toISOString(),
          folder: BUCKET_NAME,
        };
      });

    return { data: mediaItems, error: null };
  } catch (error) {
    const listError = ErrorHandler.handleFileUploadError(
      error as Error,
      'listMedia'
    );
    ErrorHandler.logError(listError, { bucket: BUCKET_NAME });
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to list media',
    };
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  folder?: string
): Promise<{ data: UploadResult | null; error: FileValidationError | null }> {
  // Validate file
  const validationError = validateFile(file);
  if (validationError) {
    ErrorHandler.logError(
      ErrorHandler.createError(
        validationError.message,
        ErrorType.FILE_UPLOAD,
        400,
        { fileName: file.name, fileSize: file.size, fileType: file.type }
      )
    );
    return { data: null, error: validationError };
  }

  try {
    // Ensure bucket exists
    const initError = await initializeBucket();
    if (initError.error) {
      return {
        data: null,
        error: {
          message: initError.error,
          code: 'UPLOAD_FAILED',
        },
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${randomString}-${sanitizedName}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin()
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      const storageError = ErrorHandler.handleFileUploadError(uploadError, file.name);
      ErrorHandler.logError(storageError, { bucket: BUCKET_NAME, path: filePath });
      return {
        data: null,
        error: {
          message: uploadError.message || 'Failed to upload file',
          code: 'UPLOAD_FAILED',
        },
      };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin()
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      data: {
        url: urlData.publicUrl,
        path: filePath,
        fileName: file.name,
        size: file.size,
        contentType: file.type,
      },
      error: null,
    };

  } catch (error) {
    const uploadError = ErrorHandler.handleFileUploadError(
      error as Error,
      file.name
    );
    ErrorHandler.logError(uploadError, { bucket: BUCKET_NAME });
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to upload file',
        code: 'UPLOAD_FAILED',
      },
    };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  path: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin()
      .storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      const deleteError = ErrorHandler.handleFileUploadError(error, path);
      ErrorHandler.logError(deleteError, { bucket: BUCKET_NAME, operation: 'delete' });
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    const deleteError = ErrorHandler.handleFileUploadError(error as Error, path);
    ErrorHandler.logError(deleteError, { bucket: BUCKET_NAME, operation: 'delete' });
    return {
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Move/rename file in Supabase Storage
 */
export async function moveFile(
  oldPath: string,
  newPath: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin()
      .storage
      .from(BUCKET_NAME)
      .move(oldPath, newPath);

    if (error) {
      const moveError = ErrorHandler.handleFileUploadError(error, oldPath);
      ErrorHandler.logError(moveError, { bucket: BUCKET_NAME, operation: 'move', oldPath, newPath });
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    const moveError = ErrorHandler.handleFileUploadError(error as Error, oldPath);
    ErrorHandler.logError(moveError, { bucket: BUCKET_NAME, operation: 'move' });
    return {
      error: error instanceof Error ? error.message : 'Failed to move file',
    };
  }
}
