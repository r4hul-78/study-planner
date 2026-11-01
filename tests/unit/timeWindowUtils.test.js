import { describe, it, expect } from 'vitest';
import {
  daysBetween,
  addDays,
  timeToMinutes,
  minutesToTime,
  formatDuration,
  getMonthMatrix
} from '../../src/js/utils/dateUtils.js';

describe('Date & Time Utilities', () => {
  it('correctly calculates days between dates without UTC offset drift', () => {
    expect(daysBetween('2026-10-17', '2026-10-20')).toBe(3);
    expect(daysBetween('2026-10-20', '2026-10-17')).toBe(-3);
    expect(daysBetween('2026-10-17', '2026-10-17')).toBe(0);
  });

  it('correctly adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-30', 2)).toBe('2027-01-01');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('converts time strings to minutes and back accurately', () => {
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('18:30')).toBe(1110);
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(1110)).toBe('18:30');
  });

  it('formats duration into readable human text', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('generates a complete 7-column calendar matrix for a month', () => {
    const matrix = getMonthMatrix(2026, 9); // October 2026 (0-indexed month 9)
    expect(matrix.length).toBeGreaterThanOrEqual(4);
    for (const week of matrix) {
      expect(week.length).toBe(7);
    }
  });
});
