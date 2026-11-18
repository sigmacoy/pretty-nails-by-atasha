import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '@/app/(public)/booking/BookingForm';
import { availabilityApi, bookingsApi, paymentsApi, loyaltyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/useApi');
jest.mock('@/lib/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation');
jest.mock('sonner');

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

describe('BookingForm - Slot Re-validation (Item 10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user-123' } });
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockToast.success.mockImplementation(() => {});
    mockToast.error.mockImplementation(() => {});

    // Mock services API
    const { servicesApi } = require('@/lib/api');
    servicesApi.getActive.mockResolvedValue({ data: [] });
  });

  const mockAvailableSlots = [
    { startTime: '09:00', endTime: '09:30', available: true },
    { startTime: '09:30', endTime: '10:00', available: true },
    { startTime: '10:00', endTime: '10:30', available: false }, // Booked
    { startTime: '10:30', endTime: '11:00', available: true },
  ];

  const mockAvailabilityResponse = {
    data: [
      {
        id: 'avail-1',
        date: '2025-12-25T00:00:00.000Z',
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

  it('re-fetches availability when moving from Step 2 to Step 3', async () => {
    const user = userEvent.setup();

    mockAvailabilityApi.getSlots.mockResolvedValue({ data: mockAvailableSlots });
    mockAvailabilityApi.getAvailable.mockResolvedValue(mockAvailabilityResponse);
    mockBookingsApi.create.mockResolvedValue({ data: { id: 'booking-123', message: 'Success' } });
    mockPaymentsApi.create.mockResolvedValue({ data: {} });
    mockLoyaltyApi.getCard.mockResolvedValue({ data: { stampCount: 0 } });

    render(<BookingForm />);

    // Step 1: Select a service
    await user.click(screen.getByText('Studio Dry Cuticle Prep & Hygiene Care'));
    await user.click(screen.getByText('Continue to Date & Timing'));

    // Step 2: Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText('Appointment Date'), { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    await user.click(screen.getByText('09:00'));
    await user.click(screen.getByText('Continue to Client Record'));

    // Verify availability was re-fetched
    await waitFor(() => {
      expect(mockAvailabilityApi.getSlots).toHaveBeenCalledWith(dateStr);
      expect(mockAvailabilityApi.getAvailable).toHaveBeenCalled();
    });

    // Should proceed to Step 3
    await waitFor(() => {
      expect(screen.getByText('Client record & consultation details')).toBeInTheDocument();
    });
  });

  it('shows error and stays on Step 2 when selected slot is no longer available', async () => {
    const user = userEvent.setup();

    // First call returns slot as available
    mockAvailabilityApi.getSlots
      .mockResolvedValueOnce({ data: mockAvailableSlots }) // Initial fetch
      .mockResolvedValueOnce({ data: [
        { startTime: '09:00', endTime: '09:30', available: false }, // Now booked!
        { startTime: '09:30', endTime: '10:00', available: true },
        { startTime: '10:00', endTime: '10:30', available: false },
        { startTime: '10:30', endTime: '11:00', available: true },
      ]}); // Re-validation fetch

    mockAvailabilityApi.getAvailable.mockResolvedValue(mockAvailabilityResponse);

    render(<BookingForm />);

    // Step 1
    await user.click(screen.getByText('Studio Dry Cuticle Prep & Hygiene Care'));
    await user.click(screen.getByText('Continue to Date & Timing'));

    // Step 2
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText('Appointment Date'), { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    await user.click(screen.getByText('09:00'));
    await user.click(screen.getByText('Continue to Client Record'));

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

    // Re-validation returns different slots (date may be fully booked)
    mockAvailabilityApi.getSlots
      .mockResolvedValueOnce({ data: mockAvailableSlots })
      .mockResolvedValueOnce({ data: [] }); // No slots available!

    mockAvailabilityApi.getAvailable.mockResolvedValue({ data: [] }); // Date not available

    render(<BookingForm />);

    // Step 1
    await user.click(screen.getByText('Studio Dry Cuticle Prep & Hygiene Care'));
    await user.click(screen.getByText('Continue to Date & Timing'));

    // Step 2
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText('Appointment Date'), { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    await user.click(screen.getByText('09:00'));
    await user.click(screen.getByText('Continue to Client Record'));

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

    mockAvailabilityApi.getSlots
      .mockResolvedValueOnce({ data: mockAvailableSlots })
      .mockResolvedValueOnce({ data: mockAvailableSlots });

    // Date no longer available
    mockAvailabilityApi.getAvailable.mockResolvedValue({ data: [] });

    render(<BookingForm />);

    // Step 1
    await user.click(screen.getByText('Studio Dry Cuticle Prep & Hygiene Care'));
    await user.click(screen.getByText('Continue to Date & Timing'));

    // Step 2
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText('Appointment Date'), { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    await user.click(screen.getByText('09:00'));
    await user.click(screen.getByText('Continue to Client Record'));

    // Should show error toast
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'This date is no longer available for booking. Please select another date.'
      );
    });
  });

  it('proceeds to Step 3 when slot is still available', async () => {
    const user = userEvent.setup();

    mockAvailabilityApi.getSlots.mockResolvedValue({ data: mockAvailableSlots });
    mockAvailabilityApi.getAvailable.mockResolvedValue(mockAvailabilityResponse);
    mockBookingsApi.create.mockResolvedValue({ data: { id: 'booking-123', message: 'Success' } });
    mockPaymentsApi.create.mockResolvedValue({ data: {} });
    mockLoyaltyApi.getCard.mockResolvedValue({ data: { stampCount: 0 } });

    render(<BookingForm />);

    // Step 1
    await user.click(screen.getByText('Studio Dry Cuticle Prep & Hygiene Care'));
    await user.click(screen.getByText('Continue to Date & Timing'));

    // Step 2
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText('Appointment Date'), { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    await user.click(screen.getByText('09:00'));
    await user.click(screen.getByText('Continue to Client Record'));

    // Should proceed to Step 3
    await waitFor(() => {
      expect(screen.getByText('Client record & consultation details')).toBeInTheDocument();
    });
  });
});