import { createClient } from './supabase/client'
import { MOCK_COMPANY_ID, INITIAL_EMPLOYEES, INITIAL_POSITIONS } from './constants'

export async function seedDatabase() {
  const supabase = createClient()

  console.log('Seeding database...')

  // Create demo company
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('*')
    .eq('id', MOCK_COMPANY_ID)
    .maybeSingle()

  if (!existingCompany) {
    console.log('Creating demo company...')
    await supabase
      .from('companies')
      .insert({ id: MOCK_COMPANY_ID, name: 'Demo Company' })
  }

  // Seed positions
  console.log('Seeding positions...')
  for (const position of INITIAL_POSITIONS) {
    const { data: existing } = await supabase
      .from('positions')
      .select('*')
      .eq('id', position.id)
      .maybeSingle()

    if (!existing) {
      await supabase
        .from('positions')
        .insert({
          id: position.id,
          company_id: position.companyId,
          name: position.name,
          color: position.color,
        })
    }
  }

  // Seed employees
  console.log('Seeding employees...')
  for (const employee of INITIAL_EMPLOYEES) {
    const { data: existing } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employee.id)
      .maybeSingle()

    if (!existing) {
      await supabase
        .from('employees')
        .insert({
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
        })
    }
  }

  console.log('Database seeded successfully!')
}
