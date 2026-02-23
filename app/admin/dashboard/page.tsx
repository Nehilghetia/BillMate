'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDashboardStats } from '@/app/actions/dashboard'
import { Package, Users, ShoppingCart, IndianRupee, Plus, FileText, Eye, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getDashboardStats()
        if (result.data) {
          setStats(result.data)
        } else {
          console.error('Failed to load dashboard stats:', result.error)
        }
      } catch (error) {
        console.error('Error in fetchStats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string
    value: string | number
    icon: any
    color: string
  }) => (
    <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-black">LIVE</span>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <div className="text-3xl font-black text-slate-900">{value}</div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8 lg:p-12">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Control Center</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
          Dashboard <span className="text-blue-600 italic">Overview.</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Welcome back! Here's your real-time business analytics.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={Package}
              color="bg-blue-600"
            />
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={Users}
              color="bg-indigo-600"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCart}
              color="bg-purple-600"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              color="bg-emerald-600"
            />
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-2xl font-black text-slate-900 uppercase">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <Link href="/admin/products">
                  <Button className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 justify-start group">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    Add New Product
                  </Button>
                </Link>
                <Link href="/admin/bills">
                  <Button className="w-full h-14 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-base rounded-2xl border border-slate-100 transition-all active:scale-95 justify-start group" variant="outline">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    Create Bill
                  </Button>
                </Link>
                <Link href="/admin/orders">
                  <Button className="w-full h-14 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-base rounded-2xl border border-slate-100 transition-all active:scale-95 justify-start group" variant="outline">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <Eye className="w-5 h-5 text-indigo-600" />
                    </div>
                    View Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="p-8 pb-4 border-b border-white/10 relative z-10">
                <CardTitle className="text-2xl font-black uppercase">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-xl border border-white/20">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-2">
                    Your recent activity will appear here
                  </p>
                  <p className="text-white/60 text-xs font-medium">
                    Track orders, bills, and customer interactions in real-time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
