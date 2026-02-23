'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DiagnosticPage() {
    const supabase = createClient()
    const [results, setResults] = useState<any>({})

    useEffect(() => {
        runDiagnostics()
    }, [])

    const runDiagnostics = async () => {
        const diagnostics: any = {}

        // Check bills table
        const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select('*')
            .limit(5)

        diagnostics.bills = {
            count: bills?.length || 0,
            error: billsError?.message || null,
            sample: bills?.[0] || null
        }

        // Check bill_items table
        const { data: billItems, error: itemsError } = await supabase
            .from('bill_items')
            .select('*')
            .limit(5)

        diagnostics.billItems = {
            count: billItems?.length || 0,
            error: itemsError?.message || null,
            sample: billItems?.[0] || null
        }

        // Check products table
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .limit(5)

        diagnostics.products = {
            count: products?.length || 0,
            error: productsError?.message || null,
            sample: products?.[0] || null
        }

        // Check promotions table
        const { data: promotions, error: promotionsError } = await supabase
            .from('promotions')
            .select('*')
            .limit(5)

        diagnostics.promotions = {
            count: promotions?.length || 0,
            error: promotionsError?.message || null,
            sample: promotions?.[0] || null
        }

        setResults(diagnostics)
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Database Diagnostics</h1>

            <div className="grid gap-6">
                {/* Bills */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bills Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2"><strong>Count:</strong> {results.bills?.count}</p>
                        <p className="mb-2"><strong>Error:</strong> {results.bills?.error || 'None'}</p>
                        <details>
                            <summary className="cursor-pointer font-semibold">Sample Data</summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                                {JSON.stringify(results.bills?.sample, null, 2)}
                            </pre>
                        </details>
                    </CardContent>
                </Card>

                {/* Bill Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bill Items Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2"><strong>Count:</strong> {results.billItems?.count}</p>
                        <p className="mb-2"><strong>Error:</strong> {results.billItems?.error || 'None'}</p>
                        <details>
                            <summary className="cursor-pointer font-semibold">Sample Data</summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                                {JSON.stringify(results.billItems?.sample, null, 2)}
                            </pre>
                        </details>
                    </CardContent>
                </Card>

                {/* Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Products Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2"><strong>Count:</strong> {results.products?.count}</p>
                        <p className="mb-2"><strong>Error:</strong> {results.products?.error || 'None'}</p>
                        <details>
                            <summary className="cursor-pointer font-semibold">Sample Data</summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                                {JSON.stringify(results.products?.sample, null, 2)}
                            </pre>
                        </details>
                    </CardContent>
                </Card>

                {/* Promotions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Promotions Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2"><strong>Count:</strong> {results.promotions?.count}</p>
                        <p className="mb-2"><strong>Error:</strong> {results.promotions?.error || 'None'}</p>
                        <details>
                            <summary className="cursor-pointer font-semibold">Sample Data</summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                                {JSON.stringify(results.promotions?.sample, null, 2)}
                            </pre>
                        </details>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
