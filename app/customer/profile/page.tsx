'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Phone, MapPin, Mail, Save, ArrowLeft, CheckCircle2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { updateUserProfile } from '@/app/actions/user'
import { useToast } from '@/lib/toast-context'
import { ShopHeader } from '@/components/shop-header'

export default function ProfilePage() {
    const { user, profile, fetchProfile, signOut, loading: authLoading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: ''
    })

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                address: profile.address || ''
            })
        }
    }, [profile])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const result = await updateUserProfile(user.id, formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Profile updated successfully!')
                await fetchProfile(user.id) // Refresh the global state
            }
        } catch (error) {
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await signOut()
            toast.success('Logged out successfully')
            router.push('/auth/login')
        } catch (error) {
            toast.error('Failed to logout')
        }
    }

    if (authLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col pb-20">
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Identity Management</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Profile <span className="text-blue-600 italic">Settings.</span></h1>
                            <p className="text-slate-500 mt-3 text-lg font-medium max-w-xl">Optimize your personal manifest and logistics preferences for a tailored acquisition experience.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button variant="ghost" className="h-12 px-6 rounded-xl text-slate-500 font-bold hover:bg-slate-50 border border-slate-100 transition-all group">
                                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Shop
                                </Button>
                            </Link>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="h-12 px-6 rounded-xl text-red-500 font-bold hover:bg-red-50 border border-red-100 transition-all group"
                            >
                                <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Logout
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Left Column: Identity Card */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-none shadow-2xl shadow-blue-100/50 rounded-[40px] overflow-hidden bg-slate-900 text-white relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-400 transition-colors duration-700"></div>
                                <CardContent className="pt-12 pb-12 flex flex-col items-center text-center relative z-10">
                                    <div className="w-28 h-28 bg-white/10 rounded-[40px] flex items-center justify-center mb-8 backdrop-blur-xl border border-white/20 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                                        <User className="w-14 h-14 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{profile?.full_name || 'Anonymous Entity'}</h2>
                                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/10">
                                        <CheckCircle2 className="w-3 h-3 text-blue-400" /> Verified Acquisitioner
                                    </div>

                                    <div className="w-full space-y-6 pt-8 border-t border-white/10 text-left px-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Digital Address</span>
                                            <span className="text-sm font-bold truncate">{user?.email}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Communication Channel</span>
                                            <span className="text-sm font-bold">{profile?.phone || 'Channel Unassigned'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Entity Location</span>
                                            <span className="text-sm font-bold">{profile?.address || 'Geolocation Pending'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Calculate Completion Percentage */}
                            {(() => {
                                let percent = 25 // Start with 25% for Account Creation
                                if (profile?.full_name) percent += 25
                                if (profile?.phone && profile.phone.length > 5) percent += 25
                                if (profile?.address && profile.address.length > 5) percent += 25

                                return (
                                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Integrity</p>
                                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden mb-4">
                                            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-500 mb-6">
                                            {percent === 100
                                                ? "Your identity manifest is fully optimized (100%). You are a verified entity."
                                                : `Your identity manifest is ${percent}% optimized. Complete your profile to reach 100%.`}
                                        </p>

                                        {percent < 100 ? (
                                            <Button
                                                onClick={() => {
                                                    const phoneInput = document.getElementById('phone')
                                                    if (phoneInput) {
                                                        phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                        phoneInput.focus()
                                                    }
                                                }}
                                                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-xl border border-slate-100 shadow-none transition-all"
                                            >
                                                Enhance Integrity
                                            </Button>
                                        ) : (
                                            <div className="w-full h-12 bg-emerald-50 text-emerald-700 font-black rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>Verified</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Right Column: Update Interface */}
                        <div className="lg:col-span-8">
                            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
                                <CardHeader className="p-10 pb-4 border-b border-slate-50">
                                    <CardTitle className="text-2xl font-black text-slate-900 uppercase">Modify Persona</CardTitle>
                                    <CardDescription className="text-slate-400 font-bold text-sm">Update your system entities for accurate logistics and billing.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 pt-8">
                                    <form onSubmit={handleSave} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label htmlFor="full_name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Alias</Label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <Input
                                                        id="full_name"
                                                        className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                                                        placeholder="Alexander Hamilton"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-slate-300">Permanent Identity (Read-only)</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200" />
                                                    <Input
                                                        id="email"
                                                        className="pl-12 h-14 bg-slate-100/50 border-none rounded-2xl text-slate-300 font-bold text-lg cursor-not-allowed italic shadow-inner"
                                                        value={user?.email || ''}
                                                        disabled
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Channel</Label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <Input
                                                        id="phone"
                                                        className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                                                        placeholder="+91 XXX XXX XXXX"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="address" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Geolocation</Label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <Input
                                                        id="address"
                                                        className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                                                        placeholder="Manhattan, NY"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 flex flex-col sm:flex-row gap-6 items-center">
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full sm:w-auto px-12 h-16 bg-slate-900 hover:bg-blue-600 text-white font-black text-lg rounded-[20px] shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                                            >
                                                {loading ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                        Syncing...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        Update Persona
                                                    </div>
                                                )}
                                            </Button>

                                            <p className="text-[10px] font-bold text-slate-400 max-w-[240px] leading-relaxed italic">
                                                Changes to your identity manifest are immediate and will be reflected in all future logistics protocols.
                                            </p>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="mt-8 bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 flex items-center gap-4 group hover:bg-blue-600 transition-all duration-500 cursor-default">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-blue-900 uppercase tracking-tight group-hover:text-white transition-colors">Enterprise Encryption Active</p>
                                    <p className="text-[10px] text-blue-500 font-bold group-hover:text-blue-100 transition-colors">Your identity manifest is protected by 256-bit AES protocols.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
