import { createClient } from '../supabase/client'
import { ShiftBreak } from '../types'

export async function getBreaks(shiftId: string): Promise<ShiftBreak[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shift_breaks')
    .select('*')
    .eq('shift_id', shiftId)
    .order('break_in')

  if (error) throw error

  return (data || []).map((b: any) => ({
    id: b.id,
    companyId: b.company_id,
    shiftId: b.shift_id,
    employeeId: b.employee_id,
    breakIn: b.break_in,
    breakOut: b.break_out,
  }))
}

export async function getAllBreaks(companyId: string): Promise<ShiftBreak[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shift_breaks')
    .select('*')
    .eq('company_id', companyId)
    .order('break_in', { ascending: false })

  if (error) throw error

  return (data || []).map((b: any) => ({
    id: b.id,
    companyId: b.company_id,
    shiftId: b.shift_id,
    employeeId: b.employee_id,
    breakIn: b.break_in,
    breakOut: b.break_out,
  }))
}

export async function saveShiftBreak(shiftBreak: ShiftBreak): Promise<void> {
  const supabase = createClient()

  const payload = {
    id: shiftBreak.id,
    company_id: shiftBreak.companyId,
    shift_id: shiftBreak.shiftId,
    employee_id: shiftBreak.employeeId,
    break_in: shiftBreak.breakIn,
    break_out: shiftBreak.breakOut,
  }

  const { error } = await supabase
    .from('shift_breaks')
    .upsert(payload)

  if (error) throw error
}
