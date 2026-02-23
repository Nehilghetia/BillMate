'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Upload, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

interface Promotion {
    id: string
    title: string
    description: string
    discount_percent: number
    category: string
    is_active: boolean
    banner_color: string
    image_url?: string
    created_at: string
}

export default function PromotionsPage() {
    const supabase = createClient()
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discount_percent: 30,
        category: '',
        banner_color: '#3B82F6',
        image_url: '',
    })

    useEffect(() => {
        fetchPromotions()
    }, [])

    const fetchPromotions = async () => {
        try {
            const { data } = await supabase
                .from('promotions')
                .select('*')
                .order('created_at', { ascending: false })

            setPromotions(data || [])
        } catch (error) {
            console.error('Error fetching promotions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                await supabase
                    .from('promotions')
                    .update(formData)
                    .eq('id', editingId)
                toast.success('Promotion updated successfully')
            } else {
                await supabase.from('promotions').insert([formData])
                toast.success('Promotion created successfully')
            }

            setShowForm(false)
            setEditingId(null)
            setFormData({
                title: '',
                description: '',
                discount_percent: 30,
                category: '',
                banner_color: '#3B82F6',
                image_url: '',
            })
            fetchPromotions()
        } catch (error) {
            toast.error('Failed to save promotion')
            console.error('Error saving promotion:', error)
        }
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await supabase
                .from('promotions')
                .update({ is_active: !currentStatus })
                .eq('id', id)

            setPromotions(promotions.map(p =>
                p.id === id ? { ...p, is_active: !currentStatus } : p
            ))
            toast.success(`Promotion ${!currentStatus ? 'activated' : 'deactivated'}`)
        } catch (error) {
            toast.error('Failed to update promotion status')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promotion?')) return

        try {
            await supabase.from('promotions').delete().eq('id', id)
            setPromotions(promotions.filter(p => p.id !== id))
            toast.success('Promotion deleted successfully')
        } catch (error) {
            toast.error('Failed to delete promotion')
        }
    }

    const handleEdit = (promotion: Promotion) => {
        setFormData({
            title: promotion.title,
            description: promotion.description,
            discount_percent: promotion.discount_percent,
            category: promotion.category,
            banner_color: promotion.banner_color,
            image_url: promotion.image_url || '',
        })
        setEditingId(promotion.id)
        setShowForm(true)
    }

    return (
        <div className="p-8 lg:p-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                <div>
                    <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full mb-3">
                        <Tag className="w-3 h-3 text-pink-600" />
                        <span className="text-pink-700 text-[10px] font-black tracking-widest uppercase">Promotions Control</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                        Promotions <span className="text-blue-600 italic">Manager.</span>
                    </h1>
                    <p className="text-slate-500 text-lg font-medium">Control category discounts and promotional banners</p>
                </div>
                <Button
                    onClick={() => {
                        setShowForm(!showForm)
                        setEditingId(null)
                        setFormData({
                            title: '',
                            description: '',
                            discount_percent: 30,
                            category: '',
                            banner_color: '#3B82F6',
                            image_url: '',
                        })
                    }}
                    className="h-14 px-8 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 group"
                >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    {showForm ? 'Cancel' : 'Add Promotion'}
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white mb-8">
                    <CardHeader className="p-8 pb-4 border-b border-slate-50">
                        <CardTitle className="text-2xl font-black text-slate-900">
                            {editingId ? 'Edit Promotion' : 'Create New Promotion'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                        Promotion Title *
                                    </label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Mobile Mania"
                                        required
                                        className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        className="w-full h-14 px-4 bg-slate-50 text-slate-900 font-bold text-base border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Physical">Physical Products</option>
                                        <option value="Digital">Digital Products</option>
                                        <option value="Services">Services</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                    Promotion Image
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.image_url ? (
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 relative group">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-6 h-6 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                            <ImageIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="flex items-center justify-center w-full h-20 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl cursor-pointer transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                    <Upload className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Click to upload image</div>
                                                    <div className="text-xs font-medium text-slate-400">JPG, PNG, WebP up to 5MB</div>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return

                                                    try {
                                                        const fileExt = file.name.split('.').pop()
                                                        const fileName = `${Math.random()}.${fileExt}`
                                                        const { error: uploadError } = await supabase.storage
                                                            .from('promotions')
                                                            .upload(fileName, file)

                                                        if (uploadError) throw uploadError

                                                        const { data } = supabase.storage
                                                            .from('promotions')
                                                            .getPublicUrl(fileName)

                                                        setFormData({ ...formData, image_url: data.publicUrl })
                                                        toast.success('Image uploaded successfully')
                                                    } catch (error) {
                                                        toast.error('Failed to upload image')
                                                        console.error(error)
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the promotion..."
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                        Discount Percentage *
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.discount_percent}
                                        onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                                        required
                                        className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                                        Banner Color
                                    </label>
                                    <div className="flex gap-4">
                                        <Input
                                            type="color"
                                            value={formData.banner_color}
                                            onChange={(e) => setFormData({ ...formData, banner_color: e.target.value })}
                                            className="h-14 w-20 bg-slate-50 border-none rounded-2xl cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={formData.banner_color}
                                            onChange={(e) => setFormData({ ...formData, banner_color: e.target.value })}
                                            placeholder="#3B82F6"
                                            className="h-14 flex-1 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 h-14 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95"
                                >
                                    {editingId ? 'Update Promotion' : 'Create Promotion'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false)
                                        setEditingId(null)
                                    }}
                                    variant="outline"
                                    className="flex-1 h-14 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-base rounded-2xl border border-slate-100"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )
            }

            {/* Promotions List */}
            {
                loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Promotions...</p>
                        </div>
                    </div>
                ) : promotions.length === 0 ? (
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
                        <CardContent className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Tag className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">No Promotions Yet</h3>
                            <p className="text-slate-500 font-medium mb-6">Create your first promotion to boost sales!</p>
                            <Button
                                onClick={() => setShowForm(true)}
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Promotion
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {promotions.map((promo) => (
                            <Card key={promo.id} className="border-none shadow-lg shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="flex-1 flex items-start gap-4">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl"
                                                style={{ backgroundColor: promo.banner_color }}
                                            >
                                                {promo.discount_percent}%
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-black text-slate-900">{promo.title}</h3>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${promo.is_active ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-slate-50 border border-slate-100 text-slate-500'}`}>
                                                        {promo.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 text-sm font-medium mb-3">{promo.description}</p>
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                                                        <Tag className="w-4 h-4 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-600">{promo.category}</span>
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
                                                        <span className="text-xs font-bold text-blue-700">{promo.discount_percent}% OFF</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => toggleActive(promo.id, promo.is_active)}
                                                className={`h-12 px-6 font-bold rounded-xl border transition-all group/btn ${promo.is_active ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-100' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'}`}
                                                variant="outline"
                                            >
                                                {promo.is_active ? (
                                                    <ToggleRight className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 mr-2" />
                                                )}
                                                {promo.is_active ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <Button
                                                onClick={() => handleEdit(promo)}
                                                className="h-12 px-6 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-xl border border-slate-100 transition-all group/btn"
                                                variant="outline"
                                            >
                                                <Edit2 className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(promo.id)}
                                                className="h-12 px-6 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold rounded-xl border border-red-100 hover:border-red-600 transition-all group/btn"
                                                variant="outline"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            }
        </div >
    )
}
