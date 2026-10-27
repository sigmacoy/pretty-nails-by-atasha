"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Sparkles, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Upload, X, QrCode, Phone, Info } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatTime, generateTimeSlots, calculateEndTime, isWeekend } from "@/lib/utils";
import { useRouter } from "next/navigation";

const services = [
  {
    id: "gel",
    name: "Nail Gel",
    category: "GEL",
    variants: [
      { id: "gel-small", name: "Small", price: 30000, duration: 180 },
      { id: "gel-medium", name: "Medium", price: 35000, duration: 210 },
      { id: "gel-long", name: "Long", price: 40000, duration: 240 },
    ],
  },
  {
    id: "extension",
    name: "Soft Gel Extension",
    category: "EXTENSION",
    variants: [
      { id: "ext-small", name: "Small", price: 40000, duration: 240 },
      { id: "ext-medium", name: "Medium", price: 45000, duration: 270 },
      { id: "ext-long", name: "Long", price: 50000, duration: 300 },
    ],
  },
  {
    id: "pedicure",
    name: "Nail Gel Pedicure",
    category: "PEDICURE",
    variants: [
      { id: "pedicure", name: "Standard", price: 30000, duration: 180 },
    ],
  },
];

const addOns = [
  { id: "nail-art", name: "Nail Art", price: 5000, perNail: true },
  { id: "french-tip", name: "French Tip", price: 1000, perNail: true },
  { id: "ombre", name: "Ombre", price: 1000, perNail: true },
  { id: "marble", name: "Marble", price: 2000, perNail: true },
  { id: "polka-dots", name: "Polka Dots", price: 1000, perNail: true },
  { id: "flakes", name: "Gold/Silver Flakes", price: 2000, perNail: true },
  { id: "cat-eye", name: "Cat Eye", price: 2000, perNail: true },
  { id: "glitters", name: "Glitters", price: 2000, perNail: true },
  { id: "metallic", name: "Metallic", price: 2000, perNail: true },
  { id: "embossed-flower", name: "Embossed Flower", price: 3000, perNail: true },
  { id: "embossed", name: "Embossed", price: 2000, perNail: true },
  { id: "3d-effect", name: "3D Effect", price: 3000, perNail: true },
  { id: "3d-mermaid", name: "3D Mermaid/Shell", price: 3000, perNail: true },
  { id: "big-stone", name: "Big Stone", price: 2000, perNail: true },
  { id: "pearl", name: "Pearl", price: 500, perNail: true },
  { id: "rhinestone", name: "Rhinestone", price: 500, perNail: true },
  { id: "blooming-gel", name: "Blooming Gel", price: 2000, perNail: true },
  { id: "matte-coat", name: "Matte Coat", price: 1000, perNail: true },
];

