'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductForm } from '@/components/product-form'
import { Package, Plus, Edit2, Trash2, Tag, IndianRupee } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  created_at: string
}

export default function ProductsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, forceDelete = false) => {
    if (!forceDelete) {
      // First check if product is used in any orders
      const { data: billItems } = await supabase
        .from('bill_items')
        .select('id')
        .eq('product_id', id)
        .limit(1)

      if (billItems && billItems.length > 0) {
        const confirmForce = confirm(
          'This product is used in existing orders.\n\n' +
          'Click OK to FORCE DELETE (will remove from all orders)\n' +
          'Click Cancel to keep the product'
        )

        if (confirmForce) {
          return handleDelete(id, true) // Recursive call with force=true
        }
        return
      }
    }

    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      // If force delete, remove from bill_items first
      if (forceDelete) {
        const { error: itemsError } = await supabase
          .from('bill_items')
          .delete()
          .eq('product_id', id)

        if (itemsError) {
          console.error('Error deleting bill items:', itemsError)
          toast.error('Failed to remove product from orders')
          return
        }
      }

      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase delete error:', error)
        throw new Error(error.message || 'Failed to delete product')
      }

      setProducts(products.filter((p) => p.id !== id))
      toast.success('Product deleted successfully')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      const errorMessage = error?.message || 'Failed to delete product'
      toast.error(errorMessage)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingId(null)
    fetchProducts()
  }

  return (
    <div className="p-8 lg:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
            <Package className="w-3 h-3 text-blue-600" />
            <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Product Catalog</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
            Products <span className="text-blue-600 italic">Management.</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Manage your complete product inventory</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="h-14 px-8 bg-slate-900 hover:bg-blue-600 text-white font-black text-base rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          Add Product
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ProductForm
            onClose={handleFormClose}
            editingId={editingId}
            onSuccess={() => {
              setShowForm(false)
              setEditingId(null)
              fetchProducts()
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Products...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
          <CardContent className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Products Yet</h3>
            <p className="text-slate-500 font-medium mb-6">Create your first product to get started!</p>
            <Button
              onClick={() => setShowForm(true)}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <Card key={product.id} className="border-none shadow-lg shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Package className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-900 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{product.category}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-black text-emerald-700">
                          {product.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setEditingId(product.id)
                        setShowForm(true)
                      }}
                      className="h-12 px-6 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-xl border border-slate-100 transition-all group/btn"
                      variant="outline"
                    >
                      <Edit2 className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(product.id)}
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
      )}
    </div>
  )
}
