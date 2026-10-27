"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, User, CheckCircle, XCircle, MoreHorizontal, Loader2, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  customerName: string;
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
}

const statusOptions = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"queue" | "list">("queue");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchBookings();
    }
  }, [session, selectedDate, statusFilter, search]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || data);
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
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
    } finally {
      setActionLoading(null);
    }
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

  const getQueuePosition = (index: number) => index + 1;

  // Group bookings by date for queue view
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const date = booking.appointmentDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Sort dates
  const sortedDates = Object.keys(bookingsByDate).sort();

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        </div>
        <Card>
          <CardContent className="pt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded mb-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div className="text-center py-12">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage customer appointments and queue</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="date-filter" className="block text-sm font-medium mb-1">Filter by Date</Label>
            <Input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full max-w-xs"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="status-filter" className="block text-sm font-medium mb-1">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-full max-w-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="search" className="block text-sm font-medium mb-1">Search</Label>
            <Input
              id="search"
              placeholder="Search customer, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex gap-2">
              <Button variant={viewMode === "queue" ? "default" : "outline" size="icon" onClick={() => setViewMode("queue")} title="Queue View">
                <Calendar className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline" size="icon" onClick={() => setViewMode("list")} title="List View">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Queue View - Grouped by Date */}
      {viewMode === "queue" && (
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No bookings found</p>
                <p className="text-gray-400 mt-1">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            sortedDates.map(date => {
              const dayBookings = bookingsByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <Card key={date}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-100 rounded-lg">
                          <Calendar className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{formatDate(date)}</h3>
                          <p className="text-sm text-gray-500">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""} • Max 4 slots</p>
                        </div>
                      </div>
                      <Badge variant={dayBookings.length >= 4 ? "destructive" : "success"}>
                        {dayBookings.length}/4 Slots
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dayBookings.map((booking, index) => (
                        <div
                          key={booking.id}
                          className={cn(
                            "relative p-4 border rounded-lg transition-all",
                            booking.status === "PENDING" && "border-yellow-300 bg-yellow-50",
                            booking.status === "CONFIRMED" && "border-green-300 bg-green-50",
                            booking.status === "COMPLETED" && "border-gray-300 bg-gray-50",
                            booking.status === "CANCELLED" && "border-red-300 bg-red-50",
                            booking.status === "NO_SHOW" && "border-red-300 bg-red-50"
                          )}
                        >
                          {/* Queue Position */}
                          <div className="absolute -top-2 -left-2">
                            <span className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                              booking.status === "PENDING" && "bg-yellow-500",
                              booking.status === "CONFIRMED" && "bg-green-500",
                              booking.status === "COMPLETED" && "bg-gray-500",
                              (booking.status === "CANCELLED" || booking.status === "NO_SHOW") && "bg-red-500"
                            )}>
                              {getQueuePosition(index)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Customer Info */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <span className="font-medium text-primary-700">
                                  {booking.customerName?.[0]?.toUpperCase() || "C"}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{booking.customerName}</p>
                                <p className="text-sm text-gray-500 truncate">{booking.customerEmail}</p>
                                {booking.customerPhone && (
                                  <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                                )}
                              </div>
                            </div>

                            {/* Time & Services */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 text-center sm:text-left">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {booking.services.slice(0, 2).map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {s.serviceName} - {s.variantName}
                                  </Badge>
                                ))}
                                {booking.services.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{booking.services.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant={getStatusBadge(booking.status)} className="capitalize">
                                {booking.status.toLowerCase().replace("_", " ")}
                              </Badge>
                              {booking.payment && (
                                <Badge variant={booking.payment.status === "PAID" ? "success" : "warning"}>
                                  {booking.payment.status === "PAID" ? "Paid" : "Pending"}
                                </Badge>
                              )
                              <span className="font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</span>

                              {booking.status === "PENDING" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                                    disabled={actionLoading === booking.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                                    disabled={actionLoading === booking.id}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}

                              {booking.status === "CONFIRMED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(booking.id, "COMPLETED")}
                                  disabled={actionLoading === booking.id}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete"}
                                </Button>
                              )}

                              <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Notes & Inspiration */}
                          {(booking.notes || booking.inspirationImg) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4">
                              {booking.inspirationImg && (
                                <a href={booking.inspirationImg} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                  <img src={booking.inspirationImg} alt="Inspiration" className="w-16 h-16 rounded-lg object-cover" />
                                </a>
                              )}
                              {booking.notes && (
                                <p className="text-sm text-gray-600 flex-1">{booking.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-500">Queue</th>
                      <th className="text-left p-3 font-medium text-gray-500">Customer</th>
                      <th className="text-left p-3 font-medium text-gray-500">Date & Time</th>
                      <th className="text-left p-3 font-medium text-gray-500">Services</th>
                      <th className="text-left p-3 font-medium text-gray-500">Status</th>
                      <th className="text-left p-3 font-medium text-gray-500">Payment</th>
                      <th className="text-left p-3 font-medium text-gray-500">Total</th>
                      <th className="text-left p-3 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking, index) => (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                            booking.status === "PENDING" && "bg-yellow-500",
                            booking.status === "CONFIRMED" && "bg-green-500",
                            booking.status === "COMPLETED" && "bg-gray-500",
                            (booking.status === "CANCELLED" || booking.status === "NO_SHOW") && "bg-red-500"
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{booking.customerName}</div>
                          <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{formatDate(booking.appointmentDate)}</div>
                          <div className="text-sm text-gray-500">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {booking.services.map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {s.serviceName} - {s.variantName}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadge(booking.status)} className="capitalize">
                            {booking.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {booking.payment ? (
                            <Badge variant={booking.payment.status === "PAID" ? "success" : "warning"}>
                              {booking.payment.status === "PAID" ? "Paid" : "Pending"}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {booking.status === "PENDING" && (
                              <>
                                <Button size="sm" onClick={() => handleStatusChange(booking.id, "CONFIRMED")} disabled={actionLoading === booking.id} className="bg-green-600 hover:bg-green-700">Confirm</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(booking.id, "CANCELLED")} disabled={actionLoading === booking.id}>Cancel</Button>
                              </>
                            )}
                            {booking.status === "CONFIRMED" && (
                              <Button size="sm" onClick={() => handleStatusChange(booking.id, "COMPLETED")} disabled={actionLoading === booking.id} className="bg-blue-600 hover:bg-blue-700">Complete</Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={open => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Booking Details - #{selectedBooking.id.slice(-6)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{selectedBooking.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedBooking.customerEmail}</p>
                    {selectedBooking.customerPhone && <p className="text-sm text-gray-500">{selectedBooking.customerPhone}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Appointment</p>
                    <p className="font-medium">{formatDate(selectedBooking.appointmentDate)}</p>
                    <p className="text-sm text-gray-500">{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Services</p>
                  <div className="space-y-2 mt-1">
                    {selectedBooking.services.map((s, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-gray-100">
                        <span>{s.serviceName} - {s.variantName} x{s.quantity}</span>
                        <span className="font-medium">{formatCurrency(s.price * s.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedBooking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Downpayment</span>
                    <span>{formatCurrency(selectedBooking.downpayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Remaining</span>
                    <span>{formatCurrency(selectedBooking.totalPrice - selectedBooking.downpayment)}</span>
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="mt-1">{selectedBooking.notes}</p>
                  </div>
                )}
                {selectedBooking.inspirationImg && (
                  <div>
                    <p className="text-sm text-gray-500">Inspiration Photo</p>
                    <img src={selectedBooking.inspirationImg} alt="Inspiration" className="mt-1 max-h-64 rounded-lg" />
                  </div>
                )}
              </div>
              <DialogFooter>
                {selectedBooking.status === "PENDING" && (
                  <>
                    <Button onClick={() => handleStatusChange(selectedBooking.id, "CONFIRMED")} disabled={actionLoading === selectedBooking.id} className="bg-green-600">
                      Confirm Booking
                    </Button>
                    <Button variant="destructive" onClick={() => handleStatusChange(selectedBooking.id, "CANCELLED")} disabled={actionLoading === selectedBooking.id}>
                      Cancel
                    </Button>
                  </>
                )}
                {selectedBooking.status === "CONFIRMED" && (
                  <Button onClick={() => handleStatusChange(selectedBooking.id, "COMPLETED")} disabled={actionLoading === selectedBooking.id} className="bg-blue-600">
                    Mark Complete
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}