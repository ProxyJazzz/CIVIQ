import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbStatus = 'healthy'
  let storageStatus = 'healthy'
  let errorLog: string[] = []

  try {
    const supabase = await createClient()

    // 1. Validate Database connectivity (fetch profiles count)
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    if (dbError) {
      dbStatus = 'unhealthy'
      errorLog.push(`Database connection failed: ${dbError.message}`)
    }

    // 2. Validate Storage bucket availability
    const { error: storageError } = await supabase.storage.listBuckets()
    if (storageError) {
      storageStatus = 'unhealthy'
      errorLog.push(`Storage buckets list failed: ${storageError.message}`)
    }
  } catch (err) {
    dbStatus = 'unhealthy'
    storageStatus = 'unhealthy'
    errorLog.push(`Supabase client initiation error: ${err instanceof Error ? err.message : 'Unknown'}`)
  }

  // 3. Confirm API configurations presence
  const geminiStatus = process.env.GOOGLE_API_KEY ? 'healthy' : 'unconfigured'

  const overallStatus =
    dbStatus === 'healthy' &&
    storageStatus === 'healthy' &&
    geminiStatus === 'healthy'
      ? 'healthy'
      : 'degraded'

  return NextResponse.json(
    {
      status: overallStatus,
      uptime: process.uptime(),
      version: '1.0.0-rc2',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbStatus,
        storage: storageStatus,
        gemini: geminiStatus,
      },
      errors: errorLog.length > 0 ? errorLog : undefined,
    },
    {
      status: overallStatus === 'healthy' ? 200 : 503,
    }
  )
}
