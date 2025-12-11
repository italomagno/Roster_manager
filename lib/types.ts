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
  color: string;
}

export interface Employee {
  id: string;
  companyId: string;
  userId?: string;
  fullName: string;
  role: string;
  positionIds: string[];
  weeklyHours: number;
  isActive: boolean;
  location?: string;
  allowedStartTime?: string;
  allowedEndTime?: string;
  hourlyRate?: number;
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
  breakIn: string;
  breakOut?: string;
}

export interface Shift {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
  positionId?: string;
  status: ShiftStatus;
  checkInTime?: string;
  checkOutTime?: string;
}
