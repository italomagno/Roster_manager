
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Shift, Employee, ShiftBreak } from '../types';
import { calculateNetWorkedMinutes, calculateTotalBreakMinutes, formatDuration, calculatePlannedMinutes, calculateEstimatedPay } from '../services/timeUtils';
import { Calendar, DollarSign, Clock, Briefcase } from 'lucide-react';
import { WEEKDAYS } from '../constants';

const MyWorkPage = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [breaks, setBreaks] = useState<ShiftBreak[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date Filter State (default to current month)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    // 1. Get Employee Profile
    const emp = await store.getEmployeeByUserId(user.id);
    setEmployee(emp || null);

    if (emp && user.companyId) {
        // 2. Get Shifts for range
        const allShifts = await store.getShiftsByDateRange(user.companyId, emp.id, startDate, endDate);
        setShifts(allShifts);
        
        // 3. Get all breaks (in real app, filter by date range query, here filtering in memory)
        const allBreaks = await store.getAllBreaks(user.companyId);
        setBreaks(allBreaks.filter(b => b.employeeId === emp.id));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, startDate, endDate]);

  // --- Metrics Calculation ---
  const completedShifts = shifts.filter(s => s.checkInTime && s.checkOutTime);
  const totalDays = completedShifts.length;
  
  const totalNetMinutes = completedShifts.reduce((acc, shift) => {
      const shiftBreaks = breaks.filter(b => b.shiftId === shift.id);
      return acc + calculateNetWorkedMinutes(shift, shiftBreaks);
  }, 0);
  
  const totalBreakMinutes = completedShifts.reduce((acc, shift) => {
      const shiftBreaks = breaks.filter(b => b.shiftId === shift.id);
      return acc + calculateTotalBreakMinutes(shiftBreaks);
  }, 0);

  const estimatedPay = calculateEstimatedPay(totalNetMinutes, employee?.hourlyRate);
  const totalHours = (totalNetMinutes / 60).toFixed(1);

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading work summary...</div>;
  if (!employee) return <div className="p-12 text-center text-slate-500">Employee profile not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">My Work Summary</h1>
           <p className="text-slate-500">Review your history and estimated earnings.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
           <input 
             type="date" 
             value={startDate} 
             onChange={e => setStartDate(e.target.value)}
             className="text-sm border-none focus:ring-0 text-slate-700"
           />
           <span className="text-slate-400">-</span>
           <input 
             type="date" 
             value={endDate}
             onChange={e => setEndDate(e.target.value)}
             className="text-sm border-none focus:ring-0 text-slate-700"
           />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase className="w-5 h-5"/></div>
                <span className="text-sm font-medium text-slate-500">Shifts Worked</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalDays}</div>
         </div>
         
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Clock className="w-5 h-5"/></div>
                <span className="text-sm font-medium text-slate-500">Total Hours</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalHours}h</div>
            <div className="text-xs text-slate-400 mt-1">Net of breaks</div>
         </div>

         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock className="w-5 h-5"/></div>
                <span className="text-sm font-medium text-slate-500">Total Breaks</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatDuration(totalBreakMinutes)}</div>
         </div>

         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign className="w-5 h-5"/></div>
                <span className="text-sm font-medium text-slate-500">Estimated Pay</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
                {employee.hourlyRate ? `$${estimatedPay.toFixed(2)}` : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Rate: {employee.hourlyRate ? `$${employee.hourlyRate}/h` : 'Not set'}</div>
         </div>
      </div>

      {/* Shift History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
           <h3 className="font-semibold text-slate-800">Shift History</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Times</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Break</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pay (Est)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {shifts.map(shift => {
                        const shiftBreaks = breaks.filter(b => b.shiftId === shift.id);
                        const netMins = calculateNetWorkedMinutes(shift, shiftBreaks);
                        const breakMins = calculateTotalBreakMinutes(shiftBreaks);
                        const pay = calculateEstimatedPay(netMins, employee.hourlyRate);
                        const status = !shift.checkInTime ? 'Absent' : !shift.checkOutTime ? 'No Checkout' : 'Completed';
                        
                        return (
                            <tr key={shift.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900">{shift.date}</div>
                                    <div className="text-xs text-slate-500">{WEEKDAYS[new Date(shift.date).getDay()]}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{shift.role || employee.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {shift.checkInTime ? (
                                        <>
                                            <span className="text-green-600">{new Date(shift.checkInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            <span className="text-slate-400 mx-1">-</span>
                                            <span className="text-red-600">{shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '???'}</span>
                                        </>
                                    ) : <span className="text-red-500">No Show</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {breakMins > 0 ? formatDuration(breakMins) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                    {status === 'Completed' ? formatDuration(netMins) : status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {employee.hourlyRate && status === 'Completed' ? `$${pay.toFixed(2)}` : '-'}
                                </td>
                            </tr>
                        );
                    })}
                    {shifts.length === 0 && (
                        <tr><td colSpan={6} className="p-6 text-center text-slate-500">No shifts found in this period.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default MyWorkPage;
