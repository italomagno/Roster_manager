import { createClient as createBrowserClient } from '../supabase/client'
import { User, CompanyRole } from '../types'

export async function signUp(email: string, password: string, fullName: string, role: CompanyRole = CompanyRole.STAFF): Promise<{ user: User | null; error: string | null }> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    return { user: null, error: error.message }
  }

  if (!data.user) {
    return { user: null, error: 'Failed to create user' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!userData) {
    return { user: null, error: 'Failed to fetch user profile' }
  }

  const user: User = {
    id: userData.id,
    name: userData.full_name,
    email: userData.email,
    role: userData.role as CompanyRole,
    companyId: userData.company_id,
  }

  return { user, error: null }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { user: null, error: error.message }
  }

  if (!data.user) {
    return { user: null, error: 'Failed to sign in' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!userData) {
    return { user: null, error: 'Failed to fetch user profile' }
  }

  const user: User = {
    id: userData.id,
    name: userData.full_name,
    email: userData.email,
    role: userData.role as CompanyRole,
    companyId: userData.company_id,
  }

  return { user, error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (!userData) return null

  return {
    id: userData.id,
    name: userData.full_name,
    email: userData.email,
    role: userData.role as CompanyRole,
    companyId: userData.company_id,
  }
}

export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function resetPasswordRequest(email: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
