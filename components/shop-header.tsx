'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, LogOut, FileText, Store, Receipt, ShoppingBag, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'

export function ShopHeader() {
    const { user, profile, signOut } = useAuth()
    const router = useRouter()
    const { cart } = useCart()

    const handleLogout = async () => {
        await signOut()
        router.push('/auth/login')
    }

    return (
        <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-[100] border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Left side: Logo and Main Nav */}
                    <div className="flex items-center space-x-12">
                        <Link href="/" className="flex items-center shrink-0 group">
                            <div className="bg-blue-600 p-2 rounded-[14px] mr-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-200">
                                <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                BillMate <span className="text-blue-600 italic">Store.</span>
                            </span>
                        </Link>

                        <div className="hidden lg:flex items-center space-x-8">
                            <Link href="/customer/shop" className="group flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-all duration-300">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-blue-50 transition-colors">
                                    <Store className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                </div>
                                Shop
                            </Link>
                            <Link href="/customer/invoices" className="group flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-all duration-300">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-blue-50 transition-colors">
                                    <Receipt className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                </div>
                                Invoices
                            </Link>
                        </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex items-center gap-4">
                        <Link href="/cart">
                            <Button
                                variant="ghost"
                                className="relative bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 h-11 px-5 rounded-xl border border-transparent hover:border-blue-100 transition-all group lg:min-w-[110px]"
                            >
                                <ShoppingCart className="w-4 h-4 md:mr-2 transition-transform group-hover:-translate-y-0.5" />
                                <span className="hidden md:inline font-bold">Cart</span>
                                {cart.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md">
                                        {cart.reduce((a, b) => a + b.quantity, 0)}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link href="/customer/orders" className="hidden sm:block">
                                    <Button variant="ghost" className="h-11 px-5 rounded-xl text-slate-500 font-bold hover:bg-slate-50">
                                        <FileText className="mr-2 h-4 w-4" /> My Orders
                                    </Button>
                                </Link>

                                <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden md:block"></div>

                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="hidden sm:flex h-11 px-4 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 font-bold"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span className="hidden xl:inline">Logout</span>
                                </Button>

                                <Link href="/customer/profile" className="flex items-center gap-3 pl-3 md:border-l border-slate-100 group">
                                    <div className="hidden xl:flex flex-col items-end group-hover:opacity-70 transition-opacity">
                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider truncate max-w-[120px]">
                                            {profile?.full_name || user.email?.split('@')[0]}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                                            {user.email}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 bg-white p-0.5 rounded-full ring-2 ring-slate-100 group-hover:ring-blue-600 transition-all overflow-hidden shadow-sm">
                                        <div className="w-full h-full bg-blue-50 text-blue-600 rounded-full flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white">
                                            <User className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/auth/login">
                                    <Button variant="ghost" className="h-11 px-6 rounded-xl text-slate-600 font-bold">Login</Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button className="h-11 px-8 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95">
                                        Join Now
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
