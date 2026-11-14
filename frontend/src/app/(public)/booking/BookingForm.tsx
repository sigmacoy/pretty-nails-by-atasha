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
  ShieldCheck,
} from 'lucide-react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@/hooks/useApi';
import { servicesApi, bookingsApi, availabilityApi, paymentsApi, loyaltyApi } from '@/lib/api';
import { ServiceDto, BookingRequest } from '@/types';
import { Button } from '@/components/ui';
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
  { id: 1, title: 'Select treatments', icon: ShoppingBag },
  { id: 2, title: 'Date & timing', icon: Calendar },
  { id: 3, title: 'Client record', icon: User },
  { id: 4, title: 'Reservation deposit', icon: CreditCard },
];

// Curated studio treatments fallback for booking flow
const defaultServicesFallback: ServiceDto[] = [
  {
    id: 'service-extension',
    name: 'Soft Gel Sculpted Extensions',
    category: 'EXTENSION',
    description: 'Sculpted length with apex architecture and Japanese soft gel. Unrushed structural balance designed for high durability.',
    basePrice: 80000,
    duration: 90,
    isActive: true,
    variants: [
      { id: 'v1', serviceId: 'service-extension', name: 'Short', price: 80000 },
      { id: 'v2', serviceId: 'service-extension', name: 'Medium', price: 95000 },
      { id: 'v3', serviceId: 'service-extension', name: 'Long', price: 110000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-gel',
    name: 'Structured BIAB & Gel Overlay',
    category: 'GEL',
    description: 'Natural plate reinforcement with Russian dry cuticle prep and high-shine Japanese apex finish.',
    basePrice: 50000,
    duration: 60,
    isActive: true,
    variants: [
      { id: 'v4', serviceId: 'service-gel', name: 'Classic Single-Tone', price: 50000 },
      { id: 'v5', serviceId: 'service-gel', name: 'French Accent Hairline', price: 60000 },
      { id: 'v6', serviceId: 'service-gel', name: 'Magnetic Velvet Cat-Eye', price: 65000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-pedicure',
    name: 'Signature Luxe Gel Pedicure',
    category: 'PEDICURE',
    description: 'Callus softening, gentle dry prep, natural foot soak, and high-shine long-wearing gel finish.',
    basePrice: 60000,
    duration: 60,
    isActive: true,
    variants: [
      { id: 'v7', serviceId: 'service-pedicure', name: 'Classic Luxe', price: 60000 },
      { id: 'v8', serviceId: 'service-pedicure', name: 'French Finish', price: 70000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-cleaning',
    name: 'Studio Dry Cuticle Prep & Hygiene Care',
    category: 'GEL',
    description: 'Precision e-file dry manicuring, cuticle refinement, and natural plate conditioning.',
    basePrice: 30000,
    duration: 30,
    isActive: true,
    variants: [
      { id: 'v9', serviceId: 'service-cleaning', name: 'Standard Care', price: 30000 },
      { id: 'v10', serviceId: 'service-cleaning', name: 'Deep Restorative Care', price: 45000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-nail-art',
    name: 'Bespoke Hand-Painted Nail Art',
    category: 'ADDON',
    description: 'Custom fine-line artwork, tortoiseshell glass, metallic foil accents, or tailored editorial aesthetics.',
    basePrice: 15000,
    duration: 30,
    isActive: true,
    variants: [
      { id: 'v11', serviceId: 'service-nail-art', name: 'Minimalist Accent (2 nails)', price: 15000 },
      { id: 'v12', serviceId: 'service-nail-art', name: 'Full Set Bespoke Concept', price: 35000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
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
  const rawServices = servicesData?.data || [];
  const services = rawServices.length > 0 ? rawServices : defaultServicesFallback;

  // Pre-select service from URL
  useEffect(() => {
    const serviceId = searchParams.get('service');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (serviceId && services.length > 0) {
      const service = services.find((s) => s.id === serviceId);
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
      const dayAvailability = response.data.find((a) => a.date === date && a.isAvailable);
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
  const selectedServiceDetails = services.filter((s) =>
    selectedServices.some((ss) => ss.serviceId === s.id)
  );
  const totalPrice = selectedServiceDetails.reduce((sum, s) => {
    const selected = selectedServices.find((ss) => ss.serviceId === s.id);
    const variant = selected?.variantId ? s.variants.find((v) => v.id === selected.variantId) : s.variants[0];
    return sum + ((variant?.price || s.basePrice) * (selected?.quantity || 1));
  }, 0);
  const totalDuration = selectedServiceDetails.reduce((sum, s) => sum + s.duration, 0);
  const downpayment = 10000; // ₱100.00 in centavos

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
        serviceIds: selectedServices.map((s) => s.serviceId),
        variantIds: selectedServices.map((s) => s.variantId).filter(Boolean) as string[],
        services: selectedServices.map((s) => ({
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

      toast.success('Reservation request submitted. Atasha will review your downpayment reference to confirm your slot.');
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
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Studio Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-3">
            Private Atelier · Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-stone-900 dark:text-rose-50 leading-[1.08]">
            Book a Private Atelier Appointment
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
            Select your preferred treatments, reserve an available date and time, and secure your session with a reservation downpayment. Each appointment is an unhurried, private 1-on-1 experience.
          </p>
        </div>

        {/* Studio Notice Banner */}
        <div className="mb-8 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-5 sm:p-6 shadow-card flex items-start sm:items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            <span className="font-semibold text-stone-900 dark:text-rose-50 block sm:inline mr-1">
              Deposit Review Policy:
            </span>
            A reservation downpayment of ₱100.00 via GCash or Maya guarantees your slot. Atasha manually verifies each payment reference before confirmation. Rescheduling is available up to 24 hours in advance via your client portal.
          </div>
        </div>

        {/* 4-Step Stepper */}
        <div className="mb-10 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-5 sm:p-6 shadow-card">
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
            <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-6 sm:p-8 shadow-card transition-opacity duration-200">
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
          <div className="flex flex-col gap-3 pt-3">
            <Link href={`/login?redirect=${encodeURIComponent('/booking')}`}>
              <button
                type="button"
                className="w-full h-12 sm:h-14 px-8 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base tracking-normal shadow-xs transition-colors border border-rose-800/80 inline-flex items-center justify-center"
              >
                Sign in to Proceed
              </button>
            </Link>
            <Link href={`/register?redirect=${encodeURIComponent('/booking')}`}>
              <button
                type="button"
                className="w-full h-12 sm:h-14 px-8 rounded-full border border-rose-300/80 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-medium text-sm sm:text-base transition-colors inline-flex items-center justify-center"
              >
                Create Studio Account
              </button>
            </Link>
          </div>
        </Modal>
      </div>
    </div>
  );
}

// 4-Step Stepper Component
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
        <span className="font-mono text-rose-800 dark:text-rose-300 tabular-nums">
          Step {currentStep} of {steps.length}
        </span>
        <span className="font-medium text-stone-900 dark:text-rose-50">
          {steps[currentStep - 1]?.title}
        </span>
      </div>

      {/* Stepper track */}
      <div className="relative">
        <div
          className="hidden sm:block absolute top-[20px] left-12 right-12 h-[1.5px] bg-rose-200/80 dark:border-rose-950/60 -z-0"
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
                <button
                  type="button"
                  disabled={!isCompleted}
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all duration-200 select-none border ${
                    isCompleted
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 border-stone-900 cursor-pointer hover:bg-stone-800'
                      : isCurrent
                      ? 'bg-rose-900 text-white border-rose-900 shadow-xs ring-4 ring-rose-900/15'
                      : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-rose-200/80 dark:border-rose-950/60 cursor-default'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2]" />
                  ) : (
                    <span className="font-mono tabular-nums font-semibold">{step.id}</span>
                  )}
                </button>

                <span
                  className={`mt-2 text-xs leading-snug max-w-[90px] sm:max-w-[120px] hidden sm:block ${
                    isCurrent
                      ? 'font-medium text-stone-900 dark:text-rose-50'
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
    <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-6 sm:p-7 shadow-card space-y-5">
      <div className="border-b border-rose-100 dark:border-rose-950/60 pb-3.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block mb-1">
          Atelier Overview
        </span>
        <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-rose-50 tracking-tight">
          Appointment Summary
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-normal">
          Transparent treatment rates and deposit breakdown
        </p>
      </div>

      {/* Selected Services List */}
      <div className="space-y-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-rose-800/70 dark:text-rose-300/70 block">
          Selected Treatments
        </span>
        {serviceDetails.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400 italic py-1 font-normal">
            No service selected yet. Choose treatments to begin.
          </p>
        ) : (
          <div className="space-y-2.5">
            {serviceDetails.map((service) => {
              const selected = selectedServices.find((s) => s.serviceId === service.id);
              const variant = selected?.variantId
                ? service.variants.find((v) => v.id === selected.variantId)
                : service.variants[0];
              const price = variant?.price || service.basePrice;

              return (
                <div
                  key={service.id}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 dark:text-rose-50 truncate">
                      {service.name}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {variant ? getVariantLabel(variant.name) : 'Standard'} · <span className="tabular-nums">{service.duration} mins</span>
                    </p>
                  </div>
                  <span className="font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums flex-shrink-0">
                    {formatPrice(price)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date & Time Slot */}
      <div className="border-t border-rose-100 dark:border-rose-950/60 pt-3.5 space-y-1.5 text-xs">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-rose-800/70 dark:text-rose-300/70 block">
          Reserved Schedule
        </span>
        {appointmentDate && startTime ? (
          <div className="flex items-center justify-between text-stone-800 dark:text-stone-200 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-rose-600 stroke-[1.5]" />
              {formatDate(appointmentDate)}
            </span>
            <span className="font-mono tabular-nums text-stone-700 dark:text-stone-300 font-medium">
              {formatTime(startTime)}{endTime ? ` – ${formatTime(endTime)}` : ''}
            </span>
          </div>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 italic pt-0.5 font-normal">
            Date and time slot pending selection
          </p>
        )}
        {totalDuration > 0 && (
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-rose-500 stroke-[1.5]" />
              Estimated session length
            </span>
            <span className="font-mono tabular-nums">{totalDuration} mins</span>
          </div>
        )}
      </div>

      {/* Customer Info (if filled in Step 3) */}
      {(customerName || customerPhone) && (
        <div className="border-t border-rose-100 dark:border-rose-950/60 pt-3.5 space-y-1 text-xs">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-rose-800/70 dark:text-rose-300/70 block">
            Client Details
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
      <div className="border-t border-rose-100 dark:border-rose-950/60 pt-3.5 space-y-2.5 text-xs">
        <div className="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Treatment Subtotal</span>
          <span className="font-serif font-semibold text-stone-900 dark:text-rose-50 tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>

        {redeemLoyaltyReward && (
          <div className="flex justify-between text-rose-800 dark:text-rose-300 font-medium">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3 stroke-[1.5]" />
              Loyalty reward (10 stamps)
            </span>
            <span className="font-mono tabular-nums">-Free gel service</span>
          </div>
        )}

        <div className="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Reservation Downpayment</span>
          <span className="font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
            {redeemLoyaltyReward ? '₱0.00' : formatPrice(downpayment)}
          </span>
        </div>

        <div className="border-t border-rose-100 dark:border-rose-950/60 pt-2.5 flex justify-between items-baseline">
          <div>
            <p className="font-serif font-medium text-stone-900 dark:text-rose-50 text-sm">
              Balance due at atelier
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
              Payable upon session completion
            </p>
          </div>
          <span className="text-base font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
            {redeemLoyaltyReward ? '₱0.00' : formatPrice(remainingBalance)}
          </span>
        </div>
      </div>

      {/* Salon Guarantee Notice */}
      <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/30 p-3.5 text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed border border-rose-200/60 dark:border-rose-900/40">
        Slots are held for 15 minutes past appointment time. Fresh, hospital-grade autoclave sterilized implements are prepared for each private 1-on-1 session.
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
          <div key={i} className="h-28 bg-rose-100/50 dark:bg-stone-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block">
          Step 01
        </span>
        <h2 className="text-2xl font-serif font-normal text-stone-900 dark:text-rose-50">
          Select treatments
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal">
          Choose one or more salon treatments for your upcoming private session
        </p>
      </div>

      <div className="space-y-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServices.some((s) => s.serviceId === service.id)}
            selectedVariant={selectedServices.find((s) => s.serviceId === service.id)?.variantId}
            onSelect={(variantId) => {
              const existing = selectedServices.find((s) => s.serviceId === service.id);
              if (existing) {
                const updated = selectedServices.map((s) =>
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
              const updated = selectedServices.filter((s) => s.serviceId !== service.id);
              setSelectedServices(updated);
              form.setValue('services', updated);
            }}
          />
        ))}
      </div>

      {selectedServices.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-stone-900/30 text-stone-500 dark:text-stone-400">
          <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-rose-400 stroke-[1.5]" />
          <p className="text-xs sm:text-sm font-normal">Select at least one treatment to proceed to scheduling</p>
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={selectedServices.length === 0}
          className="h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm sm:text-base tracking-normal shadow-[0_4px_16px_rgba(76,5,25,0.2)] hover:shadow-[0_6px_24px_rgba(76,5,25,0.32)] border border-rose-800/80 transition-all duration-200 inline-flex items-center justify-center"
        >
          <span>Continue to Date & Timing</span>
        </button>
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
      className={`rounded-2xl border p-5 transition-all duration-200 ${
        isSelected
          ? 'border-rose-800/80 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20 shadow-xs'
          : 'border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/60 hover:border-rose-300 dark:hover:border-rose-800'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-serif font-medium text-base text-stone-900 dark:text-rose-50">
              {service.name}
            </h4>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 uppercase">
              {service.category.toLowerCase().replace(/_/g, ' ')}
            </span>
          </div>
          {service.description && (
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
              {service.description}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-base font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
            {formatPrice(service.basePrice)}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums flex items-center justify-end gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-rose-500 stroke-[1.5]" />
            {service.duration} mins
          </p>
        </div>
      </div>

      {/* Variants / Length tiers */}
      {service.variants.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-rose-100 dark:border-rose-950/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-800 dark:text-stone-200">
              Treatment Tier & Options
            </span>
            {isSelected && (
              <button
                type="button"
                onClick={onRemove}
                className="text-[11px] text-rose-700 dark:text-rose-400 hover:underline transition-colors font-medium"
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border ${
                    active
                      ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
                      : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 border-rose-200/80 dark:border-rose-950/60 hover:border-rose-300'
                  }`}
                >
                  <span className="mr-1.5">{getVariantLabel(variant.name)}</span>
                  <span className="font-serif font-semibold tabular-nums opacity-90">
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
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block">
          Step 02
        </span>
        <h2 className="text-2xl font-serif font-normal text-stone-900 dark:text-rose-50">
          Select date and timing
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal">
          Pick an appointment date and reserved 30-minute window for your session
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Date Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
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
            className="w-full h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-rose-800 focus:border-rose-800 font-mono tabular-nums shadow-xs"
          />
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
            Reservations are accepted up to 90 days in advance
          </p>
        </div>

        {/* Time Slot Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
            Available Appointment Windows
          </label>

          {isLoadingSlots ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-rose-100/50 dark:bg-stone-800 animate-pulse" />
              ))}
            </div>
          ) : !appointmentDate ? (
            <div className="p-8 rounded-2xl border border-dashed border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-stone-900/30 text-center text-xs text-stone-500 dark:text-stone-400">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-rose-400 stroke-[1.5]" />
              Select a date on the calendar to inspect open time slots
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-stone-900/30 text-center text-xs text-stone-500 dark:text-stone-400">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-rose-400 stroke-[1.5]" />
              No available slots for this date. Please select another date.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
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
                    className={`p-3 rounded-xl border text-left transition-all duration-150 font-mono tabular-nums text-xs ${
                      isSelected
                        ? 'border-rose-900 bg-rose-900 text-white font-medium shadow-xs'
                        : 'border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-rose-300'
                    }`}
                  >
                    <div className="font-medium">{formatTime(slot.startTime)}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-rose-200' : 'text-stone-400 dark:text-stone-500'}`}>
                      ends {formatTime(slot.endTime)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-12 sm:h-14 px-6 sm:px-8 rounded-full border border-rose-300/80 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-300 font-medium text-sm transition-colors inline-flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!appointmentDate || !startTime}
          className="h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm sm:text-base tracking-normal shadow-[0_4px_16px_rgba(76,5,25,0.2)] hover:shadow-[0_6px_24px_rgba(76,5,25,0.32)] border border-rose-800/80 transition-all duration-200 inline-flex items-center justify-center"
        >
          <span>Continue to Client Record</span>
        </button>
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
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block">
          Step 03
        </span>
        <h2 className="text-2xl font-serif font-normal text-stone-900 dark:text-rose-50">
          Client record & consultation details
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal">
          Provide your contact details and any custom nail art preferences for Atasha
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
            Full Name <span className="text-rose-700">*</span>
          </label>
          <input
            type="text"
            {...form.register('name')}
            placeholder="e.g. Maria Santos"
            className="w-full h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-rose-800 focus:border-rose-800 shadow-xs"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-rose-700 dark:text-rose-400">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
            Mobile Number (GCash / Maya contact) <span className="text-rose-700">*</span>
          </label>
          <input
            type="tel"
            {...form.register('phone')}
            placeholder="e.g. 0917 123 4567"
            className="w-full h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-800 focus:border-rose-800 shadow-xs"
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-rose-700 dark:text-rose-400">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
            Consultation Notes & Preferences <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <textarea
            {...form.register('notes')}
            rows={3}
            placeholder="Share details about current nail condition, previous gel sets, sensitivities, or shape preferences..."
            className="w-full p-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-rose-800 focus:border-rose-800 shadow-xs resize-none"
          />
        </div>

        {/* Inspiration Image URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
            Inspiration Reference URL <span className="text-stone-400 font-normal">(optional lookbook link)</span>
          </label>
          <input
            type="url"
            {...form.register('inspirationImg')}
            placeholder="https://..."
            className="w-full h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-rose-800 focus:border-rose-800 shadow-xs"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-12 sm:h-14 px-6 sm:px-8 rounded-full border border-rose-300/80 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-300 font-medium text-sm transition-colors inline-flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base tracking-normal shadow-[0_4px_16px_rgba(76,5,25,0.2)] hover:shadow-[0_6px_24px_rgba(76,5,25,0.32)] border border-rose-800/80 transition-all duration-200 inline-flex items-center justify-center"
        >
          <span>Continue to Deposit Review</span>
        </button>
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
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block">
          Step 04
        </span>
        <h2 className="text-2xl font-serif font-normal text-stone-900 dark:text-rose-50">
          Reservation downpayment & verification
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal">
          Submit your downpayment details to lock in your private atelier appointment slot
        </p>
      </div>

      {/* Loyalty Reward Voucher Card */}
      {hasRewardAvailable && (
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-rose-700 dark:text-rose-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-0.5">
              <h4 className="font-serif font-medium text-sm text-stone-900 dark:text-rose-50">
                Studio Loyalty Reward Available ({stampCount} stamps)
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-normal">
                You have earned 10 stamps on your digital loyalty card. Redeem a complimentary treatment on this visit.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-900 px-4 py-2 rounded-full border border-rose-200/80 dark:border-rose-950/60 shadow-xs self-start sm:self-auto">
            <input
              type="checkbox"
              checked={redeemLoyaltyReward}
              onChange={(e) => setRedeemLoyaltyReward(e.target.checked)}
              className="rounded-full border-rose-300 text-rose-900 focus:ring-rose-800 h-4 w-4"
            />
            <span>Redeem free service</span>
          </label>
        </div>
      )}

      {/* Downpayment Method Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
            Payment Method for Reservation Fee
          </label>
          <span className="font-serif font-semibold text-xs tabular-nums text-rose-950 dark:text-rose-200">
            Deposit: {formatPrice(downpayment)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* GCash */}
          <button
            type="button"
            onClick={() => setPaymentMethod('GCASH')}
            className={`rounded-2xl border p-4 text-left transition-all duration-150 ${
              paymentMethod === 'GCASH'
                ? 'border-rose-900 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30 ring-1 ring-rose-900/30'
                : 'border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif font-medium text-sm text-stone-900 dark:text-rose-50">
                GCash
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200/80">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-normal">
              Scan studio QR or transfer via mobile
            </p>
          </button>

          {/* Maya */}
          <button
            type="button"
            onClick={() => setPaymentMethod('MAYA')}
            className={`rounded-2xl border p-4 text-left transition-all duration-150 ${
              paymentMethod === 'MAYA'
                ? 'border-rose-900 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30 ring-1 ring-rose-900/30'
                : 'border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif font-medium text-sm text-stone-900 dark:text-rose-50">
                Maya
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200/80">
                QR Ph
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-normal">
              Scan Maya QR or transfer via mobile
            </p>
          </button>

          {/* Cash */}
          <button
            type="button"
            onClick={() => setPaymentMethod('CASH')}
            className={`rounded-2xl border p-4 text-left transition-all duration-150 ${
              paymentMethod === 'CASH'
                ? 'border-rose-900 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30 ring-1 ring-rose-900/30'
                : 'border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif font-medium text-sm text-stone-900 dark:text-rose-50 flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-rose-600 stroke-[1.5]" />
                Atelier Counter
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                In-person
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-normal">
              Pay at atelier counter within 24h
            </p>
          </button>
        </div>
      </div>

      {/* QR Code Presentation */}
      {(paymentMethod === 'GCASH' || paymentMethod === 'MAYA') && (
        <div className="space-y-5">
          <PaymentQRCode method={paymentMethod} amount={downpayment} />

          {/* Reference Number Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
              {paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} Reference Number <span className="text-rose-700">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <FileText className="h-4 w-4 stroke-[1.5]" />
              </div>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. 1002 9384 1928"
                className="w-full pl-10 pr-4 h-12 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-800 focus:border-rose-800 shadow-xs"
                required
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
              Enter the transaction reference number from your GCash or Maya confirmation SMS or receipt
            </p>
          </div>

          {/* Receipt Screenshot Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-800 dark:text-stone-200">
              Payment Receipt Screenshot <span className="text-stone-400 font-normal">(optional attachment)</span>
            </label>
            {!receiptPreview ? (
              <label className="rounded-2xl border border-dashed border-rose-300 dark:border-rose-900 hover:border-rose-400 p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/60 dark:bg-stone-900/40">
                <Upload className="h-5 w-5 text-rose-500 mb-1.5 stroke-[1.5]" />
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                  Upload transaction receipt screenshot
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
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900">
                <img
                  src={receiptPreview}
                  alt="Payment receipt preview"
                  className="h-14 w-14 object-cover rounded-xl border border-rose-200/80 dark:border-rose-900"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                    {receiptFile?.name || 'receipt-attachment.jpg'}
                  </p>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1 mt-0.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rose-600 stroke-[1.5]" />
                    Receipt attached for manual verification by Atasha
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
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
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-rose-50/40 dark:bg-stone-900/50 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-stone-900 dark:text-rose-50 font-medium text-xs">
            <AlertCircle className="h-4 w-4 stroke-[1.5] text-rose-600" />
            <span>Atelier In-Person Cash Downpayment</span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Please visit Pretty Nails by Atasha · Cebu City within 24 hours of booking to settle the ₱100.00 reservation downpayment. Unconfirmed slots without downpayment may be released to waitlisted clients.
          </p>
        </div>
      )}

      {/* Confirmation Agreement */}
      <div className="space-y-5 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...form.register('confirmed')}
            className="mt-1 h-4 w-4 rounded-md border-rose-300 text-rose-900 focus:ring-rose-800"
            required
          />
          <span className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            I confirm my appointment details and agree that a reservation downpayment of {formatPrice(downpayment)} secures this private session, subject to manual review and confirmation by Atasha.
          </span>
        </label>

        <div className="flex justify-between items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full border border-rose-300/80 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-300 font-medium text-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm sm:text-base tracking-normal shadow-[0_4px_16px_rgba(76,5,25,0.2)] hover:shadow-[0_6px_24px_rgba(76,5,25,0.32)] border border-rose-800/80 transition-all duration-200 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin stroke-[1.5]" />
                Submitting reservation...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[2]" />
                <span>Submit Reservation</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;
