'use server'

import { createClient } from '@supabase/supabase-js'
import { sendMagicLinkEmail } from '@/lib/email'

export async function sendCustomMagicLink(email: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase configuration missing on server')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Generate Link
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`
            }
        })

        if (error) {
            console.error('Supabase generateLink error:', error)
            if (error.message.includes('User not found')) {
                return { error: 'Account not found. Please Sign Up first.' }
            }
            return { error: error.message }
        }

        if (!data.properties?.action_link) {
            return { error: 'Failed to generate login link' }
        }

        const link = data.properties.action_link
        console.log('Generated Magic Link for:', email)

        // 2. Send via Gmail (Nodemailer)
        await sendMagicLinkEmail(email, link)

        return { success: true }
    } catch (err: any) {
        console.error('Unexpected error sending magic link:', err)
        return { error: err.message || 'Failed to send login email' }
    }
}
