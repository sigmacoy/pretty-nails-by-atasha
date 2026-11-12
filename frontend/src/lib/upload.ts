import api from './api';
import { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates an image file before upload (size and MIME type).
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMb}MB) exceeds the 5MB limit` };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
}

/**
 * Uploads an image file to POST /api/upload.
 * Supports progress tracking and client-side validation.
 *
 * @param file The image File to upload
 * @param onProgress Optional callback receiving upload progress percentage (0 - 100)
 * @returns Promise<{ url: string; filename: string; size: number }>
 */
export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    const errorMessage =
      axiosError.response?.data?.message ||
      (axiosError.response?.data as { error?: string })?.error ||
      axiosError.message ||
      'Failed to upload image. Please try again.';
    throw new Error(errorMessage);
  }
}
