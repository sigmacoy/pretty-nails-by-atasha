"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Users, DollarSign, Calendar, Award, TrendingUp, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

interface ReportData {
  monthlyRevenue: number;
  monthlyCustomers: number;
  monthlyBookings: number;
  monthlyStamps: number;
  revenueByMonth: Array<{ month: string; revenue: number; bookings: number }>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  bookingsByDay: Array<{ day: string; count: number }>;
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this-month");

  useEffect(() => { if (status === "unauthenticated") window.location.href = "/login"; }, [status]);
  useEffect(() => { if (session?.user?.role === "ADMIN") fetchReport(); }, [session, period]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`);
      if (res.ok) setReport(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (status === "loading") return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  if (!session || session.user.role !== "ADMIN") return <div className="text-center py-12">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Business analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Monthly Revenue</p><p className="text-3xl font-bold">{report ? formatCurrency(report.monthlyRevenue) : "₱0"}</p></div><DollarSign className="h-10 w-10 text-primary-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Customers</p><p className="text-3xl font-bold">{report?.monthlyCustomers || 0}</p></div><Users className="h-10 w-10 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Bookings</p><p className="text-3xl font-bold">{report?.monthlyBookings || 0}</p></div><Calendar className="h-10 w-10 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Stamps Issued</p><p className="text-3xl font-bold">{report?.monthlyStamps || 0}</p></div><Award className="h-10 w-10 text-yellow-500" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse bg-gray-100 rounded" /> : report?.revenueByMonth && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={report.revenueByMonth}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#ec4899" fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bookings by Day</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse bg-gray-100 rounded" /> : report?.bookingsByDay && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.bookingsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => [v, "Bookings"]} />
                  <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            {loading ? Array.from({length: 5}).map((_,i) => <div key={i} className="h-12 animate-pulse bg-gray-100 rounded mb-2" />) : report?.topServices && (
              <div className="space-y-3">
                {report.topServices.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">{i + 1}</span>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-gray-500">{s.count} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">{formatCurrency(s.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-40 animate-pulse bg-gray-100 rounded" /> : report && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(report.monthlyRevenue)}</p></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Avg. per Booking</p><p className="text-2xl font-bold">{report.monthlyBookings > 0 ? formatCurrency(report.monthlyRevenue / report.monthlyBookings) : "₱0"}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Unique Customers</p><p className="text-2xl font-bold">{report.monthlyCustomers}</p></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Repeat Rate</p><p className="text-2xl font-bold">{report.monthlyCustomers > 0 ? `${Math.round((report.monthlyBookings / report.monthlyCustomers) * 100)}%` : "0%"}</p></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}