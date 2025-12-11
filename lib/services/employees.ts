import { createClient } from '../supabase/client'
import { Employee } from '../types'

export async function getEmployees(companyId: string): Promise<Employee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('full_name')

  if (error) throw error

  return (data || []).map((e: any) => ({
    id: e.id,
    companyId: e.company_id,
    userId: e.user_id,
    fullName: e.full_name,
    role: e.role,
    positionIds: e.position_ids || [],
    weeklyHours: Number(e.weekly_hours),
    isActive: e.is_active,
    location: e.location,
    allowedStartTime: e.allowed_start_time,
    allowedEndTime: e.allowed_end_time,
    hourlyRate: e.hourly_rate ? Number(e.hourly_rate) : undefined,
  }))
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    companyId: data.company_id,
    userId: data.user_id,
    fullName: data.full_name,
    role: data.role,
    positionIds: data.position_ids || [],
    weeklyHours: Number(data.weekly_hours),
    isActive: data.is_active,
    location: data.location,
    allowedStartTime: data.allowed_start_time,
    allowedEndTime: data.allowed_end_time,
    hourlyRate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
  }
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    companyId: data.company_id,
    userId: data.user_id,
    fullName: data.full_name,
    role: data.role,
    positionIds: data.position_ids || [],
    weeklyHours: Number(data.weekly_hours),
    isActive: data.is_active,
    location: data.location,
    allowedStartTime: data.allowed_start_time,
    allowedEndTime: data.allowed_end_time,
    hourlyRate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
  }
}

export async function saveEmployee(employee: Employee): Promise<Employee> {
  const supabase = createClient()

  const payload = {
    id: employee.id,
    company_id: employee.companyId,
    user_id: employee.userId,
    full_name: employee.fullName,
    role: employee.role,
    position_ids: employee.positionIds,
    weekly_hours: employee.weeklyHours,
    is_active: employee.isActive,
    location: employee.location,
    allowed_start_time: employee.allowedStartTime,
    allowed_end_time: employee.allowedEndTime,
    hourly_rate: employee.hourlyRate,
  }

  const { data, error } = await supabase
    .from('employees')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    companyId: data.company_id,
    userId: data.user_id,
    fullName: data.full_name,
    role: data.role,
    positionIds: data.position_ids || [],
    weeklyHours: Number(data.weekly_hours),
    isActive: data.is_active,
    location: data.location,
    allowedStartTime: data.allowed_start_time,
    allowedEndTime: data.allowed_end_time,
    hourlyRate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
  }
}
