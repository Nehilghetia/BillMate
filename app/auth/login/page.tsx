'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { forceVerifyUser } from '@/app/actions/auth'
import { sendLoginNotification } from '@/app/actions/auth-email'
import { sendCustomMagicLink } from '@/app/actions/auth-magic'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  // Login Method State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')

  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // UI States
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false) // New state to keep spinner during nav
  const [loadingText, setLoadingText] = useState('Logging in...') // Dynamic feedback
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [verificationFixing, setVerificationFixing] = useState(false)

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) setMessage(msg)
  }, [searchParams])

  // Helper to handle successful session
  const handleSessionSuccess = async (user: any) => {
    setLoadingText('Checking permissions...')
    try {
      const userId = user.id

      // Send login notification
      if (user.email) {
        sendLoginNotification(user.email).catch(console.error)
      }

      // 1. FAST PATH: Check user_metadata first (set during signup)
      const metaRole = user.user_metadata?.role
      console.log('[v0] Login Metadata Role:', metaRole)

      if (metaRole === 'admin') {
        setLoadingText('Redirecting to Admin Dashboard...')
        setRedirecting(true)
        router.refresh()
        router.push('/admin/dashboard')
        return
      } else if (metaRole === 'customer') {
        setLoadingText('Redirecting to Home...')
        setRedirecting(true)
        router.refresh()
        router.push('/')
        return
      }

      // 2. SLOW PATH: If metadata missing, fetch from database (fallback)
      console.log('[v0] Metadata missing, fetching profile from DB...')
      setLoadingText('Fetching account details...')

      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 10000)
      )

      const profilePromise = supabase
        .from('users')
        .select('user_type')
        .eq('auth_id', userId)
        .single()

      // Race against timeout
      const result: any = await Promise.race([profilePromise, timeoutPromise])
      const { data: userProfile, error: profileError } = result

      console.log('[v0] Login Profile Check:', { userProfile, profileError, userId })

      if (profileError) {
        console.warn('[v0] Profile fetch error:', profileError)
        setLoadingText('Redirecting...')
        setRedirecting(true)
        router.refresh()
        router.push('/')
        return
      }

      if (userProfile?.user_type === 'admin') {
        setLoadingText('Accessing Admin Panel...')
        setRedirecting(true)
        router.refresh()
        router.push('/admin/dashboard')
      } else {
        setLoadingText('Entering Store...')
        setRedirecting(true)
        router.refresh()
        router.push('/')
      }
    } catch (profileErr) {
      console.error('[v0] Profile check error:', profileErr)
      // Fallback redirect
      setLoadingText('Redirecting...')
      setRedirecting(true)
      router.refresh()
      router.push('/')
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingText('Verifying credentials...')
    setError(null)
    setVerificationFixing(false)

    try {
      if (!email || !password) {
        setError('Please enter email and password')
        setLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error('[v0] Auth login error:', authError)

        // Handle Email Not Confirmed Error by trying to force confirm via Server Action
        if (authError.message?.includes('Email not confirmed')) {
          console.warn('[v0] Email not confirmed. Attempting auto-fix via admin API...')
          setVerificationFixing(true)
          setLoadingText('Verifying email address...')

          try {
            await forceVerifyUser(email)
            setVerificationFixing(false)
            setMessage('Account verified! Please click Sign In again.')
            setLoading(false)
            return
          } catch (fixErr) {
            console.error('[v0] Auto-verification failed:', fixErr)
            setError('Email not confirmed. Please use OTP login or contact support.')
            setLoading(false)
            return
          }
        }

        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('Email or password is incorrect. If you haven\'t created an account yet, please sign up first.')
        }

        throw authError
      }

      if (!data?.user?.id) {
        throw new Error('Login failed - no user data returned')
      }

      await handleSessionSuccess(data.user)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login'
      console.error('[v0] Login error:', errorMessage)
      setError(errorMessage)
      setLoading(false) // Ensure loading is off on error
    } finally {
      if (!verificationFixing && !redirecting) {
        // Only stop loading if NOT redirecting and NOT fixing
        // NOTE: redirecting state update might happen in async, so we might need a ref or check state differently.
        // Actually, setRedirecting(true) happens before return.
        // But state updates are batched/async.
        // However, 'finally' runs after 'handleSessionSuccess' PROMISE resolves.
        // 'handleSessionSuccess' sets redirecting to true.
        // We can't easily check 'redirecting' state variable here immediately?
        // Actually, we can just NOT set loading false in finally, but instead set it false in catch blocks of the callees.
        // I moved setLoading(false) to catch/error blocks above.
      }
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email) {
        setError('Please enter your email address')
        setLoading(false)
        return
      }

      // Use custom server action to bypass Supabase Email limits
      const result = await sendCustomMagicLink(email)

      if (result.error) {
        throw new Error(result.error)
      }

      setOtpSent(true)
      setMessage('Magic Link sent! Check your email to login.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email || !otp) {
        setError('Please enter email and OTP')
        setLoading(false)
        return
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (verifyError) throw verifyError

      if (!data?.user?.id) {
        throw new Error('Verification failed - no user data returned')
      }

      await handleSessionSuccess(data.user)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid OTP'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe] p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 opacity-10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>

      <Card className="w-full max-w-md shadow-2xl shadow-blue-100/50 border-none bg-white rounded-[40px] overflow-hidden relative z-10">
        <CardHeader className="space-y-4 text-center pb-6 pt-12 px-10">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="bg-blue-600 p-3 rounded-[18px] shadow-lg shadow-blue-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-4xl font-black tracking-tight text-slate-900">
            Welcome <span className="text-blue-600 italic">Back.</span>
          </CardTitle>
          <p className="text-slate-500 font-medium text-sm">Enter your credentials to access your premium account</p>
        </CardHeader>
        <CardContent className="pt-2 pb-12 px-10">

          {/* Toggle Tabs */}
          <div className="grid w-full grid-cols-2 bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-100">
            <button
              onClick={() => { setLoginMethod('password'); setError(null); setMessage(null); }}
              className={`text-sm font-bold py-3 rounded-xl transition-all duration-300 ${loginMethod === 'password'
                ? 'bg-white text-slate-900 shadow-lg shadow-slate-200'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              Password
            </button>
            <button
              onClick={() => { setLoginMethod('otp'); setError(null); setMessage(null); }}
              className={`text-sm font-bold py-3 rounded-xl transition-all duration-300 ${loginMethod === 'otp'
                ? 'bg-white text-slate-900 shadow-lg shadow-slate-200'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              Email OTP
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 border rounded-2xl text-sm font-bold flex items-center ${message.includes('OTP') ? 'bg-blue-50/50 border-blue-100 text-blue-700' : 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {message}
            </div>
          )}

          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-2xl shadow-slate-200 transition-all active:scale-95 mt-8"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
                    <span>{loadingText}</span>
                  </div>
                ) : (
                  'Access Account'
                )}
              </Button>
            </form>
          ) : (
            /* OTP Login Form */
            /* Magic Link Login Form */
            <form onSubmit={otpSent ? (e) => e.preventDefault() : handleSendOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email-otp">
                  Email Address
                </label>
                <Input
                  id="email-otp"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={otpSent}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner disabled:opacity-50"
                />
              </div>

              {otpSent && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </div>
                  <h3 className="text-blue-900 font-bold text-lg">Magic Link Sent!</h3>
                  <p className="text-blue-700 text-sm">
                    We've sent a login link to <strong>{email}</strong>.
                    <br />Click the link in the email to sign in instantly.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOtpSent(false)}
                    className="mt-2 text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-100"
                  >
                    Send to different email
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!otpSent && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-2xl shadow-slate-200 transition-all active:scale-95 mt-8"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
                      <span>Sending Link...</span>
                    </div>
                  ) : (
                    'Send Magic Link'
                  )}
                </Button>
              )}
            </form>
          )}

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-black tracking-widest">Or</span>
              </div>
            </div>

            <div className="mt-8 text-center text-sm">
              <p className="text-slate-500 font-medium">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-black text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <p className="text-xs font-black text-blue-900 mb-2 uppercase tracking-wide">First time here?</p>
              <p className="text-xs text-blue-600 font-medium leading-relaxed">
                Create a test account to explore BillMate. You can choose to be a Business Admin or Customer during signup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
