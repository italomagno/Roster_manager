
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Shift, Employee, ShiftBreak } from '../types';
import { Select } from '../components/ui';
import { calculateNetWorkedMinutes, calculateTotalBreakMinutes, formatDuration, calculatePlannedMinutes, calculateEstimatedPay } from '../services/timeUtils';
import { Download, PieChart, DollarSign, Clock } from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  
  // Date State
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // Data State
  const [reportData, setReportData] = useState<{shift: Shift, emp: Employee, breaks: ShiftBreak[]}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        if(user?.companyId) {
            const emps = await store.getEmployees(user.companyId);
            setEmployees(emps);
        }
    };
    init();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
        if(!user?.companyId) return;
        setIsLoading(true);

        const allShifts = await store.getShifts(user.companyId, startDate, endDate);
        const allBreaks = await store.getAllBreaks(user.companyId);
        const allEmps = await store.getEmployees(user.companyId); // Cached locally in component anyway

        // Filter and Map
        let filteredShifts = allShifts;
        if (selectedEmployeeId !== 'all') {
            filteredShifts = allShifts.filter(s => s.employeeId === selectedEmployeeId);
        }

        const data = filteredShifts.map(shift => {
            const emp = allEmps.find(e => e.id === shift.employeeId) || {} as Employee;
            const shiftBreaks = allBreaks.filter(b => b.shiftId === shift.id);
            return { shift, emp, breaks: shiftBreaks };
        });

        // Sort by date desc
        data.sort((a,b) => b.shift.date.localeCompare(a.shift.date));

        setReportData(data);
        setIsLoading(false);
    };
    fetchData();
  }, [user, selectedEmployeeId, startDate, endDate]);

  // --- Aggregates ---
  const totalPlannedMins = reportData.reduce((acc, item) => acc + calculatePlannedMinutes(item.shift.startTime, item.shift.endTime), 0);
  const totalNetMins = reportData.reduce((acc, item) => acc + (item.shift.checkInTime && item.shift.checkOutTime ? calculateNetWorkedMinutes(item.shift, item.breaks) : 0), 0);
  const totalPay = reportData.reduce((acc, item) => {
      const mins = item.shift.checkInTime && item.shift.checkOutTime ? calculateNetWorkedMinutes(item.shift, item.breaks) : 0;
      return acc + calculateEstimatedPay(mins, item.emp.hourlyRate);
  }, 0);
  
  const varianceMins = totalNetMins - totalPlannedMins;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Payroll & Reports</h1>
           <p className="text-slate-500">Generate insights on hours worked and estimated costs.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
           <Select 
             value={selectedEmployeeId} 
             onChange={e => setSelectedEmployeeId(e.target.value)}
             className="w-48"
           >
               <option value="all">All Employees</option>
               {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
           </Select>
           <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="text-sm border-none focus:ring-0 text-slate-700 w-32"
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="text-sm border-none focus:ring-0 text-slate-700 w-32"
                />
            </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1">Total Worked Hours</div>
            <div className="text-2xl font-bold text-slate-900">{(totalNetMins / 60).toFixed(1)}h</div>
            <div className="text-xs text-slate-400 mt-1">Net of breaks</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1">Estimated Cost</div>
            <div className="text-2xl font-bold text-slate-900">${totalPay.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">Based on hourly rates</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1">Total Planned</div>
            <div className="text-2xl font-bold text-slate-900">{(totalPlannedMins / 60).toFixed(1)}h</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1">Variance</div>
            <div className={`text-2xl font-bold ${varianceMins > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {varianceMins > 0 ? '+' : ''}{(varianceMins / 60).toFixed(1)}h
            </div>
            <div className="text-xs text-slate-400 mt-1">Actual vs Planned</div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
              <div className="p-12 text-center text-slate-500">Generating report...</div>
          ) : (
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Planned</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Worked (Net)</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Breaks</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Pay (Est)</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {reportData.map((item) => {
                             const plannedMins = calculatePlannedMinutes(item.shift.startTime, item.shift.endTime);
                             const netMins = calculateNetWorkedMinutes(item.shift, item.breaks);
                             const breakMins = calculateTotalBreakMinutes(item.breaks);
                             const pay = calculateEstimatedPay(netMins, item.emp.hourlyRate);
                             
                             const isCompleted = item.shift.checkInTime && item.shift.checkOutTime;
                             const isMissing = !item.shift.checkInTime && new Date(item.shift.date) < new Date();

                             return (
                                 <tr key={item.shift.id} className="hover:bg-slate-50">
                                     <td className="px-6 py-4 whitespace-nowrap text-slate-900">{item.shift.date}</td>
                                     <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.emp.fullName || 'Unknown'}</td>
                                     <td className="px-6 py-4 whitespace-nowrap text-slate-500">{(plannedMins/60).toFixed(1)}h</td>
                                     <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                                         {isCompleted ? `${(netMins/60).toFixed(2)}h` : '-'}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-slate-500">{breakMins > 0 ? formatDuration(breakMins) : '-'}</td>
                                     <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                                         {isCompleted && item.emp.hourlyRate ? `$${pay.toFixed(2)}` : '-'}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         {!item.shift.checkInTime && isMissing ? (
                                             <span className="text-red-600 text-xs font-bold uppercase">No Show</span>
                                         ) : !item.shift.checkOutTime && item.shift.checkInTime ? (
                                             <span className="text-indigo-600 text-xs font-bold uppercase animate-pulse">In Progress</span>
                                         ) : isCompleted ? (
                                             <span className="text-green-600 text-xs font-bold uppercase">Completed</span>
                                         ) : (
                                            <span className="text-slate-400 text-xs uppercase">Future</span>
                                         )}
                                     </td>
                                 </tr>
                             );
                        })}
                         {reportData.length === 0 && (
                             <tr><td colSpan={7} className="p-8 text-center text-slate-500">No data found for this selection.</td></tr>
                         )}
                    </tbody>
                  </table>
              </div>
          )}
      </div>
      <p className="text-xs text-slate-400 text-center">Calculations exclude unpaid break times. Overtime logic is currently linear (1.0x).</p>
    </div>
  );
};

export default ReportsPage;
