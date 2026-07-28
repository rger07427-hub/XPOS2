import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client dengan JWT pemanggil - untuk verifikasi identitas & role
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Hanya admin yang boleh mengubah akun' }), { status: 403 })
    }

    const { target_user_id, new_email, new_password } = await req.json()

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id wajib diisi' }), { status: 400 })
    }
    if (!new_email && !new_password) {
      return new Response(JSON.stringify({ error: 'Isi minimal email atau password baru' }), { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const updates: Record<string, unknown> = {}
    if (new_email) {
      updates.email = new_email
      updates.email_confirm = true
    }
    if (new_password) {
      updates.password = new_password
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, updates)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})