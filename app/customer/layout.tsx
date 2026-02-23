'use client'

import React from "react"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ShopHeader } from '@/components/shop-header'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || (profile && profile.user_type !== 'customer'))) {
      router.push('/auth/login')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (profile && profile.user_type !== 'customer')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      <main>{children}</main>
    </div>
  )
}
