import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error')
  const origin = requestUrl.origin

  if (oauthError) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(oauthError)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('Missing OAuth code')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('Unable to establish session')}`)
  }

  return NextResponse.redirect(`${origin}/feed`)
}
