import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
        return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    try {
        console.log('Attempting to send test email to:', email)
        console.log('Using Gmail User:', process.env.GMAIL_USER ? 'Set' : 'Missing')
        console.log('Using App Password:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing')

        await sendWelcomeEmail(email, 'Test User')

        return NextResponse.json({ success: true, message: 'Test email sent! Check your inbox.' })
    } catch (error: any) {
        console.error('Test email failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            details: 'Check server console for more info'
        }, { status: 500 })
    }
}
