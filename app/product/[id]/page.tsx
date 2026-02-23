'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, Truck, ShieldCheck, Star, MessageSquare, Info, CheckCircle2, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'
import { ShopHeader } from '@/components/shop-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'

interface Product {
    id: string
    name: string
    description: string
    price: number
    original_price?: number
    discount_percent?: number
    category: string
    sku?: string
    tax_rate?: number
    images?: string[]
}

export default function ProductPage() {
    const params = useParams()
    const supabase = createClient()
    const { addToCart } = useCart()
    const { toast } = useToast()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)

    useEffect(() => {
        if (params.id) {
            fetchProduct(params.id as string)
        }
    }, [params.id])

    const [reviews, setReviews] = useState<any[]>([])
    const [isReviewing, setIsReviewing] = useState(false)
    const [userRating, setUserRating] = useState(5)
    const [userComment, setUserComment] = useState('')

    // Generate deterministic reviews based on product ID
    const getMockReviews = (productId: string) => {
        const users = ['Rahul Sharma', 'Sneha Patel', 'Vijay Singh', 'Anjali Gupta', 'Vikram Malhotra', 'Priya Deshmukh', 'Amit Verma', 'Kavita Reddy']
        const comments = [
            'Amazing quality! Highly recommended for this price point.',
            'Very good product, but delivery took a little long. Otherwise great.',
            'Exactly as shown in pictures. Premium build quality.',
            'Worth every penny. Will buy again!',
            'Decent product, but expected better packaging.',
            'Superb performance and looks stunning.',
            'Customer support was very helpful. Product is solid.',
            'Best in class features at this price range.'
        ]

        // Simple hash function for consistent generation
        let hash = 0
        for (let i = 0; i < productId.length; i++) {
            hash = ((hash << 5) - hash) + productId.charCodeAt(i)
            hash |= 0
        }

        const numReviews = 3 + (Math.abs(hash) % 4) // 3 to 6 reviews
        const generatedReviews = []

        for (let i = 0; i < numReviews; i++) {
            const userIndex = (Math.abs(hash) + i) % users.length
            const commentIndex = (Math.abs(hash) + i) % comments.length
            const rating = 3 + ((Math.abs(hash) + i) % 3) // 3 to 5 stars

            generatedReviews.push({
                id: i + 1,
                user: users[userIndex],
                rating: rating,
                comment: comments[commentIndex],
                date: `${(i + 1) * 2} days ago`
            })
        }

        return generatedReviews
    }

    useEffect(() => {
        if (params.id) {
            const productId = params.id as string
            const savedReviews = localStorage.getItem(`reviews_${productId}`)

            if (savedReviews) {
                setReviews(JSON.parse(savedReviews))
            } else {
                const initialReviews = getMockReviews(productId)
                setReviews(initialReviews)
                localStorage.setItem(`reviews_${productId}`, JSON.stringify(initialReviews))
            }
        }
    }, [params.id])

    const fetchProduct = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error

            const productData = data as Product

            // Calculate original price based on discount_percent from DB
            if (productData.discount_percent && productData.discount_percent > 0) {
                productData.original_price = Math.round(productData.price / (1 - productData.discount_percent / 100))
            }

            if (!productData.images || productData.images.length === 0) {
                if (productData.category.toLowerCase().includes('electronics') || productData.name.toLowerCase().includes('laptop')) {
                    productData.images = [
                        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
                        'https://images.unsplash.com/photo-1517336713481-48c918a50404?w=800',
                        'https://images.unsplash.com/photo-1525547718511-ad74d4a8d40d?w=800'
                    ]
                } else {
                    productData.images = [
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
                    ]
                }
            }
            setProduct(productData)
        } catch (error) {
            console.error('Error fetching product:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <ShopHeader />
                <div className="flex-1 flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
                    <Link href="/">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const mockSpecs = [
        { name: 'Model Name', value: product.name },
        { name: 'Category', value: product.category },
        { name: 'Color', value: 'Original / Brand Specific' },
        { name: 'Warranty', value: '1 Year Manufacturer Warranty' },
        { name: 'Return Policy', value: '7 Days Replacement Policy' }
    ]


    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault()
        if (!userComment.trim() || !product) return

        const newReview = {
            id: reviews.length + 1,
            user: 'You', // In a real app, this would be the logged-in user's name
            rating: userRating,
            comment: userComment,
            date: 'Just now'
        }

        const updatedReviews = [newReview, ...reviews]
        setReviews(updatedReviews)
        localStorage.setItem(`reviews_${product.id}`, JSON.stringify(updatedReviews))

        setIsReviewing(false)
        setUserComment('')
        setUserRating(5)
        toast.success('Review submitted successfully!')
    }

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0'

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col">
            <ShopHeader />

            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/customer/shop" className="inline-flex items-center text-sm font-bold text-blue-600 mb-8 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
                    </Link>

                    {/* Main Product Section */}
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 overflow-hidden border border-slate-100 mb-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Image Gallery Section */}
                            <div className="bg-slate-50/50 p-6 lg:p-12">
                                <div className="flex flex-col gap-6">
                                    <div className="aspect-square bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm relative group">
                                        <img
                                            src={product.images?.[selectedImageIndex]}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 left-6">
                                            <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">New Arrival</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {product.images?.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImageIndex(idx)}
                                                className={cn(
                                                    "w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 p-2 transition-all flex-shrink-0 shadow-sm hover:shadow-md",
                                                    selectedImageIndex === idx ? "border-blue-600 translate-y-[-4px]" : "border-slate-100 opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${product.name} shadow view`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-8 lg:p-12 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[2px]">
                                        {product.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Star className="w-4 h-4 fill-yellow-400" />
                                        <span className="text-slate-900 font-bold ml-1">{averageRating}</span>
                                        <span className="text-slate-400 text-xs font-medium">({reviews.length} Reviews)</span>
                                    </div>
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                                    {product.name}
                                </h1>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Price</span>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-5xl font-black text-blue-600">
                                                ₹{product.price.toLocaleString('en-IN')}
                                            </span>
                                            {product.original_price && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-red-500 uppercase tracking-tighter">Save {product.discount_percent}%</span>
                                                    <span className="text-xl font-medium text-slate-400 line-through">
                                                        ₹{product.original_price.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-12 w-[2px] bg-slate-100 mx-2"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-[2px]">Stock</span>
                                        <span className="text-lg font-bold text-green-700 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Ready to Ship
                                        </span>
                                    </div>
                                </div>

                                <p className="text-slate-500 text-lg leading-relaxed mb-10 border-l-4 border-blue-500 pl-6 bg-blue-50/30 py-4 rounded-r-2xl">
                                    {product.description}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4">
                                            <Truck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">Free Shipping</p>
                                            <p className="text-xs text-slate-500">Fast home delivery</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4">
                                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">Verified Security</p>
                                            <p className="text-xs text-slate-500">100% Secure Transaction</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                                    <Button
                                        onClick={() => {
                                            if (product) {
                                                addToCart(product)
                                                toast.success(`${product.name} added to cart`)
                                            }
                                        }}
                                        className="h-16 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[20px] shadow-xl shadow-blue-200 transition-all active:scale-95 text-lg"
                                    >
                                        <ShoppingCart className="w-5 h-5 mr-3" /> Add To Cart
                                    </Button>
                                    <Link href="/cart" className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="h-16 w-full border-2 border-slate-900 hover:bg-slate-900 hover:text-white font-black rounded-[20px] transition-all active:scale-95 text-lg"
                                            onClick={() => { if (product) addToCart(product) }}
                                        >
                                            Quick Buy
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info Tabs Section */}
                    <div className="max-w-4xl mx-auto">
                        <Tabs defaultValue="specs" className="w-full">
                            <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full h-auto flex gap-1 mb-8 overflow-x-auto">
                                <TabsTrigger value="specs" className="flex-1 py-3 font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Info className="w-4 h-4 mr-2" /> Specifications
                                </TabsTrigger>
                                <TabsTrigger value="reviews" className="flex-1 py-3 font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <MessageSquare className="w-4 h-4 mr-2" /> User Reviews
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="specs" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-black text-slate-900 mb-6">Technical Specifications</h3>
                                    <div className="grid grid-cols-1 gap-1">
                                        {mockSpecs.map((spec, i) => (
                                            <div key={i} className={cn(
                                                "flex items-center justify-between p-4 rounded-xl",
                                                i % 2 === 0 ? "bg-slate-50/50" : ""
                                            )}>
                                                <span className="text-slate-500 font-medium text-sm uppercase tracking-wider">{spec.name}</span>
                                                <span className="text-slate-900 font-bold">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="bg-blue-600 p-8 rounded-[32px] text-white flex flex-col items-center shadow-lg shadow-blue-200">
                                        <h3 className="text-4xl font-black mb-2 tracking-tighter">{averageRating} / 5</h3>
                                        <div className="flex gap-1 mb-4">
                                            {[1, 2, 3, 4].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                                            <Star className="w-5 h-5 fill-white opacity-20 text-white" />
                                        </div>
                                        <p className="text-blue-100 text-sm font-medium">Based on {reviews.length} verified customer feedbacks</p>
                                    </div>

                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-6 group">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-slate-900">{review.user}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.date}</span>
                                                </div>
                                                <div className="flex gap-0.5 mb-4">
                                                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                                                </div>
                                                <p className="text-slate-500 leading-relaxed text-sm italic">"{review.comment}"</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-slate-900 p-8 rounded-[32px] text-center">
                                        {!isReviewing ? (
                                            <>
                                                <h4 className="text-white font-bold mb-2">Bought this already?</h4>
                                                <p className="text-slate-400 text-sm mb-6">Share your feedback and help others decide!</p>
                                                <Button
                                                    onClick={() => setIsReviewing(true)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl font-bold px-8 h-12 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                                >
                                                    Write A Review
                                                </Button>
                                            </>
                                        ) : (
                                            <form onSubmit={handleSubmitReview} className="text-left space-y-4">
                                                <h4 className="text-white font-bold mb-4 text-center">Rate this Product</h4>

                                                <div className="flex justify-center gap-2 mb-6">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setUserRating(star)}
                                                            className="transition-transform active:scale-90"
                                                        >
                                                            <Star
                                                                className={cn(
                                                                    "w-8 h-8 transition-colors",
                                                                    star <= userRating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
                                                                )}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>

                                                <div>
                                                    <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Your Feedback</label>
                                                    <textarea
                                                        value={userComment}
                                                        onChange={(e) => setUserComment(e.target.value)}
                                                        placeholder="What did you like or dislike about this product?"
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32 resize-none"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex gap-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => setIsReviewing(false)}
                                                        className="flex-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl font-bold"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl font-bold h-12"
                                                    >
                                                        Post Review
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
