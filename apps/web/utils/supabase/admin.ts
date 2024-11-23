import { createClient as client } from "@supabase/supabase-js"
import { env } from "@/env"

export async function createClient() {
  return client(
    env.NEXT_PUBLIC_SUPABASE_PROJECT_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  )
}
