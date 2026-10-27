"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Loader2, Calendar, Award, CreditCard, LogOut, User, Mail, Phone, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStampProgress } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loyaltyCard, setLoyaltyCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
      setFormData({ name: session.user.name || "", phone: "" });
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [bookingsRes, loyaltyRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/loyalty/card"),
      ]);
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (loyaltyRes.ok) setLoyaltyCard(await loyaltyRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await update({ name: formData.name });
    } catch (e) { console.error(e); }
    finally { setSaving(false); setEditing(false); }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
      PENDING: "warning",
      CONFIRMED: "success",
      COMPLETED: "default",
      CANCELLED: "destructive",
      NO_SHOW: "destructive",
    };
    return variants[status] || "default";
  };

  const progress = loyaltyCard ? getStampProgress(loyaltyCard.stampCount, 9) : 0;

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account and view booking history</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile & Loyalty */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    {session.user.image ? (
                      <img src={session.user.image} alt={session.user.name || ""} className="w-20 h-20 rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-primary-600">{session.user.name?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    {editing ? (
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="09XX XXX XXXX" />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveProfile} disabled={saving} size="sm">{saving ? "Saving..." : "Save"}</Button>
                          <Button variant="outline" onClick={() => { setEditing(false); setFormData({ name: session.user.name || "", phone: "" }); }} size="sm">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-lg text-gray-900">{session.user.name || "No name set"}</p>
                        <p className="text-sm text-gray-500">{session.user.email}</p>
                        <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="mr-2 h-4 w-4" /> Edit Profile</Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Member since {formatDate(session.user.createdAt || new Date())}</p>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Card */}
            <Card className="gradient-pinkish relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-50" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Loyalty Progress</p>
                    <h3 className="font-bold text-gray-900">Pretty Nails Rewards</h3>
                  </div>
                  <Award className="h-10 w-10 text-primary-500" />
                </div>
                <div className="text-center mb-6">
                  <div className="relative w-36 h-36 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="66" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle cx="72" cy="72" r="66" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${progress * 4.14} 414`} className="transition-all duration-500" />
                      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#f472b6" /></linearGradient></defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{loyaltyCard?.stampCount || 0}</span>
                      <span className="text-gray-500 ml-1">/ 9</span>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {loyaltyCard && loyaltyCard.stampCount >= 9 ? "🎉 Free nail set ready!" : `${9 - (loyaltyCard?.stampCount || 0)} more stamps for a free nail set!`}
                  </p>
                </div>
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: 9 }, (_, i) => (
                    <div key={i} className={cn("w-8 h-8 rounded border-2 flex items-center justify-center",
                      i < (loyaltyCard?.stampCount || 0) ? "bg-primary-500 border-primary-500" : "bg-white border-gray-300"
                    )}>
                      {i < (loyaltyCard?.stampCount || 0) && <span className="text-white text-xs">✓</span>}
                    </div>
                  ))}
                </div>
                <Button onClick={() => window.location.href = "/loyalty"} className="w-full">
                  <Award className="mr-2 h-4 w-4" /> View Loyalty Details
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bookings History */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Booking History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse bg-gray-100 rounded mb-4" />)
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No bookings yet</p>
                    <Button className="mt-4" onClick={() => window.location.href = "/booking"}>
                      <Calendar className="mr-2 h-4 w-4" /> Book Your First Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(booking => (
                      <div key={booking.id} className={cn(
                        "p-4 border rounded-lg",
                        booking.status === "PENDING" && "border-yellow-300 bg-yellow-50",
                        booking.status === "CONFIRMED" && "border-green-300 bg-green-50",
                        booking.status === "COMPLETED" && "border-gray-300 bg-gray-50",
                        booking.status === "CANCELLED" && "border-red-300 bg-red-50",
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{formatDate(booking.appointmentDate)}</p>
                              <p className="text-sm text-gray-500">{booking.startTime} - {booking.endTime}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={getStatusBadge(booking.status)} className="capitalize">
                              {booking.status.toLowerCase().replace("_", " ")}
                            </Badge>
                            <span className="font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                          {booking.services.map((s: any, i: number) => (
                            <Badge key={i} variant="secondary">{s.serviceName} - {s.variantName}</Badge>
                          ))}
                        </div>
                        {booking.notes && (
                          <div className="mt-2 text-sm text-gray-600">{booking.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}