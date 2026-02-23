'use server'

import { createClient } from '@supabase/supabase-js'

export async function getDashboardStats() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials for dashboard stats')
        return { error: 'Environment configuration error' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const [productsResult, usersResult, ordersResult] = await Promise.allSettled([
            supabase.from('products').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'customer'),
            supabase.from('bills').select('total_amount', { count: 'exact' }).eq('status', 'paid')
        ])

        const stats = {
            totalProducts: 0,
            totalCustomers: 0,
            totalOrders: 0,
            totalRevenue: 0
        }

        // Process Products
        if (productsResult.status === 'fulfilled') {
            const { count, error } = productsResult.value
            if (!error) stats.totalProducts = count || 0
            else console.error('Error fetching products count:', error)
        } else {
            console.error('Products query rejected:', productsResult.reason)
        }

        // Process Users (Customers)
        if (usersResult.status === 'fulfilled') {
            const { count, error } = usersResult.value
            if (!error) stats.totalCustomers = count || 0
            else console.error('Error fetching customers count:', error)
        } else {
            console.error('Users query rejected:', usersResult.reason)
        }

        // Process Orders (Paid Bills)
        if (ordersResult.status === 'fulfilled') {
            const { data, count, error } = ordersResult.value
            if (!error) {
                stats.totalOrders = count || 0
                stats.totalRevenue = data?.reduce((sum: number, bill: any) => sum + (bill.total_amount || 0), 0) || 0
            } else {
                console.error('Error fetching orders/revenue:', error)
            }
        } else {
            console.error('Orders query rejected:', ordersResult.reason)
        }

        return { data: stats }
    } catch (error: any) {
        console.error('Unexpected error in getDashboardStats:', error)
        return { error: error.message || 'Failed to fetch dashboard stats' }
    }
}
