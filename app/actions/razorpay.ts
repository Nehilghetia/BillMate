'use server'

import { createClient } from '@supabase/supabase-js'
import { getRazorpayInstance } from '@/lib/razorpay'
import { sendOrderConfirmationEmail } from '@/lib/email'
import crypto from 'crypto'


interface LineItem {
  productId: string
  quantity: number
  price: number
  name: string
}

export async function createRazorpayOrder(
  lineItems: LineItem[],
  userId: string,
  calculatedTax: number,
  discount: number = 0,
  paymentMethod: string = 'razorpay'
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Validate user
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name, phone')
      .eq('auth_id', userId)
      .single()

    if (!userData) {
      return { error: 'User record not found in database' }
    }

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const taxAmount = calculatedTax
    const totalAmount = Math.max(0, subtotal + taxAmount - discount)
    const billNumber = `BILL-${Date.now()}`

    // Insert bill in Supabase
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert({
        bill_number: billNumber,
        customer_id: userData.id,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discount,
        total_amount: totalAmount,
        status: 'pending',
        order_status: 'Placed',
        payment_method: paymentMethod,
        created_by: userData.id,
      })
      .select('id')
      .single()

    if (billError) {
      console.error('Bill creation error:', billError)
      return { error: `Failed to create bill: ${billError.message}` }
    }

    // Insert bill line items
    const billItems = lineItems.map((item) => ({
      bill_id: billData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
      tax_rate: 18.0,
    }))

    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems)

    if (itemsError) {
      console.error('Bill items creation error:', itemsError)
      return { error: `Failed to create bill items: ${itemsError.message}` }
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id'
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret_key'
    const paysimSecretKey = process.env.PAYSIM_SECRET_KEY || (keySecret.startsWith('sk_test_') ? keySecret : null)
    const paysimApiUrl = process.env.PAYSIM_API_URL || process.env.NEXT_PUBLIC_PAYSIM_URL || 'http://localhost:3001'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

    // Priority 1: PaySim Sandbox Gateway Integration
    if (paysimSecretKey) {
      try {
        // 1. Create order in PaySim sandbox
        const orderRes = await fetch(`${paysimApiUrl}/api/v1/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paysimSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: billNumber,
            notes: {
              billId: billData.id,
              userId: userId,
              customerEmail: userData.email,
              paymentMethod: paymentMethod,
            },
          }),
        })

        const orderData = await orderRes.json()
        if (!orderRes.ok || !orderData.id) {
          throw new Error(orderData.error || 'Failed to create PaySim order')
        }

        // 2. Create hosted checkout session in PaySim
        const sessionRes = await fetch(`${paysimApiUrl}/api/v1/checkout-sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paysimSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderData.id,
            return_url: `${appUrl}/customer/checkout/success?bill_id=${billData.id}`,
            cancel_url: `${appUrl}/checkout`,
          }),
        })

        const sessionData = await sessionRes.json()
        if (!sessionRes.ok || !sessionData.id) {
          throw new Error(sessionData.error || 'Failed to create PaySim checkout session')
        }

        // Ensure checkoutUrl points to the reachable PaySim host
        let checkoutUrl = sessionData.checkout_url
        if (checkoutUrl) {
          try {
            const urlObj = new URL(checkoutUrl)
            const targetObj = new URL(paysimApiUrl)
            urlObj.protocol = targetObj.protocol
            urlObj.host = targetObj.host
            checkoutUrl = urlObj.toString()
          } catch {}
        }

        return {
          orderId: orderData.id,
          sessionId: sessionData.id,
          checkoutUrl: checkoutUrl,
          amount: totalAmount,
          currency: 'INR',
          keyId: process.env.NEXT_PUBLIC_PAYSIM_PUBLIC_KEY || keyId,
          billId: billData.id,
          billNumber: billNumber,
          userEmail: userData.email,
          userName: userData.full_name || userData.email.split('@')[0],
          userPhone: userData.phone || '',
          gateway: 'paysim',
        }
      } catch (paysimErr: any) {
        console.error('PaySim Integration Error:', paysimErr)
        return { error: `Payment Gateway Error: ${paysimErr.message}` }
      }
    }

    let razorpayOrderId = `order_${Date.now()}`

    // If using real Razorpay credentials (rzp_*), create order via SDK
    if (keySecret !== 'mock_razorpay_secret_key' && keyId.startsWith('rzp_')) {
      try {
        const razorpay = getRazorpayInstance()
        const order = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // convert to paise
          currency: 'INR',
          receipt: billNumber,
          notes: {
            billId: billData.id,
            userId: userId,
          },
        })
        razorpayOrderId = order.id
      } catch (rzpErr: any) {
        console.error('Razorpay SDK Order Error:', rzpErr)
        const detailedMessage =
          rzpErr?.error?.description ||
          rzpErr?.error?.reason ||
          rzpErr?.description ||
          rzpErr?.message ||
          'Invalid Razorpay API credentials or network failure'

        if (
          rzpErr?.statusCode === 401 ||
          detailedMessage.toLowerCase().includes('auth') ||
          detailedMessage.toLowerCase().includes('id provided does not exist') ||
          detailedMessage.toLowerCase().includes('invalid')
        ) {
          console.warn('Razorpay key authentication failed on API server. Falling back to test authorization mode.', detailedMessage)
          return {
            orderId: `order_test_${Date.now()}`,
            amount: totalAmount,
            currency: 'INR',
            keyId: 'rzp_test_mock_key_id',
            billId: billData.id,
            billNumber: billNumber,
            userEmail: userData.email,
            userName: userData.full_name || userData.email.split('@')[0],
            userPhone: userData.phone || '',
            authWarning: `Razorpay Key Auth Failed ("${detailedMessage}"). Using Test Authorization Mode.`
          }
        }

        return { error: `Razorpay Order Error: ${detailedMessage}` }
      }
    }



    return {
      orderId: razorpayOrderId,
      amount: totalAmount,
      currency: 'INR',
      keyId: keyId,
      billId: billData.id,
      billNumber: billNumber,
      userEmail: userData.email,
      userName: userData.full_name || userData.email.split('@')[0],
      userPhone: userData.phone || '',
    }
  } catch (err: any) {
    console.error('Unexpected error in createRazorpayOrder:', err)
    return { error: err.message || 'An unexpected error occurred during Razorpay order setup' }
  }
}

