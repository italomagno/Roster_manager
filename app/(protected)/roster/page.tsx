'use client'

import { useState, useEffect, useMemo } from 'react'
import { getEmployees, type Employee } from '../../../lib/services/employees'
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  type Shift,
} from '../../../lib/services/shifts'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function RosterPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '17:00',
    role_override: '',
    status: 'SCHEDULED' as 'SCHEDULED' | 'CONFIRMED' | 'DECLINED',
  })
  const [saving, setSaving] = useState(false)

  const weekDates = useMemo(() => {
    const curr = new Date()
    const day = curr.getDay()
    const firstDayOfWeek = new Date(curr)
    firstDayOfWeek.setDate(curr.getDate() - day + weekOffset * 7)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek)
      d.setDate(firstDayOfWeek.getDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }
    return dates
  }, [weekOffset])

  useEffect(() => {
    loadData()
  }, [weekOffset])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [empsData, shiftsData] = await Promise.all([
        getEmployees(),
        getShifts(weekDates[0], weekDates[6]),
      ])
      setEmployees(empsData)
      setShifts(shiftsData)
      console.log('Data loaded:', empsData.length, 'employees,', shiftsData.length, 'shifts')
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load roster data')
    } finally {
      setLoading(false)
    }
  }

  const getShiftsForCell = (employeeId: string, date: string) => {
    return shifts.filter((s) => s.employee_id === employeeId && s.date === date)
  }

  const handleAddShift = (employeeId: string, date: string) => {
    setEditingShift(null)
    setSelectedEmployeeId(employeeId)
    setSelectedDate(date)
    setFormData({
      start_time: '09:00',
      end_time: '17:00',
      role_override: '',
      status: 'SCHEDULED',
    })
    setIsDialogOpen(true)
  }

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift)
    setSelectedEmployeeId(shift.employee_id)
    setSelectedDate(shift.date)
    setFormData({
      start_time: shift.start_time,
      end_time: shift.end_time,
      role_override: shift.role_override || '',
      status: shift.status,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      if (editingShift) {
        await updateShift(editingShift.id, formData)
      } else {
        await createShift({
          employee_id: selectedEmployeeId,
          date: selectedDate,
          start_time: formData.start_time,
          end_time: formData.end_time,
          role_override: formData.role_override || null,
          status: formData.status,
        })
      }
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error('Failed to save shift:', err)
      alert('Failed to save shift')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingShift) return
    if (!confirm('Delete this shift?')) return

    try {
      await deleteShift(editingShift.id)
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error('Failed to delete shift:', err)
      alert('Failed to delete shift')
    }
  }

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading roster...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Weekly Roster</h1>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-sm font-medium w-40 text-center">
            {weekDates[0]} to {weekDates[6]}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48 sticky left-0 bg-slate-50 border-r border-slate-200">
                Employee
              </th>
              {weekDates.map((date, i) => (
                <th
                  key={date}
                  className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[140px] border-r border-slate-100"
                >
                  <div className="font-bold text-slate-700">{WEEKDAYS[i]}</div>
                  <div className="text-[10px] font-normal text-slate-400">{date}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  No employees yet. Add employees first.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200 sticky left-0 bg-white">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                        <span className="text-blue-700 text-xs font-bold">
                          {emp.full_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-900">{emp.full_name}</div>
                        <div className="text-xs text-slate-500">{emp.role}</div>
                      </div>
                    </div>
                  </td>

                  {weekDates.map((date) => {
                    const cellShifts = getShiftsForCell(emp.id, date)
                    return (
                      <td
                        key={date}
                        className="px-1 py-2 align-top border-r border-slate-100 min-h-[6rem] relative group hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1">
                          {cellShifts.map((shift) => (
                            <button
                              key={shift.id}
                              onClick={() => handleEditShift(shift)}
                              className={`w-full text-left p-2 rounded border text-xs shadow-sm transition-all cursor-pointer hover:shadow-md ${
                                shift.status === 'CONFIRMED'
                                  ? 'bg-green-50 border-green-200'
                                  : shift.status === 'DECLINED'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="font-semibold text-slate-800">
                                {shift.start_time} - {shift.end_time}
                              </div>
                              <div className="text-slate-500 truncate mt-0.5">
                                {shift.role_override || emp.role}
                              </div>
                            </button>
                          ))}

                          <button
                            onClick={() => handleAddShift(emp.id, date)}
                            className={`w-full py-1.5 text-xs border border-dashed border-slate-200 rounded text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center ${
                              cellShifts.length > 0
                                ? 'opacity-0 group-hover:opacity-100'
                                : 'opacity-50 hover:opacity-100'
                            }`}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
            <DialogDescription>
              {selectedDate} - {selectedEmployee?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_override">Role Override (Optional)</Label>
              <Input
                id="role_override"
                value={formData.role_override}
                onChange={(e) => setFormData({ ...formData, role_override: e.target.value })}
                placeholder="Leave empty to use default role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'SCHEDULED' | 'CONFIRMED' | 'DECLINED') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {editingShift && (
              <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
