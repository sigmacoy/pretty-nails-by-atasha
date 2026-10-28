"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Trash2, Edit, Tag, DollarSign, Clock, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ServiceVariant {
  id?: string;
  name: string;
  price: number; // in centavos
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  basePrice: number; // in centavos
  duration: number;
  isActive: boolean;
  variants: ServiceVariant[];
}

const categories = [
  { value: "GEL", label: "Nail Gel" },
  { value: "EXTENSION", label: "Soft Gel Extension" },
  { value: "PEDICURE", label: "Pedicure" },
  { value: "CLEANING", label: "Nail Cleaning" },
  { value: "ADDON", label: "Add-on" },
];

export default function AdminServicesPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  // Form inputs (prices in standard PHP pesos for easier owner input)
  const [formData, setFormData] = useState({
    name: "",
    category: "GEL",
    description: "",
    basePricePesos: 300,
    duration: 180,
    isActive: true,
    variants: [] as Array<{ name: string; pricePesos: number }>,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchServices();
    }
  }, [session]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch services:", e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: "",
      category: "GEL",
      description: "",
      basePricePesos: 300,
      duration: 180,
      isActive: true,
      variants: [],
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || "",
      basePricePesos: Math.round(service.basePrice / 100),
      duration: service.duration,
      isActive: service.isActive,
      variants: service.variants.map((v) => ({
        name: v.name,
        pricePesos: Math.round(v.price / 100),
      })),
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        basePrice: Math.round(formData.basePricePesos * 100),
        duration: Number(formData.duration) || 60,
        isActive: formData.isActive,
        variants: formData.variants.map((v) => ({
          name: v.name.trim(),
          price: Math.round(v.pricePesos * 100),
        })),
      };

      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : "/api/admin/services";
      const method = editingService ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingService(null);
        showToast(editingService ? "Service updated successfully" : "New service added successfully");
        await fetchServices();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save service");
      }
    } catch (e) {
      console.error("Save service error:", e);
      alert("Something went wrong saving the service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete or deactivate "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Service "${name}" deleted`);
        await fetchServices();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete service");
      }
    } catch (e) {
      console.error("Delete service error:", e);
      alert("Something went wrong deleting the service.");
    }
  };

  const addVariantField = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", pricePesos: prev.basePricePesos }],
    }));
  };

  const removeVariantField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const filteredServices = services.filter((s) => {
    const matchesCategory = categoryFilter === "ALL" || s.category === categoryFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (status === "loading") {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div className="text-center py-12">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Services & Pricing</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your nail services, lengths, pricing, and add-ons
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs">
          <Plus className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          {notification}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[{ value: "ALL", label: "All Services" }, ...categories].map((c) => (
              <Button
                key={c.value}
                size="sm"
                variant={categoryFilter === c.value ? "default" : "outline"}
                onClick={() => setCategoryFilter(c.value)}
                className={cn(
                  "text-xs h-8",
                  categoryFilter === c.value && "bg-primary-600 hover:bg-primary-700 text-white"
                )}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-14 w-14 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No services found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different category or click &quot;Add New Service&quot;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-200 hover:bg-pink-50/20 transition-all gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <Tag className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-base">{service.name}</p>
                        <Badge
                          variant={service.isActive ? "success" : "secondary"}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-gray-600">
                          {service.category}
                        </Badge>
                      </div>

                      {service.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{service.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {service.duration} mins
                        </span>
                        {service.variants && service.variants.length > 0 && (
                          <span>
                            {service.variants.length} variant{service.variants.length > 1 ? "s" : ""}: (
                            {service.variants.map((v) => `${v.name} ₱${v.price / 100}`).join(", ")})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-500 block">Base Price</span>
                      <span className="font-bold text-primary-600 text-base">
                        {formatCurrency(service.basePrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(service)}
                        className="h-8 px-2.5 text-xs text-gray-700 hover:text-primary-700 hover:bg-primary-50 border-gray-200"
                        title="Edit Service"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1 text-primary-600" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(service.id, service.name)}
                        className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete Service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-gray-900">
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-name">Service Name *</Label>
                <Input
                  id="service-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Soft Gel Extension"
                  required
                />
              </div>

              <div>
                <Label htmlFor="service-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger id="service-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="service-description">Description</Label>
              <textarea
                id="service-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of service"
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base-price">Base Price (PHP ₱) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                  <Input
                    id="base-price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.basePricePesos}
                    onChange={(e) =>
                      setFormData({ ...formData, basePricePesos: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration-min">Duration (minutes) *</Label>
                <Input
                  id="duration-min"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Math.max(5, parseInt(e.target.value) || 60) })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Label htmlFor="is-active" className="cursor-pointer text-sm font-medium text-gray-700">
                Active (available for customers to book)
              </Label>
            </div>

            {/* Variants Editor */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-gray-900">
                  Size / Length Variants (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariantField}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Variant
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {formData.variants.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No variants added. The base price will apply as standard.
                  </p>
                ) : (
                  formData.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="e.g., Small, Medium, Long"
                        value={v.name}
                        onChange={(e) => {
                          const nv = [...formData.variants];
                          nv[i].name = e.target.value;
                          setFormData({ ...formData, variants: nv });
                        }}
                        className="flex-1 text-sm h-8"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₱</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Price"
                          value={v.pricePesos}
                          onChange={(e) => {
                            const nv = [...formData.variants];
                            nv[i].pricePesos = Math.max(0, parseInt(e.target.value) || 0);
                            setFormData({ ...formData, variants: nv });
                          }}
                          className="pl-6 text-sm h-8"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariantField(i)}
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
