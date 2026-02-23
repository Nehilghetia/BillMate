'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, ArrowLeft, ShoppingCart, Trash2, Ticket, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { calculateTax, getTaxRatePercent } from '@/lib/tax-utils'
import { useToast } from '@/lib/toast-context'
import { ShopHeader } from '@/components/shop-header'

export default function CartPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart()
    const { toast } = useToast()

    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

    const applyCoupon = () => {
        setIsApplyingCoupon(true)
        // Mock coupon logic
        setTimeout(() => {
            if (couponCode.toUpperCase() === 'SAVE20') {
                setDiscount(cartTotal * 0.2)
                toast.success('Coupon applied! You saved 20%')
            } else if (couponCode.toUpperCase() === 'FIRST100') {
                setDiscount(100)
                toast.success('₹100 discount applied!')
            } else {
                toast.error('Invalid coupon code')
                setDiscount(0)
            }
            setIsApplyingCoupon(false)
        }, 800)
    }

    const handleCheckout = () => {
        if (!user) {
            router.push('/auth/login?message=Please login to checkout')
            return
        }
        // Store cart data in localStorage to avoid URL length issues
        localStorage.setItem('checkoutData', JSON.stringify({ cart, discount }))
        router.push('/checkout')
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col pb-20">
            <ShopHeader />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Checkout Readiness</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Shopping <span className="text-blue-600 italic">Cart.</span></h1>
                            <p className="text-slate-500 mt-3 text-lg font-medium max-w-xl">Review your selected premium products and prepare for a seamless acquisition experience.</p>
                        </div>

                        <Link href="/customer/shop">
                            <Button variant="ghost" className="h-12 px-6 rounded-xl text-slate-500 font-bold hover:bg-slate-50 border border-slate-100">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
                            </Button>
                        </Link>
                    </div>

                    {cart.length === 0 ? (
                        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
                            <CardContent className="py-24 flex flex-col items-center text-center">
                                <div className="mb-8 w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center relative">
                                    <ShoppingCart className="w-10 h-10 text-slate-300" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-4 ring-white">0</div>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Your Cart is Empty</h2>
                                <p className="text-slate-500 mb-10 max-w-xs leading-relaxed">It looks like you haven't added any premium gear to your collection yet.</p>
                                <Link href="/customer/shop">
                                    <Button className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                                        Start Exploring
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                            {/* Items List */}
                            <div className="lg:col-span-8 space-y-6">
                                {cart.map((item) => (
                                    <div key={item.productId} className="group bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all duration-500">
                                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                                            <div className="w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 p-3 shadow-inner border border-slate-50 group-hover:scale-105 transition-transform">
                                                {item.product.images?.[0] ? (
                                                    <img
                                                        src={item.product.images[0]}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <ShoppingCart className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 text-center sm:text-left">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.product.category}</span>
                                                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-200"></span>
                                                    <span className="text-[10px] font-bold text-slate-400 capitalize">{getTaxRatePercent(item.product)} GST</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {item.product.name}
                                                </h3>
                                                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</span>
                                                        <span className="text-lg font-black text-slate-900">₹{item.product.price.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="h-8 w-[1px] bg-slate-100"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Impact</span>
                                                        <span className="text-lg font-black text-blue-600">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col items-center gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50 w-full sm:w-auto">
                                                <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm"
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-4 h-4 text-slate-600" />
                                                    </Button>
                                                    <span className="w-10 text-center font-black text-slate-900">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm"
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-4 w-4 text-slate-600" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        removeFromCart(item.productId)
                                                        toast.info('Item removed from cart')
                                                    }}
                                                    className="w-full text-red-400 hover:text-red-500 hover:bg-red-50 font-bold rounded-xl"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary & Checkout */}
                            <div className="lg:col-span-4 space-y-6">
                                <Card className="border-none shadow-2xl shadow-blue-100/30 rounded-[32px] overflow-hidden bg-white sticky top-24">
                                    <CardHeader className="p-8 pb-4 border-b border-slate-50">
                                        <CardTitle className="text-xl font-black text-slate-900 uppercase">Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal Cost</span>
                                                <span className="font-black text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Taxes & Levies</span>
                                                <span className="font-black text-slate-900">₹{cart.reduce((sum, item) => sum + (calculateTax(item.product) * item.quantity), 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Delivery Charge</span>
                                                {cartTotal >= 5000 ? (
                                                    <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Free Fulfillment</span>
                                                ) : (
                                                    <span className="font-black text-slate-900">₹150</span>
                                                )}
                                            </div>
                                            {discount > 0 && (
                                                <div className="flex justify-between items-center text-sm bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                                                    <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">Coupon Discount</span>
                                                    <span className="font-black text-emerald-600 whitespace-nowrap">- ₹{discount.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Coupon Section */}
                                        <div className="pt-4 border-t border-slate-50 space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coupons & Invitations</p>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        placeholder="Coupon code"
                                                        className="pl-9 h-11 bg-slate-50 border-none rounded-xl text-sm font-bold focus-visible:ring-blue-500/20"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={applyCoupon}
                                                    disabled={isApplyingCoupon || !couponCode}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-6 font-bold text-xs"
                                                >
                                                    {isApplyingCoupon ? '...' : 'Apply'}
                                                </Button>
                                            </div>
                                            {discount > 0 && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    PROMO CODE ACTIVE
                                                </div>
                                            )}
                                            <p className="text-[9px] text-slate-400 font-bold italic">Try "SAVE20" for 20% off!</p>
                                        </div>

                                        <div className="pt-6 border-t border-slate-50 flex flex-col gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Investment</p>
                                            <div className="flex justify-between items-end">
                                                <span className="text-3xl font-black text-blue-600 tracking-tight">₹{(
                                                    cartTotal +
                                                    cart.reduce((sum, item) => sum + (calculateTax(item.product) * item.quantity), 0) +
                                                    (cartTotal >= 5000 ? 0 : 150) -
                                                    discount
                                                ).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleCheckout}
                                            className="w-full bg-slate-900 hover:bg-blue-600 h-14 text-lg font-black rounded-2xl mt-4 shadow-xl shadow-slate-200 transition-all active:scale-95 group"
                                        >
                                            Complete Order
                                            <ArrowLeft className="ml-2 h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                                        </Button>

                                        {cartTotal < 5000 && (
                                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black text-blue-700">
                                                    <span>FREE FULFILLMENT TARGET</span>
                                                    <span>{Math.round((cartTotal / 5000) * 100)}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden text-[0px]">
                                                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, (cartTotal / 5000) * 100)}%` }}>.</div>
                                                </div>
                                                <p className="text-[9px] text-blue-600 font-bold leading-tight">
                                                    Add <span className="font-black underline">₹{(5000 - cartTotal).toLocaleString('en-IN')}</span> more to unlock complimentary fulfillment.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-center gap-2 pt-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Secure Logistics & Payment</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
