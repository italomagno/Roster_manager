
import { Shift, ShiftBreak } from '../types';

/**
 * Calculates the difference in minutes between two ISO date strings.
 * Returns 0 if start or end is missing, or if end is before start.
 */
export const calculateMinutes = (startIso?: string, endIso?: string): number => {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};

/**
 * Calculates planned duration in minutes based on "HH:mm" strings.
 */
export const calculatePlannedMinutes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return Math.max(0, endMinutes - startMinutes);
};

/**
 * Calculates total break time in minutes for a specific shift.
 * Includes ongoing breaks (calculated up to 'now').
 */
export const calculateTotalBreakMinutes = (breaks: ShiftBreak[]): number => {
  const now = new Date().toISOString();
  return breaks.reduce((total, b) => {
    return total + calculateMinutes(b.breakIn, b.breakOut || now);
  }, 0);
};

/**
 * Calculates net worked minutes:
 * (CheckOut - CheckIn) - TotalBreaks
 * If still working (no checkout), calculates (Now - CheckIn) - Breaks
 */
export const calculateNetWorkedMinutes = (shift: Shift, breaks: ShiftBreak[]): number => {
  if (!shift.checkInTime) return 0;
  
  const endTime = shift.checkOutTime || new Date().toISOString();
  const grossMinutes = calculateMinutes(shift.checkInTime, endTime);
  const breakMinutes = calculateTotalBreakMinutes(breaks);
  
  return Math.max(0, grossMinutes - breakMinutes);
};

/**
 * Calculates estimated pay based on minutes worked and hourly rate.
 * Returns 0 if rate is undefined.
 */
export const calculateEstimatedPay = (minutes: number, hourlyRate?: number): number => {
  if (!hourlyRate) return 0;
  const hours = minutes / 60;
  return parseFloat((hours * hourlyRate).toFixed(2));
};

/**
 * Formats a duration in minutes to "1h 30m" or "45m"
 */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
