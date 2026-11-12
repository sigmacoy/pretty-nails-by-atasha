'use client';

import { useState, useRef, useCallback, useEffect, FC, DragEvent, ChangeEvent, MouseEvent } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadFile, validateImageFile } from '@/lib/upload';

export interface FileUploadProps {
  value?: string;
  onChange?: (url: string) => void;
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

export const FileUpload: FC<FileUploadProps> = ({
  value,
  onChange,
  onRemove,
  label,
  helperText,
  error: externalError,
  disabled = false,
  className,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 5,
  placeholder = 'Click or drag & drop an image here',
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

      // Client validation
      const validation = validateImageFile(file);
      if (!validation.valid) {
        const errorMsg = validation.error || `File must be JPEG, PNG, or WebP and under ${maxSizeMB}MB`;
        setInternalError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Generate local object URL for instant preview feedback
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const result = await uploadFile(file, (percent) => {
          setUploadProgress(percent);
        });

        // Set permanent uploaded remote URL
        setPreviewUrl(result.url);
        setIsUploading(false);
        setUploadProgress(100);

        if (onChange) {
          onChange(result.url);
        }
        toast.success('Image uploaded successfully');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to upload image. Please try again.';
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
    [disabled, isUploading, maxSizeMB, onChange, value]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  }, [disabled, isUploading, handleProcessFile]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  }, [handleProcessFile]);

  const handleClear = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
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
  }, [onChange, onRemove]);

  const triggerSelect = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <div className="relative rounded-lg border border-border bg-card p-3 shadow-sm transition-all">
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="h-full w-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {isUploading ? 'Uploading image...' : 'Image ready'}
                </span>
              </div>

              {isUploading ? (
                <div className="mt-2 w-full">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Click change to select a different photo.
                </p>
              )}

              {!isUploading && !disabled && (
                <div className="mt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={triggerSelect}
                    className="text-xs font-medium text-primary hover:underline focus:outline-none"
                  >
                    Change photo
                  </button>
                  <span className="text-muted-foreground text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-medium text-destructive hover:underline focus:outline-none"
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
                aria-label="Remove image"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
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
            'group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none',
            'border-muted-foreground/30 hover:border-primary/70 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20',
            activeError && 'border-destructive bg-destructive/5 hover:border-destructive',
            (disabled || isUploading) && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="w-48 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <Upload className="h-6 w-6" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, and WebP (up to {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {activeError && (
        <div className="flex items-center space-x-1.5 text-xs text-destructive mt-1.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !activeError && (
        <p className="text-xs text-muted-foreground mt-1.5">{helperText}</p>
      )}
    </div>
  );
};

export default FileUpload;
