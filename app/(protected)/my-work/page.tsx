'use client'

import { useState, useEffect } from 'react'
import { Shift, ShiftBreak, ShiftStatus } from '../../../lib/types'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { getEmployeeByUserId } from '../../../lib/services/employees'
import { getShiftsByDateRange, checkInShift, checkOutShift, updateShiftStatus } from '../../../lib/services/shifts'
import { getBreaks, saveShiftBreak } from '../../../lib/services/breaks'
import { Button } from '../../../components/ui'
import { Clock, Coffee, LogIn, LogOut, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { formatDuration, calculateBreakDuration } from '../../../lib/timeUtils'

export default function MyWorkPage() {
  const { user } = useAuth()
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([])
  const [breaks, setBreaks] = useState<ShiftBreak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const fetchData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const emp = await getEmployeeByUserId(user.id)
      if (!emp) return

      setEmployeeId(emp.id)

      const today = new Date().toISOString().slice(0, 10)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const endDate = nextWeek.toISOString().slice(0, 10)

      const shifts = await getShiftsByDateRange(user.companyId, emp.id, today, endDate)

      const todayShifts = shifts.filter(s => s.date === today)
      const activeShift = todayShifts.find(s => s.checkInTime && !s.checkOutTime)

      setCurrentShift(activeShift || todayShifts[0] || null)
      setUpcomingShifts(shifts.filter(s => s.date > today).slice(0, 5))

      if (activeShift) {
        const shiftBreaks = await getBreaks(activeShift.id)
        setBreaks(shiftBreaks)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [user])

  const handleClockIn = async () => {
    if (!currentShift) return
    await checkInShift(currentShift.id)
    fetchData()
  }

  const handleClockOut = async () => {
    if (!currentShift) return
    await checkOutShift(currentShift.id)
    fetchData()
  }

  const handleStartBreak = async () => {
    if (!currentShift || !user?.companyId) return

    const breakData: ShiftBreak = {
      id: `break_${Date.now()}`,
      companyId: user.companyId,
      shiftId: currentShift.id,
      employeeId: currentShift.employeeId,
      breakIn: new Date().toISOString(),
    }

    await saveShiftBreak(breakData)
    fetchData()
  }

  const handleEndBreak = async () => {
    if (!currentShift) return

    const activeBreak = breaks.find(b => !b.breakOut)
    if (!activeBreak) return

    const updatedBreak: ShiftBreak = {
      ...activeBreak,
      breakOut: new Date().toISOString(),
    }

    await saveShiftBreak(updatedBreak)
    fetchData()
  }

  const handleConfirmShift = async (shiftId: string) => {
    await updateShiftStatus(shiftId, ShiftStatus.CONFIRMED)
    fetchData()
  }

  const handleDeclineShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to decline this shift?')) return
    await updateShiftStatus(shiftId, ShiftStatus.DECLINED)
    fetchData()
  }

  const calculateElapsedTime = (): string => {
    if (!currentShift?.checkInTime) return '0h'
    const start = new Date(currentShift.checkInTime)
    const diff = currentTime.getTime() - start.getTime()
    const hours = diff / (1000 * 60 * 60)
    return formatDuration(hours)
  }

  const calculateWorkTime = (): string => {
    if (!currentShift?.checkInTime) return '0h'

    const start = new Date(currentShift.checkInTime)
    const end = currentShift.checkOutTime ? new Date(currentShift.checkOutTime) : currentTime
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    const breakHours = breaks.reduce((sum, b) => {
      return sum + calculateBreakDuration(b.breakIn, b.breakOut)
    }, 0)

    return formatDuration(totalHours - breakHours)
  }

  const activeBreak = breaks.find(b => !b.breakOut)
  const isClockedIn = currentShift?.checkInTime && !currentShift?.checkOutTime
  const canClockIn = currentShift && !currentShift.checkInTime && currentShift.status !== ShiftStatus.DECLINED

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Work</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {currentShift ? (
            <div className="bg-white border-2 border-indigo-200 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Current Shift</h2>
                {isClockedIn && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    Clocked In
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <span className="font-medium text-slate-900">
                      {currentShift.startTime} - {currentShift.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Position:</span>
                    <span className="font-medium text-slate-900">{currentShift.role}</span>
                  </div>
                  {isClockedIn && (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Clocked In:</span>
                        <span className="font-medium text-slate-900">
                          {new Date(currentShift.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Elapsed Time:</span>
                        <span className="font-bold text-green-600">{calculateElapsedTime()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Work Time:</span>
                        <span className="font-bold text-indigo-600">{calculateWorkTime()}</span>
                      </div>
                    </>
                  )}
                </div>

                {isClockedIn && breaks.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-sm mb-3">
                      <Coffee className="w-4 h-4" />
                      Breaks ({breaks.length})
                    </div>
                    <div className="space-y-2">
                      {breaks.map((brk, idx) => (
                        <div key={brk.id} className="text-sm flex justify-between">
                          <span className="text-slate-500">Break {idx + 1}:</span>
                          <span className={`font-medium ${!brk.breakOut ? 'text-amber-600' : 'text-slate-900'}`}>
                            {new Date(brk.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {brk.breakOut && (
                              <>
                                {' - '}
                                {new Date(brk.breakOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' '}({formatDuration(calculateBreakDuration(brk.breakIn, brk.breakOut))})
                              </>
                            )}
                            {!brk.breakOut && ' - In Progress'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {activeBreak && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 font-medium">
                      <Coffee className="w-5 h-5" />
                      Currently on break
                    </div>
                    <span className="text-sm text-amber-600">
                      Started: {new Date(activeBreak.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {!isClockedIn && canClockIn && (
                  <Button onClick={handleClockIn} className="flex-1" isLoading={isLoading}>
                    <LogIn className="w-4 h-4 mr-2" /> Clock In
                  </Button>
                )}

                {isClockedIn && !activeBreak && (
                  <>
                    <Button onClick={handleStartBreak} variant="outline" className="flex-1">
                      <Coffee className="w-4 h-4 mr-2" /> Start Break
                    </Button>
                    <Button onClick={handleClockOut} variant="danger" className="flex-1">
                      <LogOut className="w-4 h-4 mr-2" /> Clock Out
                    </Button>
                  </>
                )}

                {isClockedIn && activeBreak && (
                  <Button onClick={handleEndBreak} className="flex-1">
                    <Coffee className="w-4 h-4 mr-2" /> End Break
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No shifts scheduled for today.</p>
            </div>
          )}

          {upcomingShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Shifts</h2>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
                {upcomingShifts.map((shift) => (
                  <div key={shift.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-sm text-slate-500">
                            {shift.startTime} - {shift.endTime} • {shift.role}
                          </div>
                        </div>
                      </div>

                      {shift.status === ShiftStatus.SCHEDULED && (
                        <div className="flex gap-2">
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

                      {shift.status === ShiftStatus.CONFIRMED && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Confirmed
                        </span>
                      )}

                      {shift.status === ShiftStatus.DECLINED && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Declined
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
