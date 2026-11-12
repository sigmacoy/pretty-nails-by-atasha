'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Calendar, Clock, User, MessageSquare, Image, Check, ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles, CreditCard, Banknote, Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@/hooks/useApi';
import { servicesApi, bookingsApi, availabilityApi, paymentsApi, loyaltyApi } from '@/lib/api';
import { ServiceDto, BookingRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Stepper } from '@/components/ui/Stepper';
import { PaymentQRCode } from '@/components/booking/PaymentQRCode';
import { formatPrice, formatDate, formatTime, getVariantLabel } from '@/lib/utils';
import { bookingStep1Schema, bookingStep2Schema, bookingStep3Schema, bookingStep4Schema, type BookingStep1Input, type BookingStep2Input, type BookingStep3Input, type BookingStep4Input } from '@/lib/validations';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Services', icon: <ShoppingBag className="h-6 w-6" /> },
  { id: 2, title: 'Date & Time', icon: <Calendar className="h-6 w-6" /> },
  { id: 3, title: 'Details', icon: <User className="h-6 w-6" /> },
  { id: 4, title: 'Confirm', icon: <Check className="h-6 w-6" /> },
];

export function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; variantId?: string; quantity: number }[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'GCASH' | 'MAYA' | 'CASH'>('GCASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [redeemLoyaltyReward, setRedeemLoyaltyReward] = useState(false);

  // Loyalty card query for reward eligibility
  const { data: loyaltyData } = useQuery(
    () => loyaltyApi.getCard(),
    { enabled: isAuthenticated }
  );
  const loyaltyCard = loyaltyData?.data;
  const stampCount = loyaltyCard?.stampCount ?? 0;
  const hasRewardAvailable = stampCount >= 10;

  // Forms
  const step1Form = useForm<BookingStep1Input>({ resolver: zodResolver(bookingStep1Schema), defaultValues: { services: [] } });
  const step2Form = useForm<BookingStep2Input>({ resolver: zodResolver(bookingStep2Schema), defaultValues: { appointmentDate: '', startTime: '' } });
  const step3Form = useForm<BookingStep3Input>({ resolver: zodResolver(bookingStep3Schema), defaultValues: { name: '', phone: '', notes: '', inspirationImg: '' } });
  const step4Form = useForm<BookingStep4Input>({ resolver: zodResolver(bookingStep4Schema), defaultValues: {} });

  // Load services
  const { data: servicesData, isLoading: servicesLoading } = useQuery(
    () => servicesApi.getActive(),
    { enabled: true }
  );
  const services = servicesData?.data || [];

  // Pre-select service from URL
  useEffect(() => {
    const serviceId = searchParams.get('service');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const defaultVariant = service.variants[0]?.id;
        setSelectedServices([{ serviceId, variantId: defaultVariant, quantity: 1 }]);
        step1Form.setValue('services', [{ serviceId, variantId: defaultVariant, quantity: 1 }]);
      }
    }
    if (date) {
      setAppointmentDate(date);
      step2Form.setValue('appointmentDate', date);
      fetchAvailableSlots(date);
    }
    if (time) {
      setStartTime(time);
      step2Form.setValue('startTime', time);
    }
  }, [services, searchParams, step1Form, step2Form]);

  // Fetch available slots
  const fetchAvailableSlots = async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const response = await availabilityApi.getAvailable();
      const dayAvailability = response.data.find(a => a.date === date && a.isAvailable);
      if (dayAvailability) {
        const slots: { startTime: string; endTime: string }[] = [];
        const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
          const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
          let nextHour = currentHour;
          let nextMin = currentMin + 30;
          if (nextMin >= 60) {
            nextMin -= 60;
            nextHour += 1;
          }
          const slotEnd = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;

          if (nextHour < endHour || (nextHour === endHour && nextMin <= endMin)) {
            slots.push({ startTime: slotStart, endTime: slotEnd });
          }

          currentHour = nextHour;
          currentMin = nextMin;
        }
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Calculate totals
  const selectedServiceDetails = services.filter(s =>
    selectedServices.some(ss => ss.serviceId === s.id)
  );
  const totalPrice = selectedServiceDetails.reduce((sum, s) => {
    const selected = selectedServices.find(ss => ss.serviceId === s.id);
    const variant = selected?.variantId ? s.variants.find(v => v.id === selected.variantId) : s.variants[0];
    return sum + ((variant?.price || s.basePrice) * (selected?.quantity || 1));
  }, 0);
  const totalDuration = selectedServiceDetails.reduce((sum, s) => sum + s.duration, 0);
  const downpayment = 10000; // ₱100

  const handleNext = async (step: number) => {
    if (step === 1) {
      const valid = await step1Form.trigger();
      if (valid && selectedServices.length > 0) {
        setCurrentStep(2);
      }
    } else if (step === 2) {
      const valid = await step2Form.trigger();
      if (valid && appointmentDate && startTime) {
        setCurrentStep(3);
      }
    } else if (step === 3) {
      const valid = await step3Form.trigger();
      if (valid) {
        setCurrentStep(4);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setRedirectAfterAuth(true);
      return;
    }

    const valid = await step4Form.trigger();
    if (!valid) return;

    const trimmedRef = paymentReference.trim();
    if (paymentMethod !== 'CASH' && !trimmedRef) {
      toast.error(`Please provide your ${paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} reference number after sending your downpayment.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData: BookingRequest = {
        serviceIds: selectedServices.map(s => s.serviceId),
        variantIds: selectedServices.map(s => s.variantId).filter(Boolean) as string[],
        services: selectedServices.map(s => ({
          serviceId: s.serviceId,
          variantId: s.variantId,
          quantity: s.quantity || 1,
        })),
        totalPrice,
        downpayment,
        appointmentDate,
        startTime,
        endTime: endTime || undefined,
        notes: step3Form.getValues('notes') || undefined,
        inspirationImg: step3Form.getValues('inspirationImg') || undefined,
        inspirationImage: step3Form.getValues('inspirationImg') || undefined,
        paymentReference: paymentMethod === 'CASH' ? undefined : (trimmedRef || undefined),
        paymentMethod,
        redeemLoyaltyReward: hasRewardAvailable && redeemLoyaltyReward ? true : undefined,
      };

      const response = await bookingsApi.create(bookingData);
      const bookingId = response.data?.id || (response.data as unknown as { bookingId?: string })?.bookingId;

      if (bookingId && paymentMethod !== 'CASH' && trimmedRef) {
        try {
          await paymentsApi.create({
            bookingId,
            amount: downpayment,
            method: paymentMethod,
            reference: trimmedRef,
          });
        } catch (paymentErr) {
          console.warn('Payment record sync:', paymentErr);
        }
      }

      toast.success('Booking confirmed! Downpayment reference recorded.');
      router.push('/my-bookings');
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-padding section-padding">
      {/* Stepper */}
      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{Math.round((currentStep / STEPS.length) * 100)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <BookingStep1
              services={services}
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              form={step1Form}
              onNext={() => handleNext(1)}
              isLoading={servicesLoading}
            />
          )}

          {currentStep === 2 && (
            <BookingStep2
              appointmentDate={appointmentDate}
              setAppointmentDate={setAppointmentDate}
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              availableSlots={availableSlots}
              isLoadingSlots={isLoadingSlots}
              form={step2Form}
              onBack={handleBack}
              onNext={() => handleNext(2)}
              fetchAvailableSlots={fetchAvailableSlots}
            />
          )}

          {currentStep === 3 && (
            <BookingStep3
              form={step3Form}
              onBack={handleBack}
              onNext={() => handleNext(3)}
            />
          )}

          {currentStep === 4 && (
            <BookingStep4
              selectedServices={selectedServices}
              serviceDetails={selectedServiceDetails}
              appointmentDate={appointmentDate}
              startTime={startTime}
              endTime={endTime}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              downpayment={downpayment}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentReference={paymentReference}
              setPaymentReference={setPaymentReference}
              receiptFile={receiptFile}
              setReceiptFile={setReceiptFile}
              receiptPreview={receiptPreview}
              setReceiptPreview={setReceiptPreview}
              redeemLoyaltyReward={redeemLoyaltyReward}
              setRedeemLoyaltyReward={setRedeemLoyaltyReward}
              hasRewardAvailable={hasRewardAvailable}
              stampCount={stampCount}
              form={step4Form}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In Required"
        description="Please sign in or create an account to complete your booking."
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Link href={`/login?redirect=${encodeURIComponent('/booking')}`}>
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href={`/register?redirect=${encodeURIComponent('/booking')}`}>
            <Button variant="outline" className="w-full" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}

// Step 1: Service Selection
function BookingStep1({
  services,
  selectedServices,
  setSelectedServices,
  form,
  onNext,
  isLoading
}: {
  services: ServiceDto[];
  selectedServices: { serviceId: string; variantId?: string; quantity: number }[];
  setSelectedServices: React.Dispatch<React.SetStateAction<{ serviceId: string; variantId?: string; quantity: number }[]>>;
  form: UseFormReturn<BookingStep1Input>;
  onNext: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div>
      <CardHeader className="pb-4">
        <CardTitle>Select Your Services</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">Choose one or more services for your appointment</p>
      </CardHeader>

      <div className="space-y-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServices.some(s => s.serviceId === service.id)}
            selectedVariant={selectedServices.find(s => s.serviceId === service.id)?.variantId}
            onSelect={(variantId) => {
              const existing = selectedServices.find(s => s.serviceId === service.id);
              if (existing) {
                setSelectedServices(selectedServices.map(s =>
                  s.serviceId === service.id ? { ...s, variantId } : s
                ));
                form.setValue('services', selectedServices.map(s =>
                  s.serviceId === service.id ? { ...s, variantId } : s
                ));
              } else {
                const newSelection = { serviceId: service.id, variantId, quantity: 1 };
                setSelectedServices([...selectedServices, newSelection]);
                form.setValue('services', [...selectedServices, newSelection]);
              }
            }}
            onRemove={() => {
              setSelectedServices(selectedServices.filter(s => s.serviceId !== service.id));
              form.setValue('services', selectedServices.filter(s => s.serviceId !== service.id));
            }}
          />
        ))}
      </div>

      {selectedServices.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select at least one service to continue</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={selectedServices.length === 0} size="lg">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  isSelected,
  selectedVariant,
  onSelect,
  onRemove
}: {
  service: ServiceDto;
  isSelected: boolean;
  selectedVariant?: string;
  onSelect: (variantId: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative border-2 rounded-xl p-4 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2">
          <button
            onClick={onRemove}
            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            aria-label="Remove service"
          >
            <span className="text-sm">×</span>
          </button>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{service.category.toLowerCase()}</p>
          {service.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.description}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{formatPrice(service.basePrice)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{service.duration} min</p>
        </div>
      </div>

      {service.variants.length > 1 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Variant
          </label>
          <div className="flex flex-wrap gap-2">
            {service.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onSelect(variant.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedVariant === variant.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{getVariantLabel(variant.name)}</span>
                  <span className="font-bold">{formatPrice(variant.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Date & Time
function BookingStep2({
  appointmentDate,
  setAppointmentDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  availableSlots,
  isLoadingSlots,
  form,
  onBack,
  onNext,
  fetchAvailableSlots,
}: {
  appointmentDate: string;
  setAppointmentDate: React.Dispatch<React.SetStateAction<string>>;
  startTime: string;
  setStartTime: React.Dispatch<React.SetStateAction<string>>;
  endTime: string;
  setEndTime: React.Dispatch<React.SetStateAction<string>>;
  availableSlots: { startTime: string; endTime: string }[];
  isLoadingSlots: boolean;
  form: UseFormReturn<BookingStep2Input>;
  onBack: () => void;
  onNext: () => void;
  fetchAvailableSlots: (date: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div>
      <CardHeader className="pb-4">
        <CardTitle>Select Date & Time</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">Choose your preferred appointment date and time</p>
      </CardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Appointment Date
          </label>
          <input
            type="date"
            min={today}
            max={maxDate}
            value={appointmentDate}
            onChange={(e) => {
              const date = e.target.value;
              setAppointmentDate(date);
              form.setValue('appointmentDate', date);
              fetchAvailableSlots(date);
            }}
            className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Time Slots */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Time Slots
          </label>

          {isLoadingSlots ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Button key={i} variant="outline" disabled className="w-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No available slots for this date</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {availableSlots.map((slot) => (
                <button
                  key={`${slot.startTime}-${slot.endTime}`}
                  onClick={() => {
                    setStartTime(slot.startTime);
                    setEndTime(slot.endTime);
                    form.setValue('startTime', slot.startTime);
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    startTime === slot.startTime
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{formatTime(slot.startTime)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(slot.endTime)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!appointmentDate || !startTime} size="lg">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Details
function BookingStep3({
  form,
  onBack,
  onNext,
}: {
  form: UseFormReturn<BookingStep3Input>;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <CardHeader className="pb-4">
        <CardTitle>Your Details</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">Provide your contact information and any special requests</p>
      </CardHeader>

      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Maria Santos"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+63 9XX XXX XXXX"
          {...form.register('phone')}
          error={form.formState.errors.phone?.message}
        />
        <Textarea
          label="Notes (Optional)"
          placeholder="Any special requests, allergies, or preferences..."
          {...form.register('notes')}
          rows={3}
        />
        <Input
          label="Inspiration Image URL (Optional)"
          type="url"
          placeholder="https://example.com/nail-inspo.jpg"
          {...form.register('inspirationImg')}
          error={form.formState.errors.inspirationImg?.message}
        />
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} size="lg">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Confirm
function BookingStep4({
  selectedServices,
  serviceDetails,
  appointmentDate,
  startTime,
  endTime,
  totalPrice,
  totalDuration,
  downpayment,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  receiptFile,
  setReceiptFile,
  receiptPreview,
  setReceiptPreview,
  redeemLoyaltyReward,
  setRedeemLoyaltyReward,
  hasRewardAvailable,
  stampCount,
  form,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  selectedServices: { serviceId: string; variantId?: string; quantity: number }[];
  serviceDetails: ServiceDto[];
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  downpayment: number;
  paymentMethod: 'GCASH' | 'MAYA' | 'CASH';
  setPaymentMethod: React.Dispatch<React.SetStateAction<'GCASH' | 'MAYA' | 'CASH'>>;
  paymentReference: string;
  setPaymentReference: React.Dispatch<React.SetStateAction<string>>;
  receiptFile: File | null;
  setReceiptFile: React.Dispatch<React.SetStateAction<File | null>>;
  receiptPreview: string | null;
  setReceiptPreview: React.Dispatch<React.SetStateAction<string | null>>;
  redeemLoyaltyReward: boolean;
  setRedeemLoyaltyReward: React.Dispatch<React.SetStateAction<boolean>>;
  hasRewardAvailable: boolean;
  stampCount: number;
  form: UseFormReturn<BookingStep4Input>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div>
      <CardHeader className="pb-4">
        <CardTitle>Confirm Your Booking</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">Review your appointment details, select downpayment method, and confirm</p>
      </CardHeader>

      <div className="space-y-6">
        {/* Services Summary */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Services</h4>
          <div className="space-y-3">
            {serviceDetails.map((service) => {
              const selected = selectedServices.find(s => s.serviceId === service.id);
              const variant = selected?.variantId
                ? service.variants.find(v => v.id === selected.variantId)
                : service.variants[0];
              return (
                <div key={service.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {variant ? getVariantLabel(variant.name) : 'Standard'} • {service.duration} min
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(variant?.price || service.basePrice)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(appointmentDate)}</p>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatTime(startTime)} - {formatTime(endTime)}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{totalDuration} minutes</p>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Downpayment</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(downpayment)}</p>
          </div>
        </div>

        {/* Price Summary */}
        <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
          <div className="flex justify-between text-gray-900 dark:text-gray-100">
            <span>Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          {redeemLoyaltyReward && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 mt-2 font-medium text-sm">
              <span>Loyalty Reward (10 Stamps)</span>
              <span>Free Service Applied (Downpayment Waived)</span>
            </div>
          )}
          <div className="flex justify-between text-gray-900 dark:text-gray-100 mt-2">
            <span>Downpayment (due now)</span>
            <span className="font-semibold">{redeemLoyaltyReward ? '₱0.00 (Waived)' : formatPrice(downpayment)}</span>
          </div>
          <div className="flex justify-between text-gray-900 dark:text-gray-100 mt-2 border-t pt-2">
            <span className="font-semibold text-lg">Total Due</span>
            <span className="font-bold text-lg text-primary">{redeemLoyaltyReward ? '₱0.00' : formatPrice(totalPrice)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            {redeemLoyaltyReward
              ? 'Your booking is covered by your 10 loyalty stamps reward!'
              : `Remaining balance of ${formatPrice(totalPrice - downpayment)} payable at the salon.`}
          </p>
        </div>

        {/* Loyalty Reward Banner */}
        {hasRewardAvailable && (
          <div className="border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-sm text-amber-950 dark:text-amber-200">
                  Loyalty Reward Available ({stampCount} Stamps)
                </h5>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  You have earned 10 stamps! Check the box to redeem a free service reward on this booking.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-amber-900 dark:text-amber-200 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-amber-300 shadow-sm self-start sm:self-auto">
              <input
                type="checkbox"
                checked={redeemLoyaltyReward}
                onChange={(e) => setRedeemLoyaltyReward(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              Redeem Free Service
            </label>
          </div>
        )}

        {/* Downpayment & Payment Method Section */}
        <div className="border rounded-xl p-5 bg-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
            <div>
              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Downpayment & Payment Method
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A non-refundable ₱100.00 downpayment is required to lock in your appointment slot
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 self-start sm:self-auto font-mono text-sm px-3 py-1">
              Downpayment: {formatPrice(downpayment)}
            </Badge>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* GCash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('GCASH')}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === 'GCASH'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                    <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      G
                    </div>
                    <span>GCash</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                    Fastest
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scan QR or send to mobile number</p>
              </button>

              {/* Maya */}
              <button
                type="button"
                onClick={() => setPaymentMethod('MAYA')}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === 'MAYA'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <span>Maya</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">
                    QR Ph
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scan Maya QR or send to mobile</p>
              </button>

              {/* Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                    <Banknote className="h-5 w-5" />
                    <span>In-Salon Cash</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium">
                    Counter
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Settle at salon counter within 24h</p>
              </button>
            </div>
          </div>

          {/* QR Code and Reference Inputs for GCash / Maya */}
          {(paymentMethod === 'GCASH' || paymentMethod === 'MAYA') && (
            <div className="space-y-4 pt-2">
              <PaymentQRCode method={paymentMethod} amount={downpayment} />

              {/* Reference Number Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} Reference Number{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. 1002 9384 1928 or MP240109"
                    className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Please copy and paste the reference number from your {paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} confirmation receipt.
                </p>
              </div>

              {/* Receipt Attachment / Preview */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Payment Receipt Screenshot <span className="text-xs text-gray-500 font-normal">(Optional Attachment)</span>
                </label>
                {!receiptPreview ? (
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50/50 dark:bg-gray-800/30">
                    <Upload className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Upload receipt screenshot
                    </span>
                    <span className="text-[10px] text-gray-500">PNG, JPG or WebP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setReceiptFile(file);
                          const objectUrl = URL.createObjectURL(file);
                          setReceiptPreview(objectUrl);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receiptPreview}
                      alt="Payment receipt preview"
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {receiptFile?.name || 'receipt-attachment.jpg'}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Receipt attached for salon review
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                      className="text-gray-400 hover:text-rose-500"
                      aria-label="Remove receipt attachment"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cash Notice */}
          {paymentMethod === 'CASH' && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>In-Salon Cash Downpayment Terms</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Please visit Pretty Nails by Atasha within <strong>24 hours</strong> of booking to submit the <strong>₱100.00</strong> downpayment at the reception desk. Unsettled bookings may be cancelled if other clients reserve the slot.
              </p>
            </div>
          )}
        </div>

        {/* Confirmation */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...form.register('confirmed')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              required
            />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              I confirm that all information is correct and I agree to the{' '}
              <a href="#" className="text-primary hover:underline">booking terms and conditions</a>.
              I understand that a downpayment of {formatPrice(downpayment)} is required to secure this appointment.
            </div>
          </label>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} size="lg">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={onSubmit} isLoading={isSubmitting} size="lg" className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2" />
                  Confirming...
                </>
              ) : (
                <>
                  Confirm Booking
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}