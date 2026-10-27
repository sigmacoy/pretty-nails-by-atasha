"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Trash2, Edit, Tag, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  basePrice: number;
  duration: number;
  isActive: boolean;
  variants: Array<{ id: string; name: string; price: number }>;
}

const categories = ["GEL", "EXTENSION", "PEDICURE", "ADDON"];

export default function AdminServicesPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "GEL",
    description: "",
    basePrice: 0,
    duration: 180,
    isActive: true,
    variants: [] as Array<{ name: string; price: number }>,
  });

  useEffect(() => {
    if (status === "unauthenticated") window.location.href = "/login";
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") fetchServices();
  }, [session]);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      if (res.ok) setServices(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
      const res = await fetch(url, {
        method: editingService ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setEditingService(null); fetchServices(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  if (status === "loading") return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  if (!session || session.user.role !== "ADMIN") return <div className="text-center py-12">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage nail services and pricing</p>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingService ? "Edit" : "Add"} Service</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">Base Price (centavos) *</Label>
                  <Input id="basePrice" type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input id="duration" type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div>
                <Label className="block mb-2">Variants</Label>
                <div className="space-y-2">
                  {formData.variants.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Name (e.g., Small)" value={v.name} onChange={e => { const nv = [...formData.variants]; nv[i].name = e.target.value; setFormData({...formData, variants: nv}); }} />
                      <Input type="number" placeholder="Price" value={v.price} onChange={e => { const nv = [...formData.variants]; nv[i].price = parseInt(e.target.value); setFormData({...formData, variants: nv}); }} className="w-24" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => { const nv = formData.variants.filter((_, j) => j !== i); setFormData({...formData, variants: nv}); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => setFormData({...formData, variants: [...formData.variants, {name: "", price: 0}]})} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Variant</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
              <Button type="submit">{editingService ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent>
          {loading ? Array.from({length: 3}).map((_,i) => <div key={i} className="h-20 animate-pulse bg-gray-100 rounded mb-4" />) : services.length === 0 ? (
            <div className="text-center py-12"><Tag className="h-16 w-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No services yet</p>
          ) : (
            <div className="space-y-3">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center"><Tag className="h-6 w-6 text-primary-600" /></div>
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.category} • {s.duration}min • {s.variants.length} variants</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                    <span className="font-semibold text-primary-600">From {formatCurrency(s.basePrice)}</span>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingService(s); setFormData({name: s.name, category: s.category, description: s.description || "", basePrice: s.basePrice, duration: s.duration, isActive: s.isActive, variants: s.variants.map(v => ({name: v.name, price: v.price}))}); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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