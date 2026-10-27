"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Sparkles, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Upload, X } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    const date = new Date(monthDates[monthDates.length - 1]);
    date.setDate(date.getDate() + 1);
    monthDates.push(date);
  }

  const isDateAvailable = (date: Date) => {
    if (date < today) return false;
    if (!isWeekend(date)) return false;
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);
    if (date > maxDate) return false;
    return true;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const timeSlots = generateTimeSlots("08:00", "22:00", 60); // Hourly slots

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

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: selectedDate.toISOString().split('T')[0],
          startTime: selectedTime,
          endTime,
          totalPrice,
          downpayment: DOWNPAYMENT,
          notes,
          inspirationImage: inspirationPreview,
          services: selectedServices.map(s => ({
            serviceId: s.serviceId,
            variantId: s.variantId,
            quantity: s.quantity,
          })),
          addOns: Object.entries(selectedAddOns).map(([addOnId, quantity]) => ({
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

        {/* Step 1: Date & Time Selection */}
        {step === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary-600" />
                Select Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Available on Saturdays and Sundays only. Book up to 1 month in advance.
              </p>

              {/* Calendar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newDate = new Date(currentYear, currentMonth - 1, 1);
                    setSelectedDate(newDate);
                  }}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="font-semibold text-lg capitalize">
                    {firstDay.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newDate = new Date(currentYear, currentMonth + 1, 1);
                    setSelectedDate(newDate);
                  }}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {monthDates.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => handleDateClick(date)}
                      disabled={!isDateAvailable(date)}
                      className={cn(
                        "aspect-square rounded-lg text-sm font-medium transition-all",
                        isDateSelected(date)
                          ? "bg-primary-600 text-white"
                          : isDateAvailable(date)
                          ? "hover:bg-primary-100 text-gray-900"
                          : "text-gray-300 cursor-not-allowed"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Available Time Slots ({formatDate(selectedDate)})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => handleTimeClick(slot)}
                        disabled={!isTimeSlotAvailable(slot)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                          selectedTime === slot
                            ? "bg-primary-600 text-white border-primary-600"
                            : isTimeSlotAvailable(slot)
                            ? "border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            : "border-gray-200 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || !selectedTime}
                  size="lg"
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
                            setInspirationPreview(URL.createObjectURL(file));
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

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>₱100 downpayment via GCash to confirm booking</li>
                    <li>Cancel before 8 PM day before for refund</li>
                    <li>No-show = downpayment forfeited</li>
                    <li>Owner will confirm within 24 hours</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} size="lg">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
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