import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateInput?: string | Date | null, formatStr = 'MMM dd, yyyy'): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return isValid(d) ? format(d, formatStr) : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  return timeStr;
}

export function formatDuration(minutes?: number | null): string {
  if (!minutes && minutes !== 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function formatSeconds(seconds?: number | null): string {
  if (!seconds) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatScoreDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

export function getSeverityColor(severity: string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'text-red-400 bg-red-950/60 border-red-800';
    case 'HIGH':
      return 'text-amber-400 bg-amber-950/60 border-amber-800';
    case 'MEDIUM':
      return 'text-blue-400 bg-blue-950/60 border-blue-800';
    case 'LOW':
    default:
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  }
}
