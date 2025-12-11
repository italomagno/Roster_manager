'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Availability, CompanyRole } from '../../../../lib/types'
import { useAuth } from '../../../../lib/contexts/AuthContext'
import { getEmployee, getEmployeeByUserId } from '../../../../lib/services/employees'
import { getAvailability, saveAvailability } from '../../../../lib/services/availability'
import { Button, Input } from '../../../../components/ui'
import { WEEKDAYS } from '../../../../lib/constants'
import { Calendar, Plus, Trash2, Save } from 'lucide-react'

interface AvailabilitySlot {
  weekday: number
  startTime: string
  endTime: string
}

export default function AvailabilityPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [employeeName, setEmployeeName] = useState('')
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const employeeId = params?.employeeId as string
  const isManager = user?.role === CompanyRole.MANAGER || user?.role === CompanyRole.OWNER

  const fetchData = async () => {
    if (!employeeId) return
    setIsLoading(true)
    try {
      const emp = await getEmployee(employeeId)
      if (!emp) {
        router.push('/employees')
        return
      }

      if (!isManager && user?.id) {
        const currentUserEmp = await getEmployeeByUserId(user.id)
        if (currentUserEmp?.id !== employeeId) {
          router.push('/my-work')
          return
        }
      }

      setEmployeeName(emp.fullName)

      const availData = await getAvailability(employeeId)
      const slots = availData.map(a => ({
        weekday: a.weekday,
        startTime: a.startTime,
        endTime: a.endTime
      }))
      setAvailability(slots)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [employeeId, user])

  const addSlot = (weekday: number) => {
    setAvailability([...availability, { weekday, startTime: '09:00', endTime: '17:00' }])
  }

  const removeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...availability]
    updated[index][field] = value
    setAvailability(updated)
  }

  const handleSave = async () => {
    if (!user?.companyId) return
    setIsSaving(true)
    try {
      const availData: Availability[] = availability.map((slot, idx) => ({
        id: `avail_${employeeId}_${slot.weekday}_${idx}`,
        employeeId,
        weekday: slot.weekday,
        startTime: slot.startTime,
        endTime: slot.endTime
      }))

      await saveAvailability(availData, employeeId)
      alert('Availability saved successfully!')
    } finally {
      setIsSaving(false)
    }
  }

  const getSlotsByWeekday = (weekday: number) => {
    return availability
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.weekday === weekday)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
          <p className="text-sm text-slate-500 mt-1">{employeeName}</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {WEEKDAYS.map((day, weekday) => {
            const slots = getSlotsByWeekday(weekday)
            return (
              <div key={weekday} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <h3 className="text-base font-semibold text-slate-900">{day}</h3>
                  </div>
                  <button
                    onClick={() => addSlot(weekday)}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Time
                  </button>
                </div>

                {slots.length > 0 ? (
                  <div className="space-y-3">
                    {slots.map(({ slot, index }) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <button
                          onClick={() => removeSlot(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-slate-500">
                    No availability set for this day
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Set your available time slots for each day of the week. You can add multiple time slots per day if needed.
        </p>
      </div>
    </div>
  )
}
