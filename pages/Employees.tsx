
import React, { useState, useEffect } from 'react';
import { Employee, Position } from '../types';
import { useAuth } from '../App';
import { store } from '../services/store';
import { Button, Input, Modal } from '../components/ui';
import { Plus, Edit2, User as UserIcon, MapPin, Clock, Search, Calendar, CheckSquare, Square, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Multi-select state
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);

  const fetchData = async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    const [emps, pos] = await Promise.all([
      store.getEmployees(user.companyId),
      store.getPositions(user.companyId)
    ]);
    setEmployees(emps);
    setPositions(pos);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Build legacy role string from selected positions
    const roleNames = positions
      .filter(p => selectedPositionIds.includes(p.id))
      .map(p => p.name)
      .join(', ');

    const newEmployee: Employee = {
      id: editingEmployee?.id || `emp_${Date.now()}`,
      companyId: user!.companyId,
      fullName: formData.get('fullName') as string,
      role: roleNames || 'Staff', // Sync with position names
      positionIds: selectedPositionIds,
      weeklyHours: Number(formData.get('weeklyHours')),
      location: formData.get('location') as string,
      isActive: true,
      allowedStartTime: formData.get('allowedStartTime') as string,
      allowedEndTime: formData.get('allowedEndTime') as string,
      hourlyRate: Number(formData.get('hourlyRate')) || undefined,
    };

    await store.saveEmployee(newEmployee);
    setIsModalOpen(false);
    setEditingEmployee(null);
    fetchData();
  };

  const openModal = (emp?: Employee) => {
    setEditingEmployee(emp || null);
    // Initialize multi-select state
    setSelectedPositionIds(emp?.positionIds || []);
    setIsModalOpen(true);
  };

  const togglePosition = (posId: string) => {
    setSelectedPositionIds(prev => {
      if (prev.includes(posId)) {
        return prev.filter(id => id !== posId);
      } else {
        return [...prev, posId];
      }
    });
  };

  const goToAvailability = (empId: string) => {
    navigate(`/availability/${empId}`);
  };

  // Helper to get position styling
  const getPositionStyle = (positionId?: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    
    // Convert hex to simple rgba-like inline style for bg opacity
    return {
      style: {
        backgroundColor: `${pos.color}20`, // 20 = approx 12% opacity
        color: pos.color,
        borderColor: `${pos.color}40`
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employees</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your team roster and details.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-800 shadow-sm border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 flex gap-4">
           <div className="relative flex-1 max-w-xs">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
             <input 
               type="text" 
               placeholder="Search employees..." 
               className="pl-10 w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 transition-colors shadow-sm bg-white text-black placeholder-neutral-400 border-neutral-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:border-neutral-700"
             />
           </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading employees...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-neutral-700">
              <thead className="bg-slate-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Positions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hours/Wk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-slate-200 dark:divide-neutral-700">
                {employees.map((emp) => {
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-neutral-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{emp.fullName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">ID: {emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-[250px]">
                        <div className="flex flex-wrap gap-1">
                          {emp.positionIds && emp.positionIds.length > 0 ? (
                             emp.positionIds.map(pid => {
                               const style = getPositionStyle(pid);
                               const posName = positions.find(p => p.id === pid)?.name || 'Unknown';
                               return (
                                 <span 
                                    key={pid}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap"
                                    style={style.style || {}}
                                  >
                                    {posName}
                                  </span>
                               );
                             })
                          ) : (
                            <span className="text-slate-400 italic">No position</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {emp.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                           <Clock className="h-3 w-3" /> {emp.weeklyHours}h
                        </div>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {emp.hourlyRate ? `$${emp.hourlyRate.toFixed(2)}/h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.isActive ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-slate-400'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => goToAvailability(emp.id)} className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1" title="Availability">
                              <Calendar className="h-4 w-4" />
                          </button>
                          <button onClick={() => openModal(emp)} className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400" title="Edit">
                              <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <Input 
            label="Full Name" 
            name="fullName" 
            defaultValue={editingEmployee?.fullName} 
            required 
            placeholder="e.g. Jane Doe"
          />
          
          <div className="grid grid-cols-2 gap-4">
             {/* Multi-Select for Positions */}
             <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Positions</label>
                <div className="border border-slate-300 dark:border-neutral-700 rounded-md p-2 h-40 overflow-y-auto bg-white dark:bg-neutral-900">
                  {positions.length === 0 ? (
                     <div className="text-xs text-slate-500 p-2">No positions found.</div>
                  ) : (
                     positions.map(p => {
                        const isSelected = selectedPositionIds.includes(p.id);
                        return (
                           <div 
                             key={p.id} 
                             onClick={() => togglePosition(p.id)}
                             className={`flex items-center p-1.5 rounded cursor-pointer text-sm transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-neutral-800'}`}
                           >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                              )}
                              <span className={`${isSelected ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                {p.name}
                              </span>
                              <span 
                                className="ml-auto w-2 h-2 rounded-full" 
                                style={{ backgroundColor: p.color }}
                              />
                           </div>
                        );
                     })
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Select all that apply.</p>
             </div>

             <div className="col-span-2 sm:col-span-1 space-y-4">
                <Input 
                  label="Weekly Hours" 
                  name="weeklyHours" 
                  type="number"
                  defaultValue={editingEmployee?.weeklyHours || 40} 
                  required 
                />
                <Input 
                  label="Location" 
                  name="location" 
                  defaultValue={editingEmployee?.location} 
                  placeholder="e.g. Main Kitchen"
                />
                <div className="relative">
                  <Input 
                    label="Hourly Rate ($)" 
                    name="hourlyRate" 
                    type="number"
                    step="0.01"
                    defaultValue={editingEmployee?.hourlyRate || ''} 
                    placeholder="15.00"
                  />
                  <div className="absolute right-3 top-8 text-slate-400 pointer-events-none">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
             </div>
          </div>
          
          {/* Time Constraints */}
          <div className="pt-2 border-t border-slate-100 dark:border-neutral-700">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Time Constraints</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Allowed Start" 
                name="allowedStartTime" 
                type="time"
                defaultValue={editingEmployee?.allowedStartTime || ''}
              />
              <Input 
                label="Allowed End" 
                name="allowedEndTime" 
                type="time"
                defaultValue={editingEmployee?.allowedEndTime || ''}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Used for future auto-scheduling checks.</p>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingEmployee ? 'Save Changes' : 'Create Employee'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
