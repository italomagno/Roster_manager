import { createClient as createBrowserClient } from '../supabase/client'
import { User, CompanyRole } from '../types'

type AuthResult = { user: User | null; error: string | null }

async function fetchProfile(supabase: ReturnType<typeof createBrowserClient>, userId: string): Promise<AuthResult> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[auth] fetchProfile error:', error.message)
    return { user: null, error: error.message }
  }

  if (!data) {
    return { user: null, error: 'User profile not found in public.users' }
  }

  const user: User = {
    id: data.id,
    name: data.full_name,
    email: data.email,
    role: data.role as CompanyRole,
    companyId: data.company_id ?? null,
  }

  return { user, error: null }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: CompanyRole = CompanyRole.STAFF
): Promise<AuthResult> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })

  if (error) return { user: null, error: error.message }
  if (!data.user) return { user: null, error: 'No user returned from signUp' }

  // ✅ Email confirmation ON => sem sessão
  if (!data.session) {
    return {
      user: null,
      error: 'Account created. Please check your email to confirm, then sign in.',
    }
  }

  // ✅ Com sessão, busca profile
  return fetchProfile(supabase, data.user.id)
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { user: null, error: error.message }
  if (!data.user) return { user: null, error: 'No user returned from signIn' }

  return fetchProfile(supabase, data.user.id)
}

export async function signOut(): Promise<{ error: string | null }> {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}

/**
 * ✅ Fonte da verdade no client: session.
 * getUser() pode retornar null em timing edge-cases; session é mais estável pra app state.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient()

  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
  if (sessionErr) {
    console.error('[auth] getSession error:', sessionErr.message)
    return null
  }

  const authUser = sessionData.session?.user
  if (!authUser) return null

  const { user, error } = await fetchProfile(supabase, authUser.id)
  if (error) return null
  return user
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

  return { error: error?.message ?? null }
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  return { error: error?.message ?? null }
}
