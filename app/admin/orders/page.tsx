'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Package, IndianRupee, Calendar, CheckCircle2, User, MapPin, Phone, Tag, Truck, Clock, CheckCircle } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

interface Order {
  id: string
  customer_id: string
  customer_name?: string
  shipping_address?: string
  pincode?: string
  phone_number?: string
  total_amount: number
  status: string
  order_status?: string
  coupon_code?: string
  discount_amount?: number
  created_at: string
  items: any[]
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('bills')
        .select('*, items:bill_items(id)')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error, data } = await supabase
        .from('bills')
        .update({ order_status: newStatus })
        .eq('id', orderId)

      if (error) {
        console.error('Supabase UPDATE error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || 'Failed to update order status')
      }

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, order_status: newStatus }
          : order
      ))

      toast.success(`Order status updated to ${newStatus}`)
    } catch (error: any) {
      console.error('Error updating order status:', {
        error: error,
        message: error?.message,
        stack: error?.stack
      })
      toast.error(error?.message || 'Failed to update order status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-50 border-blue-100 text-blue-700'
      case 'processing':
        return 'bg-amber-50 border-amber-100 text-amber-700'
      case 'shipped':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700'
      case 'delivered':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700'
      case 'cancelled':
        return 'bg-red-50 border-red-100 text-red-700'
      default:
        return 'bg-slate-50 border-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed':
        return <Clock className="w-4 h-4" />
      case 'processing':
        return <Package className="w-4 h-4" />
      case 'shipped':
        return <Truck className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <CheckCircle2 className="w-4 h-4" />
    }
  }

  return (
    <div className="p-8 lg:p-12">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-3">
          <ShoppingCart className="w-3 h-3 text-purple-600" />
          <span className="text-purple-700 text-[10px] font-black tracking-widest uppercase">Order Management</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
          Orders <span className="text-blue-600 italic">Control.</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Track and manage all customer orders with real-time status updates</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Orders...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
          <CardContent className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Orders Yet</h3>
            <p className="text-slate-500 font-medium">Orders will appear here once customers make purchases</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const currentStatus = order.order_status || 'placed'
            return (
              <Card key={order.id} className="border-none shadow-lg shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex flex-col gap-6">
                    {/* Header Section */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                        <ShoppingCart className="w-7 h-7 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-black text-slate-900 font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(currentStatus)}`}>
                            {getStatusIcon(currentStatus)}
                            {currentStatus.toUpperCase()}
                          </span>
                          {order.coupon_code && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-pink-50 border border-pink-100 text-pink-700">
                              <Tag className="w-3 h-3" />
                              {order.coupon_code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                          <User className="w-4 h-4" />
                          <span>{order.customer_name || 'Customer'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono">{order.customer_id?.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Details */}
                    {(order.shipping_address || order.phone_number || order.pincode) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl">
                        {order.shipping_address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
                              <p className="text-sm font-medium text-slate-700">{order.shipping_address}</p>
                            </div>
                          </div>
                        )}
                        {order.pincode && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pincode</p>
                              <p className="text-sm font-black text-slate-900">{order.pincode}</p>
                            </div>
                          </div>
                        )}
                        {order.phone_number && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                              <p className="text-sm font-black text-slate-900">{order.phone_number}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Details & Status Control */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Order Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
                          <Package className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</p>
                            <p className="text-sm font-black text-slate-900">{order.items?.length || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                          <IndianRupee className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Amount</p>
                            <p className="text-sm font-black text-emerald-700">
                              ₹{order.total_amount?.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl col-span-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Order Date</p>
                            <p className="text-sm font-black text-blue-700">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status Control */}
                      <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Update Order Status
                        </label>
                        <select
                          value={currentStatus}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="w-full h-14 px-4 bg-white text-slate-900 font-bold text-base border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-all"
                        >
                          <option value="placed">📦 Placed</option>
                          <option value="processing">⚙️ Processing</option>
                          <option value="shipped">🚚 Shipped</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                        <p className="text-xs text-slate-400 font-medium">
                          Current workflow: Placed → Processing → Shipped → Delivered
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
