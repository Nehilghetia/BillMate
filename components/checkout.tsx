'use client'

import React from "react"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { createCheckoutSession } from '@/app/actions/checkout'
import { useCart } from '@/lib/cart-context'
import { calculateTax } from '@/lib/tax-utils'
// import { toast } from 'sonner'
import { CreditCard, Smartphone, Landmark, Banknote, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'

interface CheckoutProps {
  items: Array<{
    productId: string
    quantity: number
    product: {
      name: string
      price: number
      category: string
    }
  }>
  discount?: number
  onSuccess?: () => void
}

export function CheckoutForm({ items, discount = 0, onSuccess }: CheckoutProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { clearCart } = useCart()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' })
  const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const totalTax = items.reduce((sum, item) => sum + (calculateTax(item.product) * item.quantity), 0)
  const shippingCharge = subtotal >= 5000 ? 0 : 150
  const total = subtotal + totalTax + shippingCharge - discount

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    if (selectedPaymentMethod === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc)) {
      toast.error('Please enter complete card details')
      return
    }
    if (selectedPaymentMethod === 'upi' && !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID')
      return
    }

    setLoading(true)
    setError(null)

    const toastId = toast.loading('Processing payment...')

    try {
      const lineItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name,
      }))

      const result = await createCheckoutSession(lineItems, user.id, totalTax, discount, selectedPaymentMethod)

      if (result.error) {
        throw new Error(result.error)
      }

      // Clear the cart
      clearCart()

      toast.dismiss(toastId)
      toast.success('Payment successful!')

      // Redirect to orders page
      router.push('/customer/orders')
    } catch (err) {
      toast.dismiss(toastId)
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed'
      setError(errorMessage)
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-2xl shadow-blue-100/30 rounded-[40px] overflow-hidden bg-white sticky top-24">
      <CardHeader className="p-8 pb-4 border-b border-slate-50">
        <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 uppercase">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          Settlement
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Manifest</p>
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center group/item"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-bold text-slate-900 truncate group-hover/item:text-blue-600 transition-colors uppercase text-sm">{item.product.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">UNIT QTY: {item.quantity}</p>
                </div>
                <p className="font-black text-slate-900 whitespace-nowrap">
                  ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-50">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net Value</span>
              <span className="font-black text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">GST Contribution</span>
              <span className="font-black text-slate-900">₹{totalTax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fulfillment</span>
              {subtotal >= 5000 ? (
                <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest text-right">Complimentary</span>
              ) : (
                <span className="font-black text-slate-900">₹150</span>
              )}
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 font-bold">
                <span className="uppercase tracking-widest text-[10px]">Applied Discount</span>
                <span>- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-3">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Investment</span>
                <span className="text-3xl font-black text-blue-600 tracking-tight">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-slate-50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Instrument</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'card', icon: CreditCard, label: 'Standard Card' },
                { id: 'upi', icon: Smartphone, label: 'Instant UPI' },
                { id: 'netbanking', icon: Landmark, label: 'Net Banking' },
                { id: 'cod', icon: Banknote, label: 'Doorstep COD' }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={cn(
                    "h-20 flex flex-col gap-2 items-center justify-center rounded-2xl transition-all border-2",
                    selectedPaymentMethod === method.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]"
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <method.icon className={cn("w-5 h-5", selectedPaymentMethod === method.id ? "text-white" : "text-slate-400")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100 ring-4 ring-white shadow-inner">
              {selectedPaymentMethod === 'card' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Universal Card Number</label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    />
                    <CreditCard className="absolute right-4 bottom-3 w-4 h-4 text-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Expiration</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Security CVC</label>
                      <input
                        type="text"
                        placeholder="•••"
                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={cardDetails.cvc}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Cardholder Entity</label>
                    <input
                      type="text"
                      placeholder="NAME ON CARD"
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    />
                  </div>
                </div>
              ) : selectedPaymentMethod === 'upi' ? (
                <div className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Enter Registered UPI ID</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                      <input
                        type="text"
                        placeholder="username@bankhost"
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 text-lg font-black focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Encrypted by Stripe Security</p>
                    </div>
                  </div>
                </div>
              ) : selectedPaymentMethod === 'netbanking' ? (
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block text-center">Select Your Bank</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'BOB'].map((bank) => (
                        <button
                          type="button"
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={cn(
                            "aspect-[3/2] rounded-xl flex items-center justify-center border-2 transition-all group",
                            selectedBank === bank
                              ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-100"
                              : "border-slate-100 bg-white hover:border-slate-300"
                          )}
                        >
                          <span className={cn(
                            "text-xs font-black uppercase transition-colors",
                            selectedBank === bank ? "text-blue-700" : "text-slate-500"
                          )}>{bank}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 relative">
                      <select
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                        onChange={(e) => setSelectedBank(e.target.value)}
                        value={selectedBank || ''}
                      >
                        <option value="" disabled>Select Other Bank</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="YES">Yes Bank</option>
                        <option value="IDFC">IDFC First Bank</option>
                        <option value="INDUS">IndusInd Bank</option>
                        <option value="UBI">Union Bank of India</option>
                      </select>
                      <div className="absolute right-4 top-[2.3rem] pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  {selectedBank && (
                    <div className="flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {selectedBank} Bank Selected
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <Banknote className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-black text-slate-900 uppercase">Doorstep Fulfillment</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Pay upon safe arrival</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-6 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white h-16 font-black text-lg shadow-2xl shadow-slate-200 rounded-[20px] transition-all active:scale-95 group"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHORIZING...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  AUTHORIZE ₹{total.toLocaleString('en-IN')}
                  <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="Stripe" />
                <div className="w-[1px] h-4 bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[2px]">PCI Compliant</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold max-w-xs text-center leading-relaxed">By authorizing this transaction, you agree to our Premium Terms of Acquisition and Fulfillment Protocols.</p>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
