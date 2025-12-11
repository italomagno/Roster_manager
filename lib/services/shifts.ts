import { createClient } from '../supabase/client'
import { Shift, ShiftStatus } from '../types'

export async function getShifts(companyId: string, weekStart: string, weekEnd: string): Promise<Shift[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('company_id', companyId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date')
    .order('start_time')

  if (error) throw error

  return (data || []).map((s: any) => ({
    id: s.id,
    companyId: s.company_id,
    employeeId: s.employee_id,
    employeeName: s.employee_name,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    role: s.role,
    positionId: s.position_id,
    status: s.status as ShiftStatus,
    checkInTime: s.check_in_time,
    checkOutTime: s.check_out_time,
  }))
}

export async function getEmployeeShifts(companyId: string, employeeId: string): Promise<Shift[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('company_id', companyId)
    .eq('employee_id', employeeId)
    .order('date')
    .order('start_time')

  if (error) throw error

  return (data || []).map((s: any) => ({
    id: s.id,
    companyId: s.company_id,
    employeeId: s.employee_id,
    employeeName: s.employee_name,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    role: s.role,
    positionId: s.position_id,
    status: s.status as ShiftStatus,
    checkInTime: s.check_in_time,
    checkOutTime: s.check_out_time,
  }))
}

export async function getShiftsByDateRange(
  companyId: string,
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<Shift[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('company_id', companyId)
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) throw error

  return (data || []).map((s: any) => ({
    id: s.id,
    companyId: s.company_id,
    employeeId: s.employee_id,
    employeeName: s.employee_name,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    role: s.role,
    positionId: s.position_id,
    status: s.status as ShiftStatus,
    checkInTime: s.check_in_time,
    checkOutTime: s.check_out_time,
  }))
}

export async function saveShift(shift: Shift): Promise<Shift> {
  const supabase = createClient()

  const payload = {
    id: shift.id,
    company_id: shift.companyId,
    employee_id: shift.employeeId,
    employee_name: shift.employeeName,
    date: shift.date,
    start_time: shift.startTime,
    end_time: shift.endTime,
    role: shift.role,
    position_id: shift.positionId,
    status: shift.status,
    check_in_time: shift.checkInTime,
    check_out_time: shift.checkOutTime,
  }

  const { data, error } = await supabase
    .from('shifts')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    companyId: data.company_id,
    employeeId: data.employee_id,
    employeeName: data.employee_name,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    role: data.role,
    positionId: data.position_id,
    status: data.status as ShiftStatus,
    checkInTime: data.check_in_time,
    checkOutTime: data.check_out_time,
  }
}

export async function updateShiftStatus(shiftId: string, status: ShiftStatus): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('shifts')
    .update({ status })
    .eq('id', shiftId)

  if (error) throw error
}

export async function deleteShift(shiftId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId)

  if (error) throw error
}

export async function checkInShift(shiftId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('shifts')
    .update({ check_in_time: new Date().toISOString() })
    .eq('id', shiftId)

  if (error) throw error
}

export async function checkOutShift(shiftId: string): Promise<void> {
  const supabase = createClient()

  const checkOutTime = new Date().toISOString()

  // Close any open breaks
  await supabase
    .from('shift_breaks')
    .update({ break_out: checkOutTime })
    .eq('shift_id', shiftId)
    .is('break_out', null)

  // Update shift
  const { error } = await supabase
    .from('shifts')
    .update({ check_out_time: checkOutTime })
    .eq('id', shiftId)

  if (error) throw error
}
