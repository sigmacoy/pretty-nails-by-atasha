"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Award, Settings, CheckCircle2, Plus, RotateCcw, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface LoyaltyCard {
  id: string;
  userId: string;
  stampCount: number;
  lastStampAt: string | null;
  expiresAt: string | null;
  user: { name: string | null; nickname?: string | null; email: string };
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
  const [settings, setSettings] = useState<Settings>({
    stampsRequired: 9,
    stampExpiryMonths: 12,
    stampPerService: true,
    stampPerAmount: 50000,
  });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") window.location.href = "/login";
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchCards();
      fetchSettings();
    }
  }, [session]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/admin/loyalty");
      if (res.ok) {
        const raw = await res.json();
        // Never show owner in loyalty customer list
        setCards(
          raw.filter(
            (c: any) =>
              c.user?.email !== "owner@prettynails.com" &&
              !c.user?.name?.toLowerCase().includes("atasha")
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) setSettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      showToast("Stamp rules and settings saved");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCardAction = async (cardId: string, action: "ADD_STAMP" | "RESET" | "REDEEM", customerName: string) => {
    if (action === "RESET" && !confirm(`Reset stamps for ${customerName} to 0?`)) return;
    if (action === "REDEEM" && !confirm(`Redeem free nail set for ${customerName}? This will deduct 9 stamps.`)) return;

    setActionLoading(cardId);
    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, action, amount: 1 }),
      });
      if (res.ok) {
        if (action === "ADD_STAMP") showToast(`Added +1 stamp for ${customerName}`);
        if (action === "RESET") showToast(`Reset stamps to 0 for ${customerName}`);
        if (action === "REDEEM") showToast(`Redeemed free nail set for ${customerName}`);
        await fetchCards();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update stamp card");
    } finally {
      setActionLoading(null);
    }
  };

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

  const activeCards = cards.filter(
    (c) => !c.expiresAt || new Date(c.expiresAt) > new Date()
  ).length;
  const totalStamps = cards.reduce((sum, c) => sum + c.stampCount, 0);
  const readyToRedeem = cards.filter((c) => c.stampCount >= (settings.stampsRequired || 9)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-gray-600 text-sm mt-1">
            Unified digital loyalty stamp system &mdash; 9 stamps = 1 free nail set
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          {notification}
        </div>
      )}

      {/* Top Program Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{cards.length}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Stamp Cards</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{activeCards}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Stamps Earned</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">{totalStamps}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free Sets Ready (9/9)</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{readyToRedeem}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Loyalty Cards & Stamps List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display text-xl text-gray-900">
                Customer Loyalty Cards &amp; Stamps
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Every customer has 1 digital stamp card. Collect 9 stamps to earn 1 free nail set.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-14 w-14 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No loyalty members yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-left text-xs font-semibold text-gray-600">
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Loyalty Stamps Progress</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Stamp</th>
                    <th className="p-3.5">Card Expiration</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cards.map((c) => {
                    const isExpired = c.expiresAt && new Date(c.expiresAt) <= new Date();
                    const isReady = c.stampCount >= (settings.stampsRequired || 9);
                    const progressPercent = Math.min((c.stampCount / (settings.stampsRequired || 9)) * 100, 100);

                    return (
                      <tr key={c.id} className="hover:bg-pink-50/20 transition-colors">
                        <td className="p-3.5">
                          <p className="font-semibold text-gray-900">{c.user.name || "Customer"}</p>
                          <p className="text-xs text-gray-500">{c.user.email}</p>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-1.5 min-w-[160px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-900 text-sm">
                                {c.stampCount} / {settings.stampsRequired} Stamps
                              </span>
                              <span className="text-gray-500 text-[11px]">
                                {isReady ? "Reward Unlocked!" : `${(settings.stampsRequired || 9) - c.stampCount} to free set`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-600 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {isExpired ? (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          ) : isReady ? (
                            <Badge variant="success" className="text-xs font-bold flex items-center gap-1 w-fit">
                              <Gift className="h-3 w-3" /> Free Set Ready
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">In Progress</Badge>
                          )}
                        </td>

                        <td className="p-3.5 text-xs text-gray-600">
                          {c.lastStampAt ? formatDate(c.lastStampAt) : "No stamps yet"}
                        </td>

                        <td className="p-3.5 text-xs text-gray-600">
                          {c.expiresAt ? formatDate(c.expiresAt) : "12 months"}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {isReady && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCardAction(c.id, "REDEEM", c.user.name || c.user.email)}
                                disabled={actionLoading === c.id}
                                className="h-7 px-2 text-xs font-semibold text-primary-700 border-primary-300 hover:bg-primary-50"
                                title="Redeem 9 stamps for 1 free nail set"
                              >
                                <Gift className="h-3 w-3 mr-1" /> Redeem Free Set
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCardAction(c.id, "ADD_STAMP", c.user.name || c.user.email)}
                              disabled={actionLoading === c.id}
                              className="h-7 px-2 text-xs hover:bg-pink-50 hover:text-primary-700"
                              title="Award +1 Stamp to this card"
                            >
                              <Plus className="h-3 w-3 mr-1" /> +1 Stamp
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCardAction(c.id, "RESET", c.user.name || c.user.email)}
                              disabled={actionLoading === c.id}
                              className="h-7 px-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                              title="Reset stamps to 0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary-600" />
            Loyalty Rules Configuration
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Rules governing when customer digital cards receive stamps and rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettings();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <Label htmlFor="stampsRequired">Stamps Required for Free Nail Set</Label>
              <Input
                id="stampsRequired"
                type="number"
                min="1"
                value={settings.stampsRequired}
                onChange={(e) =>
                  setSettings({ ...settings, stampsRequired: parseInt(e.target.value) || 9 })
                }
                className="mt-1"
              />
              <p className="text-[11px] text-gray-400 mt-1">Default: 9 stamps = 1 free nail set</p>
            </div>

            <div>
              <Label htmlFor="stampExpiryMonths">Stamp Expiry Window (Months)</Label>
              <Input
                id="stampExpiryMonths"
                type="number"
                min="1"
                value={settings.stampExpiryMonths}
                onChange={(e) =>
                  setSettings({ ...settings, stampExpiryMonths: parseInt(e.target.value) || 12 })
                }
                className="mt-1"
              />
              <p className="text-[11px] text-gray-400 mt-1">Default: 12 months</p>
            </div>

            <div className="flex flex-col justify-center">
              <Label className="mb-2">Earn by Service</Label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={settings.stampPerService}
                  onChange={(e) =>
                    setSettings({ ...settings, stampPerService: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-600"
                />
                <span>1 stamp per nail set service</span>
              </label>
            </div>

            <div className="flex flex-col justify-center">
              <Label className="mb-2">Earn by Amount</Label>
              <p className="text-xs text-gray-600">
                1 stamp per ₱500 paid amount (₱1,000+ = 2 stamps)
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs"
              >
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Save Loyalty Rules
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
