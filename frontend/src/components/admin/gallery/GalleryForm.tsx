'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Tag, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { GalleryDto, GalleryRequest, GalleryCategory, GALLERY_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { FileUpload } from '@/components/ui/FileUpload';
import { cn } from '@/lib/utils';

export interface GalleryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GalleryRequest) => Promise<void>;
  initialData?: GalleryDto | null;
  isPending: boolean;
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  GEL: 'Gel nails',
  EXTENSION: 'Extensions',
  PEDICURE: 'Pedicure',
  NAIL_ART: 'Nail art',
  ADDON: 'Add-on',
};

function formatCategory(category: string): string {
  return (
    CATEGORY_DISPLAY_NAMES[category] ||
    category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ')
  );
}

export function GalleryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isPending,
}: GalleryFormProps) {
  const [formData, setFormData] = useState<GalleryRequest>({
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<GalleryRequest>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Synchronize initial data on open/close
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          imageUrl: initialData.imageUrl,
          category: initialData.category || '',
          isActive: initialData.isActive,
        });
        setImagePreview(initialData.imageUrl);
        setShowUrlInput(Boolean(initialData.imageUrl));
      } else {
        setFormData({
          title: '',
          description: '',
          imageUrl: '',
          category: 'GEL',
          isActive: true,
        });
        setImagePreview(null);
        setShowUrlInput(false);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Sync preview whenever imageUrl changes
  useEffect(() => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [formData.imageUrl]);

  const validateForm = (): boolean => {
    const newErrors: Partial<GalleryRequest> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image is required';
    } else {
      try {
        new URL(formData.imageUrl);
      } catch {
        // If it's a relative path starting with / or an uploaded url, it is still valid
        if (!formData.imageUrl.startsWith('/')) {
          newErrors.imageUrl = 'Please provide a valid image URL or upload a file';
        }
      }
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    if (errors[name as keyof GalleryRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectCategory = (cat: string) => {
    setFormData((prev) => ({ ...prev, category: cat }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit design' : 'Upload design'}
      description="Provide design details and category tagging for the studio portfolio"
      size="lg"
      showClose={!isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Field */}
        <div>
          <Input
            label="Design title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Chrome French tips with micro pearls"
            error={errors.title}
            required
            maxLength={100}
          />
        </div>

        {/* Style Tags (Pass 2 & 4: lacquer rose accent on selected, sentence case) */}
        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Style tags
          </label>
          <div className="flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-normal transition-colors duration-150',
                    isSelected
                      ? 'bg-primary text-primary-foreground border border-primary shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-200/70 dark:hover:bg-stone-700/70'
                  )}
                >
                  <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{formatCategory(cat)}</span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.category}</span>
            </p>
          )}
        </div>

        {/* Photo Upload Zone (Pass 6, 8, 9: clean image upload card, nested radius 12px, smooth transition-opacity) */}
        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Design photography
          </label>

          {imagePreview ? (
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800/80 bg-stone-950 group transition-opacity duration-200">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full h-full object-cover transition-opacity duration-200"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center rounded-[6px] bg-stone-950/80 backdrop-blur-sm text-stone-300 text-[11px] font-normal px-2.5 py-1 border border-stone-700/60">
                  Portfolio preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, imageUrl: '' }));
                  setImagePreview(null);
                }}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-md bg-stone-950/80 hover:bg-stone-950 text-stone-200 border border-stone-700/80 backdrop-blur-sm px-2.5 py-1 text-xs transition-colors duration-150"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Replace photo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <FileUpload
                value={formData.imageUrl}
                onChange={(url) => {
                  setFormData((prev) => ({ ...prev, imageUrl: url }));
                  if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: undefined }));
                }}
                onRemove={() => {
                  setFormData((prev) => ({ ...prev, imageUrl: '' }));
                  setImagePreview(null);
                }}
                helperText="JPEG, PNG, or WebP up to 5MB"
                placeholder="Click or drag design photography here"
                error={errors.imageUrl}
                showPreview={false}
              />

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-normal"
                >
                  <LinkIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{showUrlInput ? 'Hide image URL field' : 'Or enter direct image link'}</span>
                </button>
              </div>

              {showUrlInput && (
                <div className="pt-1">
                  <Input
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/nail-photo.jpg"
                    error={errors.imageUrl}
                    helperText="Direct URL to external image file"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div>
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Details about shade, gel technique, accent art, or length..."
            rows={3}
            maxLength={500}
            helperText="Optional notes displayed when clients open the design."
          />
        </div>

        {/* Visibility Toggle */}
        <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 p-3.5 bg-stone-50/50 dark:bg-stone-900/30 flex items-start gap-3">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 mt-0.5 rounded border-stone-300 text-primary focus:ring-primary accent-primary"
          />
          <div>
            <label
              htmlFor="isActive"
              className="text-xs font-medium text-stone-900 dark:text-stone-100 block cursor-pointer"
            >
              Publish to public gallery
            </label>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-normal mt-0.5 leading-relaxed">
              When enabled, clients can browse this design in the studio portfolio.
            </p>
          </div>
        </div>

        {/* Action Buttons (Pass 2 & 7: 8px button radius, single lacquer rose accent) */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isPending}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            <span>{initialData ? 'Save changes' : 'Upload design'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
