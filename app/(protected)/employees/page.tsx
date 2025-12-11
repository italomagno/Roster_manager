'use client'

import { useState, useEffect } from 'react'
import { Employee, Position, CompanyRole } from '../../../lib/types'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { getEmployees, saveEmployee } from '../../../lib/services/employees'
import { getPositions } from '../../../lib/services/positions'
import { Button, Modal, Input, Select } from '../../../components/ui'
import { Plus, Edit2, Search, Users } from 'lucide-react'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])

  const isManager = user?.role === CompanyRole.MANAGER || user?.role === CompanyRole.OWNER

  const fetchData = async () => {
    if (!user?.companyId) return
    setIsLoading(true)
    try {
      const [emps, pos] = await Promise.all([
        getEmployees(user.companyId),
        getPositions(user.companyId)
      ])
      setEmployees(emps)
      setPositions(pos)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEmployee = () => {
    if (!isManager) return
    setEditingEmployee(null)
    setSelectedPositions([])
    setIsModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    if (!isManager) return
    setEditingEmployee(employee)
    setSelectedPositions(employee.positionIds)
    setIsModalOpen(true)
  }

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const employeeData: Employee = {
      id: editingEmployee?.id || `emp_${Date.now()}`,
      companyId: user!.companyId,
      fullName: formData.get('fullName') as string,
      role: formData.get('role') as string,
      positionIds: selectedPositions,
      weeklyHours: Number(formData.get('weeklyHours') || 0),
      hourlyRate: Number(formData.get('hourlyRate') || 0) || undefined,
      location: formData.get('location') as string || undefined,
      allowedStartTime: formData.get('allowedStartTime') as string || undefined,
      allowedEndTime: formData.get('allowedEndTime') as string || undefined,
      isActive: true,
    }

    await saveEmployee(employeeData)
    setIsModalOpen(false)
    fetchData()
  }

  const togglePosition = (positionId: string) => {
    setSelectedPositions(prev =>
      prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    )
  }

  const getEmployeePositions = (emp: Employee) => {
    return positions.filter(p => emp.positionIds.includes(p.id))
  }

  const totalHours = employees.reduce((sum, emp) => sum + emp.weeklyHours, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">
            {employees.length} employees • {totalHours} total weekly hours
          </p>
        </div>
        {isManager && (
          <Button onClick={handleAddEmployee} className="self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
                    <span className="text-indigo-700 text-lg font-bold">
                      {emp.fullName.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      {emp.fullName}
                    </h3>
                    <p className="text-sm text-slate-500">{emp.role}</p>
                  </div>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleEditEmployee(emp)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Weekly Hours:</span>
                  <span className="font-medium text-slate-900">{emp.weeklyHours}h</span>
                </div>
                {emp.hourlyRate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hourly Rate:</span>
                    <span className="font-medium text-slate-900">${emp.hourlyRate}/hr</span>
                  </div>
                )}
                {emp.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-900">{emp.location}</span>
                  </div>
                )}
                {getEmployeePositions(emp).length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 text-xs block mb-1.5">Positions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {getEmployeePositions(emp).map(pos => (
                        <span
                          key={pos.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${pos.color}20`,
                            color: pos.color,
                            borderColor: pos.color,
                            borderWidth: '1px'
                          }}
                        >
                          {pos.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && !isLoading && (
            <div className="col-span-full bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm ? 'No employees found matching your search.' : 'No employees yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4 text-left">
          <Input
            label="Full Name"
            name="fullName"
            defaultValue={editingEmployee?.fullName || ''}
            required
            placeholder="John Doe"
          />

          <Input
            label="Role"
            name="role"
            defaultValue={editingEmployee?.role || ''}
            required
            placeholder="e.g., Cashier, Manager"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weekly Hours"
              name="weeklyHours"
              type="number"
              min="0"
              max="168"
              defaultValue={editingEmployee?.weeklyHours || 40}
              required
            />
            <Input
              label="Hourly Rate ($)"
              name="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={editingEmployee?.hourlyRate || ''}
              placeholder="Optional"
            />
          </div>

          <Input
            label="Location"
            name="location"
            defaultValue={editingEmployee?.location || ''}
            placeholder="Optional"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Allowed Start Time"
              name="allowedStartTime"
              type="time"
              defaultValue={editingEmployee?.allowedStartTime || ''}
            />
            <Input
              label="Allowed End Time"
              name="allowedEndTime"
              type="time"
              defaultValue={editingEmployee?.allowedEndTime || ''}
            />
          </div>

          {positions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Positions (Optional)
              </label>
              <div className="border border-slate-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {positions.map(pos => (
                  <label key={pos.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPositions.includes(pos.id)}
                      onChange={() => togglePosition(pos.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span
                      className="inline-block w-3 h-3 rounded"
                      style={{ backgroundColor: pos.color }}
                    ></span>
                    <span className="text-sm text-slate-700">{pos.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
