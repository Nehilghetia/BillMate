'use server'

import { createClient } from '@supabase/supabase-js'

export async function forceVerifyUser(email: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key is missing')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get user by email - iterating is unavoidable without direct email lookup in default admin API, 
    // unless we use `admin.generateLink` but that sends email.
    // Actually, `admin.listUsers` returns a `users` array.

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        throw new Error('Failed to look up user')
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
        throw new Error('User not found with this email')
    }

    // 2. Update user to be confirmed
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    )

    if (updateError) {
        console.error('Error confirming user:', updateError)
        throw new Error('Failed to verify user')
    }

    return { success: true }
}
