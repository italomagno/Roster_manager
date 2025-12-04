
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Shift, Employee, ShiftBreak } from '../types';
import { WEEKDAYS } from '../constants';
import { calculatePlannedMinutes, calculateNetWorkedMinutes, formatDuration, calculateTotalBreakMinutes } from '../services/timeUtils';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const TimeTrackingPage = () => {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [breaks, setBreaks] = useState<ShiftBreak[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate week dates securely
  const weekDates = useMemo(() => {
    const curr = new Date();
    const day = curr.getDay();
    const firstDayOfWeek = new Date(curr);
    firstDayOfWeek.setDate(curr.getDate() - day + (weekOffset * 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek);
      d.setDate(firstDayOfWeek.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, [weekOffset]);

  const fetchData = async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    const [emps, shiftsData, breaksData] = await Promise.all([
      store.getEmployees(user.companyId),
      store.getShifts(user.companyId, weekDates[0], weekDates[6]),
      store.getAllBreaks(user.companyId)
    ]);
    setEmployees(emps);
    setShifts(shiftsData);
    setBreaks(breaksData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [weekOffset, user]);

  const formatTime = (iso?: string) => {
      if(!iso) return '-';
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Filter shifts that have any tracking activity or are past
  const trackedShifts = shifts.filter(s => s.checkInTime || s.checkOutTime || new Date(s.date) < new Date()).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-slate-500 mt-1">Monitor attendance and compare scheduled vs. actual hours (net of breaks).</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
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

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading data...</div>
        ) : trackedShifts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
                No tracking data found for this week.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Planned</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actual In/Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Breaks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Worked</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Variance</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {trackedShifts.map(shift => {
                            const emp = employees.find(e => e.id === shift.employeeId);
                            const shiftBreaks = breaks.filter(b => b.shiftId === shift.id);
                            
                            const plannedMins = calculatePlannedMinutes(shift.startTime, shift.endTime);
                            const breakMins = calculateTotalBreakMinutes(shiftBreaks);
                            const netWorkedMins = calculateNetWorkedMinutes(shift, shiftBreaks);
                            
                            const plannedHours = (plannedMins / 60).toFixed(2);
                            const actualHours = (netWorkedMins / 60).toFixed(2);
                            const varianceHours = (netWorkedMins - plannedMins) / 60;
                            
                            // Determine row status
                            const isComplete = !!shift.checkOutTime;
                            const isInProgress = shift.checkInTime && !shift.checkOutTime;
                            const isMissing = !shift.checkInTime && new Date(shift.date) < new Date() && new Date(shift.date).toDateString() !== new Date().toDateString();

                            return (
                                <tr key={shift.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{shift.role || emp?.role}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{new Date(shift.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-slate-500">{WEEKDAYS[new Date(shift.date).getDay()]}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{shift.startTime} - {shift.endTime}</div>
                                        <div className="text-xs text-slate-500">{plannedHours} hrs</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isMissing ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Absent
                                            </span>
                                        ) : (
                                            <div className="text-sm">
                                                <div className={`flex items-center gap-1 ${shift.checkInTime ? 'text-slate-900' : 'text-slate-400'}`}>
                                                   <span className="w-8 text-xs text-slate-500">IN</span> {formatTime(shift.checkInTime)}
                                                </div>
                                                <div className={`flex items-center gap-1 ${shift.checkOutTime ? 'text-slate-900' : 'text-slate-400'}`}>
                                                   <span className="w-8 text-xs text-slate-500">OUT</span> {formatTime(shift.checkOutTime)}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {breakMins > 0 ? formatDuration(breakMins) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isComplete ? (
                                            <span className="text-sm font-bold text-slate-900">{actualHours} hrs</span>
                                        ) : isInProgress ? (
                                            <span className="inline-flex items-center text-xs font-medium text-indigo-600 animate-pulse">
                                                <Clock className="w-3 h-3 mr-1" /> Working...
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         {isComplete ? (
                                             <div className={`text-xs ${varianceHours < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                 {varianceHours > 0 ? '+' : ''}{varianceHours.toFixed(2)} hrs
                                             </div>
                                         ) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default TimeTrackingPage;
