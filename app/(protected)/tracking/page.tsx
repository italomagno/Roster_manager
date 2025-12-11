'use client'

import { useState, useEffect } from 'react'
import { Employee, Shift, ShiftBreak } from '../../../lib/types'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { getEmployees } from '../../../lib/services/employees'
import { getShifts } from '../../../lib/services/shifts'
import { getAllBreaks } from '../../../lib/services/breaks'
import { Clock, UserCheck, Coffee, Calendar } from 'lucide-react'
import { formatDuration, calculateBreakDuration } from '../../../lib/timeUtils'

interface ShiftWithEmployee extends Shift {
  employee?: Employee
  breaks?: ShiftBreak[]
}

export default function TimeTrackingPage() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<ShiftWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [breaks, setBreaks] = useState<ShiftBreak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchData = async () => {
    if (!user?.companyId) return
    setIsLoading(true)
    try {
      const [emps, shiftsData, breaksData] = await Promise.all([
        getEmployees(user.companyId),
        getShifts(user.companyId, selectedDate, selectedDate),
        getAllBreaks(user.companyId)
      ])

      const shiftsWithEmployee = shiftsData.map(shift => {
        const employee = emps.find(e => e.id === shift.employeeId)
        const shiftBreaks = breaksData.filter(b => b.shiftId === shift.id)
        return { ...shift, employee, breaks: shiftBreaks }
      })

      setEmployees(emps)
      setShifts(shiftsWithEmployee)
      setBreaks(breaksData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [user, selectedDate])

  const calculateElapsedTime = (checkInTime: string): string => {
    const start = new Date(checkInTime)
    const diff = currentTime.getTime() - start.getTime()
    const hours = diff / (1000 * 60 * 60)
    return formatDuration(hours)
  }

  const calculateWorkTime = (shift: ShiftWithEmployee): string => {
    if (!shift.checkInTime) return '0h'

    const start = new Date(shift.checkInTime)
    const end = shift.checkOutTime ? new Date(shift.checkOutTime) : currentTime
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    const breakHours = shift.breaks?.reduce((sum, b) => {
      return sum + calculateBreakDuration(b.breakIn, b.breakOut)
    }, 0) || 0

    return formatDuration(totalHours - breakHours)
  }

  const activeShifts = shifts.filter(s => s.checkInTime && !s.checkOutTime)
  const completedShifts = shifts.filter(s => s.checkInTime && s.checkOutTime)
  const scheduledShifts = shifts.filter(s => !s.checkInTime)

  const totalActiveHours = activeShifts.reduce((sum, shift) => {
    if (!shift.checkInTime) return sum
    const hours = (currentTime.getTime() - new Date(shift.checkInTime).getTime()) / (1000 * 60 * 60)
    return sum + hours
  }, 0)

  const getActiveBreak = (shift: ShiftWithEmployee) => {
    return shift.breaks?.find(b => !b.breakOut)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeShifts.length} active shift{activeShifts.length !== 1 ? 's' : ''} • {formatDuration(totalActiveHours)} total active time
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Currently Clocked In
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeShifts.map((shift) => {
                  const activeBreak = getActiveBreak(shift)
                  return (
                    <div
                      key={shift.id}
                      className="bg-white border-2 border-green-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-300">
                            <span className="text-green-700 text-lg font-bold">
                              {shift.employee?.fullName.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-base font-semibold text-slate-900">
                              {shift.employee?.fullName || 'Unknown'}
                            </h3>
                            <p className="text-sm text-slate-500">{shift.role || shift.employee?.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Active
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-500">Scheduled:</span>
                          <span className="font-medium text-slate-900">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Clock In:</span>
                          <span className="font-medium text-slate-900">
                            {shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Elapsed Time:</span>
                          <span className="font-bold text-green-600">
                            {shift.checkInTime ? calculateElapsedTime(shift.checkInTime) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Work Time:</span>
                          <span className="font-medium text-slate-900">
                            {calculateWorkTime(shift)}
                          </span>
                        </div>

                        {shift.breaks && shift.breaks.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1 text-slate-500 text-xs mb-1.5">
                              <Coffee className="w-3 h-3" />
                              Breaks ({shift.breaks.length})
                            </div>
                            {shift.breaks.map((brk, idx) => (
                              <div key={brk.id} className="flex justify-between text-xs py-1">
                                <span className="text-slate-500">Break {idx + 1}:</span>
                                <span className={`font-medium ${!brk.breakOut ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {new Date(brk.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {brk.breakOut ? new Date(brk.breakOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                                  {brk.breakOut && ` (${formatDuration(calculateBreakDuration(brk.breakIn, brk.breakOut))})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {activeBreak && (
                        <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50 -mx-5 -mb-5 px-5 py-3 rounded-b-lg">
                          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                            <Coffee className="w-4 h-4" />
                            On Break
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {completedShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Completed Shifts
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completedShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-white border border-slate-200 rounded-lg shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                          <span className="text-blue-700 text-sm font-bold">
                            {shift.employee?.fullName.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {shift.employee?.fullName || 'Unknown'}
                          </h3>
                          <p className="text-xs text-slate-500">{shift.role || shift.employee?.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scheduled:</span>
                        <span className="font-medium text-slate-900">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Actual:</span>
                        <span className="font-medium text-slate-900">
                          {shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {' - '}
                          {shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Work Time:</span>
                        <span className="font-bold text-blue-600">
                          {calculateWorkTime(shift)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scheduledShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Scheduled (Not Started)</h2>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
                {scheduledShifts.map((shift) => (
                  <div key={shift.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-slate-700 text-xs font-bold">
                            {shift.employee?.fullName.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-slate-900">
                            {shift.employee?.fullName || 'Unknown'}
                          </h3>
                          <p className="text-xs text-slate-500">{shift.role || shift.employee?.role}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shifts.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No shifts scheduled for this date.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
