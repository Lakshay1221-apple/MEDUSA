import { describe, it, expect } from 'vitest';
import { formatDuration, formatSeconds, formatScoreDelta, getSeverityColor } from '@/lib/utils/formatters';

describe('Formatters Utility', () => {
  it('formats durations properly', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(null)).toBe('0m');
  });

  it('formats seconds to HH:mm:ss', () => {
    expect(formatSeconds(0)).toBe('00:00:00');
    expect(formatSeconds(65)).toBe('00:01:05');
    expect(formatSeconds(3665)).toBe('01:01:05');
    expect(formatSeconds(null)).toBe('00:00:00');
  });

  it('formats score deltas with signs', () => {
    expect(formatScoreDelta(50)).toBe('+50');
    expect(formatScoreDelta(-15)).toBe('-15');
    expect(formatScoreDelta(0)).toBe('0');
  });

  it('returns appropriate severity badge styles', () => {
    expect(getSeverityColor('CRITICAL')).toContain('text-red-400');
    expect(getSeverityColor('HIGH')).toContain('text-amber-400');
    expect(getSeverityColor('MEDIUM')).toContain('text-blue-400');
    expect(getSeverityColor('LOW')).toContain('text-emerald-400');
  });
});
