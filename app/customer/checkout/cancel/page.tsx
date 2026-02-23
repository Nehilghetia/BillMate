import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">✕</div>
          <CardTitle className="text-3xl text-red-600">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-center">
            Your payment has been cancelled. Your items remain in your cart.
          </p>

          <div className="flex gap-3">
            <Link href="/customer/shop" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/customer/checkout" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Return to Checkout
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
