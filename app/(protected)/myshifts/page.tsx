'use client'

import { useState, useEffect } from 'react'
import { Shift, ShiftStatus } from '../../../lib/types'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { getEmployeeByUserId } from '../../../lib/services/employees'
import { getShiftsByDateRange, updateShiftStatus } from '../../../lib/services/shifts'
import { StatusBadge } from '../../../components/ui'
import { Calendar, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDuration, calculateDuration } from '../../../lib/timeUtils'

export default function MyShiftsPage() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  const getWeekDates = (offset: number) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - dayOfWeek + offset * 7)

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 29)

    return {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10)
    }
  }

  const fetchData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const emp = await getEmployeeByUserId(user.id)
      if (!emp) return

      const dates = getWeekDates(weekOffset)
      const shiftsData = await getShiftsByDateRange(user.companyId, emp.id, dates.start, dates.end)
      setShifts(shiftsData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, weekOffset])

  const handleConfirmShift = async (shiftId: string) => {
    await updateShiftStatus(shiftId, ShiftStatus.CONFIRMED)
    fetchData()
  }

  const handleDeclineShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to decline this shift?')) return
    await updateShiftStatus(shiftId, ShiftStatus.DECLINED)
    fetchData()
  }

  const groupShiftsByWeek = () => {
    const weeks: { [key: string]: Shift[] } = {}

    shifts.forEach(shift => {
      const date = new Date(shift.date)
      const weekStart = new Date(date)
      const dayOfWeek = date.getDay()
      weekStart.setDate(date.getDate() - dayOfWeek)
      const weekKey = weekStart.toISOString().slice(0, 10)

      if (!weeks[weekKey]) {
        weeks[weekKey] = []
      }
      weeks[weekKey].push(shift)
    })

    return weeks
  }

  const weeklyShifts = groupShiftsByWeek()
  const totalHours = shifts.reduce((sum, shift) => {
    return sum + calculateDuration(shift.startTime, shift.endTime)
  }, 0)

  const dates = getWeekDates(weekOffset)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Shifts</h1>
          <p className="text-sm text-slate-500 mt-1">
            {shifts.length} shift{shifts.length !== 1 ? 's' : ''} • {formatDuration(totalHours)} total hours
          </p>
        </div>
        <div className="flex items-center self-start sm:self-auto space-x-2 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
          <button
            onClick={() => setWeekOffset(p => p - 1)}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-sm font-medium w-40 text-center tabular-nums">
            {dates.start} - {dates.end}
          </span>
          <button
            onClick={() => setWeekOffset(p => p + 1)}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(weeklyShifts).length > 0 ? (
            Object.entries(weeklyShifts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([weekStart, weekShifts]) => {
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 6)
                const weekHours = weekShifts.reduce((sum, shift) => {
                  return sum + calculateDuration(shift.startTime, shift.endTime)
                }, 0)

                return (
                  <div key={weekStart}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </h2>
                      <span className="text-sm text-slate-500">
                        {weekShifts.length} shifts • {formatDuration(weekHours)}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
                      {weekShifts
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((shift) => (
                          <div key={shift.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="flex-shrink-0 mt-0.5">
                                  <Calendar className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-slate-900">
                                      {new Date(shift.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                    <StatusBadge status={shift.status} />
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {shift.startTime} - {shift.endTime}
                                    </div>
                                    <span>•</span>
                                    <span>{shift.role}</span>
                                    <span>•</span>
                                    <span className="font-medium">
                                      {formatDuration(calculateDuration(shift.startTime, shift.endTime))}
                                    </span>
                                  </div>

                                  {shift.checkInTime && (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                      <div className="text-xs text-slate-500">
                                        Actual: {new Date(shift.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {shift.checkOutTime && (
                                          <> - {new Date(shift.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {shift.status === ShiftStatus.SCHEDULED && new Date(shift.date) > new Date() && (
                                <div className="flex gap-2 lg:ml-4">
                                  <button
                                    onClick={() => handleDeclineShift(shift.id)}
                                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" /> Decline
                                  </button>
                                  <button
                                    onClick={() => handleConfirmShift(shift.id)}
                                    className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-4 h-4" /> Confirm
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No shifts scheduled for this period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
