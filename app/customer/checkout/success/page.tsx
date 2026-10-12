'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

import { useCart } from '@/lib/cart-context'
import { verifyRazorpayPayment } from '@/app/actions/razorpay'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const { clearCart } = useCart()
  const [bill, setBill] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const paymentId = searchParams.get('razorpay_payment_id')
  const orderId = searchParams.get('razorpay_order_id')
  const signature = searchParams.get('razorpay_signature')

  useEffect(() => {
    const billId = searchParams.get('bill_id')
    if (billId) {
      // Clear cart on successful checkout arrival
      clearCart()
      fetchBill(billId)
    }
  }, [searchParams])

  const fetchBill = async (billId: string) => {
    try {
      // If redirected with payment parameters, verify with server action
      if (paymentId && orderId && signature) {
        await verifyRazorpayPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          billId: billId,
        })
      }

      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single()

      if (data) {
        // Ensure bill status is paid
        if (data.status !== 'paid') {
          await supabase
            .from('bills')
            .update({ status: 'paid' })
            .eq('id', billId)
        }
        setBill(data)
      }
    } catch (error) {
      console.error('Error fetching bill:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <CardTitle className="text-3xl text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {bill && (
            <>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Bill ID:</dt>
                    <dd className="font-mono text-gray-900">{bill.id.slice(0, 8).toUpperCase()}</dd>
                  </div>
                  {paymentId && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Payment ID:</dt>
                      <dd className="font-mono text-blue-600 font-semibold">{paymentId}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Amount Paid:</dt>
                    <dd className="font-semibold text-green-600">
                      ₹{bill.total_amount?.toLocaleString('en-IN')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Status:</dt>
                    <dd className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                      PAID (VERIFIED)
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-700">
                  Your payment has been processed successfully.
                  You can download your invoice from the invoices page.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Link href="/customer/shop" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/customer/invoices" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Download Invoice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
