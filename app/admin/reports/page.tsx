'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
}

export default function ReportsPage() {
  const supabase = createClient()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateReport()
  }, [])

  const generateReport = async () => {
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        supabase.from('bills').select('*').eq('status', 'paid'), // Use paid bills for reports
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'customer'),
        supabase.from('products').select('name, id'),
      ])

      const orders = ordersData.data || []
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate top products
      const productMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {}

      orders.forEach((order) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            if (!productMap[item.productId]) {
              productMap[item.productId] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
              }
            }
            productMap[item.productId].quantity += item.quantity
            productMap[item.productId].revenue += item.price * item.quantity
          })
        }
      })

      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setReport({
        totalRevenue,
        totalOrders,
        totalCustomers: customersData.count || 0,
        averageOrderValue,
        topProducts,
      })
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Business performance metrics</p>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{report.totalRevenue.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {report.totalOrders}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {report.totalCustomers}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{report.averageOrderValue.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Products</CardTitle>
            </CardHeader>
            <CardContent>
              {report.topProducts.length === 0 ? (
                <p className="text-gray-600">No product sales yet</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Quantity Sold
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((product, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.quantity} units
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          ₹{product.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
