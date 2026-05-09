import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  fileName?: string;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  acceptedFormats?: string[];
  onUploadComplete?: (files: Array<{ url: string; fileName: string }>) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFiles = 5,
    maxSize = 10 * 1024 * 1024, // 10MB
    acceptedFormats = ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    onUploadComplete,
  } = options;

  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    // Initialize upload progress
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads(prev => [...prev, ...newUploads]);

    try {
      // Create FormData for upload
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update progress based on response
      setUploads(prev => {
        const updated = [...prev];

        result.files.forEach((file: { url: string; fileName: string }, index: number) => {
          const uploadIndex = updated.findIndex(
            u => u.file.name === acceptedFiles[index].name && u.status === 'pending'
          );

          if (uploadIndex !== -1) {
            updated[uploadIndex] = {
              ...updated[uploadIndex],
              progress: 100,
              status: 'success',
              url: file.url,
              fileName: file.fileName,
            };
          }
        });

        result.errors.forEach((error: { message: string }, index: number) => {
          const uploadIndex = updated.findIndex(
            u => u.status === 'pending'
          );

          if (uploadIndex !== -1) {
            updated[uploadIndex] = {
              ...updated[uploadIndex],
              progress: 0,
              status: 'error',
              error: error.message,
            };
          }
        });

        return updated;
      });

      // Call completion callback
      if (result.files && result.files.length > 0) {
        onUploadComplete?.(result.files);
      }

    } catch (error) {
      console.error('Upload error:', error);

      // Mark all pending uploads as failed
      setUploads(prev =>
        prev.map(upload =>
          upload.status === 'pending'
            ? { ...upload, status: 'error' as const, error: 'Upload failed' }
            : upload
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [acceptedFormats, maxSize, maxFiles, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const successfulUploads = uploads.filter(u => u.status === 'success');
  const hasErrors = uploads.some(u => u.status === 'error');

  return {
    uploads,
    successfulUploads,
    isUploading,
    isDragActive,
    hasErrors,
    getRootProps,
    getInputProps,
    removeUpload,
    clearUploads,
  };
}
