'use server'

import { createClient } from "@/lib/supabase/server"
import type { Department } from "@/types/community"

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
