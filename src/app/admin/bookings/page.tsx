"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Loader2,
  Trash2,
  Search,
  History,
  QrCode,
  AlertTriangle,
  Sparkles,
  Download,
  Filter
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  customerName: string;
  customerNickname?: string | null;
  customerEmail: string;
  customerPhone: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  downpayment: number;
  notes: string | null;
  inspirationImg: string | null;
  createdAt: string;
  services: Array<{
    serviceName: string;
    variantName: string;
    quantity: number;
    price: number;
  }>;
  payment: {
    status: string;
    reference: string | null;
    verifiedAt: string | null;
  } | null;
  loyaltyStamps?: Array<{ id: string; earnedAt: string }>;
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");

  // Filters for Queue / Active Tab
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [queueStatusFilter, setQueueStatusFilter] = useState("ALL_ACTIVE");
  const [queueSearch, setQueueSearch] = useState("");
  const [viewMode, setViewMode] = useState<"queue" | "list">("queue");

  // Filters for History Tab
  const [historySearchName, setHistorySearchName] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL_HISTORY");
  const [historyDateFilter, setHistoryDateFilter] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [stampModalBooking, setStampModalBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchBookings();
    }
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings?limit=200&sort=desc");
      if (res.ok) {
        const raw = await res.json();
        const list = Array.isArray(raw) ? raw : raw.bookings || [];
        const normalized = list.map((b: any) => ({
          ...b,
          customerName: b.user?.name || b.customerName || "Customer",
          customerNickname: b.user?.nickname || b.customerNickname || null,
          customerEmail: b.user?.email || b.customerEmail || "",
          customerPhone: b.user?.phone || b.customerPhone || null,
          services: b.services?.map((s: any) => ({
            serviceName: s.service?.name || s.serviceName || "Service",
            variantName: s.variantName || "Standard",
            quantity: s.quantity || 1,
            price: s.price || 0,
          })) || [],
          loyaltyStamps: b.loyaltyStamps || [],
        }));
        setBookings(normalized);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
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
        showToast(`Booking marked as ${newStatus.toLowerCase()}`);
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert("Failed to update booking status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete the booking for "${customerName}"? (Prototype mode)`)) {
      return;
    }

    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Booking for ${customerName} deleted`);
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(null);
        }
        fetchBookings();
      } else {
        alert("Failed to delete booking.");
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
      alert("Error deleting booking");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (bStatus: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
      PENDING: "warning",
      CONFIRMED: "success",
      COMPLETED: "default",
      CANCELLED: "destructive",
      NO_SHOW: "destructive",
    };
    return variants[bStatus] || "default";
  };

  // Active / Queue bookings (PENDING, CONFIRMED)
  const activeBookings = bookings.filter((b) => {
    const isActiveStatus =
      queueStatusFilter === "ALL_ACTIVE"
        ? b.status === "PENDING" || b.status === "CONFIRMED"
        : b.status === queueStatusFilter;

    const matchesDate = !selectedDate || b.appointmentDate.startsWith(selectedDate);
    const matchesSearch =
      !queueSearch ||
      b.customerName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(queueSearch.toLowerCase()) ||
      (b.customerNickname && b.customerNickname.toLowerCase().includes(queueSearch.toLowerCase()));

    return isActiveStatus && matchesDate && matchesSearch;
  });

  // History bookings (COMPLETED, CANCELLED, NO_SHOW, or all past)
  const historyBookings = bookings.filter((b) => {
    const isHistorical =
      historyStatusFilter === "ALL_HISTORY"
        ? b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "NO_SHOW"
        : b.status === historyStatusFilter;

    const matchesDate = !historyDateFilter || b.appointmentDate.startsWith(historyDateFilter);
    const matchesName =
      !historySearchName ||
      b.customerName.toLowerCase().includes(historySearchName.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(historySearchName.toLowerCase()) ||
      (b.customerNickname && b.customerNickname.toLowerCase().includes(historySearchName.toLowerCase()));

    return isHistorical && matchesDate && matchesName;
  });

  // Group active bookings by date for queue view
  const bookingsByDate = activeBookings.reduce((acc, booking) => {
    const dateKey = booking.appointmentDate.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const sortedDates = Object.keys(bookingsByDate).sort();

  if (status === "loading") {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div className="text-center py-12">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs">
          <CheckCircle className="h-4 w-4 text-green-600" />
          {toastMessage}
        </div>
      )}

      {/* Page Title & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage upcoming queue appointments and complete historical bookings
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2",
              activeTab === "queue"
                ? "bg-white text-primary-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Calendar className="h-4 w-4 text-primary-600" />
            Active Queue ({bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2",
              activeTab === "history"
                ? "bg-white text-primary-950 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <History className="h-4 w-4 text-primary-600" />
            History of Bookings ({bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "NO_SHOW").length})
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ACTIVE QUEUE & APPOINTMENTS                        */}
      {/* ========================================================= */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {/* Active Filters */}
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search active customer..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-40 h-9 text-xs"
                  title="Filter by date"
                />

                <Select value={queueStatusFilter} onValueChange={setQueueStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_ACTIVE">All Active</SelectItem>
                    <SelectItem value="PENDING">Pending Only</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  variant={viewMode === "queue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("queue")}
                  className="h-9 px-3 text-xs"
                  title="Queue view grouped by day"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Queue
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 px-3 text-xs"
                  title="List view"
                >
                  <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
                  List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Queue View Grouped by Date */}
          {viewMode === "queue" && (
            <div className="space-y-6">
              {sortedDates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No active bookings found</p>
                    <p className="text-xs text-gray-400 mt-1">Check the &quot;History of Bookings&quot; tab for past records</p>
                  </CardContent>
                </Card>
              ) : (
                sortedDates.map((dateKey) => {
                  const dayBookings = bookingsByDate[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
                  return (
                    <Card key={dateKey} className="overflow-hidden border-gray-200">
                      <CardHeader className="bg-gray-50/80 py-3 px-4 border-b border-gray-200 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{formatDate(dateKey)}</h3>
                            <p className="text-[11px] text-gray-500">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""} in queue (Max 4 capacity)</p>
                          </div>
                        </div>
                        <Badge variant={dayBookings.length >= 4 ? "destructive" : "success"} className="text-xs">
                          {dayBookings.length} / 4 Slots
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {dayBookings.map((booking, index) => (
                          <div
                            key={booking.id}
                            className={cn(
                              "relative p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                              booking.status === "PENDING" && "bg-yellow-50/40 border-yellow-200",
                              booking.status === "CONFIRMED" && "bg-white border-gray-200 hover:border-primary-200 hover:bg-pink-50/20"
                            )}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 text-sm">{booking.customerName}</span>
                                  {booking.customerNickname && (
                                    <span className="text-[11px] font-medium text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                                      &quot;{booking.customerNickname}&quot;
                                    </span>
                                  )}
                                  <Badge variant={getStatusBadge(booking.status)} className="text-[10px] uppercase font-semibold">
                                    {booking.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{booking.customerEmail} • {booking.customerPhone || "No phone"}</p>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-700 flex-wrap">
                                  <span className="font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-primary-600" />
                                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                  </span>
                                  <span>•</span>
                                  <span>{booking.services.map((s) => s.serviceName).join(", ")}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                              <div className="text-left md:text-right">
                                <span className="font-bold text-primary-700 text-sm block">
                                  {formatCurrency(booking.totalPrice)}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  Downpayment: {booking.payment?.status === "PAID" ? "₱100 Paid" : "Pending"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {booking.status === "PENDING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                                      disabled={actionLoading === booking.id}
                                      className="h-8 px-2.5 text-xs"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                                      disabled={actionLoading === booking.id}
                                      className="h-8 px-2 text-xs"
                                    >
                                      Decline
                                    </Button>
                                  </>
                                )}

                                {booking.status === "CONFIRMED" && (() => {
                                  const hasNailSet = booking.services.some((s) => {
                                    const n = (s.serviceName || "").toLowerCase();
                                    return n.includes("gel") || n.includes("extension") || n.includes("pedicure");
                                  });
                                  const qualifies = hasNailSet || booking.totalPrice >= 50000;

                                  return qualifies ? (
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        await handleStatusChange(booking.id, "COMPLETED");
                                        setStampModalBooking(booking);
                                      }}
                                      disabled={actionLoading === booking.id}
                                      className="h-8 px-2.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                                    >
                                      <QrCode className="h-3.5 w-3.5 mr-1" />
                                      Complete &amp; QR
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          await handleStatusChange(booking.id, "COMPLETED");
                                          showToast("Completed (No stamp for Nail Cleaning under ₱500)");
                                        }}
                                        disabled={actionLoading === booking.id}
                                        className="h-8 px-2 text-xs bg-gray-800 hover:bg-gray-900 text-white font-semibold"
                                        title="Complete service without loyalty stamp"
                                      >
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                        Complete
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setStampModalBooking(booking)}
                                        className="h-8 px-2 text-[11px] text-primary-700 border-primary-200 hover:bg-primary-50"
                                        title="Show QR if customer decided last minute to get a nail set"
                                      >
                                        <QrCode className="h-3.5 w-3.5 mr-1" />
                                        QR
                                      </Button>
                                    </div>
                                  );
                                })()}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="h-8 w-8 p-0"
                                  title="View details"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>

                                {/* Prototype Delete Action */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBooking(booking.id, booking.customerName)}
                                  disabled={actionLoading === booking.id}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete booking (Prototype)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/70 text-left text-xs font-semibold text-gray-600">
                        <th className="p-3">Customer</th>
                        <th className="p-3">Date &amp; Time</th>
                        <th className="p-3">Services</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Total</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No active bookings found
                          </td>
                        </tr>
                      ) : (
                        activeBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50">
                            <td className="p-3">
                              <p className="font-semibold text-gray-900">{b.customerName}</p>
                              <p className="text-xs text-gray-500">{b.customerEmail}</p>
                            </td>
                            <td className="p-3 text-xs">
                              <p className="font-medium text-gray-900">{formatDate(b.appointmentDate)}</p>
                              <p className="text-gray-500">{formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                            </td>
                            <td className="p-3 text-xs text-gray-700">
                              {b.services.map((s) => s.serviceName).join(", ")}
                            </td>
                            <td className="p-3">
                              <Badge variant={getStatusBadge(b.status)} className="text-xs">
                                {b.status}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold text-primary-700">
                              {formatCurrency(b.totalPrice)}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                {b.status === "PENDING" && (
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {b.status === "CONFIRMED" && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      await handleStatusChange(b.id, "COMPLETED");
                                      setStampModalBooking(b);
                                    }}
                                    className="h-7 px-2 text-xs bg-primary-600 hover:bg-primary-700 text-white"
                                  >
                                    Complete
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBooking(b)}
                                  className="h-7 w-7 p-0"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBooking(b.id, b.customerName)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete booking (Prototype)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: HISTORY OF BOOKINGS                                */}
      {/* ========================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* History Search & Filters */}
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full flex-1">
                {/* Search by Name */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search history by customer name..."
                    value={historySearchName}
                    onChange={(e) => setHistorySearchName(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                {/* Filter by Date */}
                <Input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="w-full sm:w-44 h-9 text-xs"
                  title="Filter by appointment date"
                />

                {/* Filter by Status in History */}
                <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
                    <SelectValue placeholder="All History Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_HISTORY">All History</SelectItem>
                    <SelectItem value="COMPLETED">Completed Only</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="NO_SHOW">No-Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-gray-500 self-end md:self-auto shrink-0 font-medium">
                Showing {historyBookings.length} history records
              </div>
            </CardContent>
          </Card>

          {/* History Records Table */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-bold text-gray-900">
                  Appointment History &amp; Loyalty QR Status
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                  Customers who forgot to scan their QR code can still scan it anytime from this history.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70 text-left text-xs font-semibold text-gray-600">
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Date &amp; Time</th>
                      <th className="p-3.5">Services</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Total Paid</th>
                      <th className="p-3.5">Loyalty Stamp QR Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-500">
                          <History className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                          <p className="font-medium">No history records matching your criteria</p>
                          <p className="text-xs text-gray-400 mt-1">Try clearing filters or search term</p>
                        </td>
                      </tr>
                    ) : (
                      historyBookings.map((b) => {
                        const isCompleted = b.status === "COMPLETED";
                        const isStamped = b.loyaltyStamps && b.loyaltyStamps.length > 0;

                        return (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{b.customerName}</span>
                                {b.customerNickname && (
                                  <span className="text-[10px] bg-primary-100 text-primary-800 px-1.5 py-0.2 rounded font-medium">
                                    &quot;{b.customerNickname}&quot;
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{b.customerEmail}</p>
                            </td>

                            <td className="p-3.5 text-xs text-gray-700">
                              <p className="font-medium text-gray-900">{formatDate(b.appointmentDate)}</p>
                              <p className="text-gray-500">{formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                            </td>

                            <td className="p-3.5 text-xs text-gray-700">
                              {b.services.map((s) => s.serviceName).join(", ")}
                            </td>

                            <td className="p-3.5">
                              <Badge variant={getStatusBadge(b.status)} className="text-xs capitalize">
                                {b.status.toLowerCase().replace("_", " ")}
                              </Badge>
                            </td>

                            <td className="p-3.5 font-semibold text-gray-900">
                              {formatCurrency(b.totalPrice)}
                            </td>

                            {/* Stamp QR Status Indicator */}
                            <td className="p-3.5">
                              {isCompleted ? (() => {
                                const hasNailSet = b.services.some((s) => {
                                  const n = (s.serviceName || "").toLowerCase();
                                  return n.includes("gel") || n.includes("extension") || n.includes("pedicure");
                                });
                                const isEligible = hasNailSet || b.totalPrice >= 50000;

                                if (isStamped) {
                                  return (
                                    <Badge variant="success" className="text-xs font-semibold flex items-center gap-1 w-fit">
                                      <CheckCircle className="h-3 w-3" /> Stamp Scanned
                                    </Badge>
                                  );
                                } else if (isEligible) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="warning" className="text-xs font-semibold flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-amber-600" /> QR Unscanned
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setStampModalBooking(b)}
                                        className="h-6 px-2 text-[11px] text-primary-700 border-primary-200 hover:bg-primary-50"
                                        title="Display QR code for customer to scan"
                                      >
                                        <QrCode className="h-3 w-3 mr-1" />
                                        Show QR
                                      </Button>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] text-gray-500 italic bg-gray-100 px-2 py-0.5 rounded">
                                        No stamp (Cleaning &lt; ₱500)
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setStampModalBooking(b)}
                                        className="h-6 px-1.5 text-[10px] text-primary-700 hover:bg-pink-50"
                                        title="Show QR if customer decided to upgrade to a nail set"
                                      >
                                        <QrCode className="h-3 w-3 mr-0.5" />
                                        Override QR
                                      </Button>
                                    </div>
                                  );
                                }
                              })() : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBooking(b)}
                                  className="h-8 w-8 p-0 text-gray-600"
                                  title="View details"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>

                                {/* Prototype Delete Action */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBooking(b.id, b.customerName)}
                                  disabled={actionLoading === b.id}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete history booking (Prototype)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-display text-xl font-bold">
                    Booking Details &mdash; #{selectedBooking.id.slice(-6)}
                  </DialogTitle>
                  <Badge variant={getStatusBadge(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-3 text-sm">
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedBooking.customerName}</p>
                    <p className="text-xs text-gray-600">{selectedBooking.customerEmail}</p>
                    {selectedBooking.customerPhone && (
                      <p className="text-xs text-gray-600">{selectedBooking.customerPhone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Appointment</p>
                    <p className="font-bold text-gray-900 mt-0.5">{formatDate(selectedBooking.appointmentDate)}</p>
                    <p className="text-xs text-gray-600">
                      {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Services</p>
                  <div className="space-y-1.5 divide-y divide-gray-100">
                    {selectedBooking.services.map((s, i) => (
                      <div key={i} className="flex justify-between py-1 text-sm">
                        <span>{s.serviceName} ({s.variantName}) x{s.quantity}</span>
                        <span className="font-semibold">{formatCurrency(s.price * s.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between font-bold text-base text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-primary-600">{formatCurrency(selectedBooking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Downpayment</span>
                    <span>{formatCurrency(selectedBooking.downpayment)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Remaining Balance</span>
                    <span>{formatCurrency(selectedBooking.totalPrice - selectedBooking.downpayment)}</span>
                  </div>
                </div>

                {/* Loyalty Stamp Status */}
                {selectedBooking.status === "COMPLETED" && (
                  <div className="p-3 bg-pink-50/60 border border-primary-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary-950">Digital Loyalty Stamp</p>
                      <p className="text-xs text-gray-600">
                        {selectedBooking.loyaltyStamps && selectedBooking.loyaltyStamps.length > 0
                          ? "Stamp recorded and scanned by customer."
                          : "Customer forgot to scan! QR code is still active and ready."}
                      </p>
                    </div>
                    {(!selectedBooking.loyaltyStamps || selectedBooking.loyaltyStamps.length === 0) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const b = selectedBooking;
                          setSelectedBooking(null);
                          setStampModalBooking(b);
                        }}
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs"
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1" />
                        Show QR
                      </Button>
                    )}
                  </div>
                )}

                {selectedBooking.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg text-xs">
                    <p className="font-semibold text-gray-700">Customer Note:</p>
                    <p className="mt-0.5 text-gray-600 italic">&quot;{selectedBooking.notes}&quot;</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 border-t pt-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteBooking(selectedBooking.id, selectedBooking.customerName)}
                  disabled={actionLoading === selectedBooking.id}
                  className="text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Booking (Prototype)
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Stamp QR Modal */}
      <Dialog open={!!stampModalBooking} onOpenChange={(open) => !open && setStampModalBooking(null)}>
        <DialogContent className="max-w-sm sm:max-w-md text-center p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-primary-600" />
              Visit Stamp QR Code
            </DialogTitle>
          </DialogHeader>

          {stampModalBooking && (
            <div className="space-y-4 py-2">
              <div className="bg-pink-50/70 p-3 rounded-xl border border-primary-100 text-left">
                <p className="font-bold text-gray-900 text-sm">
                  {stampModalBooking.customerName}
                </p>
                <p className="text-xs text-primary-800 font-medium">
                  {formatDate(stampModalBooking.appointmentDate)} &bull; {formatTime(stampModalBooking.startTime)}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Status: {stampModalBooking.loyaltyStamps && stampModalBooking.loyaltyStamps.length > 0 ? "Already Scanned" : "Awaiting Customer Scan"}
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

              <div className="space-y-1.5 text-xs text-gray-600">
                <p className="font-medium text-gray-800">
                  Ask the customer to scan this QR code with their mobile device to record +1 stamp on their digital card.
                </p>
                <div className="bg-gray-50 p-2 rounded border border-gray-100 font-mono text-[11px] text-gray-700 select-all">
                  prettynails-stamp:{stampModalBooking.id}
                </div>
                <p className="text-[10px] text-gray-400">
                  If the customer forgot to scan today, this QR remains in their Booking History so they can scan it when they return.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                setStampModalBooking(null);
                fetchBookings();
              }}
              className="w-full sm:w-auto px-6 font-semibold bg-primary-600 hover:bg-primary-700 text-white"
            >
              Done / Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
