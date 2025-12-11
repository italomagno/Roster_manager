export function getWeekDates(offset: number = 0): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek + offset * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function calculateDuration(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  let hours = end.hours - start.hours;
  let minutes = end.minutes - start.minutes;

  if (minutes < 0) {
    hours--;
    minutes += 60;
  }

  return hours + minutes / 60;
}

export function calculateBreakDuration(breakIn: string, breakOut?: string): number {
  if (!breakOut) return 0;

  const start = new Date(breakIn);
  const end = new Date(breakOut);
  const diff = end.getTime() - start.getTime();

  return diff / (1000 * 60 * 60);
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
