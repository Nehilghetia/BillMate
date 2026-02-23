'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Download, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ShopHeader } from '@/components/shop-header'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  bill_id: string
  total_amount: number
  status: string
  created_at: string
  items?: Array<{
    id: string
    quantity: number
    unit_price: number
    product: {
      name: string
      images?: string[]
    }
  }>
}

export default function InvoicesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (profile) {
      fetchInvoices()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [profile, authLoading])

  const fetchInvoices = async () => {
    if (!profile) {
      console.log('DEBUG: Auth Profile not yet available (Invoices)')
      return
    }

    console.log('DEBUG: Fetching invoices for Customer ID:', profile.id)

    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          bill_items (
            *,
            products (*)
          )
        `)
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('DEBUG: Invoice Fetch Failed. Code:', error.code, 'Message:', error.message)

        // Fallback to simple fetch
        const { data: simpleData } = await supabase
          .from('bills')
          .select('id, total_amount, status, created_at')
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false })

        if (simpleData) {
          console.log('DEBUG: Fallback invoices loaded.')
          setInvoices(simpleData.map((b: any) => ({ ...b, bill_id: b.id })) as any)
        }
        return
      }

      // Map the data to match the UI interface
      const mappedInvoices = (data || []).map((bill: any) => ({
        ...bill,
        bill_id: bill.id,
        items: (bill.bill_items || []).map((item: any) => ({
          ...item,
          product: item.products || { name: 'Unknown Product' }
        }))
      }))

      console.log('DEBUG: Invoices loaded successfully:', mappedInvoices.length)
      setInvoices(mappedInvoices as any)
    } catch (error: any) {
      console.error('DEBUG: Unexpected invoice fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      console.log(`Downloading PDF for invoice ${invoiceId}`)
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?download=true`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to download PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-blue-700 text-[10px] font-black tracking-widest uppercase">Transaction History</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">My <span className="text-blue-600 italic">Invoices.</span></h1>
            <p className="text-slate-500 mt-3 text-lg font-medium max-w-xl">Keep track of your premium hardware acquisitions and professional investments in one place.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Documents</p>
              <p className="text-xl font-black text-slate-900">{invoices.length}</p>
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
            <CardContent className="py-24 flex flex-col items-center">
              <div className="mb-8 w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center relative">
                <FileText className="w-10 h-10 text-slate-300" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-4 ring-white">?</div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No Transactions Found</h2>
              <p className="text-slate-500 mb-10 max-w-sm text-center leading-relaxed">It looks like you haven't started your premium journey yet. Explore our catalog to find the perfect gear.</p>
              <Link href="/customer/shop">
                <Button className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                  Explore Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="group relative bg-white border border-slate-100 rounded-[32px] p-6 md:p-8 hover:shadow-2xl hover:shadow-blue-100/30 transition-all duration-500 overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 opacity-0 group-hover:opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-opacity"></div>

                <div className="relative flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                  {/* Branding & Status */}
                  <div className="flex-1 lg:max-w-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-slate-900 uppercase">
                            DOC-{invoice.id.slice(0, 8)}
                          </h3>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            invoice.status === 'paid'
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : invoice.status === 'pending'
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-slate-50 text-slate-600 border border-slate-100"
                          )}>
                            {invoice.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                          Generated on {new Date(invoice.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {invoice.items && invoice.items.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {invoice.items.slice(0, 2).map((item, idx) => (
                          <span key={idx} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-100">
                            {item.product.name}
                          </span>
                        ))}
                        {invoice.items.length > 2 && (
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-100">
                            + {invoice.items.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex -space-x-4 items-center pl-4 lg:pl-0">
                    {invoice.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="h-14 w-14 rounded-2xl ring-[6px] ring-white bg-white overflow-hidden shadow-sm border border-slate-100 group-hover:-translate-y-1 transition-transform" style={{ transitionDelay: `${idx * 50}ms` }}>
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400 font-bold bg-slate-50">
                            {item.product.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Amount Section */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-50 min-w-[160px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 lg:text-right">Transaction Total</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                      ₹{invoice.total_amount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 lg:w-32 border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded-[14px] font-bold transition-all"
                      onClick={() => handleDownloadPDF(invoice.bill_id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      className="flex-1 lg:w-32 bg-slate-900 hover:bg-blue-600 text-white border-none rounded-[14px] font-bold shadow-lg shadow-slate-100 transition-all"
                      onClick={() => window.open(`/api/invoices/${invoice.bill_id}/pdf`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Explore
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
