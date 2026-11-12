'use client';

import { useState, useCallback, useEffect } from 'react';
import type { BookingRequest, BookingDto, ServiceDto } from '@/types';
import { bookingsApi, servicesApi, availabilityApi } from '@/lib/api';
import { toast } from 'sonner';

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
  availableSlots: { startTime: string; endTime: string }[];
  selectedServiceDetails: ServiceDto[];
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
};

export function useBooking() {
  const [state, setState] = useState<BookingState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load service details when services change
  useEffect(() => {
    if (state.services.length > 0) {
      loadServiceDetails();
    } else {
      setState(prev => ({ ...prev, selectedServiceDetails: [] }));
    }
  }, [state.services]);

  const loadServiceDetails = async () => {
    try {
      const response = await servicesApi.getActive();
      const allServices = response.data;
      const details = state.services
        .map(s => allServices.find(svc => svc.id === s.serviceId))
        .filter((svc): svc is ServiceDto => svc !== undefined);
      setState(prev => ({ ...prev, selectedServiceDetails: details }));
    } catch (error) {
      console.error('Failed to load service details:', error);
    }
  };

  const setServices = useCallback((services: { serviceId: string; variantId?: string; quantity: number }[]) => {
    setState(prev => ({ ...prev, services, step: Math.max(prev.step, 2) }));
  }, []);

  const setDateTime = useCallback((appointmentDate: string, startTime: string, endTime: string) => {
    setState(prev => ({ ...prev, appointmentDate, startTime, endTime, step: Math.max(prev.step, 3) }));
  }, []);

  const setDetails = useCallback((details: Partial<Pick<BookingState, 'name' | 'phone' | 'notes' | 'inspirationImg'>>) => {
    setState(prev => ({ ...prev, ...details, step: Math.max(prev.step, 4) }));
  }, []);

  const setAvailableSlots = useCallback((slots: { startTime: string; endTime: string }[]) => {
    setState(prev => ({ ...prev, availableSlots: slots }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const fetchAvailableSlots = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const response = await availabilityApi.getAvailable();
      const dayAvailability = response.data.find(a => a.date === date && a.isAvailable);
      if (dayAvailability) {
        const slots: { startTime: string; endTime: string }[] = [];
        const start = dayAvailability.startTime;
        const end = dayAvailability.endTime;
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

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
      setIsLoading(false);
    }
  }, [setAvailableSlots]);

  const submitBooking = useCallback(async (): Promise<BookingDto | null> => {
    if (state.services.length === 0 || !state.appointmentDate || !state.startTime) {
      toast.error('Please complete all required steps');
      return null;
    }

    setIsSubmitting(true);
    try {
      const totalDuration = state.selectedServiceDetails.reduce((sum, s) => sum + s.duration, 0);
      const totalPrice = state.selectedServiceDetails.reduce((sum, s) => sum + s.basePrice, 0);

      const bookingData: BookingRequest = {
        serviceIds: state.services.map(s => s.serviceId),
        variantIds: state.services.map(s => s.variantId).filter(Boolean) as string[],
        appointmentDate: state.appointmentDate,
        startTime: state.startTime,
        notes: state.notes || undefined,
        inspirationImg: state.inspirationImg || undefined,
      };

      const response = await bookingsApi.create(bookingData);
      toast.success('Booking confirmed!');
      reset();
      return response.data;
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Failed to create booking. Please try again.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [state, reset]);

  const computed = {
    totalPrice: state.selectedServiceDetails.reduce((sum, s) => sum + s.basePrice, 0),
    totalDuration: state.selectedServiceDetails.reduce((sum, s) => sum + s.duration, 0),
    downpayment: 10000, // ₱100 in centavos
    canProceedStep1: state.services.length > 0,
    canProceedStep2: !!state.appointmentDate && !!state.startTime,
    canProceedStep3: !!state.name && !!state.phone,
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
    reset,
    fetchAvailableSlots,
    submitBooking,
    computed,
  };
}