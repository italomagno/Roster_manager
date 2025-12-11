export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MOCK_COMPANY_ID = 'cm_001';
export const MOCK_USER_STAFF_ID = 'user_staff';

export const INITIAL_POSITIONS = [
  { id: 'pos_0', companyId: MOCK_COMPANY_ID, name: 'Manager', color: '#7c3aed' },
  { id: 'pos_1', companyId: MOCK_COMPANY_ID, name: 'Chef', color: '#ef4444' },
  { id: 'pos_2', companyId: MOCK_COMPANY_ID, name: 'Waiter', color: '#3b82f6' },
  { id: 'pos_3', companyId: MOCK_COMPANY_ID, name: 'Barista', color: '#f59e0b' },
  { id: 'pos_4', companyId: MOCK_COMPANY_ID, name: 'Cleaner', color: '#10b981' },
];

export const INITIAL_EMPLOYEES = [
  { id: 'emp_1', companyId: MOCK_COMPANY_ID, fullName: 'Sarah Jenkins', role: 'Manager', positionIds: ['pos_0'], weeklyHours: 40, isActive: true, location: 'Front of House', allowedStartTime: '08:00', allowedEndTime: '18:00' },
  { id: 'emp_2', companyId: MOCK_COMPANY_ID, fullName: 'Mike Ross', role: 'Chef', positionIds: ['pos_1'], weeklyHours: 45, isActive: true, location: 'Kitchen' },
  { id: 'emp_3', companyId: MOCK_COMPANY_ID, userId: MOCK_USER_STAFF_ID, fullName: 'Jessica Pearson', role: 'Waiter', positionIds: ['pos_2'], weeklyHours: 20, isActive: true, location: 'Front of House' },
  { id: 'emp_4', companyId: MOCK_COMPANY_ID, fullName: 'Louis Litt', role: 'Barista', positionIds: ['pos_3'], weeklyHours: 30, isActive: true, location: 'Front of House' },
  { id: 'emp_5', companyId: MOCK_COMPANY_ID, fullName: 'Harvey Specter', role: 'Chef', positionIds: ['pos_1'], weeklyHours: 50, isActive: true, location: 'Kitchen' },
];
