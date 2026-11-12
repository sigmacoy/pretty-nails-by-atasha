'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Calendar,
  Clock,
  User,
  CreditCard,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  X,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@/hooks/useApi';
import { servicesApi, bookingsApi, availabilityApi, paymentsApi, loyaltyApi } from '@/lib/api';
import { ServiceDto, BookingRequest } from '@/types';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { PaymentQRCode } from '@/components/booking/PaymentQRCode';
import { formatPrice, formatDate, formatTime, getVariantLabel } from '@/lib/utils';
import {
  bookingStep1Schema,
  bookingStep2Schema,
  bookingStep3Schema,
  bookingStep4Schema,
  type BookingStep1Input,
  type BookingStep2Input,
  type BookingStep3Input,
  type BookingStep4Input,
} from '@/lib/validations';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Select service', icon: ShoppingBag },
  { id: 2, title: 'Date & time', icon: Calendar },
  { id: 3, title: 'Customer details', icon: User },
  { id: 4, title: 'Reservation downpayment', icon: CreditCard },
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
  const step1Form = useForm<BookingStep1Input>({
    resolver: zodResolver(bookingStep1Schema),
    defaultValues: { services: [] },
  });
  const step2Form = useForm<BookingStep2Input>({
    resolver: zodResolver(bookingStep2Schema),
    defaultValues: { appointmentDate: '', startTime: '' },
  });
  const step3Form = useForm<BookingStep3Input>({
    resolver: zodResolver(bookingStep3Schema),
    defaultValues: { name: '', phone: '', notes: '', inspirationImg: '' },
  });
  const step4Form = useForm<BookingStep4Input>({
    resolver: zodResolver(bookingStep4Schema),
    defaultValues: {},
  });

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
  const downpayment = 10000; // ₱100 in centavos

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

      toast.success('Booking confirmed. Downpayment reference recorded');
      router.push('/my-bookings');
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerName = step3Form.watch('name');
  const customerPhone = step3Form.watch('phone');

  return (
    <div className="container-padding section-padding max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="mb-8 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-stone-500 font-mono tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-700" />
          <span>Pretty Nails by Atasha</span>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <span>Studio appointment booking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Book an appointment
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
          Select your desired nail treatments, reserve an available slot, and confirm your visit with a simple reservation downpayment.
        </p>
      </div>

      {/* 4-Step Stepper with 36px Nodes */}
      <div className="mb-10 rounded-[12px] border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs">
        <BookingStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(targetStep) => {
            if (targetStep < currentStep) setCurrentStep(targetStep);
          }}
        />
      </div>

      {/* Desktop Split Layout (Wizard Form + Sticky Summary Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Panel */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="rounded-[12px] border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs transition-opacity duration-200">
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
          </div>
        </div>

        {/* Right Column: Sticky Summary Card on Desktop */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
          <AppointmentSummaryCard
            serviceDetails={selectedServiceDetails}
            selectedServices={selectedServices}
            appointmentDate={appointmentDate}
            startTime={startTime}
            endTime={endTime}
            totalPrice={totalPrice}
            totalDuration={totalDuration}
            downpayment={downpayment}
            redeemLoyaltyReward={redeemLoyaltyReward}
            customerName={customerName}
            customerPhone={customerPhone}
          />
        </div>
      </div>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in required"
        description="Please sign in or create an account to finalize and confirm your appointment reservation."
        size="md"
      >
        <div className="flex flex-col gap-3 pt-2">
          <Link href={`/login?redirect=${encodeURIComponent('/booking')}`}>
            <Button className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-[8px] h-10 text-sm font-medium transition-colors">
              Sign in
            </Button>
          </Link>
          <Link href={`/register?redirect=${encodeURIComponent('/booking')}`}>
            <Button variant="outline" className="w-full rounded-[8px] border-stone-200 dark:border-stone-800 h-10 text-sm font-medium transition-colors">
              Create an account
            </Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}

// 4-Step Stepper Component with 36px Nodes & Signature Lacquer Drop
function BookingStepper({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: { id: number; title: string; icon: typeof ShoppingBag }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="w-full">
      {/* Mobile step status */}
      <div className="flex items-center justify-between sm:hidden mb-3 text-xs">
        <span className="font-mono text-stone-500 tabular-nums">
          Step {currentStep} of {steps.length}
        </span>
        <span className="font-medium text-stone-900 dark:text-stone-100">
          {steps[currentStep - 1]?.title}
        </span>
      </div>

      {/* Stepper track */}
      <div className="relative">
        {/* Track Line */}
        <div
          className="hidden sm:block absolute top-[18px] left-10 right-10 h-[1.5px] bg-stone-200 dark:bg-stone-800 -z-0"
          aria-hidden="true"
        />

        <div className="flex items-start justify-between relative z-10">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center flex-1"
              >
                {/* 36px Step Node */}
                <button
                  type="button"
                  disabled={!isCompleted}
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs transition-colors select-none ${
                    isCompleted
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200'
                      : isCurrent
                      ? 'bg-rose-700 text-white dark:bg-rose-600 ring-4 ring-rose-700/15 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 cursor-default'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[1.5]" />
                  ) : isCurrent ? (
                    /* Signature lacquer drop glyph */
                    <svg
                      className="h-3.5 w-3.5 fill-current"
                      viewBox="0 0 16 16"
                      aria-label="Active step"
                    >
                      <path d="M8 2C8 2 4.5 6.5 4.5 9.8C4.5 11.8 6.1 13.5 8 13.5C9.9 13.5 11.5 11.8 11.5 9.8C11.5 6.5 8 2 8 2Z" />
                    </svg>
                  ) : (
                    <span className="font-mono text-xs tabular-nums">{step.id}</span>
                  )}
                </button>

                {/* Step Title */}
                <span
                  className={`mt-2 text-xs leading-snug max-w-[85px] sm:max-w-[110px] hidden sm:block ${
                    isCurrent
                      ? 'font-medium text-stone-900 dark:text-stone-100'
                      : isCompleted
                      ? 'font-normal text-stone-700 dark:text-stone-300'
                      : 'font-normal text-stone-400 dark:text-stone-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Side-by-side / Sticky Appointment Summary Card
function AppointmentSummaryCard({
  serviceDetails,
  selectedServices,
  appointmentDate,
  startTime,
  endTime,
  totalPrice,
  totalDuration,
  downpayment,
  redeemLoyaltyReward,
  customerName,
  customerPhone,
}: {
  serviceDetails: ServiceDto[];
  selectedServices: { serviceId: string; variantId?: string; quantity: number }[];
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  downpayment: number;
  redeemLoyaltyReward: boolean;
  customerName?: string;
  customerPhone?: string;
}) {
  const remainingBalance = Math.max(0, totalPrice - downpayment);

  return (
    <div className="rounded-[12px] border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 p-5 shadow-xs space-y-4">
      <div className="border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100 tracking-tight">
          Appointment summary
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Real-time service and pricing calculation
        </p>
      </div>

      {/* Selected Services List */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Selected treatments
        </span>
        {serviceDetails.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400 italic py-1">
            No service selected yet. Choose treatments to start.
          </p>
        ) : (
          <div className="space-y-2">
            {serviceDetails.map((service) => {
              const selected = selectedServices.find(s => s.serviceId === service.id);
              const variant = selected?.variantId
                ? service.variants.find(v => v.id === selected.variantId)
                : service.variants[0];
              const price = variant?.price || service.basePrice;

              return (
                <div
                  key={service.id}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                      {service.name}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {variant ? getVariantLabel(variant.name) : 'Standard'} • <span className="tabular-nums">{service.duration} min</span>
                    </p>
                  </div>
                  <span className="font-mono font-medium text-stone-900 dark:text-stone-100 tabular-nums flex-shrink-0">
                    {formatPrice(price)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date & Time Slot */}
      <div className="border-t border-stone-200/80 dark:border-stone-800 pt-3 space-y-1 text-xs">
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Schedule
        </span>
        {appointmentDate && startTime ? (
          <div className="flex items-center justify-between text-stone-800 dark:text-stone-200 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400 stroke-[1.5]" />
              {formatDate(appointmentDate)}
            </span>
            <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
              {formatTime(startTime)}{endTime ? ` – ${formatTime(endTime)}` : ''}
            </span>
          </div>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 italic pt-1">
            Date and time slot pending selection
          </p>
        )}
        {totalDuration > 0 && (
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
              Estimated session length
            </span>
            <span className="font-mono tabular-nums">{totalDuration} min</span>
          </div>
        )}
      </div>

      {/* Customer Info (if filled in Step 3) */}
      {(customerName || customerPhone) && (
        <div className="border-t border-stone-200/80 dark:border-stone-800 pt-3 space-y-1 text-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Client details
          </span>
          {customerName && (
            <p className="text-stone-800 dark:text-stone-200 font-medium truncate">
              {customerName}
            </p>
          )}
          {customerPhone && (
            <p className="text-stone-500 dark:text-stone-400 font-mono text-[11px] tabular-nums">
              {customerPhone}
            </p>
          )}
        </div>
      )}

      {/* Tabular Price Breakdown */}
      <div className="border-t border-stone-200/80 dark:border-stone-800 pt-3 space-y-2 text-xs">
        <div className="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Treatment subtotal</span>
          <span className="font-mono tabular-nums font-medium text-stone-900 dark:text-stone-100">
            {formatPrice(totalPrice)}
          </span>
        </div>

        {redeemLoyaltyReward && (
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3 stroke-[1.5]" />
              Loyalty reward (10 stamps)
            </span>
            <span className="font-mono tabular-nums">-Free gel service</span>
          </div>
        )}

        <div className="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Reservation downpayment</span>
          <span className="font-mono tabular-nums font-medium text-stone-900 dark:text-stone-100">
            {redeemLoyaltyReward ? '₱0.00' : formatPrice(downpayment)}
          </span>
        </div>

        <div className="border-t border-stone-200/80 dark:border-stone-800 pt-2 flex justify-between items-baseline">
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">
              Balance due at salon
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Payable during your appointment visit
            </p>
          </div>
          <span className="text-base font-medium font-mono tabular-nums text-rose-700 dark:text-rose-400">
            {redeemLoyaltyReward ? '₱0.00' : formatPrice(remainingBalance)}
          </span>
        </div>
      </div>

      {/* Salon Guarantee Notice */}
      <div className="rounded-[8px] bg-stone-100/90 dark:bg-stone-800/60 p-3 text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed border border-stone-200/60 dark:border-stone-700/60">
        Slots are held for 15 minutes past start time. Fresh, sanitized implements are prepared for each appointment session.
      </div>
    </div>
  );
}

// Step 1: Select Service
function BookingStep1({
  services,
  selectedServices,
  setSelectedServices,
  form,
  onNext,
  isLoading,
}: {
  services: ServiceDto[];
  selectedServices: { serviceId: string; variantId?: string; quantity: number }[];
  setSelectedServices: React.Dispatch<React.SetStateAction<{ serviceId: string; variantId?: string; quantity: number }[]>>;
  form: UseFormReturn<BookingStep1Input>;
  onNext: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-stone-100 dark:bg-stone-800 rounded-[8px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Select treatments
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Choose one or more salon treatments for your upcoming session
        </p>
      </div>

      <div className="space-y-3.5">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServices.some(s => s.serviceId === service.id)}
            selectedVariant={selectedServices.find(s => s.serviceId === service.id)?.variantId}
            onSelect={(variantId) => {
              const existing = selectedServices.find(s => s.serviceId === service.id);
              if (existing) {
                const updated = selectedServices.map(s =>
                  s.serviceId === service.id ? { ...s, variantId } : s
                );
                setSelectedServices(updated);
                form.setValue('services', updated);
              } else {
                const newSelection = { serviceId: service.id, variantId, quantity: 1 };
                const updated = [...selectedServices, newSelection];
                setSelectedServices(updated);
                form.setValue('services', updated);
              }
            }}
            onRemove={() => {
              const updated = selectedServices.filter(s => s.serviceId !== service.id);
              setSelectedServices(updated);
              form.setValue('services', updated);
            }}
          />
        ))}
      </div>

      {selectedServices.length === 0 && (
        <div className="text-center py-10 rounded-[8px] border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-500 dark:text-stone-400">
          <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-stone-400 stroke-[1.5]" />
          <p className="text-xs">Select at least one treatment to proceed to scheduling</p>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button
          onClick={onNext}
          disabled={selectedServices.length === 0}
          className="bg-rose-700 hover:bg-rose-800 text-white rounded-[8px] h-10 px-5 text-sm font-medium transition-colors"
        >
          <span>Continue to date & time</span>
          <ChevronRight className="h-4 w-4 ml-1.5 stroke-[1.5]" />
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
  onRemove,
}: {
  service: ServiceDto;
  isSelected: boolean;
  selectedVariant?: string;
  onSelect: (variantId: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-[12px] border p-4 transition-colors ${
        isSelected
          ? 'border-rose-700/60 bg-rose-50/15 dark:border-rose-500/50 dark:bg-rose-950/10'
          : 'border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900/50 hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm text-stone-900 dark:text-stone-100">
              {service.name}
            </h4>
            <span className="rounded-[6px] px-2 py-0.5 text-[10px] font-medium tracking-wide text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
              {service.category.toLowerCase()}
            </span>
          </div>
          {service.description && (
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium font-mono text-stone-900 dark:text-stone-100 tabular-nums">
            {formatPrice(service.basePrice)}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums flex items-center justify-end gap-1 mt-0.5">
            <Clock className="h-3 w-3 stroke-[1.5]" />
            {service.duration} min
          </p>
        </div>
      </div>

      {/* Variants / Length tiers */}
      {service.variants.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
              Treatment tier / option
            </span>
            {isSelected && (
              <button
                type="button"
                onClick={onRemove}
                className="text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Deselect
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {service.variants.map((variant) => {
              const active = isSelected && (selectedVariant === variant.id || (!selectedVariant && variant.id === service.variants[0]?.id));
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onSelect(variant.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <span className="mr-1.5">{getVariantLabel(variant.name)}</span>
                  <span className="font-mono font-normal tabular-nums opacity-90">
                    {formatPrice(variant.price)}
                  </span>
                </button>
              );
            })}
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Select date and time
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Pick an appointment date and reserved time slot that fits your schedule
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Date Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Appointment date
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
            className="w-full h-10 px-3 rounded-[8px] border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-rose-700 focus:border-rose-700 font-mono tabular-nums"
          />
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Bookings are accepted up to 90 days in advance
          </p>
        </div>

        {/* Time Slot Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Available appointment slots
          </label>

          {isLoadingSlots ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-[8px] bg-stone-100 dark:bg-stone-800 animate-pulse" />
              ))}
            </div>
          ) : !appointmentDate ? (
            <div className="p-6 rounded-[8px] border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-center text-xs text-stone-500 dark:text-stone-400">
              <Calendar className="h-6 w-6 mx-auto mb-1.5 text-stone-400 stroke-[1.5]" />
              Select a date on the calendar to see open time slots
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-6 rounded-[8px] border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-center text-xs text-stone-500 dark:text-stone-400">
              <Calendar className="h-6 w-6 mx-auto mb-1.5 text-stone-400 stroke-[1.5]" />
              No available slots for this date. Please select another date.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const isSelected = startTime === slot.startTime;
                return (
                  <button
                    key={`${slot.startTime}-${slot.endTime}`}
                    type="button"
                    onClick={() => {
                      setStartTime(slot.startTime);
                      setEndTime(slot.endTime);
                      form.setValue('startTime', slot.startTime);
                    }}
                    className={`p-2.5 rounded-[8px] border text-left transition-colors font-mono tabular-nums text-xs ${
                      isSelected
                        ? 'border-rose-700 bg-rose-50/50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/25 dark:text-rose-100 font-medium ring-1 ring-rose-700/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="font-medium">{formatTime(slot.startTime)}</div>
                    <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                      ends {formatTime(slot.endTime)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-[8px] border-stone-200 dark:border-stone-800 h-10 px-4 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1.5 stroke-[1.5]" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!appointmentDate || !startTime}
          className="bg-rose-700 hover:bg-rose-800 text-white rounded-[8px] h-10 px-5 text-sm font-medium transition-colors"
        >
          <span>Continue to details</span>
          <ChevronRight className="h-4 w-4 ml-1.5 stroke-[1.5]" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Customer Details & Inspiration Photo Slot
function BookingStep3({
  form,
  onBack,
  onNext,
}: {
  form: UseFormReturn<BookingStep3Input>;
  onBack: () => void;
  onNext: () => void;
}) {
  const watchInspiration = form.watch('inspirationImg');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Customer details
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Provide your contact information and nail reference requests
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Full name"
          placeholder="Maria Santos"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
          className="rounded-[8px]"
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="+63 917 123 4567"
          {...form.register('phone')}
          error={form.formState.errors.phone?.message}
          className="rounded-[8px] font-mono tabular-nums"
        />

        <Textarea
          label="Special requests or nail condition notes (optional)"
          placeholder="Allergies, preferred shape (e.g. almond, square), cuticles, or previous nail enhancement removal needs..."
          {...form.register('notes')}
          rows={3}
          className="rounded-[8px]"
        />

        {/* Inspiration image input with preview slot */}
        <div className="space-y-2">
          <Input
            label="Inspiration photo URL (optional)"
            type="url"
            placeholder="https://images.unsplash.com/... or Instagram link"
            {...form.register('inspirationImg')}
            error={form.formState.errors.inspirationImg?.message}
            className="rounded-[8px]"
          />

          {/* Inspiration Photo Preview Slot */}
          {watchInspiration ? (
            <div className="rounded-[8px] border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-3 flex items-center gap-3">
              <div className="h-14 w-14 rounded-[6px] overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={watchInspiration}
                  alt="Nail art inspiration preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '0.3';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  Inspiration reference preview
                </p>
                <p className="text-stone-500 dark:text-stone-400 truncate text-[11px] font-mono">
                  {watchInspiration}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-[8px] border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/20 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-stone-400" />
              <span>Provide an image URL from Pinterest or Instagram so your technician can prepare custom gel colors.</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-[8px] border-stone-200 dark:border-stone-800 h-10 px-4 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1.5 stroke-[1.5]" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-rose-700 hover:bg-rose-800 text-white rounded-[8px] h-10 px-5 text-sm font-medium transition-colors"
        >
          <span>Continue to reservation</span>
          <ChevronRight className="h-4 w-4 ml-1.5 stroke-[1.5]" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Reservation Downpayment & Confirmation
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Reservation downpayment
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Submit your downpayment to lock in your appointment slot
        </p>
      </div>

      {/* Loyalty Reward Voucher Card */}
      {hasRewardAvailable && (
        <div className="rounded-[12px] border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Tag className="h-4 w-4 text-rose-700 dark:text-rose-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-0.5">
              <h4 className="font-medium text-xs text-stone-900 dark:text-stone-100">
                Loyalty reward available ({stampCount} stamps)
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                You have earned 10 stamps. Check the option to redeem a free service on this visit.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-950 px-3 py-1.5 rounded-[8px] border border-stone-200 dark:border-stone-800 shadow-xs self-start sm:self-auto">
            <input
              type="checkbox"
              checked={redeemLoyaltyReward}
              onChange={(e) => setRedeemLoyaltyReward(e.target.checked)}
              className="rounded-[4px] border-stone-300 text-rose-700 focus:ring-rose-700 h-3.5 w-3.5"
            />
            <span>Redeem free service</span>
          </label>
        </div>
      )}

      {/* Downpayment Method Selection (Quiet Porcelain, No Rainbow Slop) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Payment method for reservation fee
          </label>
          <span className="font-mono text-xs tabular-nums text-stone-500 dark:text-stone-400">
            Fee: {formatPrice(downpayment)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* GCash */}
          <button
            type="button"
            onClick={() => setPaymentMethod('GCASH')}
            className={`rounded-[12px] border p-3.5 text-left transition-colors ${
              paymentMethod === 'GCASH'
                ? 'border-rose-700 bg-rose-50/20 dark:border-rose-500 dark:bg-rose-950/15 ring-1 ring-rose-700/20'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-xs text-stone-900 dark:text-stone-100">
                GCash
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                Fastest
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Scan studio QR or transfer via mobile
            </p>
          </button>

          {/* Maya */}
          <button
            type="button"
            onClick={() => setPaymentMethod('MAYA')}
            className={`rounded-[12px] border p-3.5 text-left transition-colors ${
              paymentMethod === 'MAYA'
                ? 'border-rose-700 bg-rose-50/20 dark:border-rose-500 dark:bg-rose-950/15 ring-1 ring-rose-700/20'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-xs text-stone-900 dark:text-stone-100">
                Maya
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                QR Ph
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Scan Maya QR or transfer via mobile
            </p>
          </button>

          {/* Cash */}
          <button
            type="button"
            onClick={() => setPaymentMethod('CASH')}
            className={`rounded-[12px] border p-3.5 text-left transition-colors ${
              paymentMethod === 'CASH'
                ? 'border-rose-700 bg-rose-50/20 dark:border-rose-500 dark:bg-rose-950/15 ring-1 ring-rose-700/20'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5 stroke-[1.5]" />
                In-salon cash
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                Counter
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Pay at salon counter within 24h
            </p>
          </button>
        </div>
      </div>

      {/* QR Code Presentation */}
      {(paymentMethod === 'GCASH' || paymentMethod === 'MAYA') && (
        <div className="space-y-4">
          <PaymentQRCode method={paymentMethod} amount={downpayment} />

          {/* Reference Number Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} reference number <span className="text-rose-700">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <FileText className="h-4 w-4 stroke-[1.5]" />
              </div>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. 1002 9384 1928"
                className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-mono text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-700 focus:border-rose-700"
                required
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Enter the reference number from your payment confirmation receipt
            </p>
          </div>

          {/* Receipt Screenshot Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              Payment receipt screenshot <span className="text-stone-400 font-normal">(optional attachment)</span>
            </label>
            {!receiptPreview ? (
              <label className="rounded-[8px] border border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-900/30">
                <Upload className="h-5 w-5 text-stone-400 mb-1 stroke-[1.5]" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Upload receipt screenshot
                </span>
                <span className="text-[10px] text-stone-400 mt-0.5">PNG, JPG or WebP up to 5MB</span>
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
              <div className="flex items-center gap-3 p-3 rounded-[8px] border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptPreview}
                  alt="Payment receipt preview"
                  className="h-14 w-14 object-cover rounded-[6px] border border-stone-200 dark:border-stone-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                    {receiptFile?.name || 'receipt-attachment.jpg'}
                  </p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400 stroke-[1.5]" />
                    Receipt attached for salon verification
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                  className="p-1 rounded-[6px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                  aria-label="Remove receipt attachment"
                >
                  <X className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Notice */}
      {paymentMethod === 'CASH' && (
        <div className="rounded-[8px] border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-medium text-xs">
            <AlertCircle className="h-3.5 w-3.5 stroke-[1.5] text-stone-500" />
            <span>In-salon cash terms</span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
            Please visit Pretty Nails by Atasha within 24 hours of booking to settle the ₱100.00 reservation fee at the front counter. Unreserved slots may be opened to waitlisted clients.
          </p>
        </div>
      )}

      {/* Confirmation Agreement */}
      <div className="space-y-4 pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            {...form.register('confirmed')}
            className="mt-0.5 h-4 w-4 rounded-[4px] border-stone-300 text-rose-700 focus:ring-rose-700"
            required
          />
          <span className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            I confirm my appointment details and agree that a reservation downpayment of {formatPrice(downpayment)} secures this session.
          </span>
        </label>

        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-[8px] border-stone-200 dark:border-stone-800 h-10 px-4 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5 stroke-[1.5]" />
            Back
          </Button>

          <Button
            onClick={onSubmit}
            isLoading={isSubmitting}
            className="bg-rose-700 hover:bg-rose-800 text-white rounded-[8px] h-10 px-6 text-sm font-medium transition-colors shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin stroke-[1.5]" />
                Confirming reservation...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 stroke-[1.5]" />
                Confirm booking
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;
