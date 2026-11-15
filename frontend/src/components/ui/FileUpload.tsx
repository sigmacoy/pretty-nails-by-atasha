'use client';

import { useState, useRef, useCallback, useEffect, FC, DragEvent, ChangeEvent, MouseEvent } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/upload';

export interface FileUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onFileSelect?: (file: File) => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  placeholder?: string;
  showPreview?: boolean;
}

/**
 * Compresses an image file client-side to reduce upload size.
 * Maintains aspect ratio, targets max dimension 1920px, quality 0.85.
 */
async function compressImage(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let { width, height } = img;
      const maxDim = Math.max(width, height);

      if (maxDim > maxDimension) {
        const scale = maxDimension / maxDim;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

export const FileUpload: FC<FileUploadProps> = ({
  value,
  onChange,
  onFileSelect,
  onRemove,
  label,
  helperText,
  error: externalError,
  disabled = false,
  className,
  accept = 'image/jpeg,image/png',
  maxSizeMB = 5,
  placeholder = 'Select or drop GCash / Maya deposit receipt',
  showPreview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal preview if controlled value prop updates
  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const activeError = externalError || internalError;

  const handleProcessFile = useCallback(
    async (file: File) => {
      if (disabled || isUploading) return;

      setInternalError(null);

      // Client-side validation for file size (5MB maximum)
      if (file.size > maxSizeMB * 1024 * 1024) {
        const errorMsg = `Receipt file size exceeds the ${maxSizeMB}MB limit`;
        setInternalError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Client-side validation for file MIME type
      const acceptedList = accept
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const isValidType = acceptedList.some((accepted) => {
        if (accepted.endsWith('/*')) {
          const typePrefix = accepted.replace('/*', '');
          return file.type.toLowerCase().startsWith(typePrefix);
        }
        if (accepted.startsWith('.')) {
          return file.name.toLowerCase().endsWith(accepted);
        }
        return file.type.toLowerCase() === accepted;
      });

      if (!isValidType) {
        const errorMsg =
          accept === 'image/jpeg,image/png'
            ? 'Only JPG and PNG receipt images are allowed'
            : 'File type is not supported. Please select a valid image.';
        setInternalError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (onFileSelect) {
        onFileSelect(file);
      }

      // Generate local object URL for instant preview feedback
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Compress image if it's a JPEG/PNG and larger than 1MB
      let fileToUpload = file;
      if (file.size > 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        setIsUploading(true);
        setUploadProgress(0);
        toast.info('Compressing image...');
        try {
          const compressed = await compressImage(file);
          URL.revokeObjectURL(localPreview);
          const compressedPreview = URL.createObjectURL(compressed);
          setPreviewUrl(compressedPreview);
          fileToUpload = compressed;
          toast.success(`Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`);
        } catch (compressErr) {
          console.warn('Image compression failed, uploading original:', compressErr);
          // Fall back to original file
        }
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const result = await uploadFile(fileToUpload, (percent) => {
          setUploadProgress(percent);
        });

        // Set permanent uploaded remote URL
        setPreviewUrl(result.url);
        setIsUploading(false);
        setUploadProgress(100);

        if (onChange) {
          onChange(result.url);
        }
        toast.success('Deposit submitted for studio review.');
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to upload receipt. Please select valid JPG or PNG.';
        setInternalError(message);
        toast.error(message);
        // Revert to initial value preview
        setPreviewUrl(value || null);
        setIsUploading(false);
        setUploadProgress(0);
      } finally {
        // Reset file input so identical file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [accept, disabled, isUploading, maxSizeMB, onChange, onFileSelect, value]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleProcessFile(files[0]);
      }
    },
    [disabled, isUploading, handleProcessFile]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleProcessFile(files[0]);
      }
    },
    [handleProcessFile]
  );

  const handleClear = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      // Revoke object URL to prevent memory leaks
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setInternalError(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onRemove) {
        onRemove();
      }
      if (onChange) {
        onChange('');
      }
    },
    [onChange, onRemove, previewUrl]
  );

  const triggerSelect = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 font-sans">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Preview mode or Dropzone mode */}
      {showPreview && previewUrl ? (
        <div className="relative rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-[#FFF0F3] dark:bg-[#160D12] p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl border border-rose-200/80 dark:border-rose-900 bg-stone-100 dark:bg-stone-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Deposit receipt preview"
                className="h-full w-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs text-rose-200">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 font-sans">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {isUploading ? 'Uploading deposit proof...' : 'Deposit proof attached'}
                </span>
              </div>

              {isUploading ? (
                <div className="mt-2 w-full">
                  <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                    <span>Uploading</span>
                    <span className="font-mono tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-800 dark:bg-rose-400 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  Receipt attached for studio manual review
                </p>
              )}

              {!isUploading && !disabled && (
                <div className="mt-2.5 flex items-center space-x-3 text-xs">
                  <button
                    type="button"
                    onClick={triggerSelect}
                    className="font-medium text-rose-900 dark:text-rose-300 hover:underline focus:outline-none"
                  >
                    Replace receipt
                  </button>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="font-medium text-stone-500 dark:text-stone-400 hover:text-rose-900 dark:hover:text-rose-300 hover:underline focus:outline-none"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {!isUploading && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove receipt attachment"
                className="rounded-full p-1.5 text-stone-400 hover:bg-rose-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={triggerSelect}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              triggerSelect();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-disabled={disabled || isUploading}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-5 text-center transition-all cursor-pointer select-none bg-[#FFF0F3] dark:bg-[#160D12] shadow-xs',
            'hover:border-rose-400 dark:hover:border-rose-800 hover:bg-rose-50/30 dark:hover:bg-stone-900/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-800/30',
            isDragging && 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500/20',
            activeError && 'border-rose-500 bg-rose-50/20',
            (disabled || isUploading) && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-3 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-rose-800 dark:text-rose-300" />
              <div className="w-52 space-y-1.5">
                <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 font-sans">
                  <span>Uploading receipt...</span>
                  <span className="font-mono tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-800 dark:bg-rose-400 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2.5">
              <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/80 dark:bg-stone-800/80 p-3 text-rose-800 dark:text-rose-300 transition-colors">
                <Upload className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 font-sans">
                  {placeholder}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                  JPG or PNG, maximum {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {activeError && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-sans">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !activeError && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-sans">{helperText}</p>
      )}
    </div>
  );
};

export default FileUpload;