const DOWNPAYMENT = 10000; // ₱100

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: date/time, 2: services, 3: confirm
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; variantId: string; quantity: number }>>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [inspirationImage, setInspirationImage] = useState<File | null>(null);
  const [inspirationPreview, setInspirationPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any | null>(null);
  const [dbAvailabilities, setDbAvailabilities] = useState<Array<{
    date: string;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    maxSlots: number;
    note?: string | null;
  }>>([]);

  useEffect(() => {
    fetch("/api/availability")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setDbAvailabilities(data);
        }
      })
      .catch((err) => console.error("Could not fetch availability:", err));

    if (session?.user && session.user.role !== "ADMIN") {
      fetch("/api/bookings")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            const active = data.find((b: any) => b.status === "PENDING" || b.status === "CONFIRMED");
            setExistingBooking(active || null);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  // Generate available dates (Saturdays and Sundays for next 4 weeks)
  const availableDates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 28; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (isWeekend(date)) {
      availableDates.push(new Date(date));
    }
  }

  const currentMonth = selectedDate ? selectedDate.getMonth() : today.getMonth();
  const currentYear = selectedDate ? selectedDate.getFullYear() : today.getFullYear();

  const monthDates = [];
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Add previous month days
  for (let i = firstDay.getDay(); i > 0; i--) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() - i);
    monthDates.push(date);
  }

  // Add current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear, currentMonth, i);
    monthDates.push(date);
  }

  // Add next month days to fill grid
  while (monthDates.length % 7 !== 0) {
    const nextDate: Date = new Date(monthDates[monthDates.length - 1]);
    nextDate.setDate(nextDate.getDate() + 1);
    monthDates.push(nextDate);
  }

  const getDayAvailabilityRecord = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    return dbAvailabilities.find((a) => a.date.startsWith(dateStr));
  };

  const isDateAvailable = (date: Date) => {
    if (date < today) return false;
    if (!isWeekend(date)) return false;
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);
    if (date > maxDate) return false;

    // Check if owner explicitly blocked this date for breaks/holidays
    const record = getDayAvailabilityRecord(date);
    if (record && !record.isAvailable) return false;

    return true;
  };

  const isDateBlockedByOwner = (date: Date) => {
    if (date < today) return false;
    if (!isWeekend(date)) return false;
    const record = getDayAvailabilityRecord(date);
    return record ? !record.isAvailable : false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const selectedRecord = selectedDate ? getDayAvailabilityRecord(selectedDate) : null;
  const dayStartTime = selectedRecord?.startTime || "08:00";
  const dayEndTime = selectedRecord?.endTime || "22:00";
  const timeSlots = generateTimeSlots(dayStartTime, dayEndTime, 60); // Hourly slots

  const isTimeSlotAvailable = (slot: string) => {
    if (!selectedDate) return false;
    // In real app, check against existing bookings
    return true;
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTime("");
    }
  };

  const handleTimeClick = (time: string) => {
    if (isTimeSlotAvailable(time)) {
      setSelectedTime(time);
    }
  };

  const toggleService = (serviceId: string, variantId: string) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === serviceId && s.variantId === variantId);
      if (exists) {
        return prev.filter(s => s !== exists);
      }
      return [...prev, { serviceId, variantId, quantity: 1 }];
    });
  };

  const isServiceSelected = (serviceId: string, variantId: string) => {
    return selectedServices.some(s => s.serviceId === serviceId && s.variantId === variantId);
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addOnId]: prev[addOnId] ? prev[addOnId] + 1 : 1
    }));
  };

  const removeAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const count = prev[addOnId];
      if (count <= 1) {
        const { [addOnId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addOnId]: count - 1 };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    selectedServices.forEach(s => {
      const service = services.find(sv => sv.id === s.serviceId);
      const variant = service?.variants.find(v => v.id === s.variantId);
      if (variant) total += variant.price * s.quantity;
    });
    Object.entries(selectedAddOns).forEach(([addOnId, count]) => {
      const addOn = addOns.find(a => a.id === addOnId);
      if (addOn) total += addOn.price * count;
    });
    return total;
  };

  const calculateDuration = () => {
    let maxDuration = 0;
    selectedServices.forEach(s => {
      const service = services.find(sv => sv.id === s.serviceId);
      const variant = service?.variants.find(v => v.id === s.variantId);
      if (variant && variant.duration > maxDuration) maxDuration = variant.duration;
    });
    return maxDuration || 180; // Default 3 hours
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      setError("Please select date, time, and at least one service");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const totalPrice = calculateTotal();
      const duration = calculateDuration();
      const endTime = calculateEndTime(selectedTime, duration);

      // Format appointment date using local year/month/day to prevent UTC timezone shifts
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const appointmentDate = `${year}-${month}-${day}`;

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate,
          startTime: selectedTime,
          endTime,
          totalPrice,
          downpayment: DOWNPAYMENT,
          notes: notes?.trim() || null,
          inspirationImage: inspirationPreview || null,
          paymentReference: paymentReference?.trim() || null,
          services: selectedServices.map(s => ({
            serviceId: s.serviceId,
            variantId: s.variantId || null,
            quantity: s.quantity || 1,
          })),
          addOns: Object.entries(selectedAddOns)
            .filter(([_, qty]) => qty > 0)
            .map(([addOnId, quantity]) => ({
              addOnId,
              quantity,
            })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed");

      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `₱${(price / 100).toLocaleString()}`;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: "Date & Time" },
            { num: 2, label: "Services" },
            { num: 3, label: "Confirm" },
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  step === s.num
                    ? "bg-primary-600 text-white"
                    : step > s.num
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
              </div>
              <span className={cn("text-xs mt-1", step >= s.num ? "text-gray-900" : "text-gray-400")}>
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={cn(
                    "absolute top-5 left-[50%] w-full h-1 -translate-x-1/2",
                    step > s.num ? "bg-green-500" : "bg-gray-200"
                  )}
                  style={{ width: "100%" }}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>Booking submitted! Redirecting to your profile...</span>
          </div>
        )}

        {/* Existing Active Booking Banner for Logged In Customer */}
        {existingBooking && (
          <div className="mb-6 p-4 bg-pink-50 border border-primary-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-800">
                  Active Scheduled Appointment
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(existingBooking.appointmentDate)} at {existingBooking.startTime} - {existingBooking.endTime}
                </p>
                <p className="text-xs text-gray-600">
                  Status: <span className="font-semibold text-primary-700 capitalize">{existingBooking.status.toLowerCase()}</span>
                </p>
              </div>
            </div>
            <Link
              href="/appointments"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-primary-200 text-xs font-bold text-primary-800 hover:bg-primary-50 shadow-2xs shrink-0"
            >
              View Current Appointment
            </Link>
          </div>
        )}

        {/* Step 1: Date & Time Selection */}
        {step === 1 && (
          <Card className="mb-6">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  Select Date & Time
                </CardTitle>
                <span className="text-xs text-primary-700 font-medium bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100 w-fit">
                  Saturdays & Sundays Only (8:00 AM - 10:00 PM)
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Responsive 2-Column Grid: Compact Calendar on Left, Time Slots on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Compact Calendar Container */}
                <div className="lg:col-span-7 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-2xs max-w-sm sm:max-w-md w-full mx-auto">
                  {/* Month Switcher Header */}
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-primary-700 hover:bg-primary-50"
                      onClick={() => {
                        const newDate = new Date(currentYear, currentMonth - 1, 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-sm sm:text-base capitalize text-gray-900">
                      {firstDay.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-primary-700 hover:bg-primary-50"
                      onClick={() => {
                        const newDate = new Date(currentYear, currentMonth + 1, 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Day of week labels */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className={cn(
                          "text-[11px] font-bold py-1",
                          day === "Sat" || day === "Sun" ? "text-primary-700 font-extrabold" : "text-gray-400"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Compact Days Grid - Lessened div height */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDates.map((date, i) => {
                      const available = isDateAvailable(date);
                      const isBlocked = isDateBlockedByOwner(date);
                      const selected = isDateSelected(date);
                      const isCurrentMonth = date.getMonth() === currentMonth;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleDateClick(date)}
                          disabled={!available}
                          title={isBlocked ? "Owner unavailable / Break" : undefined}
                          className={cn(
                            "h-8 sm:h-9 w-full rounded-md text-xs font-semibold transition-all relative flex flex-col items-center justify-center",
                            !isCurrentMonth && "text-gray-300 opacity-40",
                            selected
                              ? "bg-primary-600 text-white shadow-xs font-bold ring-2 ring-primary-400 ring-offset-1"
                              : available
                              ? "bg-primary-50/60 hover:bg-primary-100 text-primary-950 font-bold border border-primary-100"
                              : isBlocked
                              ? "text-red-400 bg-red-50/40 line-through cursor-not-allowed border border-red-100"
                              : "text-gray-300 cursor-not-allowed"
                          )}
                        >
                          <span>{date.getDate()}</span>
                          {isBlocked && (
                            <span className="text-[8px] text-red-500 font-normal no-underline leading-none">Off</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-3 mt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-primary-100 border border-primary-300 inline-block" />
                      Weekend Open
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-300 inline-block" />
                      Blocked / Off
                    </span>
                  </div>
                </div>

                {/* Right: Time Slots Panel */}
                <div className="lg:col-span-5 bg-gray-50/70 p-4 rounded-xl border border-gray-200 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary-600" />
                      {selectedDate ? (
                        <span>Times for <strong className="text-primary-800">{formatDate(selectedDate)}</strong></span>
                      ) : (
                        <span>Available Time Slots</span>
                      )}
                    </h4>

                    {selectedRecord?.note && (
                      <p className="text-xs text-primary-800 bg-primary-50 border border-primary-100 p-2 rounded-lg mb-3">
                        Note from Atasha: {selectedRecord.note}
                      </p>
                    )}

                    {!selectedDate ? (
                      <div className="text-center py-8 text-gray-500 text-xs space-y-1">
                        <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-1" />
                        <p className="font-medium text-gray-700">Choose a Date</p>
                        <p>Pick a highlighted Saturday or Sunday on the calendar to see available slots.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 mt-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleTimeClick(slot)}
                            disabled={!isTimeSlotAvailable(slot)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-semibold transition-all border text-center",
                              selectedTime === slot
                                ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                                : isTimeSlotAvailable(slot)
                                ? "bg-white border-gray-200 text-gray-800 hover:border-primary-300 hover:bg-primary-50"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            )}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedDate && selectedTime && (
                    <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between text-xs">
                      <span className="text-gray-600">Selected:</span>
                      <span className="font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        {formatTime(selectedTime)} • {formatDate(selectedDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || !selectedTime}
                  size="default"
                  className="px-6 font-semibold shadow-xs"
                >
                  Next: Select Services
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Services Selection */}
        {step >= 2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary-600" />
                Select Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {services.map(service => (
                  <div key={service.id}>
                    <h4 className="font-medium text-gray-900 mb-3 capitalize">{service.name}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {service.variants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => toggleService(service.id, variant.id)}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all text-left",
                            isServiceSelected(service.id, variant.id)
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:border-primary-200"
                          )}
                        >
                          <div className="font-medium text-gray-900">{variant.name}</div>
                          <div className="text-primary-600 font-semibold mt-1">
                            {formatPrice(variant.price)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ~{Math.floor(variant.duration / 60)}h {variant.duration % 60}m
                          </div>
                          {isServiceSelected(service.id, variant.id) && (
                            <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add-ons */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Add-ons (Per Nail)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {addOns.map(addon => {
                      const count = selectedAddOns[addon.id] || 0;
                      return (
                        <div key={addon.id} className="relative">
                          <button
                            onClick={() => toggleAddOn(addon.id)}
                            className={cn(
                              "w-full p-3 rounded-lg border-2 transition-all text-left",
                              count > 0
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200 hover:border-primary-200"
                            )}
                          >
                            <div className="font-medium text-gray-900 text-sm">{addon.name}</div>
                            <div className="text-primary-600 font-semibold text-sm mt-1">
                              {formatPrice(addon.price)}/nail
                            </div>
                          </button>
                          {count > 0 && (
                            <div className="absolute top-1 right-1 flex items-center gap-1 bg-primary-600 text-white rounded-full px-2 py-0.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); removeAddOn(addon.id); }}
                                className="text-xs hover:bg-primary-700 rounded-full w-5 h-5 flex items-center justify-center"
                              >-</button>
                              <span className="text-xs font-medium">{count}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleAddOn(addon.id); }}
                                className="text-xs hover:bg-primary-700 rounded-full w-5 h-5 flex items-center justify-center"
                              >+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Inspiration Photo */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Inspiration Photo (Optional)</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {inspirationPreview ? (
                    <div className="relative inline-block">
                      <img src={inspirationPreview} alt="Inspiration" className="max-h-48 rounded-lg" />
                      <button
                        onClick={() => { setInspirationImage(null); setInspirationPreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-gray-600">Click or drag to upload</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="inspiration-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setInspirationImage(file);
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              setInspirationPreview(uploadEvent.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button variant="outline" onClick={() => document.getElementById("inspiration-upload")?.click()}>
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <Label htmlFor="notes">Notes for Atasha</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any specific design requests, allergies, or preferences..."
                />
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} size="lg" disabled={selectedServices.length === 0}>
                  Next: Confirm
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Confirm Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{selectedDate ? formatDate(selectedDate) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedTime ? formatTime(selectedTime) : "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Services</p>
                  <div className="space-y-2">
                    {selectedServices.map((s, i) => {
                      const service = services.find(sv => sv.id === s.serviceId);
                      const variant = service?.variants.find(v => v.id === s.variantId);
                      return (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{service?.name} - {variant?.name}</span>
                          <span className="font-medium">{formatPrice(variant?.price || 0)}</span>
                        </div>
                      );
                    })}
                    {Object.entries(selectedAddOns).map(([addOnId, count]) => {
                      const addon = addOns.find(a => a.id === addOnId);
                      return (
                        <div key={addOnId} className="flex justify-between py-2 border-b text-sm">
                          <span>{addon?.name} x{count}</span>
                          <span className="font-medium">{formatPrice((addon?.price || 0) * count)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Downpayment (due now)</span>
                    <span>{formatPrice(DOWNPAYMENT)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Remaining (pay at salon)</span>
                    <span>{formatPrice(calculateTotal() - DOWNPAYMENT)}</span>
                  </div>
                </div>

                {/* GCash Reservation Payment */}
                <div className="p-4 bg-primary-50/50 border border-primary-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                        <QrCode className="h-4 w-4 text-primary-600" />
                        GCash Downpayment (Fixed ₱100)
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Scan the shop GCash QR code or send payment to the owner account
                      </p>
                    </div>
                    <Badge variant="outline" className="border-primary-300 text-primary-800 bg-white">
                      Reservation Fee
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white p-4 rounded-lg border border-primary-100">
                    <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                      <QRCodeSVG
                        value="https://www.facebook.com/prettynailsbyatasha"
                        size={130}
                        bgColor="#ffffff"
                        fgColor="#111827"
                        level="M"
                      />
                      <span className="text-[10px] text-gray-500 mt-1">Shop GCash QR Code</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 block">GCash Account Name:</span>
                        <span className="font-bold text-gray-900 text-sm">Ma'am Atasha / Pretty Nails</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">GCash Number:</span>
                        <span className="font-bold text-primary-700 text-sm font-mono">0977 284 6167</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Downpayment Amount:</span>
                        <span className="font-bold text-gray-900">₱100.00</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gcashRef" className="text-xs font-medium text-gray-700">
                      GCash Reference Number (Optional / Recommended)
                    </Label>
                    <Input
                      id="gcashRef"
                      placeholder="e.g. 100293848192"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="mt-1 bg-white"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Helps Ma'am Atasha verify your downpayment faster.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Info className="h-4 w-4 text-yellow-700" />
                    Important Booking & Cancellation Policy:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-yellow-800">
                    <li>Fixed ₱100 downpayment via GCash secures your slot in the queue.</li>
                    <li>You may cancel before 8:00 PM the day prior for refund/reschedule.</li>
                    <li>No-shows forfeit the downpayment and may be blocked.</li>
                    <li>Appointment only: Wait for owner confirmation in queue. Check status anytime on your profile.</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} size="lg" className="px-6">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Booking Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}