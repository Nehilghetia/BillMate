'use server'

import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email'

export async function createUserProfile(
  authId: string,
  email: string,
  fullName: string,
  userType: 'admin' | 'customer'
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is missing')
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Retry logic to handle foreign key constraint timing issues
  let lastError: any = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Add delay before insert to allow auth.users transaction to commit
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
        console.log(`[v0] Server: Retrying profile insert (attempt ${attempt})`)
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          auth_id: authId,
          email,
          full_name: fullName,
          user_type: userType,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        lastError = error

        // Handle duplicate key error (23505) gracefully
        // This means the profile already exists, likely from a previous partial signup or trigger
        if (error.code === '23505') {
          console.warn('[v0] Server: Profile already exists, treating as success')
          return { success: true, alreadyExists: true }
        }

        // Check if it's a foreign key error - if so, retry
        if (error.message?.includes('foreign key') && attempt < 3) {
          console.warn(`[v0] Server: Foreign key error on attempt ${attempt}, retrying...`)
          continue
        }
        console.error('[v0] Server: Profile insert error:', error)
        throw error
      }

      console.log('[v0] Server: Profile created successfully')
      return { success: true, data }
    } catch (err: any) {
      lastError = err

      // Also catch it if it was thrown above or from library
      if (err?.code === '23505') {
        console.warn('[v0] Server: Profile already exists (caught), treating as success')
        return { success: true, alreadyExists: true }
      }

      if (attempt === 3) {
        console.error('[v0] Server: Profile creation failed after 3 attempts:', err)
        throw err
      }
    }
  }

  throw lastError
}

export async function registerNewUser(
  email: string,
  pass: string,
  fullName: string,
  role: 'admin' | 'customer'
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is missing')
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Create User via Admin API (bypasses email sending if autoConfirm is true)
  // Note: Using `admin.createUser` creates a user that is confirmed by default if email_confirm is set
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: pass,
    email_confirm: true, // Auto-confirm the user so they can login immediately
    user_metadata: {
      full_name: fullName,
      role: role,
    },
  })

  // 2. Handle specific auth errors
  if (authError) {
    console.error('[v0] Server: Admin createUser error:', authError)

    // Check for user already registered
    if (authError.message?.includes('already registered')) {
      throw new Error('This email is already registered. Please login instead.')
    }

    throw new Error(authError.message || 'Failed to create user account')
  }

  if (!authData.user) {
    throw new Error('Failed to create user: No user data returned')
  }

  // 3. Create Profile (reuse existing logic)
  try {
    const profileResult = await createUserProfile(authData.user.id, email, fullName, role)

    // Send welcome email (fire and forget)
    sendWelcomeEmail(email, fullName).catch(err => console.error('Failed to send welcome email:', err))

    return { success: true, user: authData.user, profile: profileResult }
  } catch (profileError) {
    console.error('[v0] Server: Profile creation failed during registration:', profileError)
    // We don't throw here because the Auth User was created successfully.
    // The client can still login, and profile might be created later or handled gracefully.
    return { success: true, user: authData.user, profileError }
  }
}
