'use server'

import { sendLoginAlert } from '@/lib/email'

export async function sendLoginNotification(email: string) {
    try {
        const time = new Date().toLocaleString()
        // Fire and forget
        sendLoginAlert(email, time).catch(err => console.error('Failed to send login alert:', err))
        return { success: true }
    } catch (error) {
        console.error('Error triggering login email:', error)
        return { success: false }
    }
}
