"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, User, Calendar, Award, Edit, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string | null;
  nickname?: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: { bookings: number; loyaltyStamps?: number };
  loyaltyCard: { stampCount: number; expiresAt: string | null } | null;
  notes: Array<{ id: string; content: string; nickname: string | null; createdAt: string }>;
}

export default function AdminCustomersPage() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => { if (status === "unauthenticated") window.location.href = "/login"; }, [status]);
  useEffect(() => { if (session?.user?.role === "ADMIN") fetchCustomers(); }, [session]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/admin/customers?search=${search}`);
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveNote = async () => {
    if (!editingCustomer || !noteContent.trim()) return;
    try {
      await fetch(`/api/admin/customers/${editingCustomer.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent, nickname }),
      });
      setEditingCustomer(null);
      setNoteContent("");
      setNickname("");
      fetchCustomers();
    } catch (e) { console.error(e); }
  };

  if (status === "loading") return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  if (!session || session.user.role !== "ADMIN") return <div className="text-center py-12">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer profiles and notes</p>
        </div>
      </div>

      <Card className="p-4">
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
      </Card>

      <Card>
        <CardContent>
          {loading ? Array.from({length: 5}).map((_,i) => <div key={i} className="h-20 animate-pulse bg-gray-100 rounded mb-4" />) : customers.length === 0 ? (
            <div className="text-center py-12"><User className="h-16 w-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No customers found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left p-3 font-medium text-gray-500">Contact</th>
                    <th className="text-left p-3 font-medium text-gray-500">Joined</th>
                    <th className="text-left p-3 font-medium text-gray-500">Bookings</th>
                    <th className="text-left p-3 font-medium text-gray-500">Stamps</th>
                    <th className="text-left p-3 font-medium text-gray-500">Loyalty</th>
                    <th className="text-left p-3 font-medium text-gray-500">Notes</th>
                    <th className="text-left p-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="font-medium text-primary-700">{c.name?.[0]?.toUpperCase() || c.email[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.name || "No name"}</p>
                            {c.nickname && <p className="text-sm text-primary-600">"{c.nickname}"</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-600">{c.email}</p>
                        {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                      <td className="p-3"><Badge variant="secondary">{c._count.bookings}</Badge></td>
                      <td className="p-3"><Badge variant="default">{c._count.loyaltyStamps}</Badge></td>
                      <td className="p-3">
                        {c.loyaltyCard ? (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{c.loyaltyCard.stampCount}/9</span>
                            {c.loyaltyCard.expiresAt && new Date(c.loyaltyCard.expiresAt) < new Date() && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                        ) : <span className="text-gray-400 text-sm">No card</span>}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{c.notes.length} notes</Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(c); setNoteContent(""); setNickname(""); }}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(c); setNoteContent(""); setNickname(""); }}><Edit className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingCustomer} onOpenChange={open => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Note for {editingCustomer?.name || editingCustomer?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nickname">Nickname (optional)</Label>
              <Input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g., VIP Client, Frequent Late" />
            </div>
            <div>
              <Label htmlFor="note">Note *</Label>
              <textarea id="note" value={noteContent} onChange={e => setNoteContent(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" rows={4} placeholder="Write your note here..." required />
            </div>
            {editingCustomer && editingCustomer.notes && editingCustomer.notes.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Previous Notes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editingCustomer.notes.map(n => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{n.nickname ? `"${n.nickname}" ` : ""}{n.content}</p>
                      <p className="text-xs text-gray-500">{formatDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(null)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={!noteContent.trim()}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}