export async function verifyRazorpayPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  billId,
  paymentMethod = 'razorpay',
}: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  billId: string
  paymentMethod?: string
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret_key'
    const paysimSecretKey = process.env.PAYSIM_SECRET_KEY || (secret.startsWith('sk_test_') ? secret : null)
    const paysimApiUrl = process.env.PAYSIM_API_URL || process.env.NEXT_PUBLIC_PAYSIM_URL || 'http://localhost:3001'

    // If PaySim is used
    if (paysimSecretKey && razorpayPaymentId) {
      try {
        const verifyRes = await fetch(`${paysimApiUrl}/api/v1/payments/${razorpayPaymentId}/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paysimSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: razorpayOrderId,
            payment_id: razorpayPaymentId,
            signature: razorpaySignature,
          }),
        })

        const verifyData = await verifyRes.json()
        if (!verifyRes.ok || !verifyData.verified) {
          // If remote verification fails, fallback to local cryptographic check
          const generatedSignature = crypto
            .createHmac('sha256', paysimSecretKey)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex')

          if (razorpaySignature && generatedSignature !== razorpaySignature) {
            return { success: false, error: verifyData.error || 'Invalid payment cryptographic signature' }
          }
        }
      } catch (err: any) {
        console.warn('PaySim remote verify failed, verifying signature locally:', err.message)
        const generatedSignature = crypto
          .createHmac('sha256', paysimSecretKey)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex')

        if (razorpaySignature && generatedSignature !== razorpaySignature) {
          return { success: false, error: 'Invalid payment signature' }
        }
      }
    } else if (secret !== 'mock_razorpay_secret_key' && razorpaySignature) {
      // Standard Razorpay signature check
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex')

      if (generatedSignature !== razorpaySignature) {
        return { success: false, error: 'Invalid Razorpay payment signature verification' }
      }
    }

    // Update bill status to paid
    const { data: billData, error: updateError } = await supabase
      .from('bills')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', billId)
      .select('bill_number, total_amount, customer_id')
      .single()

    if (updateError) {
      console.error('Failed to update bill payment status:', updateError)
      return { success: false, error: updateError.message }
    }

    // Retrieve user email for confirmation email
    if (billData?.customer_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', billData.customer_id)
        .single()

      if (userData?.email) {
        await sendOrderConfirmationEmail(
          {
            bill_number: billData.bill_number,
            total_amount: billData.total_amount,
            order_status: 'Placed',
          },
          userData.email
        )
      }
    }

    return { success: true, billId }
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err)
    return { success: false, error: err.message || 'Payment verification failed' }
  }
}
