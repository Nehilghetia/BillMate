import 'server-only'
import Razorpay from 'razorpay'

export function getRazorpayInstance() {
  const key_id = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key_id').trim()
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret_key').trim()

  return new Razorpay({
    key_id,
    key_secret,
  })
}
