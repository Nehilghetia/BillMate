'use client'

import { useEffect, useState } from 'react'
import { CheckoutForm } from '@/components/checkout'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ShopHeader } from '@/components/shop-header'
import { cn } from '@/lib/utils'

interface CartItem {
    productId: string
    quantity: number
    product: {
        name: string
        price: number
        category: string
    }
}

export default function CheckoutPage() {
    const [items, setItems] = useState<CartItem[]>([])
    const [discount, setDiscount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Read from localStorage instead of URL params
        const checkoutData = localStorage.getItem('checkoutData')

        if (checkoutData) {
            try {
                const { cart, discount: savedDiscount } = JSON.parse(checkoutData)
                setItems(cart || [])
                setDiscount(savedDiscount || 0)
            } catch (error) {
                console.error('Error parsing checkout data:', error)
            }
        }

        setLoading(false)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                    <p className="text-gray-600 mb-8">Add items to your cart to proceed to checkout.</p>
                    <Link href="/">
                        <Button>Start Shopping</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col pb-20">
            <ShopHeader />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Secure Acquisition</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Finalize <span className="text-blue-600 italic">Order.</span></h1>
                            <p className="text-slate-500 mt-3 text-lg font-medium max-w-xl">Enter your logistics details and select a preferred payment instrument to complete your premium acquisition.</p>
                        </div>

                        <Link href="/cart">
                            <Button variant="ghost" className="h-12 px-6 rounded-xl text-slate-500 font-bold hover:bg-slate-50 border border-slate-100 transition-all group">
                                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Cart
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-7 space-y-8">
                            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                        <ArrowLeft className="w-6 h-6 rotate-90" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase">Logistics & Billing</h2>
                                </div>

                                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Legal Name</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Alexander Hamilton"
                                            className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Communication Email</label>
                                        <input
                                            type="email"
                                            placeholder="alex@premium.com"
                                            className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Residential/Business Address</label>
                                        <input
                                            type="text"
                                            placeholder="123 Luxury Avenue, Suite 400"
                                            className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">City</label>
                                        <input
                                            type="text"
                                            placeholder="Metropolis"
                                            className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Postal Identifier</label>
                                        <input
                                            type="text"
                                            placeholder="000 001"
                                            className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="bg-blue-600 rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black mb-2">Premium Fulfillment</h3>
                                    <p className="text-blue-100/80 text-sm max-w-md">Your order is eligible for priority dispatch. Our logistics engine will ensure doorstep delivery within 48-72 business hours.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <CheckoutForm items={items} discount={discount} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
