
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Employee, Availability } from '../types';
import { store } from '../services/store';
import { Button, Input } from '../components/ui';
import { ArrowLeft, Save } from 'lucide-react';
import { WEEKDAYS } from '../constants';

const AvailabilityPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!employeeId) return;
      setIsLoading(true);
      const [emp, avails] = await Promise.all([
        store.getEmployee(employeeId),
        store.getAvailability(employeeId)
      ]);
      if (!emp) {
        navigate('/employees');
        return;
      }
      setEmployee(emp);
      setAvailabilities(avails);
      setIsLoading(false);
    };
    loadData();
  }, [employeeId, navigate]);

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailabilities(prev => {
      const existing = prev.find(a => a.weekday === dayIndex);
      if (existing) {
        // If setting empty, user might want to clear it, but for now keep simple update
        return prev.map(a => a.weekday === dayIndex ? { ...a, [field]: value } : a);
      } else {
        // Create new entry
        return [...prev, {
          id: `avail_${Date.now()}_${dayIndex}`,
          employeeId: employeeId!,
          weekday: dayIndex,
          startTime: field === 'startTime' ? value : '09:00',
          endTime: field === 'endTime' ? value : '17:00'
        }];
      }
    });
  };

  const getAvailabilityForDay = (dayIndex: number) => {
    return availabilities.find(a => a.weekday === dayIndex) || { startTime: '', endTime: '' };
  };

  const handleSave = async () => {
    if (!employeeId) return;
    setIsSaving(true);
    // Filter out incomplete
    const valid = availabilities.filter(a => a.startTime && a.endTime);
    await store.saveAvailability(valid, employeeId);
    setIsSaving(false);
    navigate('/employees');
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/employees')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Availability</h1>
                <p className="text-slate-500">Set standard hours for {employee?.fullName}</p>
            </div>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
        </Button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden p-6">
        <div className="grid gap-4">
            {WEEKDAYS.map((day, index) => {
                const avail = getAvailabilityForDay(index);
                return (
                    <div key={day} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                        <div className="w-32 font-medium text-slate-700">{day}</div>
                        <div className="flex items-center gap-2 flex-1">
                            <Input 
                                type="time" 
                                value={avail.startTime} 
                                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                className="w-32"
                            />
                            <span className="text-slate-400">to</span>
                            <Input 
                                type="time" 
                                value={avail.endTime} 
                                onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                className="w-32"
                            />
                        </div>
                        <div className="text-sm text-slate-400">
                            {avail.startTime && avail.endTime ? 
                                `${(parseInt(avail.endTime) - parseInt(avail.startTime))}h` : 
                                'Off'
                            }
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;
