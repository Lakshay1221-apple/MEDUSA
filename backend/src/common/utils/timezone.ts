/**
 * Computes the local date (YYYY-MM-DD) for a given UTC Date and IANA timezone name.
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // outputs YYYY-MM-DD
  } catch (error) {
    // Fallback to UTC if invalid timezone
    return date.toISOString().split('T')[0];
  }
}

/**
 * Returns today's date (YYYY-MM-DD) for the given user timezone.
 */
export function getTodayInTimezone(timezone: string = 'UTC'): string {
  return getLocalDateString(new Date(), timezone);
}

/**
 * Adds days to a YYYY-MM-DD date string and returns new YYYY-MM-DD string.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Generates an inclusive array of date strings (YYYY-MM-DD) between start and end.
 */
export function getDateRangeArray(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  while (current <= endDateStr) {
    dates.push(current);
    current = addDaysToDateString(current, 1);
  }
  return dates;
}

/**
 * Gets day of week abbreviation (MON, TUE, WED, THU, FRI, SAT, SUN) in UTC.
 */
export function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[date.getUTCDay()];
}
