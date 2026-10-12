'use client'

import React from "react"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpay'
import { useCart } from '@/lib/cart-context'
import { calculateTax } from '@/lib/tax-utils'
import { CreditCard, ArrowLeft } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

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

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as any).Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function CheckoutForm({ items, discount = 0, onSuccess }: CheckoutProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { clearCart } = useCart()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedPaymentMethod = 'razorpay'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Preload Razorpay checkout script
    loadRazorpayScript()
  }, [])

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


    setLoading(true)
    setError(null)

    const toastId = toast.loading('Initiating secure payment...')

    try {
      const lineItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name,
      }))


      // Razorpay payment flow (Handles Razorpay modal, UPI, Cards, NetBanking)
      const orderRes = await createRazorpayOrder(lineItems, user.id, totalTax, discount, selectedPaymentMethod)
      if (orderRes.error || !orderRes.orderId) {
        throw new Error(orderRes.error || 'Failed to generate Razorpay payment order')
      }

      if ((orderRes as any).authWarning) {
        toast.info((orderRes as any).authWarning)
      }

      toast.dismiss(toastId)

      // Priority 1: Interactive PaySim Sandbox Gateway Flow (Direct Big Screen / Full Page Redirect)
      if (orderRes.checkoutUrl) {
        toast.dismiss(toastId)
        toast.loading('Redirecting to PaySim payment gateway...')
        window.location.href = orderRes.checkoutUrl
        return
      }

      const isScriptLoaded = await loadRazorpayScript()

      // If Razorpay SDK loaded and valid key exists, launch Razorpay SDK popup
      if (isScriptLoaded && typeof (window as any).Razorpay !== 'undefined' && orderRes.keyId !== 'rzp_test_mock_key_id') {
        const options = {
          key: orderRes.keyId,
          amount: Math.round((orderRes.amount || total) * 100),
          currency: orderRes.currency || 'INR',
          name: 'BillMate',
          description: `Invoice #${orderRes.billNumber}`,
          order_id: orderRes.orderId,
          handler: async function (response: any) {
            const verifyingToast = toast.loading('Verifying Razorpay payment signature...')
            try {
              const verifyRes = await verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                billId: orderRes.billId!,
                paymentMethod: selectedPaymentMethod,
              })

              toast.dismiss(verifyingToast)

              if (verifyRes.success) {
                clearCart()
                toast.success('Payment verified & order completed successfully!')
                router.push('/customer/orders')
              } else {
                toast.error(verifyRes.error || 'Payment verification failed')
              }
            } catch (err: any) {
              toast.dismiss(verifyingToast)
              toast.error(err.message || 'Payment verification failed')
            } finally {
              setLoading(false)
            }
          },
          prefill: {
            name: orderRes.userName,
            email: orderRes.userEmail,
            contact: orderRes.userPhone,
          },
          notes: {
            billId: orderRes.billId,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment window closed')
              setLoading(false)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          toast.error(response.error?.description || 'Razorpay payment failed')
          setLoading(false)
        })
        rzp.open()
      } else {
        // Fallback for mock test mode or direct server verification
        const verifyRes = await verifyRazorpayPayment({
          razorpayOrderId: orderRes.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: '',
          billId: orderRes.billId!,
          paymentMethod: selectedPaymentMethod,
        })

        if (verifyRes.success) {
          clearCart()
          toast.success('Payment authorized (Test Mode)!')
          router.push('/customer/orders')
        } else {
          throw new Error(verifyRes.error || 'Payment authorization failed')
        }
      }
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
                  PROCESSING PAYMENT...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  PAY VIA PAYSIM ₹{total.toLocaleString('en-IN')}
                  <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 opacity-70 hover:opacity-100 transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secured by</span>
                <span className="text-xs font-black text-blue-600 tracking-wider">PAYSIM</span>
                <div className="w-[1px] h-4 bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[2px]">PCI-DSS COMPLIANT</span>
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
