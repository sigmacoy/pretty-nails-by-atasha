"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  Phone,
  Mail,
  Edit,
  Sliders,
  AlertCircle,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate, formatTime, formatCurrency, isWeekend } from "@/lib/utils";
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
  user: {
    id: string;
    name: string | null;
    nickname?: string | null;
    email: string;
    phone: string | null;
  };
  services: Array<{
    service: { name: string; duration: number };
    variantId: string | null;
    price: number;
  }>;
  payment: {
    status: string;
    reference: string | null;
  } | null;
}

interface Availability {
  id?: string;
  date: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  maxSlots: number;
  note: string | null;
}

export default function AdminSchedulePage() {
  const { data: session, status } = useSession();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split("T")[0]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Availability Dialog
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editFormData, setEditFormData] = useState({
    isAvailable: true,
    startTime: "08:00",
    endTime: "22:00",
    maxSlots: 4,
    note: "",
  });

  // Note dialog
  const [noteCustomer, setNoteCustomer] = useState<{ id: string; name: string; nickname?: string } | null>(null);
  const [customerNoteText, setCustomerNoteText] = useState("");
  const [customerNicknameText, setCustomerNicknameText] = useState("");

  // Stamp QR dialog
  const [stampModalBooking, setStampModalBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchMonthData();
    }
  }, [session, currentMonth, currentYear]);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];

      const [availRes, bookingsRes] = await Promise.all([
        fetch(`/api/admin/availability?start=${startDate}&end=${endDate}`),
        fetch(`/api/admin/bookings?start=${startDate}&end=${endDate}&limit=100`),
      ]);

      if (availRes.ok) {
        setAvailabilities(await availRes.json());
      }
      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setMonthBookings(Array.isArray(bData) ? bData : bData.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchMonthData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDayAvailability = async (dateStr: string, currentIsAvailable: boolean) => {
    const existing = availabilities.find((a) => a.date === dateStr || a.date.startsWith(dateStr));
    try {
      const res = await fetch(`/api/admin/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          isAvailable: !currentIsAvailable,
          startTime: existing?.startTime || "08:00",
          endTime: existing?.endTime || "22:00",
          maxSlots: existing?.maxSlots || 4,
          note: !currentIsAvailable ? "" : "Blocked by owner",
        }),
      });
      if (res.ok) {
        fetchMonthData();
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    }
  };

  const handleSaveHours = async () => {
    try {
      const res = await fetch(`/api/admin/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDateStr,
          ...editFormData,
        }),
      });
      if (res.ok) {
        setIsEditingHours(false);
        fetchMonthData();
      }
    } catch (err) {
      console.error("Failed to save hours:", err);
    }
  };

  const handleSaveCustomerNote = async () => {
    if (!noteCustomer) return;
    try {
      const res = await fetch(`/api/admin/customers/${noteCustomer.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: customerNoteText || "Customer note updated.",
          nickname: customerNicknameText || undefined,
        }),
      });
      if (res.ok) {
        setNoteCustomer(null);
        setCustomerNoteText("");
        setCustomerNicknameText("");
        fetchMonthData();
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  // Calendar dates generation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const monthDates: Date[] = [];
  for (let i = firstDay.getDay(); i > 0; i--) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() - i);
    monthDates.push(d);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    monthDates.push(new Date(currentYear, currentMonth, i));
  }
  while (monthDates.length % 7 !== 0) {
    const nextD: Date = new Date(monthDates[monthDates.length - 1]);
    nextD.setDate(nextD.getDate() + 1);
    monthDates.push(nextD);
  }

  // Filter bookings for selected day & sort in Queue order (earliest startTime first)
  const selectedDayBookings = monthBookings
    .filter((b) => {
      const bDate = new Date(b.appointmentDate).toISOString().split("T")[0];
      return bDate === selectedDateStr;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find availability for selected day
  const selectedDayObj = new Date(selectedDateStr + "T00:00:00");
  const selectedDayAvail = availabilities.find((a) => a.date === selectedDateStr || a.date.startsWith(selectedDateStr));
  const isSelectedDayWeekend = isWeekend(selectedDayObj);
  const isSelectedDayAvailable = selectedDayAvail?.isAvailable ?? isSelectedDayWeekend;

  // Conflict Detection Engine:
  // Detects if any booking's estimated service duration (average 3h to 5h) overlaps with a subsequent booking
  const conflicts: Array<{ bookingA: Booking; bookingB: Booking; reason: string }> = [];
  for (let i = 0; i < selectedDayBookings.length; i++) {
    const a = selectedDayBookings[i];
    if (a.status === "CANCELLED" || a.status === "NO_SHOW") continue;

    const [aHour, aMin] = a.startTime.split(":").map(Number);
    const aStartMinutes = aHour * 60 + aMin;
    // Estimated duration: minimum 180 min (3h), maximum up to 300 min (5h)
    const aEstEndMinutes = aStartMinutes + 180; // 3 hours

    for (let j = i + 1; j < selectedDayBookings.length; j++) {
      const b = selectedDayBookings[j];
      if (b.status === "CANCELLED" || b.status === "NO_SHOW") continue;

      const [bHour, bMin] = b.startTime.split(":").map(Number);
      const bStartMinutes = bHour * 60 + bMin;

      if (bStartMinutes < aEstEndMinutes) {
        conflicts.push({
          bookingA: a,
          bookingB: b,
          reason: `${a.user?.name || "Customer 1"} (${a.startTime}, ~3-5h service) overlaps with ${b.user?.name || "Customer 2"} (${b.startTime}).`,
        });
      }
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Top Banner / Staff Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-primary-100 shadow-sm">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
            Schedule & Queue Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Solo Nail Artist: <span className="font-semibold text-primary-700">Ma'am Atasha</span> • Available Saturdays & Sundays (8:00 AM - 10:00 PM) • Max 4 clients per day
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary-200 text-primary-800 bg-primary-50 px-3 py-1">
            Queue Resolution Active
          </Badge>
        </div>
      </div>

      {/* Main Grid: Left Calendar / Right Queue Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Section (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
                    if (currentMonth === 0) setCurrentYear((y) => y - 1);
                  }}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-display text-lg font-bold capitalize text-gray-900">
                  {firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrentMonth((m) => (m === 11 ? 0 : m + 1));
                    if (currentMonth === 11) setCurrentYear((y) => y + 1);
                  }}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Weekend Open
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Blocked
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-gray-500 py-1.5 bg-gray-50 rounded"
                  >
                    {day}
                  </div>
                ))}

                {monthDates.map((date, idx) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isSelected = dateStr === selectedDateStr;
                  const isWeekendDay = isWeekend(date);
                  const avail = availabilities.find((a) => a.date === dateStr || a.date.startsWith(dateStr));
                  const isAvailable = avail?.isAvailable ?? isWeekendDay;
                  const isPast = date < today;

                  // Count bookings for this day
                  const dayBookings = monthBookings.filter((b) => {
                    const bDate = new Date(b.appointmentDate).toISOString().split("T")[0];
                    return bDate === dateStr && b.status !== "CANCELLED";
                  });

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={cn(
                        "min-h-[72px] sm:min-h-[84px] p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all relative",
                        !isCurrentMonth && "text-gray-300 bg-gray-50/50 border-gray-100",
                        isCurrentMonth && !isSelected && "hover:border-primary-300 hover:bg-primary-50/20 bg-white border-gray-200",
                        isSelected && "ring-2 ring-primary-500 border-primary-500 bg-primary-50/40 shadow-sm",
                        !isAvailable && isCurrentMonth && "bg-red-50/30 border-red-200"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            "text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full",
                            isSelected ? "bg-primary-600 text-white" : "text-gray-800",
                            !isAvailable && "text-gray-400 line-through"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        {isAvailable && isWeekendDay && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        )}
                        {!isAvailable && (
                          <span className="text-[10px] text-red-500 font-medium">Off</span>
                        )}
                      </div>

                      {/* Queue badge indicator */}
                      <div className="mt-1">
                        {dayBookings.length > 0 ? (
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold",
                            dayBookings.length >= 4 ? "bg-red-100 text-red-700" : "bg-primary-100 text-primary-800"
                          )}>
                            {dayBookings.length} {dayBookings.length === 1 ? "client" : "clients"}
                          </span>
                        ) : isAvailable && isWeekendDay ? (
                          <span className="text-[10px] text-gray-400">Open</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Availability Quick Settings */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary-600" />
                  <span className="font-semibold text-sm text-gray-900">
                    Day Controls for {formatDate(selectedDateStr)}
                  </span>
                </div>
                <Badge variant={isSelectedDayAvailable ? "success" : "destructive"}>
                  {isSelectedDayAvailable ? "Working Day" : "Blocked Off"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-600 space-y-0.5">
                <p>
                  Status:{" "}
                  <span className="font-semibold text-gray-900">
                    {isSelectedDayAvailable ? "Open for bookings (8:00 AM - 10:00 PM)" : "Closed / Blocked (Break/Holiday)"}
                  </span>
                </p>
                <p>Max Capacity: 4 customers per day (Average 3 to 5 hours per service)</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isSelectedDayAvailable ? "destructive" : "success"}
                  onClick={() => handleToggleDayAvailability(selectedDateStr, isSelectedDayAvailable)}
                  className="text-xs font-semibold px-3 shadow-xs"
                >
                  {isSelectedDayAvailable ? "Block this Day" : "Unblock this Day / Open"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditFormData({
                      isAvailable: isSelectedDayAvailable,
                      startTime: selectedDayAvail?.startTime || "08:00",
                      endTime: selectedDayAvail?.endTime || "22:00",
                      maxSlots: selectedDayAvail?.maxSlots || 4,
                      note: selectedDayAvail?.note || "",
                    });
                    setIsEditingHours(true);
                  }}
                  className="text-xs"
                >
                  Custom Hours
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Day Queue System & Conflicts (5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary-600" />
                    Queue for {formatDate(selectedDateStr)}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Customers pile up in queue. Approve and resolve conflicts first.
                  </CardDescription>
                </div>
                <Badge variant={selectedDayBookings.length >= 4 ? "destructive" : "outline"} className="text-xs">
                  {selectedDayBookings.length}/4 Queued
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Conflict Schedule Warning Alert */}
              {conflicts.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Conflict Schedule Detected
                  </div>
                  {conflicts.map((c, idx) => (
                    <p key={idx} className="text-xs text-amber-900 leading-relaxed">
                      {c.reason}
                    </p>
                  ))}
                  <p className="text-[11px] text-amber-800 italic pt-1 border-t border-amber-200">
                    Solved by owner confirmation: Review the queue order below and confirm or reject appointments to avoid overlap.
                  </p>
                </div>
              )}

              {/* Queue List (Top is #1 First, Bottom is Last) */}
              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Clock className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600 font-medium text-sm">No customers in queue for this day</p>
                  <p className="text-xs text-gray-400 mt-1">
                    When customers book appointments, they will appear here in queue order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayBookings.map((booking, index) => {
                    const queuePosition = index + 1;
                    const isOverlapping = conflicts.some(
                      (c) => c.bookingA.id === booking.id || c.bookingB.id === booking.id
                    );

                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "p-3.5 border rounded-xl transition-all relative space-y-2.5",
                          isOverlapping && "ring-1 ring-amber-400 bg-amber-50/30",
                          booking.status === "PENDING" && !isOverlapping && "border-yellow-200 bg-yellow-50/30",
                          booking.status === "CONFIRMED" && !isOverlapping && "border-green-200 bg-green-50/30",
                          booking.status === "COMPLETED" && "border-gray-200 bg-gray-50/30",
                          booking.status === "CANCELLED" && "border-red-200 bg-red-50/30 opacity-75"
                        )}
                      >
                        {/* Queue Position Pill */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs",
                              index === 0 ? "bg-primary-600" : "bg-gray-700"
                            )}>
                              {queuePosition}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                              {index === 0 ? "First in Queue" : `Queue Position #${queuePosition}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadge(booking.status)} className="capitalize text-xs">
                              {booking.status.toLowerCase().replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-gray-900 text-sm">
                                {booking.user?.name || "Customer"}
                              </span>
                              {booking.user?.nickname && (
                                <span className="text-xs text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded font-medium">
                                  "{booking.user.nickname}"
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                              {booking.user?.phone && (
                                <p className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-gray-400" /> {booking.user.phone}
                                </p>
                              )}
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-400" /> {booking.user?.email}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-primary-700 text-sm block">
                              {formatCurrency(booking.totalPrice)}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Downpayment: {booking.payment?.status === "PAID" ? "₱100 Paid" : "Pending"}
                            </span>
                          </div>
                        </div>

                        {/* Time & Duration */}
                        <div className="flex items-center justify-between text-xs bg-white/70 p-2 rounded border border-gray-200/60">
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                            <Clock className="h-3.5 w-3.5 text-primary-600" />
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </div>
                          <span className="text-[11px] text-gray-500">
                            Avg Duration: 3 - 5 Hours
                          </span>
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-1">
                          {booking.services.map((s, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[11px] bg-white border border-gray-200">
                              {s.service.name}
                            </Badge>
                          ))}
                        </div>

                        {/* Customer Notes */}
                        {booking.notes && (
                          <p className="text-xs text-gray-600 italic bg-white/50 p-1.5 rounded border border-gray-100">
                            "{booking.notes}"
                          </p>
                        )}

                        {/* Actions for Owner */}
                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-200/60 gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNoteCustomer({
                                id: booking.user.id,
                                name: booking.user.name || "Customer",
                                nickname: booking.user.nickname || "",
                              });
                              setCustomerNicknameText(booking.user.nickname || "");
                              setCustomerNoteText("");
                            }}
                            className="h-7 text-xs px-2 text-gray-600"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Add Nickname/Note
                          </Button>

                          <div className="flex gap-1.5">
                            {booking.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                                  disabled={actionLoading === booking.id}
                                  className="h-7 text-xs px-2.5"
                                >
                                  {actionLoading === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                                  disabled={actionLoading === booking.id}
                                  className="h-7 text-xs px-2"
                                >
                                  Decline
                                </Button>
                              </>
                            )}

                            {booking.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                variant="info"
                                onClick={async () => {
                                  await handleStatusChange(booking.id, "COMPLETED");
                                  setStampModalBooking(booking);
                                }}
                                disabled={actionLoading === booking.id}
                                className="h-7 text-xs px-2.5 font-semibold"
                              >
                                {actionLoading === booking.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <QrCode className="h-3 w-3 mr-1" />
                                )}
                                Complete & Generate Stamp QR
                              </Button>
                            )}

                            {booking.status === "COMPLETED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStampModalBooking(booking)}
                                className="h-7 text-xs px-2.5 text-primary-700 border-primary-200 hover:bg-primary-50 font-medium"
                              >
                                <QrCode className="h-3 w-3 mr-1" />
                                Show Stamp QR
                              </Button>
                            )}
                          </div>
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

      {/* Edit Hours Dialog */}
      <Dialog open={isEditingHours} onOpenChange={setIsEditingHours}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule for {formatDate(selectedDateStr)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <Label htmlFor="dayAvailable">Available for Bookings</Label>
              <input
                id="dayAvailable"
                type="checkbox"
                checked={editFormData.isAvailable}
                onChange={(e) => setEditFormData({ ...editFormData, isAvailable: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-primary-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="maxSlots">Max Customers for Day</Label>
              <Input
                id="maxSlots"
                type="number"
                min={1}
                max={6}
                value={editFormData.maxSlots}
                onChange={(e) => setEditFormData({ ...editFormData, maxSlots: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div>
              <Label htmlFor="dayNote">Note (Holiday / Reason for Block)</Label>
              <Input
                id="dayNote"
                placeholder="e.g. Family Event, Supply Restock, Salon Closed"
                value={editFormData.note}
                onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingHours(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHours}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note / Nickname Dialog */}
      <Dialog open={!!noteCustomer} onOpenChange={(open) => !open && setNoteCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Note & Nickname</DialogTitle>
          </DialogHeader>
          {noteCustomer && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="customerNick">Customized Nickname for Customer</Label>
                <Input
                  id="customerNick"
                  placeholder="e.g. VIP Maria, Loves French Tip"
                  value={customerNicknameText}
                  onChange={(e) => setCustomerNicknameText(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customerNote">Internal Note for Atasha</Label>
                <textarea
                  id="customerNote"
                  rows={3}
                  placeholder="Preferences, allergies, nail habits..."
                  value={customerNoteText}
                  onChange={(e) => setCustomerNoteText(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteCustomer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomerNote}>Save Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Customer Stamp QR Modal */}
      <Dialog open={!!stampModalBooking} onOpenChange={(open) => !open && setStampModalBooking(null)}>
        <DialogContent className="max-w-sm sm:max-w-md text-center p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-primary-600" />
              Customer Loyalty Stamp QR
            </DialogTitle>
          </DialogHeader>
          {stampModalBooking && (
            <div className="space-y-4 py-3">
              <div className="bg-primary-50/60 p-3 rounded-xl border border-primary-100">
                <p className="font-bold text-gray-900 text-sm">
                  {stampModalBooking.user?.name || "Customer"}
                </p>
                <p className="text-xs text-primary-800 font-medium">
                  Service Completed • Earns +1 Stamp
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-5 rounded-2xl border-2 border-primary-200 inline-block shadow-md">
                <QRCodeSVG
                  value={`prettynails-stamp:${stampModalBooking.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="mx-auto"
                />
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <p className="font-medium text-gray-800">
                  Ask the customer to open their Loyalty Card page on their phone and scan this QR code with their camera.
                </p>
                <p className="text-[11px] text-gray-400 font-mono bg-gray-50 py-1 px-2 rounded border border-gray-100 inline-block mt-1">
                  Code: prettynails-stamp:{stampModalBooking.id}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => setStampModalBooking(null)}
              className="w-full sm:w-auto px-6 font-semibold"
            >
              Done / Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
