import { createClient } from "@supabase/supabase-js"

type FrameRecord = {
  id: string
  filename: string
  embedding: number[]
  created_at: string
}
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: FrameRecord
  schema: 'public'
  old_record: null | FrameRecord
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  if (payload.table !== "frame") return Response.json({ message: "Ignored" }, { status: 202 })
  if (payload.type !== "INSERT") return Response.json({ message: "Ignored" }, { status: 202 })

  const supabaseAdminClient = createClient(
    // Supabase API URL - env var exported by default when deployed.
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )



  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
