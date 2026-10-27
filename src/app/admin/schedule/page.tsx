"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Clock, X, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, isWeekend } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Availability {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  maxSlots: number;
  note: string | null;
}

export default function AdminSchedulePage() {
  const { data: session, status } = useSession();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    isAvailable: true,
    startTime: "08:00",
    endTime: "22:00",
    maxSlots: 4,
    note: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAvailabilities();
    }
  }, [session, currentMonth, currentYear]);

  const fetchAvailabilities = async () => {
    try {
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      const res = await fetch(`/api/admin/availability?start=${startDate}&end=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailabilities(data);
      }
    } catch (error) {
      console.error("Failed to fetch availabilities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingDate) return;
    try {
      const res = await fetch(`/api/admin/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: editingDate, ...formData }),
      });
      if (res.ok) {
        setEditingDate(null);
        fetchAvailabilities();
      }
    } catch (error) {
      console.error("Failed to save availability:", error);
    }
  };

  const handleDelete = async (date: string) => {
    if (!confirm("Remove availability for this date?")) return;
    try {
      await fetch(`/api/admin/availability/${date}`, { method: "DELETE" });
      fetchAvailabilities();
    } catch (error) {
      console.error("Failed to delete availability:", error);
    }
  };

  const getAvailability = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilities.find(a => a.date === dateStr);
  };

  const monthDates = [];
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  for (let i = firstDay.getDay(); i > 0; i--) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() - i);
    monthDates.push(date);
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    monthDates.push(new Date(currentYear, currentMonth, i));
  }

  while (monthDates.length % 7 !== 0) {
    const date = new Date(monthDates[monthDates.length - 1]);
    date.setDate(date.getDate() + 1);
    monthDates.push(date);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (status === "loading") {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div className="text-center py-12">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600 mt-1">Manage your working days, hours, and blocked dates</p>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              setCurrentMonth(m => m === 0 ? 11 : m - 1);
              if (currentMonth === 0) setCurrentYear(y => y - 1);
            }}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-display text-xl font-semibold capitalize">
              {firstDay.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => {
              setCurrentMonth(m => m === 11 ? 0 : m + 1);
              if (currentMonth === 11) setCurrentYear(y => y + 1);
            }}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Badge variant="success" className="text-xs">Available</Badge> Working Day</span>
            <span className="flex items-center gap-1"><Badge variant="destructive" className="text-xs">Blocked</Badge> Off</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-100 border border-primary-300" /> Today</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0.5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2 bg-gray-50">
                {day}
              </div>
            ))}
            {monthDates.map((date, i) => {
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = date.toDateString() === today.toDateString();
              const isWeekendDay = isWeekend(date);
              const avail = getAvailability(date);
              const isAvailable = avail?.isAvailable ?? isWeekendDay;
              const isPast = date < today;

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!isPast) {
                      setEditingDate(date.toISOString().split('T')[0]);
                      setFormData({
                        isAvailable: isAvailable,
                        startTime: avail?.startTime || "08:00",
                        endTime: avail?.endTime || "22:00",
                        maxSlots: avail?.maxSlots || 4,
                        note: avail?.note || "",
                      });
                    }
                  }}
                  disabled={isPast}
                  className={cn(
                    "aspect-square p-1 relative transition-all",
                    !isCurrentMonth && "text-gray-300 bg-gray-50",
                    isPast && "opacity-50 cursor-not-allowed",
                    isToday && "ring-2 ring-primary-500",
                    isWeekendDay ? "bg-white" : "bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isAvailable ? "text-gray-900" : "text-gray-400 line-through"
                  )}>
                    {date.getDate()}
                  </span>
                  {avail && !isAvailable && (
                    <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-red-400 rounded" title={avail.note || "Blocked"} />
                  )}
                  {avail && isAvailable && (
                    <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-green-400 rounded" title={`${avail.maxSlots} slots`} />
                  )}
                  {!isWeekendDay && !avail && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-400">Closed</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-500" />
            <span>Available (Weekends by default)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50" />
            <span>Blocked / Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-primary-500 ring-2 ring-primary-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-50 opacity-50" />
            <span>Past / Weekdays (Closed)</span>
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDate} onOpenChange={open => !open && setEditingDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingDate ? formatDate(editingDate) : "Date"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-medium">Available for bookings</span>
              </label>
            </div>

            {formData.isAvailable && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxSlots">Max Slots per Day</Label>
                  <Input
                    id="maxSlots"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.maxSlots}
                    onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="note">Note (Reason)</Label>
                  <Input
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="e.g., Holiday, Vacation, Emergency"
                  />
                </div>
              </div>
            )}

            {!formData.isAvailable && (
              <div>
                <Label htmlFor="note">Reason for Blocking</Label>
                <Input
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="e.g., Holiday, Vacation, Emergency"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDate(null)}>Cancel</Button>
            <Button onClick={handleSave} className={formData.isAvailable ? "" : "bg-red-600 hover:bg-red-700"}>
              {formData.isAvailable ? "Save Availability" : "Block Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}