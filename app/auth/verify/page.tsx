'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerifyPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Verifying your login...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        let authSubscription: any = null

        const processLogin = async () => {
            const supabase = createClient()

            // 1. Initial Check
            const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession()

            if (!mounted) return

            if (initialSession) {
                setStatus('Login successful! Redirecting...')
                setTimeout(() => { if (mounted) router.push('/') }, 1000)
                return
            }

            // 2. Manual Hash Parsing (Fallback if createClient missed the hash)
            // This is crucial for Implicit Flow stability
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                try {
                    // Parse hash params
                    const params = new URLSearchParams(hash.substring(1)) // remove #
                    const accessToken = params.get('access_token')
                    const refreshToken = params.get('refresh_token')

                    if (accessToken && refreshToken) {
                        setStatus('Manual verification...')
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        })

                        if (data.session) {
                            setStatus('Login successful! Redirecting...')
                            setTimeout(() => { if (mounted) router.push('/') }, 1000)
                            return
                        }
                        if (error) console.error('Manual setSession error:', error)
                    }
                } catch (e) {
                    console.error('Hash parsing error:', e)
                }
            }

            // 3. Subscription Listener (Standard mechanism)
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                if (!mounted) return
                if (event === 'SIGNED_IN' && session) {
                    setStatus('Login successful! Redirecting...')
                    router.push('/')
                }
            })
            authSubscription = data.subscription

            // 4. Timeout to catch "Stuck" state
            setTimeout(() => {
                if (!mounted) return

                // If still stuck "Verifying..."
                if (status.includes('Verifying')) {
                    if (window.location.hash.includes('error=')) {
                        setStatus('Link expired or invalid.')
                        setError('Please request a new link.')
                    } else {
                        // Trying one last reload if token seems present
                        if (window.location.hash.includes('access_token')) {
                            setStatus('Retrying...')
                            // Force reload to give Supabase another shot
                            // window.location.reload() 
                            // Or just show error
                            setError('Authentication stuck. Please refresh the page.')
                        } else {
                            setStatus('No login token found.')
                        }
                    }
                }
            }, 4000)
        }

        processLogin()

        return () => {
            mounted = false
            if (authSubscription) authSubscription.unsubscribe()
        }
    }, [router, status]) // Added status back to allow timeout check to see current status

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{status}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {error ? (
                        <div className="space-y-4">
                            <p className="text-red-600 font-medium bg-red-50 p-3 rounded-lg">{error}</p>
                            <Button onClick={() => router.push('/auth/login')} variant="outline" className="w-full">
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
