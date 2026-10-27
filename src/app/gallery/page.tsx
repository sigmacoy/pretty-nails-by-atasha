"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ImageIcon, Plus, Loader2, Search, Grid, List, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";

const categories = ["All", "Nail Gel", "Soft Gel Extension", "Pedicure", "Nail Art"];

const normalizeCategory = (cat: string | null | undefined): string => {
  if (!cat) return "";
  const map: Record<string, string> = {
    GEL: "Nail Gel",
    NAIL_ART: "Nail Art",
    EXTENSION: "Soft Gel Extension",
    PEDICURE: "Pedicure",
  };
  return map[cat] || cat;
};

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string | null;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingImage, setEditingImage] = useState<typeof images[0] | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", category: "" });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);
      const res = await fetch(`/api/gallery?${params}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) return;

    setUploading(true);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl: previewImage,
          category: formData.category,
        }),
      });

      if (res.ok) {
        setEditingImage(null);
        setFormData({ title: "", description: "", category: "" });
        setPreviewImage(null);
        fetchImages();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      fetchImages();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      // In real app, upload to cloud storage and get URL
    }
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(search.toLowerCase()) ||
      img.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || normalizeCategory(img.category) === category;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900">Gallery</h1>
            <p className="text-gray-600 mt-1">Our nail design portfolio</p>
          </div>
          {session?.user.role === "ADMIN" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Design
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingImage ? "Edit Design" : "Add New Design"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g., Rose Gold Ombre with 3D Flowers"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        placeholder="Optional description..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select category</option>
                        <option value="Nail Gel">Nail Gel</option>
                        <option value="Soft Gel Extension">Soft Gel Extension</option>
                        <option value="Pedicure">Pedicure</option>
                        <option value="Nail Art">Nail Art</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="image">Image *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                        {previewImage ? (
                          <div className="relative inline-block">
                            <img src={previewImage} alt="Preview" className="max-h-48 rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setPreviewImage(null)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="text-gray-600 mt-2">Click or drag to upload</p>
                            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="image-upload"
                              onChange={handleImageUpload}
                            />
                            <Button type="button" variant="outline" className="mt-2"
                              onClick={() => document.getElementById("image-upload")?.click()}>
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingImage(null);
                      setFormData({ title: "", description: "", category: "" });
                      setPreviewImage(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading || !formData.title || !previewImage}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
                      {editingImage ? "Update" : "Upload"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <CardContent className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col"
          )}>
            {filteredImages.map(image => (
              <Card key={image.id} className={cn("overflow-hidden", viewMode === "list" && "flex flex-row")}>
                <div className={cn(
                  "relative aspect-square overflow-hidden",
                  viewMode === "list" && "w-64 flex-shrink-0"
                )}>
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  {session?.user.role === "ADMIN" && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="bg-white/90" onClick={() => {
                        setEditingImage(image);
                        setFormData({
                          title: image.title,
                          description: image.description || "",
                          category: image.category || "",
                        });
                        setPreviewImage(image.imageUrl);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="bg-white/90" onClick={() => handleDelete(image.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                  {image.category && (
                    <Badge className="absolute bottom-2 left-2" variant="secondary">
                      {normalizeCategory(image.category)}
                    </Badge>
                  )}
                </div>
                <CardContent className={cn("p-4", viewMode === "list" && "flex-1 flex flex-col justify-center")}>
                  <h3 className="font-semibold text-gray-900">{image.title}</h3>
                  {image.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{image.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(image.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}