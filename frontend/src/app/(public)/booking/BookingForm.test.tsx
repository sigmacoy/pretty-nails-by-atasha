import '@testing-library/jest-dom';
import '@/jest.setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '@/app/(public)/booking/BookingForm';
import { availabilityApi, bookingsApi, paymentsApi, loyaltyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/useApi', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
jest.mock('@/lib/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation');
jest.mock('sonner');
// Mock react-hook-form's useForm to bypass validation
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useForm: () => ({
    register: () => ({}),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({})),
    trigger: jest.fn().mockResolvedValue(true),
    watch: jest.fn(),
    formState: { errors: {} },
  }),
  zodResolver: (schema: any) => schema,
}));

const { useQuery } = require('@/hooks/useApi');
const { servicesApi } = require('@/lib/api');
const mockAvailabilityApi = availabilityApi as jest.Mocked<typeof availabilityApi>;
const mockBookingsApi = bookingsApi as jest.Mocked<typeof bookingsApi>;
const mockPaymentsApi = paymentsApi as jest.Mocked<typeof paymentsApi>;
const mockLoyaltyApi = loyaltyApi as jest.Mocked<typeof loyaltyApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const mockAvailableSlots = [
  { startTime: '09:00', endTime: '09:30', available: true },
  { startTime: '09:30', endTime: '10:00', available: true },
  { startTime: '10:00', endTime: '10:30', available: false }, // Booked
  { startTime: '10:30', endTime: '11:00', available: true },
];

