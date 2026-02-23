'use server'

import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { sendOrderConfirmationEmail } from '@/lib/email'

interface LineItem {
  productId: string
  quantity: number
  price: number
  name: string
}

export async function createCheckoutSession(
  lineItems: LineItem[],
  userId: string,
  calculatedTax: number,
  discount: number = 0,
  paymentMethod: string = 'card'
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Validate user
    const { data: userData } = await supabase
      .from('users')
      .select('id, email')
      .eq('auth_id', userId)
      .single()

    if (!userData) {
      return { error: 'User not found in database' }
    }

    // Create bill first
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const taxAmount = calculatedTax
    const totalAmount = subtotal + taxAmount - discount
    const billNumber = `BILL-${Date.now()}`

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert({
        bill_number: billNumber,
        customer_id: userData.id,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discount, // Added discount tracking
        total_amount: totalAmount,
        status: 'paid', // Payment status
        order_status: 'Placed', // Fulfillment status
        payment_method: paymentMethod,
        created_by: userData.id,
      })
      .select('id')
      .single()

    if (billError) {
      console.error('Bill creation error:', billError)
      return { error: `Failed to create bill: ${billError.message}` }
    }

    // Insert bill items
    const billItems = lineItems.map((item) => ({
      bill_id: billData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
      tax_rate: 18.0, // GST rate
    }))

    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems)

    if (itemsError) {
      console.error('Bill items creation error:', itemsError)
      // We log but don't fail the whole request, though ideally we should rollback
      return { error: `Failed to create bill items: ${itemsError.message}` }
    }

    // Create Stripe checkout session (if configured)
    let sessionId = null
    let clientSecret = null

    if (process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const stripeLineItems = lineItems.map((item) => ({
          price_data: {
            currency: 'inr',
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100), // Convert to paise
          },
          quantity: item.quantity,
        }))

        // Add Tax Line Item
        if (taxAmount > 0) {
          stripeLineItems.push({
            price_data: {
              currency: 'inr',
              product_data: {
                name: 'GST (18%)',
              },
              unit_amount: Math.round(taxAmount * 100),
            },
            quantity: 1,
          })
        }

        // Create Coupon for Discount if applicable
        let discounts = []
        if (discount > 0) {
          const coupon = await stripe.coupons.create({
            amount_off: Math.round(discount * 100),
            currency: 'inr',
            duration: 'once',
            name: 'Special Discount',
          })
          discounts.push({ coupon: coupon.id })
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: stripeLineItems,
          mode: 'payment',
          discounts: discounts,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/checkout/success?session_id={CHECKOUT_SESSION_ID}&bill_id=${billData.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/checkout/cancel`,
          customer_email: userData.email,
          metadata: {
            billId: billData.id,
            userId: userId,
          },
        })
        sessionId = session.id
        clientSecret = session.client_secret
      } catch (error: any) {
        console.error('Error creating Stripe session:', error)
        return { error: `Stripe error: ${error.message}` }
      }
    }

    // Send confirmation email
    if (userData.email) {
      await sendOrderConfirmationEmail({
        bill_number: billNumber,
        total_amount: totalAmount,
        order_status: 'Placed'
      }, userData.email)
    }

    return { sessionId, clientSecret, billId: billData.id }
  } catch (err: any) {
    console.error('Unexpected error in createCheckoutSession:', err)
    return { error: err.message || 'An unexpected error occurred during checkout' }
  }
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return {
    status: session.payment_status,
    paymentStatus: session.payment_status,
  }
}

export async function createPaymentIntent(amount: number, userId: string, billId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId,
        billId,
      },
    })

    return { clientSecret: paymentIntent.client_secret }
  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error)
    return { error: error.message }
  }
}
