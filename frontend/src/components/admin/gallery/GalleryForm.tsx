'use client';

import { useState, useEffect } from 'react';
import { Upload, Tag, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { GalleryDto, GalleryRequest } from '@/types';
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

export const ATELIER_CATEGORIES = [
  { value: 'GEL', label: 'Structured BIAB Overlay' },
  { value: 'EXTENSION', label: 'Japanese Soft Gel Extension' },
  { value: 'VELVET_CAT_EYE', label: 'Velvet Cat-Eye Finish' },
  { value: 'NAIL_ART', label: 'Bespoke Hand-Painted Art' },
  { value: 'FRENCH_CONTOUR', label: 'French Hairline Contour' },
  { value: 'PEDICURE', label: 'Dry Cuticle Hygiene Care' },
] as const;

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
        if (!formData.imageUrl.startsWith('/')) {
          newErrors.imageUrl = 'Please provide a valid image URL or upload a file';
        }
      }
    }

    if (!formData.category) {
      newErrors.category = 'Atelier discipline category is required';
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
      title={initialData ? 'Edit design' : 'Upload lookbook design'}
      description="Curate portfolio design details and atelier discipline tagging for the public lookbook"
      size="lg"
      showClose={!isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* Title Field */}
        <div>
          <Input
            label="Design title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Japanese Apex Nude with Velvet Cat-Eye Accent"
            error={errors.title}
            required
            maxLength={100}
            className="rounded-xl border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90"
          />
        </div>

        {/* Discipline Tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
            Atelier discipline
          </label>
          <div className="flex flex-wrap gap-2">
            {ATELIER_CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleSelectCategory(cat.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-150',
                    isSelected
                      ? 'bg-rose-900 text-white border border-rose-800 shadow-sm'
                      : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                  )}
                >
                  <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-2 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.category}</span>
            </p>
          )}
        </div>

        {/* Photo Upload Zone: Editorial Framed Card */}
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-5 bg-white/60 dark:bg-[#1A0E15]/60 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-1">
            Design photography
          </label>

          {imagePreview ? (
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-rose-200/80 dark:border-rose-950/60 bg-stone-950 group transition-opacity duration-200">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full h-full object-cover transition-opacity duration-200"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center rounded-full bg-stone-950/85 backdrop-blur-sm text-rose-200 text-[11px] font-mono px-3 py-1 border border-rose-900/60">
                  Lookbook preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, imageUrl: '' }));
                  setImagePreview(null);
                }}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-stone-950/85 hover:bg-stone-950 text-rose-200 border border-rose-800/80 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium transition-colors duration-150"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Replace photography</span>
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
                helperText="JPEG, PNG, or WebP up to 5MB · High resolution private atelier photography"
                placeholder="Click or drag atelier photography here"
                error={errors.imageUrl}
                showPreview={false}
              />

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1.5 text-rose-900 dark:text-rose-300 hover:underline font-medium"
                >
                  <LinkIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{showUrlInput ? 'Hide direct image URL field' : 'Or enter direct image link'}</span>
                </button>
              </div>

              {showUrlInput && (
                <div className="pt-1">
                  <Input
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/atelier-design.jpg"
                    error={errors.imageUrl}
                    helperText="Direct URL to external image asset"
                    className="rounded-xl border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div>
          <Textarea
            label="Technique, shades & application notes"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Details on structured overlay viscosity, builder brand, French tip hairline thickness, or curing technique..."
            rows={3}
            maxLength={500}
            helperText="Optional technical notes displayed when clients open the lookbook design."
            className="rounded-xl border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90"
          />
        </div>

        {/* Visibility Toggle */}
        <div className="rounded-xl border border-rose-200/80 dark:border-rose-950/60 p-4 bg-white/60 dark:bg-[#1A0E15]/60 flex items-start gap-3.5">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 mt-0.5 rounded border-rose-300 text-rose-900 focus:ring-rose-800 accent-rose-900"
          />
          <div>
            <label
              htmlFor="isActive"
              className="text-xs font-medium text-stone-900 dark:text-rose-100 block cursor-pointer"
            >
              Publish to public atelier lookbook
            </label>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-normal mt-0.5 leading-relaxed">
              When enabled, clients can browse this design in the Pretty Nails by Atasha public lookbook.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-950/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-12 px-6 rounded-full border-rose-200/80 dark:border-rose-800/60 text-xs font-medium text-stone-700 dark:text-rose-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            className="h-12 px-8 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium gap-2 border border-rose-800/80 shadow-[0_4px_16px_rgba(76,5,25,0.2)]"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            <span>{initialData ? 'Save changes' : 'Upload lookbook design'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
