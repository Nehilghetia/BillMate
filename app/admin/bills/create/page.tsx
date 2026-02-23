'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
}

interface BillItem {
  productId: string
  quantity: number
  product?: Product
}

export default function CreateBillPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name')

      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const addItem = () => {
    setBillItems([
      ...billItems,
      { productId: '', quantity: 1 },
    ])
  }

  const removeItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...billItems]
    updated[index] = { ...updated[index], [field]: value }
    setBillItems(updated)
  }

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.price || 0) * item.quantity
    }, 0)
  }

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!customerEmail) {
        throw new Error('Customer email is required')
      }

      if (billItems.length === 0) {
        throw new Error('Add at least one item to the bill')
      }

      const billItemsWithDetails = billItems.map((item) => ({
        ...item,
        productId: item.productId,
        price: products.find((p) => p.id === item.productId)?.price || 0,
        name: products.find((p) => p.id === item.productId)?.name || '',
      }))

      const totalAmount = calculateTotal()

      // Get or create customer
      let { data: customer } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single()

      let userId = customer?.id

      if (!userId) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            email: customerEmail,
            full_name: customerEmail.split('@')[0],
            role: 'customer',
          })
          .select('id')
          .single()

        userId = newUser?.id
      }

      // Create bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          user_id: userId,
          customer_email: customerEmail,
          amount: totalAmount,
          status: 'pending',
          items: billItemsWithDetails,
        })
        .select('id')
        .single()

      if (billError) throw billError

      router.push('/admin/bills')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const total = calculateTotal()

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/admin/bills" className="text-blue-600 hover:underline mb-4 block">
          ← Back to Bills
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Bill</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleCreateBill} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email *
                  </label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bill Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billItems.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          updateItem(index, 'productId', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseInt(e.target.value))
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Qty"
                        required
                      />

                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    + Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating Bill...' : 'Create Bill'}
              </Button>
              <Link href="/admin/bills" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Items:</p>
                  {billItems.length === 0 ? (
                    <p className="text-gray-600 text-sm">No items added</p>
                  ) : (
                    <ul className="space-y-1 mt-2">
                      {billItems.map((item, idx) => {
                        const product = products.find((p) => p.id === item.productId)
                        return (
                          <li key={idx} className="text-sm text-gray-600">
                            {product?.name || 'Unknown'} x {item.quantity}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
