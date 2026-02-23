'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

interface ProductFormProps {
  editingId?: string | null
  onClose: () => void
  onSuccess: () => void
}

export function ProductForm({ editingId, onClose, onSuccess }: ProductFormProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    model_name: '',
    color: '',
    warranty: '',
    return_policy: '',
    discount_percent: 0,
    images: [] as string[],
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingId) {
      fetchProduct()
    }
  }, [editingId])

  const fetchProduct = async () => {
    if (!editingId) return
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', editingId)
        .single()

      if (data) {
        setFormData({
          name: data.name,
          description: data.description,
          price: data.price.toString(),
          category: data.category,
          model_name: data.model_name || '',
          color: data.color || '',
          warranty: data.warranty || '',
          return_policy: data.return_policy || '',
          discount_percent: data.discount_percent || 0,
          images: data.images || [],
        })
        setImagePreviews(data.images || [])
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      toast.error('Failed to load product details')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setImageFiles(prev => [...prev, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    if (formData.images[index]) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // For now, we'll use the preview URLs as image URLs
      // In production, you'd upload to a storage service like Supabase Storage or Cloudinary
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        model_name: formData.model_name,
        color: formData.color,
        warranty: formData.warranty,
        return_policy: formData.return_policy,
        discount_percent: parseInt(formData.discount_percent.toString()),
        images: imagePreviews.length > 0 ? imagePreviews : formData.images,
      }

      if (editingId) {
        const { error, data } = await supabase.from('products').update(productData).eq('id', editingId)
        if (error) {
          console.error('Supabase UPDATE error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(error.message || 'Failed to update product')
        }
        toast.success('Product updated successfully!')
      } else {
        const { error, data } = await supabase.from('products').insert([productData])
        if (error) {
          console.error('Supabase INSERT error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(error.message || 'Failed to add product')
        }
        toast.success('Product added successfully!')
      }

      onSuccess()
    } catch (err: any) {
      console.error('Error saving product:', {
        error: err,
        message: err?.message,
        stack: err?.stack
      })
      const errorMessage = err?.message || 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
      <CardHeader className="p-8 pb-4 border-b border-slate-50">
        <CardTitle className="text-2xl font-black text-slate-900">
          {editingId ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
              Product Images
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-2xl border-2 border-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-600">Click to upload images</p>
                <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Product Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., iPhone 15 Pro Max"
                required
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Model Name
              </label>
              <Input
                type="text"
                value={formData.model_name}
                onChange={(e) =>
                  setFormData({ ...formData, model_name: e.target.value })
                }
                placeholder="e.g., A2894"
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed product description..."
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              rows={4}
              required
            />
          </div>

          {/* Price, Discount, Category, Color */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Price (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                required
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Discount (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={(e) =>
                  setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full h-14 px-4 bg-slate-50 text-slate-900 font-bold text-base border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                required
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Services">Services</option>
                <option value="Physical">Physical Products</option>
                <option value="Digital">Digital Products</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Color
              </label>
              <Input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="e.g., Space Black"
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>
          </div>

          {/* Warranty & Return Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Warranty
              </label>
              <Input
                type="text"
                value={formData.warranty}
                onChange={(e) =>
                  setFormData({ ...formData, warranty: e.target.value })
                }
                placeholder="e.g., 1 Year Manufacturer Warranty"
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
                Return Policy
              </label>
              <Input
                type="text"
                value={formData.return_policy}
                onChange={(e) =>
                  setFormData({ ...formData, return_policy: e.target.value })
                }
                placeholder="e.g., 7 Days Replacement Policy"
                className="h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-base"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-14 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95"
            >
              {loading
                ? 'Saving...'
                : editingId
                  ? 'Update Product'
                  : 'Add Product'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
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
