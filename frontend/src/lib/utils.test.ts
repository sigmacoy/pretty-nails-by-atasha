import '@testing-library/jest-dom';
import '@/jest.setup';
import {
  isWithin24HoursManila,
  isPastManila,
  formatPrice,
  formatDate,
  formatTime,
  formatDateShort,
} from '@/lib/utils';

describe('Timezone utilities (Manila timezone)', () => {
  describe('isWithin24HoursManila', () => {
    it('returns true when appointment is within 24 hours in Manila time', () => {
      // Create a date that's definitely within 24 hours from now in Manila
      const manilaNow = new Date();
      // Add 8 hours to get Manila time (UTC+8)
      const manilaOffset = 8 * 60 * 60 * 1000;
      const manilaTime = new Date(manilaNow.getTime() + manilaOffset + manilaNow.getTimezoneOffset() * 60000);

      const futureManila = new Date(manilaTime.getTime() + 12 * 60 * 60 * 1000); // 12 hours ahead

      const dateStr = futureManila.toISOString().split('T')[0];
      const timeStr = futureManila.toTimeString().slice(0, 5);

      const result = isWithin24HoursManila(dateStr, timeStr);
      expect(result).toBe(true);
    });

    it('returns false when appointment is more than 24 hours in Manila time', () => {
      const manilaNow = new Date();
      const manilaOffset = 8 * 60 * 60 * 1000;
      const manilaTime = new Date(manilaNow.getTime() + manilaOffset + manilaNow.getTimezoneOffset() * 60000);

      const futureManila = new Date(manilaTime.getTime() + 48 * 60 * 60 * 1000); // 48 hours ahead

      const dateStr = futureManila.toISOString().split('T')[0];
      const timeStr = futureManila.toTimeString().slice(0, 5);

      const result = isWithin24HoursManila(dateStr, timeStr);
      expect(result).toBe(false);
    });

    it('returns false for past appointments', () => {
      const manilaNow = new Date();
      const manilaOffset = 8 * 60 * 60 * 1000;
      const manilaTime = new Date(manilaNow.getTime() + manilaOffset + manilaNow.getTimezoneOffset() * 60000);

      const pastManila = new Date(manilaTime.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      const dateStr = pastManila.toISOString().split('T')[0];
      const timeStr = pastManila.toTimeString().slice(0, 5);

      const result = isWithin24HoursManila(dateStr, timeStr);
      expect(result).toBe(false);
    });
  });

  describe('isPastManila', () => {
    it('returns true for past appointments in Manila time', () => {
      const manilaNow = new Date();
      const manilaOffset = 8 * 60 * 60 * 1000;
      const manilaTime = new Date(manilaNow.getTime() + manilaOffset + manilaNow.getTimezoneOffset() * 60000);

      const pastManila = new Date(manilaTime.getTime() - 1 * 60 * 60 * 1000);

      const dateStr = pastManila.toISOString().split('T')[0];
      const timeStr = pastManila.toTimeString().slice(0, 5);

      const result = isPastManila(dateStr, timeStr);
      expect(result).toBe(true);
    });

    it('returns false for future appointments in Manila time', () => {
      const manilaNow = new Date();
      const manilaOffset = 8 * 60 * 60 * 1000;
      const manilaTime = new Date(manilaNow.getTime() + manilaOffset + manilaNow.getTimezoneOffset() * 60000);

      const futureManila = new Date(manilaTime.getTime() + 1 * 60 * 60 * 1000);

      const dateStr = futureManila.toISOString().split('T')[0];
      const timeStr = futureManila.toTimeString().slice(0, 5);

      const result = isPastManila(dateStr, timeStr);
      expect(result).toBe(false);
    });
  });
});

describe('Formatting utilities', () => {
  describe('formatPrice', () => {
    it('formats centavos to Philippine Peso', () => {
      expect(formatPrice(10000)).toBe('₱100.00');
      expect(formatPrice(50000)).toBe('₱500.00');
      expect(formatPrice(12345)).toBe('₱123.45');
      expect(formatPrice(0)).toBe('₱0.00');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string to Philippine locale', () => {
      const result = formatDate('2025-12-25T00:00:00.000Z');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2025');
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid date');
    });
  });

  describe('formatDateShort', () => {
    it('formats ISO date string to short format', () => {
      const result = formatDateShort('2025-12-25T00:00:00.000Z');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2025');
    });
  });

  describe('formatTime', () => {
    it('formats 24-hour time to 12-hour with AM/PM', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('13:30')).toBe('1:30 PM');
      expect(formatTime('23:59')).toBe('11:59 PM');
      expect(formatTime('00:00')).toBe('12:00 AM');
    });
  });
});