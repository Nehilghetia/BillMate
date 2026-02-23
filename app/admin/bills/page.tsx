'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { X, Package, IndianRupee, User, Calendar } from 'lucide-react'

interface BillItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  products?: {
    name: string
  }
}

interface Bill {
  id: string
  customer_id: string
  total_amount: number
  status: string
  created_at: string
  bill_items: BillItem[]
}

export default function BillsPage() {
  const supabase = createClient()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      // Fetch bills first
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })

      if (billsError) {
        console.error('Error fetching bills:', billsError)
        setLoading(false)
        return
      }

      if (!billsData || billsData.length === 0) {
        setBills([])
        setLoading(false)
        return
      }

      // Try to fetch bill_items for each bill
      const billsWithItems = await Promise.all(
        billsData.map(async (bill) => {
          try {
            const { data: items } = await supabase
              .from('bill_items')
              .select('id, product_id, quantity, unit_price')
              .eq('bill_id', bill.id)

            // Try to get product names
            const itemsWithProducts = await Promise.all(
              (items || []).map(async (item) => {
                try {
                  const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', item.product_id)
                    .single()

                  return {
                    ...item,
                    products: product || { name: 'Unknown Product' }
                  }
                } catch {
                  return {
                    ...item,
                    products: { name: 'Unknown Product' }
                  }
                }
              })
            )

            return {
              ...bill,
              bill_items: itemsWithProducts
            }
          } catch (error) {
            console.log('Error fetching items for bill:', bill.id, error)
            return {
              ...bill,
              bill_items: []
            }
          }
        })
      )

      setBills(billsWithItems)
    } catch (error) {
      console.error('Error in fetchBills:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1">Manage all customer bills</p>
        </div>
        <Link href="/admin/bills/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            + Create Bill
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No bills created yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Bill ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {bill.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {bill.customer_id?.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {bill.bill_items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    ₹{bill.total_amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getBillStatusColor(bill.status)}`}
                    >
                      {bill.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(bill.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBill(bill)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                Bill Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBill(null)}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bill ID</p>
                  <p className="font-mono font-semibold">{selectedBill.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                  <p className="font-mono font-semibold">{selectedBill.customer_id?.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getBillStatusColor(selectedBill.status)}`}>
                    {selectedBill.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-semibold">{new Date(selectedBill.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Items ({selectedBill.bill_items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedBill.bill_items && selectedBill.bill_items.length > 0 ? (
                    selectedBill.bill_items.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{item.products?.name || 'Product'}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-blue-600">
                          ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items in this bill</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">
                    ₹{selectedBill.total_amount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
