'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { GalleryDto, GalleryRequest, GalleryCategory, GALLERY_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectOption } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface GalleryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GalleryRequest) => Promise<void>;
  initialData?: GalleryDto | null;
  isPending: boolean;
}

const categoryOptions: SelectOption[] = GALLERY_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' '),
}));

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

  // Reset form when modal opens/closes or initialData changes
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
      } else {
        setFormData({
          title: '',
          description: '',
          imageUrl: '',
          category: '',
          isActive: true,
        });
        setImagePreview(null);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Update image preview when imageUrl changes
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
      newErrors.imageUrl = 'Image URL is required';
    } else {
      try {
        new URL(formData.imageUrl);
      } catch {
        newErrors.imageUrl = 'Please enter a valid URL';
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
    // Clear error when user starts typing
    if (errors[name as keyof GalleryRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Gallery Item' : 'Add Gallery Item'}
      size="lg"
      showClose={!isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-1 text-xs bg-black/70 text-white rounded">
                Preview
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter gallery item title"
            error={errors.title}
            required
            maxLength={100}
          />

          <Textarea
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter a description for this gallery item"
            rows={3}
            maxLength={500}
          />

          <Input
            label="Image URL"
            name="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            error={errors.imageUrl}
            required
            helperText="Enter a valid image URL (direct link to image file)"
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
            placeholder="Select a category"
            error={errors.category}
            required
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Active (visible in public gallery)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {initialData ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
