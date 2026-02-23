'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Package, Calendar, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Order {
    id: string
    total_amount: number
    status: string
    created_at: string
    items: Array<{
        id: string
        quantity: number
        unit_price: number
        product: {
            name: string
        }
    }>
}

export default function OrdersPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login?message=Please login to view orders')
        } else if (user && profile) {
            fetchOrders()
        }
    }, [user, profile, authLoading, router])

    const fetchOrders = async () => {
        try {
            if (!profile?.id) return

            const { data } = await supabase
                .from('bills')
                .select('*, items:bill_items(*, product:products(name))')
                .eq('customer_id', profile.id)
                .order('created_at', { ascending: false })

            setOrders(data as any || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="mr-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Shop
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center text-gray-900">
                        <Package className="mr-3 h-8 w-8 text-blue-600" />
                        My Orders
                    </h1>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <div className="mb-6">
                                <Package className="w-24 h-24 mx-auto text-gray-200" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
                            <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
                            <Link href="/">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Start Shopping
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gray-50 border-b py-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-bold text-gray-900">
                                                ₹{order.total_amount?.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        {order.items?.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                                        IMG
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.product?.name}</p>
                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
