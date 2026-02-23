'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Truck, CheckCircle, Package, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShopHeader } from '@/components/shop-header'

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  payment_method?: string
  order_status?: string // Changed from tracking_status to match DB column
  tracking_number?: string
  items: Array<{
    id: string
    quantity: number
    unit_price: number
    product: {
      name: string
      images?: string[]
    }
  }>
}

export default function OrdersPage() {
  const { profile, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchOrders()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [profile, authLoading])

  const fetchOrders = async () => {
    if (!profile) {
      console.log('DEBUG: Auth Profile not yet available')
      return
    }

    console.log('DEBUG: Starting fetch for Customer ID:', profile.id)

    try {
      // Step 1: Attempt the full join with explicit table names
      // We avoid custom aliases like 'items:' or 'product:' if they cause issues
      const { data, error, status } = await supabase
        .from('bills')
        .select(`
          *,
          bill_items (
            *,
            products (
              *
            )
          )
        `)
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('DEBUG: Primary Fetch Failed. Code:', error.code, 'Message:', error.message)

        // Step 2: Fallback to the simplest possible fetch
        console.log('DEBUG: Attempting simple fallback fetch...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('bills')
          .select('*')
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.error('DEBUG: Fallback also failed:', fallbackError.message)
        } else {
          console.log('DEBUG: Fallback succeeded. Showing basic order info.')
          setOrders(fallbackData as any || [])
        }
        return
      }

      console.log('DEBUG: Fetch successful. Records found:', data?.length)

      const mappedOrders = (data || []).map((bill: any) => {
        let items = []
        if (bill.bill_items && bill.bill_items.length > 0) {
          items = bill.bill_items.map((item: any) => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products
            return {
              ...item,
              product: product || { name: 'Unknown Product' }
            }
          })
        } else if (bill.items && Array.isArray(bill.items)) {
          items = bill.items.map((item: any) => ({
            ...item,
            product: { name: item.name || 'Unknown Product' }
          }))
        }

        return {
          ...bill,
          items
        }
      })

      setOrders(mappedOrders as any)
    } catch (err: any) {
      console.error('DEBUG: Catastrophic fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Order Status & Fulfillment</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Purchase <span className="text-blue-600 italic">History.</span></h1>
            <p className="text-slate-500 mt-3 text-lg font-medium max-w-xl">Track your orders from preparation to your doorstep with our real-time logistics engine.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Shipments</p>
              <p className="text-xl font-black text-slate-900">{orders.length}</p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
            <CardContent className="py-24 flex flex-col items-center">
              <div className="mb-8 w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center relative">
                <Package className="w-10 h-10 text-slate-300" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-4 ring-white">?</div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No Purchases Found</h2>
              <p className="text-slate-500 mb-10 max-w-sm text-center leading-relaxed">Your order history is currently empty. Start exploring our exclusive collection to place your first order.</p>
              <Link href="/customer/shop">
                <Button className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                  Begin Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="group bg-white border border-slate-100 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-blue-100/30 transition-all duration-500 overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Package className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900 uppercase">
                            ORD-{order.id.slice(0, 8)}
                          </h3>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            order.status === 'paid'
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          )}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-slate-400 font-bold mt-1 text-sm">
                          Placed on {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="h-12 w-[2px] bg-slate-100 hidden lg:block"></div>
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Value</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tight">
                          ₹{order.total_amount?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Visualizer */}
                  <div className="mb-12 bg-slate-50 rounded-[32px] p-8 md:p-10 border border-slate-100 relative overflow-hidden group/tracker">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex justify-between items-center mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipment status</p>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Express Delivery Tracking</p>
                        </div>
                      </div>
                      {order.tracking_number && (
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Tracking Number</span>
                          <span className="text-sm font-black text-blue-600 font-mono tracking-tight">{order.tracking_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="relative pt-2 pb-6 px-4">
                      <div className="absolute top-4 left-0 w-full h-1.5 bg-slate-200 rounded-full"></div>
                      <div
                        className="absolute top-4 left-0 h-1.5 bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                        style={{
                          width: (order.order_status?.toLowerCase() === 'delivered') ? '100%' :
                            (order.order_status?.toLowerCase() === 'shipped') ? '66%' :
                              (order.order_status?.toLowerCase() === 'processing') ? '33%' : '0%'
                        }}
                      ></div>

                      <div className="relative flex justify-between">
                        {['placed', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                          const currentStatus = order.order_status?.toLowerCase() || 'placed';

                          const isCompleted = currentStatus === step ||
                            (step === 'placed') ||
                            (step === 'processing' && (currentStatus === 'shipped' || currentStatus === 'delivered')) ||
                            (step === 'shipped' && currentStatus === 'delivered');

                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full z-10 border-4 transition-all duration-500",
                                isCompleted ? "bg-blue-600 border-white shadow-lg scale-110" : "bg-slate-100 border-slate-200"
                              )}></div>
                              <span className={cn(
                                "text-[10px] mt-4 font-black uppercase tracking-widest",
                                isCompleted ? "text-blue-700" : "text-slate-400"
                              )}>
                                {step}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border-t border-slate-100 pt-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Manifest & Contents</h4>
                    <div className="grid gap-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-6 p-5 rounded-[24px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group/item">
                          <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 p-2 shadow-sm transition-transform group-hover/item:scale-105">
                            {item.product?.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">NA</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-black text-slate-900 group-hover/item:text-blue-600 transition-colors">
                              {item.product?.name}
                            </p>
                            <p className="text-slate-500 font-bold text-sm mt-1">
                              {item.quantity} Unit{item.quantity > 1 ? 's' : ''} × <span className="text-slate-900">₹{item.unit_price.toLocaleString('en-IN')}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-slate-900">
                              ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
