"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, Calendar, Award, LogOut, User, Mail, Phone, Edit2, Save, X, Check, AlertTriangle, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await update({ name: formData.name });
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCancelMessage(data.message);
        fetchData();
      } else {
        alert(data.error || "Failed to cancel booking");
      }
    } catch (e) {
      console.error(e);
      alert("Network error cancelling booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const isEligibleForRefund = (appointmentDateStr: string) => {
    const appt = new Date(appointmentDateStr);
    const cutoff = new Date(appt);
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(20, 0, 0, 0); // 8:00 PM the night prior
    return new Date() < cutoff;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
      PENDING: "warning",
      CONFIRMED: "success",
      COMPLETED: "default",
      CANCELLED: "destructive",
      NO_SHOW: "destructive",
    };
    return variants[status] || "default";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen py-10 px-4 bg-gray-50/50">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">Manage your profile, view stamps, and track appointments</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://www.facebook.com/prettynailsbyatasha", "_blank")}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Chat on Facebook
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/api/auth/signout?callbackUrl=/"}
              className="text-gray-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card & Loyalty Card */}
          <div className="space-y-6">
            <Card className="border-primary-100 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <div className="space-y-2">
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your Name"
                          className="h-9"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900 truncate">{session.user.name || "Customer"}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(true)}
                          className="h-7 text-xs px-2 mt-1 text-primary-600 hover:text-primary-700"
                        >
                          <Edit2 className="mr-1 h-3 w-3" /> Edit name
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t text-xs text-gray-500 space-y-1">
                  <p>Role: <span className="font-medium text-gray-700">{session.user.role}</span></p>
                  <p>Salon: Pretty Nails by Atasha</p>
                  <p>Phone: 0977 284 6167</p>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Card Summary */}
            <Card className="border-pink-200 shadow-sm bg-gradient-to-br from-pink-50 via-white to-pink-50 relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-primary-950">
                    <Award className="h-5 w-5 text-primary-600" />
                    Digital Loyalty Card
                  </CardTitle>
                  <Badge variant="outline" className="border-primary-300 text-primary-800 bg-white">
                    {loyaltyCard?.stampCount || 0}/9 Stamps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-1">
                    Progress to Free Nail Set
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {loyaltyCard && loyaltyCard.stampCount >= 9
                      ? "Free nail set ready to redeem!"
                      : `${9 - (loyaltyCard?.stampCount || 0)} more stamps needed`}
                  </p>
                </div>

                {/* Stamp Slots */}
                <div className="grid grid-cols-5 gap-1.5 justify-center max-w-xs mx-auto">
                  {Array.from({ length: 9 }, (_, i) => {
                    const filled = i < (loyaltyCard?.stampCount || 0);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-colors",
                          filled
                            ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                            : "bg-white border-dashed border-primary-200 text-primary-300"
                        )}
                      >
                        {filled ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
                      </div>
                    );
                  })}
                  <div className="aspect-square rounded-lg border-2 border-primary-300 bg-pink-100 flex items-center justify-center text-[10px] font-bold text-primary-700 text-center leading-tight">
                    FREE SET
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 text-center">
                  1 stamp per nail set or ₱500 paid. Valid for 12 months.
                </div>

                <Button
                  onClick={() => (window.location.href = "/loyalty")}
                  className="w-full text-xs h-9"
                >
                  <Award className="mr-1.5 h-4 w-4" />
                  Open Stamp Scanner & Rules
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Bookings History */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    Appointment History
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Appointment only • Saturday and Sunday • 8:00 AM - 10:00 PM
                  </p>
                </div>
                <Button size="sm" onClick={() => (window.location.href = "/booking")}>
                  Book Appointment
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 animate-pulse bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No appointments booked yet</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                      Reserve your preferred weekend slot with Ma'am Atasha ahead of time.
                    </p>
                    <Button className="mt-4" onClick={() => (window.location.href = "/booking")}>
                      Book Your First Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
                      const refundEligible = isEligibleForRefund(booking.appointmentDate);

                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            "p-4 border rounded-xl transition-all space-y-3",
                            booking.status === "PENDING" && "border-yellow-200 bg-yellow-50/40",
                            booking.status === "CONFIRMED" && "border-green-200 bg-green-50/40",
                            booking.status === "COMPLETED" && "border-gray-200 bg-gray-50/40",
                            booking.status === "CANCELLED" && "border-red-200 bg-red-50/40"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{formatDate(booking.appointmentDate)}</p>
                                <p className="text-xs text-gray-600">
                                  {booking.startTime} - {booking.endTime} (Weekend Slot)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadge(booking.status)} className="capitalize text-xs">
                                {booking.status.toLowerCase().replace("_", " ")}
                              </Badge>
                              <span className="font-bold text-primary-700 text-sm">
                                {formatCurrency(booking.totalPrice)}
                              </span>
                            </div>
                          </div>

                          {/* Services */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {booking.services?.map((s: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-white border border-gray-200">
                                {s.service?.name || s.serviceName} - {s.variantName || "Standard"}
                              </Badge>
                            ))}
                          </div>

                          {/* Payment status & downpayment */}
                          <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200/60">
                            <div>
                              <span>Reservation Fee: </span>
                              <span className="font-medium text-gray-800">₱100 (GCash)</span>
                              {booking.payment && (
                                <span className={cn(
                                  "ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                                  booking.payment.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                )}>
                                  Payment: {booking.payment.status}
                                </span>
                              )}
                            </div>

                            {canCancel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCancellingBooking(booking);
                                  setCancelMessage(null);
                                }}
                                className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 mt-2 sm:mt-0"
                              >
                                Cancel Appointment
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={!!cancellingBooking} onOpenChange={(open) => !open && setCancellingBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Appointment
            </DialogTitle>
          </DialogHeader>

          {cancellingBooking && (
            <div className="space-y-4 py-2 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">{formatDate(cancellingBooking.appointmentDate)}</p>
                <p className="text-xs text-gray-500">{cancellingBooking.startTime} - {cancellingBooking.endTime}</p>
              </div>

              {isEligibleForRefund(cancellingBooking.appointmentDate) ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-900 text-xs space-y-1">
                  <p className="font-semibold">Cancellation within Allowed Window</p>
                  <p>
                    You are cancelling before 8:00 PM the day prior. Your ₱100 reservation fee may be credited or refunded.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs space-y-1">
                  <p className="font-semibold">Late Cancellation Notice</p>
                  <p>
                    Cancellations past 8:00 PM the day before forfeit the ₱100 downpayment in accordance with salon policy.
                  </p>
                </div>
              )}

              {cancelMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                  {cancelMessage}
                </div>
              )}

              <p className="text-xs text-gray-500">
                For special concerns or reschedule requests, please message Ma'am Atasha directly on Facebook.
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://www.facebook.com/prettynailsbyatasha", "_blank")}
              className="gap-1 text-xs"
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Chat Facebook Page
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelBooking}
              disabled={cancelLoading}
              className="text-xs"
            >
              {cancelLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
