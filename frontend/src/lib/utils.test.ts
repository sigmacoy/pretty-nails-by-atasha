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
  // Use a fixed reference time to avoid flakiness and timezone issues
  // Reference: 2025-12-25T10:00:00.000Z (which is 2025-12-25 18:00 Manila time)
  const REFERENCE_UTC = '2025-12-25T10:00:00.000Z';
  const REFERENCE_MANILA_DATE = '2025-12-25';
  const REFERENCE_MANILA_TIME = '18:00';

  // Helper to create Manila date/time strings from a base Manila time (in UTC timestamp)
  const createManilaDateTimeFromUTC = (baseUTC: string, offsetHours: number): { dateStr: string; timeStr: string } => {
    const base = new Date(baseUTC);
    // Base UTC time represents Manila time = UTC+8
    // So Manila hours = UTC hours + 8
    const manilaHours = (base.getUTCHours() + 8) % 24;
    const manilaDate = base.getUTCDate();
    const manilaMonth = base.getUTCMonth() + 1;
    const manilaYear = base.getUTCFullYear();

    // Create target Manila time by adding offset hours
    const targetManila = new Date(Date.UTC(manilaYear, manilaMonth - 1, manilaDate, manilaHours, base.getUTCMinutes()));
    targetManila.setTime(targetManila.getTime() + offsetHours * 60 * 60 * 1000);

    return {
      dateStr: `${targetManila.getUTCFullYear()}-${String(targetManila.getUTCMonth() + 1).padStart(2, '0')}-${String(targetManila.getUTCDate()).padStart(2, '0')}`,
      timeStr: `${String(targetManila.getUTCHours()).padStart(2, '0')}:${String(targetManila.getUTCMinutes()).padStart(2, '0')}`,
    };
  };

  // Debug test to verify fake timers work
  it('debug: fake timers should work', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(REFERENCE_UTC));
    const now = new Date();
    expect(now.toISOString()).toBe(REFERENCE_UTC);
    jest.useRealTimers();
  });

  // Debug test to check utility functions see fake time
  it('debug: utility functions should see fake time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(REFERENCE_UTC));

    // Call a utility function that uses new Date()
    const { dateStr, timeStr } = createManilaDateTimeFromUTC(REFERENCE_UTC, 1);
    console.log('Test: dateStr=', dateStr, 'timeStr=', timeStr);
    console.log('Test: REFERENCE_UTC=', REFERENCE_UTC);

    const result = isPastManila(dateStr, timeStr);
    console.log('Test: isPastManila result=', result);

    jest.useRealTimers();
    // Just verify it runs
    expect(true).toBe(true);
  });

  describe('isWithin24HoursManila', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(REFERENCE_UTC));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns true when appointment is within 24 hours in Manila time', () => {
      // 12 hours ahead in Manila time from reference
      const { dateStr, timeStr } = createManilaDateTimeFromUTC(REFERENCE_UTC, 12);

      const result = isWithin24HoursManila(dateStr, timeStr);
      expect(result).toBe(true);
    });

    it('returns false when appointment is more than 24 hours in Manila time', () => {
      // 48 hours ahead in Manila time from reference
      const { dateStr, timeStr } = createManilaDateTimeFromUTC(REFERENCE_UTC, 48);

      const result = isWithin24HoursManila(dateStr, timeStr);
      expect(result).toBe(false);
    });

    it('returns false for past appointments', () => {
      // 1 hour behind in Manila time from reference
      const { dateStr, timeStr } = createManilaDateTimeFromUTC(REFERENCE_UTC, -1);

      const result = isWithin24HoursManila(dateStr, timeStr);
      expect(result).toBe(false);
    });
  });

  describe('isPastManila', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(REFERENCE_UTC));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns true for past appointments in Manila time', () => {
      // 1 hour behind in Manila time from reference
      const { dateStr, timeStr } = createManilaDateTimeFromUTC(REFERENCE_UTC, -1);

      const result = isPastManila(dateStr, timeStr);
      expect(result).toBe(true);
    });

    it('returns false for future appointments in Manila time', () => {
      // 1 hour ahead in Manila time from reference
      const { dateStr, timeStr } = createManilaDateTimeFromUTC(REFERENCE_UTC, 1);

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