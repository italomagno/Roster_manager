import { createClient } from '../supabase/client'
import { Availability } from '../types'

export async function getAvailability(employeeId: string): Promise<Availability[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('employee_id', employeeId)
    .order('weekday')

  if (error) throw error

  return (data || []).map((a: any) => ({
    id: a.id,
    employeeId: a.employee_id,
    weekday: a.weekday,
    startTime: a.start_time,
    endTime: a.end_time,
  }))
}

export async function saveAvailability(availabilities: Availability[], employeeId: string): Promise<void> {
  const supabase = createClient()

  // Delete existing availability for this employee
  await supabase
    .from('availability')
    .delete()
    .eq('employee_id', employeeId)

  if (availabilities.length === 0) return

  // Insert new availability
  const payload = availabilities.map((a) => ({
    id: a.id,
    employee_id: a.employeeId,
    weekday: a.weekday,
    start_time: a.startTime,
    end_time: a.endTime,
  }))

  const { error } = await supabase
    .from('availability')
    .insert(payload)

  if (error) throw error
}
