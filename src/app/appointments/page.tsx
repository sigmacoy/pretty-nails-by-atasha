"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Award,
  Loader2,
  ArrowRight,
  AlertTriangle,
  User,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  userId: string;
  status: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  downpayment: number;
  notes: string | null;
  inspirationImg: string | null;
  services: Array<{
    id: string;
    serviceId: string;
    variantId?: string | null;
    quantity: number;
    price: number;
    service: {
      name: string;
      category?: string;
      basePrice: number;
      duration: number;
    };
  }>;
  payment: {
    id: string;
    amount: number;
    status: string;
    method: string;
    reference: string | null;
  } | null;
  loyaltyStamps?: Array<{ id: string }>;
}

export default function CurrentAppointmentsPage() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login?callbackUrl=/appointments";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      fetchBookings();
    }
  }, [session]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
    } finally {
      setLoading(false);
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
        setCancelMessage(data.message || "Appointment cancelled.");
        fetchBookings();
      } else {
        alert(data.error || "Failed to cancel appointment.");
      }
    } catch (e) {
      console.error("Cancel error:", e);
      alert("Error cancelling appointment. Please try again.");
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session) return null;

  // Find active appointment (PENDING or CONFIRMED)
  const activeBookings = bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED");
  const pastBookings = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "NO_SHOW");
  const currentAppointment = activeBookings[0] || null;

  return (
    <div className="min-h-screen py-10 px-4 bg-gray-50/50">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
              Customer Portal
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-0.5">
              Current Appointment
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Track your scheduled nail session with Ma'am Atasha
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/booking">
              <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs">
                <Calendar className="h-4 w-4 mr-1.5" />
                Book Appointment
              </Button>
            </Link>
            <Link href="/loyalty">
              <Button variant="outline" size="sm" className="border-primary-200 text-primary-800 bg-white">
                <Award className="h-4 w-4 mr-1.5" />
                Loyalty Card
              </Button>
            </Link>
          </div>
        </div>

        {/* Current Active Appointment Banner / Card */}
        {currentAppointment ? (
          <div className="space-y-6">
            <Card className="border-2 border-primary-200 shadow-md bg-gradient-to-br from-pink-50/80 via-white to-pink-50/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

              <CardHeader className="pb-3 border-b border-pink-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-900">
                      Active Scheduled Session
                    </span>
                  </div>
                  <Badge variant={getStatusBadge(currentAppointment.status)} className="text-xs font-semibold px-3 py-1">
                    {currentAppointment.status === "PENDING"
                      ? "Awaiting Owner Confirmation"
                      : currentAppointment.status === "CONFIRMED"
                      ? "Confirmed by Atasha"
                      : currentAppointment.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Date & Time Highlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-primary-100 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Appointment Date</p>
                      <p className="text-base font-bold text-gray-900">
                        {formatDate(currentAppointment.appointmentDate)}
                      </p>
                      <p className="text-[11px] text-primary-700 font-medium">Saturday & Sunday Service</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0 border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Scheduled Time</p>
                      <p className="text-base font-bold text-gray-900">
                        {formatTime(currentAppointment.startTime)} - {formatTime(currentAppointment.endTime)}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">Estimated 3 - 5 Hours</p>
                    </div>
                  </div>
                </div>

                {/* Services & Pricing Breakdown */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary-600" />
                    Requested Services
                  </h3>
                  <div className="space-y-2">
                    {currentAppointment.services.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 shadow-2xs"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.service.name}</p>
                          <p className="text-xs text-gray-500">Duration: ~{item.service.duration || 180} mins</p>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {currentAppointment.notes && (
                    <div className="p-3 bg-white rounded-lg border border-gray-100 text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">Your Notes: </span>
                      "{currentAppointment.notes}"
                    </div>
                  )}
                </div>

                {/* Payment & Reservation Status */}
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Service Price</span>
                    <span className="font-bold text-gray-900">{formatCurrency(currentAppointment.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Reservation Fee (Downpayment)</span>
                    <span className="font-semibold text-green-700">
                      {currentAppointment.payment?.status === "PAID" ? "₱100 Paid via GCash" : "₱100 Pending"}
                    </span>
                  </div>
                  {currentAppointment.payment?.reference && (
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-100">
                      <span>GCash Reference</span>
                      <span className="font-mono text-gray-700">{currentAppointment.payment.reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 font-bold">
                    <span className="text-gray-900">Remaining Balance (Due at Salon)</span>
                    <span className="text-primary-700">
                      {formatCurrency(currentAppointment.totalPrice - currentAppointment.downpayment)}
                    </span>
                  </div>
                </div>

                {/* Salon Location & Solo Artist Info */}
                <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100 space-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-2 text-primary-900 font-bold">
                    <ShieldCheck className="h-4 w-4 text-primary-600" />
                    Appointment Guidelines & Salon Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-gray-600">
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                      Artist: <strong className="text-gray-800">Ma'am Atasha</strong> (Solo Nail Artist)
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                      Contact: <strong className="text-gray-800">0977 284 6167</strong>
                    </p>
                    <p className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                      Location: <strong className="text-gray-800">Cebu City, Cebu, Philippines</strong>
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 italic pt-1 border-t border-primary-100/60">
                    Cancellations made before 8:00 PM the night prior are eligible for refund/credit.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://www.facebook.com/prettynailsbyatasha", "_blank")}
                    className="w-full sm:w-auto text-xs gap-1.5 border-blue-200 text-blue-800 hover:bg-blue-50"
                  >
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    Chat on Facebook
                  </Button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCancellingBooking(currentAppointment);
                        setCancelMessage(null);
                      }}
                      className="w-full sm:w-auto text-xs border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Cancel Appointment
                    </Button>
                    <Link href="/loyalty" className="w-full sm:w-auto">
                      <Button size="sm" className="w-full text-xs font-semibold">
                        <Award className="h-3.5 w-3.5 mr-1" />
                        My Stamp Card
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other Active Appointments if any */}
            {activeBookings.length > 1 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-800">Other Upcoming Appointments</h3>
                {activeBookings.slice(1).map((b) => (
                  <div key={b.id} className="p-4 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{formatDate(b.appointmentDate)}</p>
                      <p className="text-xs text-gray-500">{formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                    </div>
                    <Badge variant={getStatusBadge(b.status)}>{b.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty State: No Active Appointments */
          <Card className="border-dashed border-2 border-gray-200 bg-white text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mx-auto mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              No Active Appointments
            </h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
              You do not have any upcoming appointments scheduled right now. Book your weekend nail session with Ma'am Atasha!
            </p>
            <Link href="/booking">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 font-semibold text-white shadow-sm">
                <Calendar className="mr-2 h-4 w-4" />
                Book Your Weekend Slot
              </Button>
            </Link>
          </Card>
        )}

        {/* Past Appointments History */}
        {pastBookings.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h2 className="font-display text-xl font-bold text-gray-900">
              Past Appointments
            </h2>
            <div className="space-y-3">
              {pastBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{formatDate(b.appointmentDate)}</span>
                      <Badge variant={getStatusBadge(b.status)} className="text-xs">
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(b.startTime)} - {formatTime(b.endTime)} • {b.services.map((s) => s.service.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right font-bold text-gray-900">
                    {formatCurrency(b.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
