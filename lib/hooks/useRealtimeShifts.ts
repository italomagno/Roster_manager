'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../supabase/client'
import { Shift } from '../types'

export function useRealtimeShifts(
  companyId: string | undefined,
  initialShifts: Shift[],
  weekStart: string,
  weekEnd: string
) {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const supabase = createClient()

  useEffect(() => {
    if (!companyId) return

    setShifts(initialShifts)

    const channel = supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newShift = payload.new as any
            const shift: Shift = {
              id: newShift.id,
              companyId: newShift.company_id,
              employeeId: newShift.employee_id,
              employeeName: newShift.employee_name,
              date: newShift.date,
              startTime: newShift.start_time,
              endTime: newShift.end_time,
              role: newShift.role,
              positionId: newShift.position_id,
              status: newShift.status,
              checkInTime: newShift.check_in_time,
              checkOutTime: newShift.check_out_time,
            }

            if (shift.date >= weekStart && shift.date <= weekEnd) {
              setShifts((current) => {
                const existing = current.findIndex((s) => s.id === shift.id)
                if (existing >= 0) {
                  const updated = [...current]
                  updated[existing] = shift
                  return updated
                } else {
                  return [...current, shift]
                }
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setShifts((current) => current.filter((s) => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, weekStart, weekEnd, initialShifts])

  return shifts
}
