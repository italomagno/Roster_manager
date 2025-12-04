
export enum CompanyRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: CompanyRole;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  companyId: string;
  name: string;
  color: string; // Hex code e.g. #F97316
}

export interface Employee {
  id: string;
  companyId: string;
  userId?: string;
  fullName: string;
  role: string; // Legacy text fallback (comma separated names)
  positionIds: string[]; // Link to Position(s)
  weeklyHours: number;
  isActive: boolean;
  location?: string;
  // Feature: Time Constraints
  allowedStartTime?: string; // "09:00"
  allowedEndTime?: string;   // "17:00"
  // Feature: Payroll
  hourlyRate?: number; // e.g. 15.50
}

export interface Availability {
  id: string;
  employeeId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ShiftBreak {
  id: string;
  companyId: string;
  shiftId: string;
  employeeId: string;
  breakIn: string;   // ISO datetime string
  breakOut?: string; // ISO datetime string or undefined while ongoing
}

export interface Shift {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  startTime: string;
  endTime: string;
  role?: string; // Optional legacy text override
  positionId?: string; // Link to Position model for colors
  status: ShiftStatus;
  
  // Time Tracking
  checkInTime?: string; // ISO Date string
  checkOutTime?: string; // ISO Date string
}
