
import { Employee, Shift, Availability, ShiftStatus, User, CompanyRole, Position, ShiftBreak } from '../types';
import { MOCK_COMPANY_ID, MOCK_USER_STAFF_ID, INITIAL_EMPLOYEES, INITIAL_POSITIONS } from '../constants';

// Helper to delay response to simulate network
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const STORAGE_KEYS = {
  EMPLOYEES: 'shiftsync_employees',
  SHIFTS: 'shiftsync_shifts',
  AVAILABILITY: 'shiftsync_availability',
  POSITIONS: 'shiftsync_positions',
  BREAKS: 'shiftsync_breaks',
};

// Seed data if empty
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AVAILABILITY)) {
    localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(INITIAL_POSITIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BREAKS)) {
    localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify([]));
  }
};

seedData();

export const store = {
  // --- Employees ---
  getEmployees: async (companyId: string): Promise<Employee[]> => {
    await delay(300);
    const raw: any[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    
    // Migration: Ensure positionIds exists (handle legacy single positionId)
    const all: Employee[] = raw.map(e => ({
      ...e,
      positionIds: Array.isArray(e.positionIds) ? e.positionIds : (e.positionId ? [e.positionId] : [])
    }));

    return all.filter(e => e.companyId === companyId);
  },

  getEmployee: async (employeeId: string): Promise<Employee | undefined> => {
    await delay(100);
    const raw: any[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const e = raw.find(x => x.id === employeeId);
    if (!e) return undefined;
    
    // Migration check
    return {
        ...e,
        positionIds: Array.isArray(e.positionIds) ? e.positionIds : (e.positionId ? [e.positionId] : [])
    };
  },

  getEmployeeByUserId: async (userId: string): Promise<Employee | undefined> => {
    await delay(100);
    const raw: any[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const e = raw.find(x => x.userId === userId);
    if (!e) return undefined;

    return {
        ...e,
        positionIds: Array.isArray(e.positionIds) ? e.positionIds : (e.positionId ? [e.positionId] : [])
    };
  },

  saveEmployee: async (employee: Employee): Promise<Employee> => {
    await delay(300);
    const all: Employee[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const index = all.findIndex(e => e.id === employee.id);
    if (index >= 0) {
      all[index] = employee;
    } else {
      all.push(employee);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(all));
    return employee;
  },

  // --- Positions ---
  getPositions: async (companyId: string): Promise<Position[]> => {
    await delay(200);
    const all: Position[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSITIONS) || '[]');
    return all.filter(p => p.companyId === companyId);
  },

  savePosition: async (position: Position): Promise<Position> => {
    await delay(200);
    const all: Position[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSITIONS) || '[]');
    const index = all.findIndex(p => p.id === position.id);
    if (index >= 0) {
      all[index] = position;
    } else {
      all.push(position);
    }
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(all));
    return position;
  },

  deletePosition: async (positionId: string): Promise<void> => {
    await delay(200);
    let all: Position[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSITIONS) || '[]');
    all = all.filter(p => p.id !== positionId);
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(all));
  },

  // --- Availability ---
  getAvailability: async (employeeId: string): Promise<Availability[]> => {
    await delay(200);
    const all: Availability[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AVAILABILITY) || '[]');
    return all.filter(a => a.employeeId === employeeId);
  },

  saveAvailability: async (availabilities: Availability[], employeeId: string): Promise<void> => {
    await delay(300);
    let all: Availability[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AVAILABILITY) || '[]');
    // Remove existing for this employee
    all = all.filter(a => a.employeeId !== employeeId);
    // Add new
    all = [...all, ...availabilities];
    localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(all));
  },

  // --- Shifts ---
  getShifts: async (companyId: string, weekStart: string, weekEnd: string): Promise<Shift[]> => {
    await delay(300);
    const all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    return all.filter(s => 
      s.companyId === companyId && 
      s.date >= weekStart && 
      s.date <= weekEnd
    );
  },

  // For Reporting: Get all shifts in a date range for a specific employee
  getShiftsByDateRange: async (companyId: string, employeeId: string, startDate: string, endDate: string): Promise<Shift[]> => {
    await delay(300);
    const all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    return all.filter(s => 
      s.companyId === companyId && 
      s.employeeId === employeeId &&
      s.date >= startDate && 
      s.date <= endDate
    ).sort((a,b) => a.date.localeCompare(b.date));
  },
  
  getEmployeeShifts: async (companyId: string, employeeId: string): Promise<Shift[]> => {
    await delay(300);
    const all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    return all
      .filter(s => s.companyId === companyId && s.employeeId === employeeId)
      .sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  },

  saveShift: async (shift: Shift): Promise<Shift> => {
    await delay(200);
    const all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    const index = all.findIndex(s => s.id === shift.id);
    
    // Enrich with employee name
    const employees: Employee[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const emp = employees.find(e => e.id === shift.employeeId);
    if (emp) shift.employeeName = emp.fullName;

    if (index >= 0) {
      all[index] = shift;
    } else {
      all.push(shift);
    }
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(all));
    return shift;
  },

  updateShiftStatus: async (shiftId: string, status: ShiftStatus): Promise<void> => {
     await delay(200);
     const all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
     const index = all.findIndex(s => s.id === shiftId);
     if(index >= 0) {
        all[index].status = status;
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(all));
     }
  },

  deleteShift: async (shiftId: string): Promise<void> => {
    await delay(200);
    let all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    all = all.filter(s => s.id !== shiftId);
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(all));
  },

  // --- Time Tracking & Breaks ---

  getBreaks: async (shiftId: string): Promise<ShiftBreak[]> => {
    await delay(100);
    const all: ShiftBreak[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BREAKS) || '[]');
    return all.filter(b => b.shiftId === shiftId);
  },

  // For reporting: Get all breaks for a company (in real app, would be DB filtered)
  getAllBreaks: async (companyId: string): Promise<ShiftBreak[]> => {
    await delay(100);
    const all: ShiftBreak[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BREAKS) || '[]');
    return all.filter(b => b.companyId === companyId);
  },

  saveShiftBreak: async (shiftBreak: ShiftBreak): Promise<void> => {
    await delay(200);
    const all: ShiftBreak[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BREAKS) || '[]');
    const index = all.findIndex(b => b.id === shiftBreak.id);
    if (index >= 0) {
        all[index] = shiftBreak;
    } else {
        all.push(shiftBreak);
    }
    localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(all));
  },

  checkInShift: async (shiftId: string): Promise<void> => {
    await delay(200);
    const all: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    const index = all.findIndex(s => s.id === shiftId);
    if (index >= 0) {
      all[index].checkInTime = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(all));
    }
  },

  checkOutShift: async (shiftId: string): Promise<void> => {
    await delay(200);
    
    // 1. Close any open breaks for this shift automatically
    const allBreaks: ShiftBreak[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BREAKS) || '[]');
    const checkOutTime = new Date().toISOString();
    let breaksChanged = false;

    const updatedBreaks = allBreaks.map(b => {
        if (b.shiftId === shiftId && !b.breakOut) {
            breaksChanged = true;
            return { ...b, breakOut: checkOutTime };
        }
        return b;
    });

    if (breaksChanged) {
        localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(updatedBreaks));
    }

    // 2. Perform Checkout
    const allShifts: Shift[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
    const index = allShifts.findIndex(s => s.id === shiftId);
    if (index >= 0) {
      allShifts[index].checkOutTime = checkOutTime;
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(allShifts));
    }
  },
};

// Mock Auth
export const mockLogin = async (email: string, role: CompanyRole): Promise<User> => {
  await delay(600);
  return {
    id: role === CompanyRole.MANAGER ? 'user_admin' : MOCK_USER_STAFF_ID,
    name: role === CompanyRole.MANAGER ? 'Admin User' : 'Jessica Pearson',
    email,
    role,
    companyId: MOCK_COMPANY_ID,
  };
};
