'use server'

import { createClient } from '@supabase/supabase-js'

export async function getUserProfile(userId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Debug logging for credentials
    // console.log('Syncing Supabase URL:', supabaseUrl ? 'Found' : 'Missing', supabaseUrl)
    // console.log('Syncing Supabase Key:', supabaseServiceKey ? 'Found' : 'Missing')

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials for server action')
        return { error: 'Configuration error: Missing credentials' }
    }

    // Ensure no whitespace
    const cleanUrl = supabaseUrl.trim()
    const cleanKey = supabaseServiceKey.trim()

    const supabase = createClient(cleanUrl, cleanKey)

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', userId)
            .single()

        if (error) {
            console.error('Error fetching user profile (server):', error)
            return { error: error.message }
        }

        return { data }
    } catch (err) {
        console.error('Unexpected error fetching profile:', err)
        return { error: 'Unexpected error' }
    }
}

export async function updateUserProfile(userId: string, updates: { full_name?: string; phone?: string; address?: string }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials for updateUserProfile')
        return { error: 'Configuration error' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('auth_id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return { error: error.message }
        }

        return { data }
    } catch (err: any) {
        console.error('Unexpected update error:', err)
        return { error: err.message || 'Failed to update profile' }
    }
}
