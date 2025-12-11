import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Mock authentication check - will be replaced with real auth later
  const sessionToken = request.cookies.get('session_token')?.value

  if (!sessionToken && !request.nextUrl.pathname.startsWith('/login')) {
    // no token, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Protected routes for managers only
  const managerRoutes = ['/employees', '/positions', '/tracking', '/reports']
  const isManagerRoute = managerRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isManagerRoute && sessionToken) {
    // In a real app, check user role from database
    // For now, we'll let the page components handle role checks
  }

  return supabaseResponse
}
