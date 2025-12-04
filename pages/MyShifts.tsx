
import React, { useState, useEffect } from 'react';
import { Shift, ShiftStatus, Employee } from '../types';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Button, StatusBadge } from '../components/ui';
import { Check, X, Calendar, Clock, MapPin, Play, Square, LogIn, LogOut } from 'lucide-react';
import { WEEKDAYS } from '../constants';

const MyShiftsPage = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [myEmployeeProfile, setMyEmployeeProfile] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const emp = await store.getEmployeeByUserId(user.id);
    setMyEmployeeProfile(emp || null);

    if (emp) {
      const myShifts = await store.getEmployeeShifts(user.companyId, emp.id);
      setShifts(myShifts);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStatusChange = async (shiftId: string, status: ShiftStatus) => {
    await store.updateShiftStatus(shiftId, status);
    fetchData(); 
  };

  const handleCheckIn = async (shiftId: string) => {
    await store.checkInShift(shiftId);
    fetchData();
  };

  const handleCheckOut = async (shiftId: string) => {
    await store.checkOutShift(shiftId);
    fetchData();
  };

  const formatTime = (isoDateString?: string) => {
    if (!isoDateString) return '--:--';
    return new Date(isoDateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (dateString: string) => {
     const today = new Date();
     const shiftDate = new Date(dateString);
     return today.toDateString() === shiftDate.toDateString();
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading your schedule...</div>;

  if (!myEmployeeProfile) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Employee Profile Found</h3>
        <p className="mt-2 text-slate-500">
          Your user account is not linked to an employee profile in this company. 
          <br/>Please ask your manager to link your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Shifts</h1>
        <p className="text-slate-500 mt-1">Welcome back, {myEmployeeProfile.fullName}. Here is your upcoming schedule.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {shifts.length === 0 ? (
            <li className="px-6 py-12 text-center text-slate-500">
              No upcoming shifts scheduled. Enjoy your time off!
            </li>
          ) : (
            shifts.map((shift) => {
              const dateObj = new Date(shift.date);
              const dayName = WEEKDAYS[dateObj.getDay()];
              const shiftIsToday = isToday(shift.date);

              return (
                <li key={shift.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Shift Info */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 text-center rounded-lg p-2 min-w-[60px] ${shiftIsToday ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        <div className="text-xs font-bold uppercase">{dayName.slice(0,3)}</div>
                        <div className="text-lg font-bold">{shift.date.slice(8)}</div>
                        {shiftIsToday && <div className="text-[10px] font-bold uppercase tracking-wide mt-1">Today</div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-sm font-medium text-slate-900">{shift.role || myEmployeeProfile.role}</h3>
                           <StatusBadge status={shift.status} />
                        </div>
                        <div className="space-y-1 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{shift.startTime} - {shift.endTime}</span>
                          </div>
                          {(shift.checkInTime || shift.checkOutTime) && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 bg-slate-100 px-2 py-1 rounded w-fit">
                                <span className={shift.checkInTime ? 'text-green-600 font-medium' : 'text-slate-400'}>In: {formatTime(shift.checkInTime)}</span>
                                <span className="text-slate-300">|</span>
                                <span className={shift.checkOutTime ? 'text-red-600 font-medium' : 'text-slate-400'}>Out: {formatTime(shift.checkOutTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* 1. Status Actions */}
                        {shift.status === ShiftStatus.SCHEDULED && (
                            <>
                            <Button 
                                variant="primary" 
                                className="bg-green-600 hover:bg-green-700 text-xs py-1.5"
                                onClick={() => handleStatusChange(shift.id, ShiftStatus.CONFIRMED)}
                            >
                                <Check className="w-3 h-3 mr-1" /> Confirm
                            </Button>
                            <Button 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1.5"
                                onClick={() => handleStatusChange(shift.id, ShiftStatus.DECLINED)}
                            >
                                <X className="w-3 h-3 mr-1" /> Decline
                            </Button>
                            </>
                        )}

                        {/* 2. Time Clock Actions */}
                        {shift.status === ShiftStatus.CONFIRMED && (
                            <div className="flex items-center gap-2">
                                {!shift.checkInTime ? (
                                    <Button 
                                        disabled={!shiftIsToday} // Only allow check-in on the day
                                        variant="primary"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1.5"
                                        onClick={() => handleCheckIn(shift.id)}
                                        title={!shiftIsToday ? "You can only check in on the scheduled date" : "Start Shift"}
                                    >
                                        <LogIn className="w-3 h-3 mr-1" /> Check In
                                    </Button>
                                ) : !shift.checkOutTime ? (
                                    <Button 
                                        variant="danger"
                                        className="text-xs py-1.5"
                                        onClick={() => handleCheckOut(shift.id)}
                                    >
                                        <LogOut className="w-3 h-3 mr-1" /> Check Out
                                    </Button>
                                ) : (
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                        Shift Completed
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Status Feedback */}
                        {shift.status === ShiftStatus.DECLINED && (
                            <span className="text-sm text-red-600 font-medium flex items-center">
                            <X className="w-4 h-4 mr-1" /> Declined
                            </span>
                        )}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
};

export default MyShiftsPage;
