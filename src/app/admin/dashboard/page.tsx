"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Calendar, Award, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Stats {
  totalCustomers: number;
  todayBookings: number;
  pendingBookings: number;
  monthlyRevenue: number;
  monthlyCustomers: number;
  stampsThisMonth: number;
}

interface RecentBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  status: string;
  totalPrice: number;
  services: Array<{ serviceName: string; variantName: string }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/bookings?limit=5&sort=desc"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const rawList = Array.isArray(bookingsData) ? bookingsData : (bookingsData.bookings || []);
        const normalized: RecentBooking[] = rawList.map((b: any) => ({
          id: b.id,
          customerName: b.user?.nickname ? `${b.user.name} (${b.user.nickname})` : (b.user?.name || b.customerName || "Customer"),
          customerEmail: b.user?.email || b.customerEmail || "",
          date: b.appointmentDate || b.date,
          time: b.startTime ? `${b.startTime}${b.endTime ? ` - ${b.endTime}` : ""}` : (b.time || ""),
          status: b.status,
          totalPrice: b.totalPrice,
          services: b.services?.map((s: any) => ({
            serviceName: s.service?.name || s.serviceName || "Service",
            variantName: s.variantName || "",
          })) || [],
        }));
        setRecentBookings(normalized);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total Customers", value: stats?.totalCustomers || 0, icon: Users, color: "bg-primary-500", href: "/admin/customers" },
    { label: "Today's Bookings", value: stats?.todayBookings || 0, icon: Calendar, color: "bg-blue-500", href: "/admin/bookings" },
    { label: "Pending Approvals", value: stats?.pendingBookings || 0, icon: Clock, color: "bg-yellow-500", href: "/admin/bookings?status=PENDING" },
    { label: "Monthly Revenue", value: formatCurrency(stats?.monthlyRevenue || 0), icon: DollarSign, color: "bg-green-500", href: "/admin/reports" },
    { label: "Customers This Month", value: stats?.monthlyCustomers || 0, icon: Users, color: "bg-purple-500", href: "/admin/reports" },
    { label: "Stamps Issued", value: stats?.stampsThisMonth || 0, icon: Award, color: "bg-pink-500", href: "/admin/loyalty" },
  ];

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

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded mb-2" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your nail salon business</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-full", stat.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <a href="/admin/bookings" className="text-sm text-primary-600 hover:underline">View All</a>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-100 rounded" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No recent bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="font-medium text-primary-700">
                        {booking.customerName?.[0]?.toUpperCase() || "C"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-medium text-gray-900">{formatDate(booking.date)}</p>
                      <p className="text-sm text-gray-500">{booking.time}</p>
                    </div>
                    <Badge variant={getStatusBadge(booking.status)} className="capitalize">
                      {booking.status.toLowerCase().replace("_", " ")}
                    </Badge>
                    <span className="font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/admin/bookings?status=PENDING" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <CheckCircle className="h-10 w-10 mx-auto text-yellow-500 mb-2" />
              <p className="font-medium text-gray-900">Approve Bookings</p>
              <p className="text-sm text-gray-500 mt-1">{stats?.pendingBookings || 0} pending</p>
            </a>
            <a href="/admin/schedule" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <Calendar className="h-10 w-10 mx-auto text-blue-500 mb-2" />
              <p className="font-medium text-gray-900">Manage Schedule</p>
              <p className="text-sm text-gray-500 mt-1">Block dates, set hours</p>
            </a>
            <a href="/admin/services" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <Award className="h-10 w-10 mx-auto text-purple-500 mb-2" />
              <p className="font-medium text-gray-900">Manage Services</p>
              <p className="text-sm text-gray-500 mt-1">Update prices, add-ons</p>
            </a>
            <a href="/admin/reports" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <TrendingUp className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-sm text-gray-500 mt-1">Revenue, customers</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}