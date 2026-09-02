import {
  getLocalDateString,
  getTodayInTimezone,
  addDaysToDateString,
  getDateRangeArray,
  getDayOfWeek,
} from './timezone';

describe('TimezoneUtils', () => {
  it('should calculate correct date string across timezone boundaries for the same instant', () => {
    // 2026-09-02 01:00:00 UTC
    const utcDate = new Date('2026-09-02T01:00:00.000Z');

    const inUTC = getLocalDateString(utcDate, 'UTC');
    const inTokyo = getLocalDateString(utcDate, 'Asia/Tokyo'); // UTC+9 -> 2026-09-02 10:00
    const inLA = getLocalDateString(utcDate, 'America/Los_Angeles'); // UTC-7 -> 2026-09-01 18:00
    const inAuckland = getLocalDateString(utcDate, 'Pacific/Auckland'); // UTC+12/+13

    expect(inUTC).toBe('2026-09-02');
    expect(inTokyo).toBe('2026-09-02');
    expect(inLA).toBe('2026-09-01');
    expect(inAuckland).toBe('2026-09-02');
  });

  it('should add days correctly to YYYY-MM-DD string', () => {
    expect(addDaysToDateString('2026-09-01', 1)).toBe('2026-09-02');
    expect(addDaysToDateString('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('should generate inclusive date range array', () => {
    const range = getDateRangeArray('2026-09-01', '2026-09-04');
    expect(range).toEqual([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
    ]);
  });

  it('should get correct day of week abbreviation', () => {
    // 2026-09-01 is Tuesday, 2026-09-05 is Saturday, 2026-09-06 is Sunday
    expect(getDayOfWeek('2026-09-01')).toBe('TUE');
    expect(getDayOfWeek('2026-09-05')).toBe('SAT');
    expect(getDayOfWeek('2026-09-06')).toBe('SUN');
  });
});
