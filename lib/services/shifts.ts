import { createClient } from '../supabase/client'

export interface Shift {
  id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  role_override: string | null
  status: 'SCHEDULED' | 'CONFIRMED' | 'DECLINED'
  created_at: string
  updated_at: string
}

export interface CreateShiftInput {
  employee_id: string
  date: string
  start_time: string
  end_time: string
  role_override?: string | null
  status?: 'SCHEDULED' | 'CONFIRMED' | 'DECLINED'
}

export interface UpdateShiftInput {
  employee_id?: string
  date?: string
  start_time?: string
  end_time?: string
  role_override?: string | null
  status?: 'SCHEDULED' | 'CONFIRMED' | 'DECLINED'
}

export async function getShifts(weekStart: string, weekEnd: string): Promise<Shift[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date')
    .order('start_time')

  if (error) throw error

  return data || []
}

export async function getShiftsByEmployee(employeeId: string): Promise<Shift[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date')
    .order('start_time')

  if (error) throw error

  return data || []
}

export async function getShift(shiftId: string): Promise<Shift | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('id', shiftId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createShift(input: CreateShiftInput): Promise<Shift> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .insert({
      employee_id: input.employee_id,
      date: input.date,
      start_time: input.start_time,
      end_time: input.end_time,
      role_override: input.role_override || null,
      status: input.status || 'SCHEDULED',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateShift(
  shiftId: string,
  input: UpdateShiftInput
): Promise<Shift> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .update(input)
    .eq('id', shiftId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteShift(shiftId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId)

  if (error) throw error
}
