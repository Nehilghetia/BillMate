'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export function CustomerHeader() {
  const router = useRouter()
  const { signOut, profile } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/customer/shop">
            <h1 className="text-2xl font-bold text-blue-600">BillMate</h1>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/customer/shop"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Shop
            </Link>
            <Link
              href="/customer/orders"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              My Orders
            </Link>
            <Link
              href="/customer/invoices"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Invoices
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
            <p className="text-xs text-gray-600">{profile?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 hover:bg-red-50 bg-transparent"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
