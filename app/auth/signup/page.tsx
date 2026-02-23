'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerNewUser } from '@/app/actions/signup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  // supabase client not needed for server action signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'customer' | 'admin'>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      // Call Server Action to register user (bypasses email sending limits)
      const result = await registerNewUser(email, password, fullName, role)

      if (result.success) {
        console.log('[v0] User created via Server Action:', result.user.id)

        setError(null)
        // Redirect to login with success message
        router.push('/auth/login?message=Account created! You can now login.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup'
      console.error('[v0] Signup error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe] p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 opacity-10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>

      <Card className="w-full max-w-md shadow-2xl shadow-blue-100/50 border-none bg-white rounded-[40px] overflow-hidden relative z-10">
        <CardHeader className="space-y-4 text-center pb-6 pt-12 px-10">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="bg-blue-600 p-3 rounded-[18px] shadow-lg shadow-blue-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-4xl font-black tracking-tight text-slate-900">
            Join <span className="text-blue-600 italic">BillMate.</span>
          </CardTitle>
          <p className="text-slate-500 font-medium text-sm">Create your premium account to get started</p>
        </CardHeader>
        <CardContent className="pt-2 pb-12 px-10">
          <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100/50 text-blue-700 rounded-2xl text-xs">
            <p className="font-black mb-2 flex items-center uppercase tracking-wide">
              <span className="bg-blue-600 text-white text-[9px] px-2 py-1 rounded-lg mr-2 font-black">TIP</span>
              Testing Signup
            </p>
            <p className="font-medium text-blue-600">Use different email addresses for each signup attempt to avoid rate limits.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="fullName">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alexander Hamilton"
                required
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
            </div>

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
              <p className="text-[10px] text-slate-400 font-medium ml-1">Must be at least 6 characters long</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="role">
                Account Type
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'customer' | 'admin')}
                  className="w-full h-14 px-4 py-2 bg-slate-50 text-slate-900 font-bold text-base border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none transition-all shadow-inner"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Business Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="block text-xs mb-1 uppercase tracking-wide">Registration Failed</span>
                  {error}
                </div>
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
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <p className="text-slate-500 font-medium">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-black text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
