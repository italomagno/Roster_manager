import { createClient } from '../supabase/client'

export interface Employee {
  id: string
  full_name: string
  role: string
  created_at: string
}

export interface CreateEmployeeInput {
  full_name: string
  role?: string
}

export interface UpdateEmployeeInput {
  full_name?: string
  role?: string
}

export async function getEmployees(): Promise<Employee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('full_name')

  if (error) throw error

  return data || []
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .insert({
      full_name: input.full_name,
      role: input.role || 'Staff',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput
): Promise<Employee> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('employees')
    .update(input)
    .eq('id', employeeId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId)

  if (error) throw error
}