function createMockAvailabilityResponse(dateStr: string) {
  return {
    data: [
      {
        id: 'avail-1',
        date: `${dateStr}T00:00:00.000Z`,
        isAvailable: true,
        startTime: '09:00',
        endTime: '18:00',
        maxSlots: 4,
        note: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  };
}

describe('BookingForm - Slot Re-validation (Item 10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations to clear mockResolvedValueOnce queues
    mockAvailabilityApi.getAvailable.mockReset();
    mockAvailabilityApi.getSlots.mockReset();
    mockBookingsApi.create.mockReset();
    mockPaymentsApi.create.mockReset();
    mockLoyaltyApi.getCard.mockReset();
    servicesApi.getActive.mockReset();

    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user-123' } });
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockToast.success.mockImplementation(() => {});
    mockToast.error.mockImplementation(() => {});

    // Mock useQuery to return different data based on the query function
    useQuery.mockImplementation((queryFn: any) => {
      const queryStr = queryFn?.toString() || '';
      if (queryStr.includes('loyaltyApi.getCard')) {
        return { data: { data: { stampCount: 0 } } };
      }
      if (queryStr.includes('servicesApi.getActive')) {
        return { data: null, isLoading: false }; // Use fallback services
      }
      return { data: null, isLoading: false };
    });

    // Mock services API (fallback will be used)
    servicesApi.getActive.mockResolvedValue({ data: [] });
  });

  async function setupBookingForm(user: ReturnType<typeof userEvent.setup>) {
    const { container } = render(<BookingForm />);

    // Step 1: Select a service variant (Standard Care from Studio Dry Cuticle Prep & Hygiene Care)
    await user.click(screen.getByRole('button', { name: /Standard Care/i }));
    // Wait for form to be valid and button to be enabled
    await waitFor(() => {
      expect(screen.getByText('Continue to Date & Timing')).not.toBeDisabled();
    });
    await user.click(screen.getByText('Continue to Date & Timing'));

    // Wait for Step 2 to render - check for Step 2 heading
    await waitFor(() => {
      expect(screen.getByText('Select date and timing')).toBeInTheDocument();
    });

    // Step 2: Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Find date input by type (type="date" doesn't have accessible name)
    const dateInput = container.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    await user.click(screen.getByText('9:00 AM'));
    await user.click(screen.getByText('Continue to Client Record'));

    return { container, dateStr };
  }

  it('re-fetches availability when moving from Step 2 to Step 3', async () => {
    const user = userEvent.setup();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mockAvailabilityResponse = createMockAvailabilityResponse(dateStr);

    // Initial fetchAvailableSlots calls getAvailable once
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Re-validation calls getSlots once and getAvailable once
    mockAvailabilityApi.getSlots.mockResolvedValueOnce({ data: mockAvailableSlots });
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Full booking flow
    mockBookingsApi.create.mockResolvedValueOnce({ data: { id: 'booking-123', message: 'Success' } });
    mockPaymentsApi.create.mockResolvedValueOnce({ data: {} });
    mockLoyaltyApi.getCard.mockResolvedValueOnce({ data: { stampCount: 0 } });

    const { container } = await setupBookingForm(user);

    // Verify availability was re-fetched
    await waitFor(() => {
      expect(mockAvailabilityApi.getSlots).toHaveBeenCalledWith(dateStr);
      expect(mockAvailabilityApi.getAvailable).toHaveBeenCalledTimes(2); // initial + re-validation
    });

    // Should proceed to Step 3
    await waitFor(() => {
      expect(screen.getByText('Client record & consultation details')).toBeInTheDocument();
    });
  });

  it('shows error and stays on Step 2 when selected slot is no longer available', async () => {
    const user = userEvent.setup();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mockAvailabilityResponse = createMockAvailabilityResponse(dateStr);

    // Initial fetchAvailableSlots calls getAvailable once
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Re-validation calls getSlots once (returns slot as booked) and getAvailable once
    mockAvailabilityApi.getSlots.mockResolvedValueOnce({ data: [
      { startTime: '09:00', endTime: '09:30', available: false }, // Now booked!
      { startTime: '09:30', endTime: '10:00', available: true },
      { startTime: '10:00', endTime: '10:30', available: false },
      { startTime: '10:30', endTime: '11:00', available: true },
    ]});
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);

    await setupBookingForm(user);

    // Should show error toast and stay on Step 2
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'This time slot has just been booked. Please choose another time.'
      );
    });

    // Should still be on Step 2
    await waitFor(() => {
      expect(screen.getByText('Select date and timing')).toBeInTheDocument();
    });
  });

  it('shows error and stays on Step 2 when selected slot no longer exists', async () => {
    const user = userEvent.setup();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mockAvailabilityResponse = createMockAvailabilityResponse(dateStr);

    // Initial fetchAvailableSlots calls getAvailable once
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Re-validation calls getSlots once (returns no slots) and getAvailable once
    mockAvailabilityApi.getSlots.mockResolvedValueOnce({ data: [] });
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);

    await setupBookingForm(user);

    // Should show error toast
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'This time slot is no longer available. Please select another time.'
      );
    });

    // Should still be on Step 2
    await waitFor(() => {
      expect(screen.getByText('Select date and timing')).toBeInTheDocument();
    });
  });

  it('shows error when date becomes unavailable (blackout/holiday)', async () => {
    const user = userEvent.setup();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mockAvailabilityResponse = createMockAvailabilityResponse(dateStr);

    // Initial fetchAvailableSlots calls getAvailable once
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Re-validation calls getSlots once and getAvailable once (returns empty = date unavailable)
    mockAvailabilityApi.getSlots.mockResolvedValueOnce({ data: mockAvailableSlots });
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce({ data: [] });

    await setupBookingForm(user);

    // Should show error toast
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'This date is no longer available for booking. Please select another date.'
      );
    });
  });

  it('proceeds to Step 3 when slot is still available', async () => {
    const user = userEvent.setup();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mockAvailabilityResponse = createMockAvailabilityResponse(dateStr);

    // Initial fetchAvailableSlots calls getAvailable once
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Re-validation calls getSlots once and getAvailable once
    mockAvailabilityApi.getSlots.mockResolvedValueOnce({ data: mockAvailableSlots });
    mockAvailabilityApi.getAvailable.mockResolvedValueOnce(mockAvailabilityResponse);
    // Full booking flow
    mockBookingsApi.create.mockResolvedValueOnce({ data: { id: 'booking-123', message: 'Success' } });
    mockPaymentsApi.create.mockResolvedValueOnce({ data: {} });
    mockLoyaltyApi.getCard.mockResolvedValueOnce({ data: { stampCount: 0 } });

    await setupBookingForm(user);

    // Should proceed to Step 3
    await waitFor(() => {
      expect(screen.getByText('Client record & consultation details')).toBeInTheDocument();
    });
  });
});