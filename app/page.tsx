'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShopHeader } from '@/components/shop-header'
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Zap, Star, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast-context'

export default function LandingPage() {
  const supabase = createClient()
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    toast.success('Added to cart')
  }

  const handleBuyNow = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    router.push('/customer/checkout')
  }

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(4)

      const mocked = (data || []).map((p: any) => {
        if (p.discount_percent && p.discount_percent > 0) {
          return {
            ...p,
            original_price: Math.round(p.price / (1 - p.discount_percent / 100))
          }
        }
        return p
      })
      setFeaturedProducts(mocked)
      setLoading(false)
    }
    fetchFeatured()
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <ShopHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-white z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-8 animate-fade-in shadow-sm shadow-blue-100/50">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-[ping_1.5s_infinite]"></span>
                <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase italic">Flash Sale: Up to 30% Off</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                Quality Gear for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Premium Living.</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
                Discover our curated collection of high-performance electronics, stylish office essentials, and cutting-edge hardware designed for you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/customer/shop">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-10 rounded-2xl shadow-xl shadow-blue-200 text-lg font-bold transition-transform hover:scale-105 active:scale-95">
                    Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-600"><span className="font-bold text-slate-900">4.9/5</span> from 2k+ reviews</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="relative z-10 bg-gradient-to-br from-indigo-100/50 to-blue-100/50 rounded-[60px] p-8 backdrop-blur-3xl border border-white/50 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="aspect-[4/5] bg-white rounded-3xl shadow-sm overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Product" />
                    </div>
                    <div className="aspect-square bg-blue-600 rounded-3xl flex items-center justify-center text-white p-6 relative overflow-hidden">
                      <ShoppingBag className="w-16 h-16 opacity-20 absolute -bottom-4 -right-4 rotate-12" />
                      <div className="text-center">
                        <div className="text-2xl font-black italic">Fast</div>
                        <div className="text-xs uppercase tracking-widest opacity-80">Delivery Everywhere</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="aspect-square bg-slate-900 rounded-3xl flex items-center justify-center text-white p-6 overflow-hidden">
                      <div className="text-center font-black">
                        <div className="text-3xl text-blue-400">30%</div>
                        <div className="text-[10px] uppercase opacity-60">Weekend Sale</div>
                      </div>
                    </div>
                    <div className="aspect-[4/5] bg-white rounded-3xl shadow-sm overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Product" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative Blobs */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-[100px] z-0 animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-400 opacity-20 rounded-full blur-[120px] z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 border-y border-slate-50 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Free Shipping</h4>
                <p className="text-xs text-slate-500">Orders over ₹5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Secure Payment</h4>
                <p className="text-xs text-slate-500">Industry standard safety</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Rapid Support</h4>
                <p className="text-xs text-slate-500">24/7 dedicated assistance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Premium Sourcing</h4>
                <p className="text-xs text-slate-500">Only verified hardware</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category - Premium Deals */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full mb-6">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-red-700 text-[10px] font-black tracking-widest uppercase">Limited Time Offers</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Shop by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 italic">Category.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Explore our curated collections with exclusive discounts on premium electronics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mobile Category */}
            <Link href="/customer/shop?category=Electronics&type=mobile" className="group col-span-1 md:col-span-2 lg:col-span-1">
              <div className="relative h-[380px] rounded-[40px] overflow-hidden bg-white p-8 shadow-2xl shadow-purple-200/50 hover:shadow-purple-500/30 transition-all duration-500 group-hover:-translate-y-2">
                {/* Image Background */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1556656793-02715d8dd6f8?w=800&q=80"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt="Mobile Mania"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/60 to-purple-600/30 mix-blend-multiply"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-purple-950/80"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-4 group-hover:bg-white/20 transition-colors">
                      <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase drop-shadow-md">📱 Flagship Series</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-2 leading-[0.9] tracking-tighter drop-shadow-2xl">
                      Mobile <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">Mania.</span>
                    </h3>
                    <p className="text-purple-100/90 text-sm font-medium max-w-[280px] leading-relaxed drop-shadow-md line-clamp-2">
                      Experience the future. Featuring the new Galaxy Note & iPhone series.
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 mb-1 inline-block group-hover:bg-white/20 transition-colors">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white leading-none">30</span>
                          <span className="text-xl font-black text-white">%</span>
                        </div>
                        <div className="text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Limited Offer</div>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white text-purple-600 rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:-rotate-45 transition-all duration-500">
                      <ArrowRight className="w-6 h-6 stroke-[3px]" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Laptop Category */}
            <Link href="/customer/shop?category=Electronics&type=laptop" className="group col-span-1 md:col-span-2 lg:col-span-1">
              <div className="relative h-[380px] rounded-[40px] overflow-hidden bg-white p-8 shadow-2xl shadow-blue-200/50 hover:shadow-blue-500/30 transition-all duration-500 group-hover:-translate-y-2">
                {/* Image Background */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt="Laptop Deals"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/60 to-blue-600/30 mix-blend-multiply"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-transparent to-blue-950/80"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-4 group-hover:bg-white/20 transition-colors">
                      <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase drop-shadow-md">💻 Pro Workstations</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-2 leading-[0.9] tracking-tighter drop-shadow-2xl">
                      Laptop <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Deals.</span>
                    </h3>
                    <p className="text-blue-100/90 text-sm font-medium max-w-[280px] leading-relaxed drop-shadow-md line-clamp-2">
                      Unleash creativity with ultimate power and portability.
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 mb-1 inline-block group-hover:bg-white/20 transition-colors">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white leading-none">30</span>
                          <span className="text-xl font-black text-white">%</span>
                        </div>
                        <div className="text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Student Offer</div>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:-rotate-45 transition-all duration-500">
                      <ArrowRight className="w-6 h-6 stroke-[3px]" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Additional Categories Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <Link href="/customer/shop?category=Physical" className="group">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📦</span>
                </div>
                <h4 className="font-black text-slate-900 mb-1">Physical</h4>
                <p className="text-xs text-slate-500">Products</p>
              </div>
            </Link>
            <Link href="/customer/shop?category=Digital" className="group">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💾</span>
                </div>
                <h4 className="font-black text-slate-900 mb-1">Digital</h4>
                <p className="text-xs text-slate-500">Downloads</p>
              </div>
            </Link>
            <Link href="/customer/shop?category=Services" className="group">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h4 className="font-black text-slate-900 mb-1">Services</h4>
                <p className="text-xs text-slate-500">Solutions</p>
              </div>
            </Link>
            <Link href="/customer/shop" className="group">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-black text-white mb-1">View All</h4>
                <p className="text-xs text-white/60">Browse catalog</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 italic">Trending Items</h2>
              <p className="text-slate-500">Our currently most popular picks for you.</p>
            </div>
            <Link href="/customer/shop" className="text-blue-600 font-bold hover:underline flex items-center">
              View All Catalog <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-[400px] bg-slate-50 rounded-[32px] animate-pulse"></div>
              ))
            ) : (
              featuredProducts.map((p) => (
                <Card key={p.id} className="group border-none shadow-none bg-transparent overflow-visible">
                  <Link href={`/product/${p.id}`} className="block relative aspect-[3/4] rounded-[32px] overflow-hidden bg-slate-50 mb-4 transition-transform group-hover:-translate-y-2 ring-1 ring-slate-100">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-6 hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <ShoppingBag className="w-16 h-16 opacity-30" />
                      </div>
                    )}
                    {p.discount_percent && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg z-10 animate-bounce">
                        -{p.discount_percent}%
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-blue-600 shadow-sm border border-blue-100">
                        {p.category}
                      </span>
                    </div>
                  </Link>
                  <CardContent className="p-0">
                    <Link href={`/product/${p.id}`} className="block">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">{p.name}</h3>
                    </Link>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                        {p.original_price && (
                          <span className="text-xs text-slate-400 line-through font-medium leading-none">₹{p.original_price.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <Button
                          onClick={(e) => handleBuyNow(e, p)}
                          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-lg shadow-blue-200"
                        >
                          Buy Now
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => handleAddToCart(e, p)}
                          className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold h-10"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[60px] p-12 md:p-24 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
              Ready to redefine <br /> your <span className="text-blue-500">lifestyle?</span>
            </h2>
            <Link href="/customer/shop">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-16 px-12 rounded-[24px] text-xl font-bold shadow-2xl transition-transform hover:scale-110">
                Explore The Shop
              </Button>
            </Link>
          </div>
          {/* Fun elements */}
          <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
          <div className="absolute bottom-10 right-10 w-3 h-3 rounded-full bg-indigo-500 animate-bounce"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xl font-black text-blue-600 italic">BILLMATE.</span>
            <p className="text-slate-400 text-xs mt-2 text-center md:text-left">© 2026 BillMate Store. Premium Retail Redefined.</p>
          </div>
          <div className="flex items-center gap-8 text-slate-400 text-sm font-bold uppercase tracking-widest">
            <Link href="/customer/shop" className="hover:text-blue-600 transition-colors">Shop</Link>
            <Link href="/customer/orders" className="hover:text-blue-600 transition-colors">Orders</Link>
            <Link href="/customer/profile" className="hover:text-blue-600 transition-colors">Account</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
