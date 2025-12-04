
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Shift, ShiftStatus, CompanyRole } from '../types';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Button, Modal, Input, StatusBadge } from '../components/ui';
import { WEEKDAYS } from '../constants';
import { ChevronLeft, ChevronRight, Plus, Trash2, Lock } from 'lucide-react';

const RosterPage = () => {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Permissions
  const isManager = user?.role === CompanyRole.MANAGER || user?.role === CompanyRole.OWNER;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Calculate week dates securely
  const weekDates = useMemo(() => {
    const curr = new Date(); // Today
    // Calculate offset for current week start (Sunday)
    const day = curr.getDay(); // 0 (Sun) to 6 (Sat)
    const firstDayOfWeek = new Date(curr);
    firstDayOfWeek.setDate(curr.getDate() - day + (weekOffset * 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek);
      d.setDate(firstDayOfWeek.getDate() + i);
      dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }
    return dates;
  }, [weekOffset]);

  const fetchData = async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    const [emps, shiftsData] = await Promise.all([
      store.getEmployees(user.companyId),
      store.getShifts(user.companyId, weekDates[0], weekDates[6])
    ]);
    setEmployees(emps);
    setShifts(shiftsData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [weekOffset, user]);

  const getShiftsForCell = (employeeId: string, date: string) => {
    return shifts.filter(s => s.employeeId === employeeId && s.date === date);
  };

  const handleAddShift = (employeeId: string, date: string) => {
    if (!isManager) return;
    setEditingShift(null);
    setSelectedEmployeeId(employeeId);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    if (!isManager) return;
    setEditingShift(shift);
    setSelectedEmployeeId(shift.employeeId);
    setSelectedDate(shift.date);
    setIsModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const shiftData: Shift = {
      id: editingShift?.id || `shift_${Date.now()}`,
      companyId: user!.companyId,
      employeeId: selectedEmployeeId,
      employeeName: '', // Backend/Store will fill this
      date: selectedDate,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      role: formData.get('role') as string,
      status: editingShift?.status || ShiftStatus.SCHEDULED,
    };

    await store.saveShift(shiftData);
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteShift = async () => {
    if (editingShift) {
      await store.deleteShift(editingShift.id);
      setIsModalOpen(false);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      
      {/* --- Header Controls --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly Roster</h1>
          {!isManager && <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Lock className="w-3 h-3" /> Read-only view</p>}
        </div>
        <div className="flex items-center self-start sm:self-auto space-x-2 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
          <button onClick={() => setWeekOffset(p => p - 1)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-sm font-medium w-40 text-center tabular-nums">
            {weekDates[0].slice(5)} - {weekDates[6].slice(5)}
          </span>
          <button onClick={() => setWeekOffset(p => p + 1)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* --- Main Grid Container --- */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Scrollable Area */}
        <div className="flex-1 w-full overflow-x-auto overflow-y-auto">
          <div className="min-w-max h-full inline-block align-top">
            
            <table className="min-w-full divide-y divide-slate-200 border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-20">
                <tr>
                  {/* Corner Cell */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48 sticky left-0 top-0 z-30 bg-slate-50 border-b border-r border-slate-200 shadow-[1px_1px_3px_rgba(0,0,0,0.05)]">
                    Employee
                  </th>
                  {/* Date Headers */}
                  {weekDates.map((date, i) => (
                    <th key={date} className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[140px] border-b border-r border-slate-100 bg-slate-50">
                      <div className="font-bold text-slate-700">{WEEKDAYS[i]}</div>
                      <div className="text-[10px] font-normal text-slate-400">{date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    {/* Employee Name */}
                    <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200 sticky left-0 z-10 bg-white shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                            <span className="text-indigo-700 text-xs font-bold">{emp.fullName.charAt(0)}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900 truncate max-w-[100px]">{emp.fullName}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[100px]">{emp.role}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Shift Cells */}
                    {weekDates.map((date) => {
                      const cellShifts = getShiftsForCell(emp.id, date);
                      return (
                        <td key={date} className="px-1 py-2 align-top border-r border-slate-100 h-24 min-h-[6rem] relative group hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            {cellShifts.map(shift => (
                              <button 
                                key={shift.id} 
                                onClick={() => handleEditShift(shift)}
                                disabled={!isManager}
                                className={`w-full text-left p-2 rounded border text-xs shadow-sm transition-all ${isManager ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : 'cursor-default'} ${
                                  shift.status === ShiftStatus.CONFIRMED ? 'bg-green-50 border-green-200' : 
                                  shift.status === ShiftStatus.DECLINED ? 'bg-red-50 border-red-200' : 
                                  'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="font-semibold text-slate-800">{shift.startTime} - {shift.endTime}</div>
                                <div className="text-slate-500 truncate mt-0.5">{shift.role || emp.role}</div>
                              </button>
                            ))}
                            
                            {/* Add Button (only for managers) */}
                            {isManager && (
                              <button 
                                  onClick={() => handleAddShift(emp.id, date)}
                                  className={`w-full py-1.5 text-xs border border-dashed border-slate-200 rounded text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center ${cellShifts.length > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-50 hover:opacity-100'}`}
                              >
                                  <Plus className="w-3 h-3 mr-1" /> Add
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && !isLoading && (
                    <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-500">
                            No employees found.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Shift Edit Modal (Manager Only) --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingShift ? 'Edit Shift' : 'Add Shift'}
      >
        <form onSubmit={handleSaveShift} className="space-y-4 text-left">
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4 border border-slate-100">
                <span className="font-semibold block sm:inline">{selectedDate}</span> 
                <span className="hidden sm:inline"> • </span>
                <span className="block sm:inline">Employee: <span className="font-semibold">{employees.find(e => e.id === selectedEmployeeId)?.fullName}</span></span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Input label="Start Time" name="startTime" type="time" defaultValue={editingShift?.startTime || '09:00'} required />
                <Input label="End Time" name="endTime" type="time" defaultValue={editingShift?.endTime || '17:00'} required />
            </div>
            
            <Input label="Role (Optional)" name="role" defaultValue={editingShift?.role || ''} placeholder="Override default role" />
            
            {editingShift && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                     <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Current Status</label>
                     <div className="flex items-center">
                       <StatusBadge status={editingShift.status} />
                     </div>
                </div>
            )}

            <div className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                {editingShift ? (
                    <button type="button" onClick={handleDeleteShift} className="w-full sm:w-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium flex items-center justify-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Shift
                    </button>
                ) : <div className="hidden sm:block"></div>}
                
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button type="button" variant="secondary" className="flex-1 sm:flex-none" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 sm:flex-none">Save Shift</Button>
                </div>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default RosterPage;
