import { createClient as createBrowserClient } from '../supabase/client'
import { User, CompanyRole } from '../types'

export async function mockLogin(email: string, role: CompanyRole): Promise<{ user: User; token: string }> {
  const supabase = createBrowserClient()

  // Find or create user
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  let user: User

  if (existingUser) {
    user = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role as CompanyRole,
      companyId: existingUser.company_id,
    }
  } else {
    // For mock, create a demo user
    const userId = role === CompanyRole.MANAGER ? 'user_admin' : 'user_staff'
    const name = role === CompanyRole.MANAGER ? 'Admin User' : 'Jessica Pearson'

    // Check if user already exists by id
    const { data: userById } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (userById) {
      user = {
        id: userById.id,
        name: userById.name,
        email: userById.email,
        role: userById.role as CompanyRole,
        companyId: userById.company_id,
      }
    } else {
      // Get or create demo company
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', 'cm_001')
        .maybeSingle()

      if (!company) {
        await supabase
          .from('companies')
          .insert({ id: 'cm_001', name: 'Demo Company' })
      }

      // Create user
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: userId,
          company_id: 'cm_001',
          name,
          email,
          role,
        })
        .select()
        .single()

      user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as CompanyRole,
        companyId: newUser.company_id,
      }
    }
  }

  // Create session token
  const token = `session_${Date.now()}_${Math.random().toString(36)}`
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

  return { user, token }
}

export async function mockLogout(token: string): Promise<void> {
  const supabase = createBrowserClient()

  await supabase
    .from('sessions')
    .delete()
    .eq('token', token)
}

export async function verifySession(token: string): Promise<User | null> {
  const supabase = createBrowserClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      users (*)
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session || !session.users) return null

  const userData = session.users as any

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role as CompanyRole,
    companyId: userData.company_id,
  }
}

export async function getCurrentUser(token: string): Promise<User | null> {
  return verifySession(token)
}
