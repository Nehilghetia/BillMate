'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/client'
import { getUserProfile } from '@/app/actions/user'

interface UserProfile {
  id: string
  auth_id: string
  email: string
  full_name: string
  user_type: 'admin' | 'customer'
  phone?: string
  address?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = React.useMemo(() => createClient(), [])

  const fetchProfile = async (userId: string) => {
    try {
      const result = await getUserProfile(userId)
      if (result.error) {
        console.error('Error fetching profile (server):', result.error)
        setProfile(null)
      } else if (result.data) {
        setProfile(result.data as any)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (mounted) {
          setUser(session?.user || null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user || null)
          setLoading(true) // Set loading while we fetch profile

          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
