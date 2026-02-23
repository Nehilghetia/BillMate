'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useToast } from '@/lib/toast-context'
import { ShopHeader } from '@/components/shop-header'
import { Search, SlidersHorizontal, ArrowUpDown, Check, Filter, ShoppingBag, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price?: number
  discount_percent?: number
  category: string
  images?: string[]
}

export default function ShopPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [categories, setCategories] = useState<string[]>([])

  const { addToCart } = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, searchQuery, selectedCategory, sortBy])

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const rawProducts = (data || []).map((p: any) => {
        // Calculate original price based on DB discount
        if (p.discount_percent && p.discount_percent > 0) {
          return {
            ...p,
            original_price: Math.round(p.price / (1 - p.discount_percent / 100))
          }
        }
        return p
      })
      setProducts(rawProducts)

      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(rawProducts.map((p: any) => p.category).filter(Boolean))] as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...products]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory)
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price)
    }

    setFilteredProducts(result)
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    toast.success(`${product.name} added to cart`)
  }

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    // Prepare checkout data for the single product
    const checkoutItem = {
      productId: product.id,
      quantity: 1,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images
      }
    }
    localStorage.setItem('checkoutData', JSON.stringify({ cart: [checkoutItem], discount: 0 }))
    router.push('/checkout')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Promotional Banner Section */}
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-8 md:p-12 shadow-2xl shadow-blue-200/50 group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left max-w-xl">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full mb-4 border border-white/10">
                Exclusive Deal
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                Upgrade Your Tech <br />
                <span className="text-blue-200">Save up to 30%</span>
              </h1>
              <p className="text-blue-100/80 text-sm md:text-base mb-8 max-w-md">
                Experience the next generation of performance. Limited time offer on all premium electronics and office hardware.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Button className="bg-white text-blue-800 hover:bg-blue-50 font-bold rounded-xl h-12 px-8 transition-transform hover:scale-105 active:scale-95">
                  Shop Now
                </Button>
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-700 bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800 shadow-lg group-hover:translate-x-1 transition-transform">
                      {i}0%
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-blue-700 bg-white flex items-center justify-center text-[10px] font-bold text-blue-800 shadow-lg">
                    +
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex-shrink-0 hidden md:block group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-blue-400 blur-[80px] opacity-20"></div>
              <div className="relative w-72 h-72 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 flex items-center justify-center rotate-3 group-hover:rotate-6 transition-all">
                <ShoppingBag className="w-32 h-32 text-white/20" />
                <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl text-blue-900 font-bold rotate-12 flex flex-col items-center">
                  <span className="text-xs opacity-50">Starts at</span>
                  <span className="text-2xl">₹999</span>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-white opacity-[0.03] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-400 opacity-[0.05] rounded-full blur-3xl"></div>
        </div>

        {/* Header Section with Search and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/50 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-20 z-30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-slate-50 border-none h-11 ring-offset-transparent focus-visible:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <select
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Filters</h2>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Categories</h3>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {cat}
                      {selectedCategory === cat && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-[400px] border border-slate-100"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-6 h-6 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">No products match your filters</h2>
                <p className="text-slate-500 mt-2">Try adjusting your search or category selection.</p>
                <Button
                  variant="link"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="text-blue-600 mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full border-none shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-100">
                    <Link href={`/product/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-50">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                          <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                          <span className="text-xs font-semibold uppercase tracking-widest opacity-40">No Image</span>
                        </div>
                      )}
                      {product.discount_percent && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg z-10 animate-bounce">
                          SAVE {product.discount_percent}%
                        </div>
                      )}
                    </Link>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1 block">
                          {product.category || 'General'}
                        </span>
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {product.name}
                        </CardTitle>
                      </div>

                      <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-slate-50">
                        <div className="flex flex-col mb-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Price</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-slate-900">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            {product.original_price && (
                              <span className="text-xs text-slate-400 line-through font-medium">
                                ₹{product.original_price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            onClick={(e) => handleBuyNow(e, product)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 shadow-md shadow-blue-100 transition-all active:scale-95"
                          >
                            Buy Now
                          </Button>
                          <Button
                            variant="outline"
                            onClick={(e) => handleAddToCart(e, product)}
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-xl h-11 px-6 transition-all active:scale-95"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
