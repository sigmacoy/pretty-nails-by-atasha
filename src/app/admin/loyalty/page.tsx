"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Award, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LoyaltyCard {
  id: string;
  userId: string;
  stampCount: number;
  lastStampAt: string | null;
  expiresAt: string | null;
  user: { name: string | null; email: string };
  stamps: Array<{ earnedAt: string; source: string; amount: number | null }>;
}

interface Settings {
  stampsRequired: number;
  stampExpiryMonths: number;
  stampPerService: boolean;
  stampPerAmount: number;
}

export default function AdminLoyaltyPage() {
  const { data: session, status } = useSession();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ stampsRequired: 9, stampExpiryMonths: 12, stampPerService: true, stampPerAmount: 50000 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (status === "unauthenticated") window.location.href = "/login"; }, [status]);
  useEffect(() => { if (session?.user?.role === "ADMIN") { fetchCards(); fetchSettings(); } }, [session]);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/admin/loyalty");
      if (res.ok) {
        const raw = await res.json();
        setCards(raw.filter((c: any) => c.user?.email !== "owner@prettynails.com" && !c.user?.name?.includes("Atasha")));
      }
    }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try { const res = await fetch("/api/admin/settings"); if (res.ok) setSettings(await res.json()); }
    catch (e) { console.error(e); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (status === "loading") return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  if (!session || session.user.role !== "ADMIN") return <div className="text-center py-12">Access denied</div>;

  const activeCards = cards.filter(c => c.expiresAt && new Date(c.expiresAt) > new Date()).length;
  const expiredCards = cards.filter(c => c.expiresAt && new Date(c.expiresAt) <= new Date()).length;
  const totalStamps = cards.reduce((sum, c) => sum + c.stampCount, 0);
  const readyToRedeem = cards.filter(c => c.stampCount >= settings.stampsRequired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-gray-600 mt-1">Manage loyalty cards and stamp configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Cards</p><p className="text-3xl font-bold">{cards.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Active Cards</p><p className="text-3xl font-bold text-green-600">{activeCards}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Stamps Issued</p><p className="text-3xl font-bold">{totalStamps}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Ready to Redeem</p><p className="text-3xl font-bold text-primary-600">{readyToRedeem}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stamp Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); handleSaveSettings(); }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="stampsRequired">Stamps Required for Free Service</Label>
              <Input id="stampsRequired" type="number" min="1" value={settings.stampsRequired} onChange={e => setSettings({...settings, stampsRequired: parseInt(e.target.value)})} />
            </div>
            <div>
              <Label htmlFor="stampExpiryMonths">Stamp Expiry (months)</Label>
              <Input id="stampExpiryMonths" type="number" min="1" value={settings.stampExpiryMonths} onChange={e => setSettings({...settings, stampExpiryMonths: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer w-full">
                <input type="checkbox" checked={settings.stampPerService} onChange={e => setSettings({...settings, stampPerService: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span>1 stamp per nail set service</span>
              </label>
            </div>
            <div>
              <Label htmlFor="stampPerAmount">Or 1 stamp per ₱ (amount in centavos)</Label>
              <Input id="stampPerAmount" type="number" min="100" value={settings.stampPerAmount} onChange={e => setSettings({...settings, stampPerAmount: parseInt(e.target.value)})} />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Loyalty Cards</CardTitle>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </CardHeader>
        <CardContent>
          {loading ? Array.from({length: 5}).map((_,i) => <div key={i} className="h-16 animate-pulse bg-gray-100 rounded mb-4" />) : cards.length === 0 ? (
            <div className="text-center py-12"><Award className="h-16 w-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No loyalty cards yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left p-3 font-medium text-gray-500">Stamps</th>
                    <th className="text-left p-3 font-medium text-gray-500">Progress</th>
                    <th className="text-left p-3 font-medium text-gray-500">Last Stamp</th>
                    <th className="text-left p-3 font-medium text-gray-500">Expires</th>
                    <th className="text-left p-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium">{c.user.name || "No name"}</p>
                        <p className="text-sm text-gray-500">{c.user.email}</p>
                      </td>
                      <td className="p-3 font-semibold text-lg">{c.stampCount} / {settings.stampsRequired}</td>
                      <td className="p-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600 rounded-full transition-all" style={{width: `${Math.min((c.stampCount / settings.stampsRequired) * 100, 100)}%`}} />
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{c.lastStampAt ? formatDate(c.lastStampAt) : "Never"}</td>
                      <td className="p-3 text-sm text-gray-500">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                      <td className="p-3">
                        {c.expiresAt && new Date(c.expiresAt) <= new Date() ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : c.stampCount >= settings.stampsRequired ? (
                          <Badge variant="success">Ready to Redeem</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}