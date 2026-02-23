'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Package, FileText, ShoppingCart, Users, BarChart3, LogOut, ShoppingBag, User, Tag } from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, profile, user } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/promotions', label: 'Promotions', icon: Tag },
    { href: '/admin/bills', label: 'Bills', icon: FileText },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ]

  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-600 p-2.5 rounded-[16px] shadow-lg shadow-blue-200">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              BillMate <span className="text-blue-600 italic">.</span>
            </h1>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-blue-700 text-[9px] font-black tracking-widest uppercase">Admin Control</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive
                ? 'bg-white/10'
                : 'bg-slate-100 group-hover:bg-slate-200'
                }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`} />
              </div>
              <span className="font-bold text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-100">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Administrator</p>
            <p className="font-bold text-slate-900 truncate text-sm">{profile?.full_name || 'Admin'}</p>
            <p className="text-slate-400 text-xs truncate font-medium">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          className="w-full h-12 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold rounded-xl border border-red-100 hover:border-red-600 transition-all group"
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
