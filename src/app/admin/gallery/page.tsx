"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, ImageIcon, Plus, Trash2, Edit, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

const categories = ["GEL", "EXTENSION", "PEDICURE", "NAIL_ART"];

export default function AdminGalleryPage() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editingImage, setEditingImage] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", category: "", isActive: true });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (status === "unauthenticated") window.location.href = "/login"; }, [status]);
  useEffect(() => { if (session?.user?.role === "ADMIN") fetchImages(); }, [session]);

  const fetchImages = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);
      const res = await fetch(`/api/admin/gallery?${params}`);
      if (res.ok) setImages(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) return;
    setUploading(true);
    try {
      const url = editingImage ? `/api/admin/gallery/${editingImage.id}` : "/api/admin/gallery";
      const res = await fetch(url, {
        method: editingImage ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl: previewImage }),
      });
      if (res.ok) { setEditingImage(null); setFormData({ title: "", description: "", category: "", isActive: true }); setPreviewImage(null); fetchImages(); }
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    fetchImages();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewImage(URL.createObjectURL(file));
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(search.toLowerCase()) || img.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || img.category === category;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading") return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  if (!session || session.user.role !== "ADMIN") return <div className="text-center py-12">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-600 mt-1">Manage nail design portfolio</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Design</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingImage ? "Edit" : "Add"} Design</DialogTitle></DialogHeader>
            <form onSubmit={handleUpload}>
              <div className="space-y-4 py-4">
                <div><Label htmlFor="title">Title *</Label><Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                <div><Label htmlFor="description">Description</Label><textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg" rows={3} /></div>
                <div><Label htmlFor="category">Category</Label>
                  <select id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="">Select</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div>
                  <Label htmlFor="image">Image *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                    {previewImage ? (
                      <div className="relative inline-block">
                        <img src={previewImage} alt="Preview" className="max-h-48 rounded-lg" />
                        <button type="button" onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-gray-600 mt-2">Click or drag to upload</p>
                        <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleImageUpload} />
                        <Button type="button" variant="outline" className="mt-2" onClick={() => document.getElementById("image-upload")?.click()}>Choose File</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditingImage(null); setFormData({ title: "", description: "", category: "", isActive: true }); setPreviewImage(null); }}>Cancel</Button>
                <Button type="submit" disabled={uploading || !formData.title || !previewImage}>{uploading ? "Uploading..." : (editingImage ? "Update" : "Upload")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", ...categories].map(cat => <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)} className="whitespace-nowrap">{cat}</Button>)}
          </div>
        </div>
      </Card>

      <Card>
        <CardContent>
          {loading ? Array.from({length: 8}).map((_,i) => <div key={i} className="h-40 animate-pulse bg-gray-100 rounded mb-4" />) : filteredImages.length === 0 ? (
            <div className="text-center py-12"><ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No images found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.imageUrl} alt={img.title} className="w-full aspect-square object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <Button variant="ghost" size="icon" className="bg-white" onClick={() => { setEditingImage(img); setFormData({title: img.title, description: img.description || "", category: img.category || "", isActive: img.isActive}); setPreviewImage(img.imageUrl); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="bg-white" onClick={() => handleDelete(img.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                  {!img.isActive && <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"><Badge variant="destructive">Inactive</Badge></div>}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-medium text-white text-sm truncate">{img.title}</p>
                    {img.category && <Badge variant="secondary" className="text-xs mt-1">{img.category}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}