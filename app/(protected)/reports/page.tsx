'use client'

import { useState, useEffect } from 'react'
import { Employee, Shift } from '../../../lib/types'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { getEmployees } from '../../../lib/services/employees'
import { getShifts } from '../../../lib/services/shifts'
import { BarChart3, DollarSign, Clock, Users, TrendingUp, Calendar } from 'lucide-react'
import { formatDuration, calculateDuration } from '../../../lib/timeUtils'

interface EmployeeStats {
  employeeId: string
  employeeName: string
  totalHours: number
  totalShifts: number
  laborCost: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchData = async () => {
    if (!user?.companyId) return
    setIsLoading(true)
    try {
      const [emps, shiftsData] = await Promise.all([
        getEmployees(user.companyId),
        getShifts(user.companyId, startDate, endDate)
      ])
      setEmployees(emps)
      setShifts(shiftsData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, startDate, endDate])

  const calculateStats = (): EmployeeStats[] => {
    const stats: { [key: string]: EmployeeStats } = {}

    shifts.forEach(shift => {
      if (!stats[shift.employeeId]) {
        const emp = employees.find(e => e.id === shift.employeeId)
        stats[shift.employeeId] = {
          employeeId: shift.employeeId,
          employeeName: shift.employeeName || emp?.fullName || 'Unknown',
          totalHours: 0,
          totalShifts: 0,
          laborCost: 0
        }
      }

      const hours = shift.checkInTime && shift.checkOutTime
        ? (new Date(shift.checkOutTime).getTime() - new Date(shift.checkInTime).getTime()) / (1000 * 60 * 60)
        : calculateDuration(shift.startTime, shift.endTime)

      const emp = employees.find(e => e.id === shift.employeeId)
      const cost = emp?.hourlyRate ? hours * emp.hourlyRate : 0

      stats[shift.employeeId].totalHours += hours
      stats[shift.employeeId].totalShifts += 1
      stats[shift.employeeId].laborCost += cost
    })

    return Object.values(stats).sort((a, b) => b.totalHours - a.totalHours)
  }

  const employeeStats = calculateStats()
  const totalHours = employeeStats.reduce((sum, stat) => sum + stat.totalHours, 0)
  const totalCost = employeeStats.reduce((sum, stat) => sum + stat.laborCost, 0)
  const averageHoursPerEmployee = employees.length > 0 ? totalHours / employees.length : 0

  const shiftsByStatus = {
    scheduled: shifts.filter(s => s.status === 'SCHEDULED').length,
    confirmed: shifts.filter(s => s.status === 'CONFIRMED').length,
    declined: shifts.filter(s => s.status === 'DECLINED').length,
    cancelled: shifts.filter(s => s.status === 'CANCELLED').length
  }

  const completedShifts = shifts.filter(s => s.checkInTime && s.checkOutTime)
  const lateClockIns = completedShifts.filter(s => {
    const scheduled = new Date(`2000-01-01T${s.startTime}`)
    const actual = new Date(s.checkInTime!)
    const scheduledTime = scheduled.getHours() * 60 + scheduled.getMinutes()
    const actualTime = actual.getHours() * 60 + actual.getMinutes()
    return actualTime > scheduledTime + 5
  }).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Analytics and insights for your team</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Total Hours</span>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatDuration(totalHours)}</div>
              <div className="text-xs text-slate-500 mt-1">Across {shifts.length} shifts</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Labor Cost</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${totalCost.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Total payroll cost</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Avg Hours/Employee</span>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatDuration(averageHoursPerEmployee)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Per employee average</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Active Employees</span>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{employees.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total team members</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Shift Status Breakdown</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Scheduled</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400"
                        style={{ width: `${shifts.length ? (shiftsByStatus.scheduled / shifts.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {shiftsByStatus.scheduled}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Confirmed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${shifts.length ? (shiftsByStatus.confirmed / shifts.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {shiftsByStatus.confirmed}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Declined</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${shifts.length ? (shiftsByStatus.declined / shifts.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {shiftsByStatus.declined}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Cancelled</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400"
                        style={{ width: `${shifts.length ? (shiftsByStatus.cancelled / shifts.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {shiftsByStatus.cancelled}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Attendance Metrics</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Completed Shifts</span>
                  <span className="text-lg font-bold text-slate-900">{completedShifts.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm text-slate-600">Late Clock-ins</span>
                  <span className="text-lg font-bold text-amber-700">{lateClockIns}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-slate-600">On-time Rate</span>
                  <span className="text-lg font-bold text-green-700">
                    {completedShifts.length ? Math.round(((completedShifts.length - lateClockIns) / completedShifts.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Employee Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Shifts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Labor Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {employeeStats.map((stat) => (
                    <tr key={stat.employeeId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-700 text-xs font-bold">
                              {stat.employeeName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{stat.employeeName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {stat.totalShifts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {formatDuration(stat.totalHours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        ${stat.laborCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {employeeStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No data available for the selected date range
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
