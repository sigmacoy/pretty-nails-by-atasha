'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { BookingRequest, BookingDto, ServiceDto } from '@/types';
import { bookingsApi, servicesApi, availabilityApi } from '@/lib/api';
import { toast } from 'sonner';
import { calculateEndTime } from '@/lib/utils';

interface BookingState {
  services: { serviceId: string; variantId?: string; quantity: number }[];
  appointmentDate: string;
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  notes: string;
  inspirationImg: string;
  step: number;
  availableSlots: { startTime: string; endTime: string; available: boolean }[];
  selectedServiceDetails: ServiceDto[];
  paymentMethod: 'CASH' | 'GCASH' | 'MAYA';
  paymentReference: string;
  redeemLoyaltyReward: boolean;
}

const initialState: BookingState = {
  services: [],
  appointmentDate: '',
  startTime: '',
  endTime: '',
  name: '',
  phone: '',
  notes: '',
  inspirationImg: '',
  step: 1,
  availableSlots: [],
  selectedServiceDetails: [],
  paymentMethod: 'GCASH',
  paymentReference: '',
  redeemLoyaltyReward: false,
};

export function useBooking() {
  const [state, setState] = useState<BookingState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allServices, setAllServices] = useState<ServiceDto[]>([]);

  // Fetch active services once on mount
  useEffect(() => {
    let cancelled = false;
    servicesApi.getActive()
      .then((response) => {
        if (!cancelled) {
          setAllServices(response.data);
        }
      })
      .catch((error) => {
        console.error('Failed to load services:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive selected service details from allServices (no network call)
  const selectedServiceDetails = useMemo(() => {
    return state.services
      .map((s) => allServices.find((svc) => svc.id === s.serviceId))
      .filter((svc): svc is ServiceDto => svc !== undefined);
  }, [state.services, allServices]);

  const setServices = useCallback((services: { serviceId: string; variantId?: string; quantity: number }[]) => {
    setState((prev) => ({ ...prev, services, step: Math.max(prev.step, 2) }));
  }, []);

  const setDateTime = useCallback((appointmentDate: string, startTime: string, endTime: string) => {
    setState((prev) => ({ ...prev, appointmentDate, startTime, endTime, step: Math.max(prev.step, 3) }));
  }, []);

  const setDetails = useCallback((details: Partial<Pick<BookingState, 'name' | 'phone' | 'notes' | 'inspirationImg'>>) => {
    setState((prev) => ({ ...prev, ...details, step: Math.max(prev.step, 4) }));
  }, []);

  const setAvailableSlots = useCallback((slots: { startTime: string; endTime: string; available: boolean }[]) => {
    setState((prev) => ({ ...prev, availableSlots: slots }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setPaymentMethod = useCallback((method: 'CASH' | 'GCASH' | 'MAYA') => {
    setState((prev) => ({ ...prev, paymentMethod: method }));
  }, []);

  const setPaymentReference = useCallback((reference: string) => {
    setState((prev) => ({ ...prev, paymentReference: reference }));
  }, []);

  const setRedeemLoyaltyReward = useCallback((redeem: boolean) => {
    setState((prev) => ({ ...prev, redeemLoyaltyReward: redeem }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const fetchAvailableSlots = useCallback(async (date: string, preferredStartTime?: string) => {
    setIsLoading(true);
    try {
      const response = await availabilityApi.getSlots(date);
      const slots = response.data.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: slot.available,
      }));
      setAvailableSlots(slots);

      if (slots.length > 0) {
        const targetSlot = slots.find((s) => s.startTime === preferredStartTime) || slots.find((s) => s.available) || slots[0];
        setState((prev) => ({ ...prev, startTime: targetSlot.startTime, endTime: targetSlot.endTime }));
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [setAvailableSlots]);

  const submitBooking = useCallback(async (): Promise<BookingDto | null> => {
    if (state.services.length === 0 || !state.appointmentDate || !state.startTime) {
      toast.error('Please select your nail treatment, date, and appointment slot.');
      return null;
    }

    const trimmedRef = state.paymentReference.trim();
    if (state.paymentMethod !== 'CASH' && !trimmedRef) {
      toast.error(`Please provide your ${state.paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} reference number after sending your reservation deposit.`);
      return null;
    }

    setIsSubmitting(true);
    try {
      const totalDuration = selectedServiceDetails.reduce((sum, s) => sum + s.duration * (state.services.find(ss => ss.serviceId === s.id)?.quantity || 1), 0);
      const totalPrice = selectedServiceDetails.reduce((sum, s) => {
        const selected = state.services.find((ss) => ss.serviceId === s.id);
        // Use variant price if variantId is provided, otherwise use basePrice (for variant-less services)
        const variant = selected?.variantId ? s.variants.find((v) => v.id === selected.variantId) : undefined;
        const price = variant?.price ?? s.basePrice;
        return sum + (price * (selected?.quantity ?? 1));
      }, 0);

      // Use server-defined downpayment from settings or default to ₱100
      const downpayment = 10000; // ₱100.00 in centavos

      // Map services preserving variantId positional alignment with serviceIds
      const services = state.services.map((s) => ({
        serviceId: s.serviceId,
        variantId: s.variantId,
        quantity: s.quantity || 1,
      }));
      const serviceIds = services.map((s) => s.serviceId);
      const variantIds = services.map((s) => s.variantId ?? '');

      const bookingData: BookingRequest = {
        serviceIds,
        variantIds,
        services,
        totalPrice,
        downpayment,
        appointmentDate: state.appointmentDate,
        startTime: state.startTime,
        endTime: state.endTime || undefined,
        notes: state.notes || undefined,
        inspirationImg: state.inspirationImg || undefined,
        inspirationImage: state.inspirationImg || undefined,
        paymentReference: state.paymentMethod === 'CASH' ? undefined : (trimmedRef || undefined),
        paymentMethod: state.paymentMethod,
        redeemLoyaltyReward: state.redeemLoyaltyReward || undefined,
      };

      const response = await bookingsApi.create(bookingData);
      toast.success('Reservation request submitted. Atasha will review your downpayment reference to confirm your slot.');
      reset();
      return response.data;
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Unable to submit reservation request. Please check your connection and retry.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [state, selectedServiceDetails, reset]);

  const computed = {
    totalPrice: selectedServiceDetails.reduce((sum, s) => {
      const selected = state.services.find((ss) => ss.serviceId === s.id);
      const variant = selected?.variantId ? s.variants.find((v) => v.id === selected.variantId) : undefined;
      const price = variant?.price ?? s.basePrice;
      return sum + (price * (selected?.quantity ?? 1));
    }, 0),
    totalDuration: selectedServiceDetails.reduce((sum, s) => sum + s.duration * (state.services.find(ss => ss.serviceId === s.id)?.quantity || 1), 0),
    downpayment: 10000,
    canProceedStep1: state.services.length > 0,
    canProceedStep2: !!state.appointmentDate && !!state.startTime,
    canProceedStep3: !!state.name && !!state.phone && state.name.length >= 2 && /^09\d{9}$/.test(state.phone.replace(/\s/g, '')),
    canProceedStep4: true,
  };

  return {
    state,
    isLoading,
    isSubmitting,
    setServices,
    setDateTime,
    setDetails,
    setAvailableSlots,
    setStep,
    setPaymentMethod,
    setPaymentReference,
    setRedeemLoyaltyReward,
    reset,
    fetchAvailableSlots,
    submitBooking,
    computed,
    selectedServiceDetails,
  };
}