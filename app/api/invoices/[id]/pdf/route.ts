import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)
    const billId = params.id

    console.log('DEBUG [Invoice API]: Fetching for Bill ID:', billId)

    // Fetch bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (billError || !bill) {
      console.error('DEBUG [Invoice API]: Bill Fetch Error:', billError)
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    console.log('DEBUG [Invoice API]: Bill Keys:', Object.keys(bill))

    // Fetch items separately for robustness
    const { data: billItems, error: itemsError } = await supabase
      .from('bill_items')
      .select('*, products(name)')
      .eq('bill_id', billId)

    if (itemsError) {
      console.error('DEBUG [Invoice API]: Items Fetch Error:', itemsError)
    }

    console.log('DEBUG [Invoice API]: Items found separately:', billItems?.length)

    // Attach items to bill object for mapping
    bill.bill_items = billItems || []

    console.log('DEBUG [Invoice API]: Raw Bill Data:', JSON.stringify(bill, null, 2))

    // Write to a temporary file for inspection since terminal logs are hard to read
    try {
      const fs = require('fs')
      const path = require('path')
      const logPath = path.join(process.cwd(), 'invoice-debug.json')
      fs.writeFileSync(logPath, JSON.stringify(bill, null, 2))
    } catch (e) { }

    console.log('DEBUG [Invoice API]: bill_items found:', bill.bill_items?.length)

    // Fetch customer details (for email)
    const { data: customer } = await supabase
      .from('users')
      .select('email')
      .eq('id', bill.customer_id)
      .single()

    // Convert the database structure to the structure expected by generateInvoiceHTML
    // Support both the 'items' JSON column and the 'bill_items' relational table
    let mappedItems = []

    if (bill.bill_items && bill.bill_items.length > 0) {
      mappedItems = bill.bill_items.map((item: any) => {
        // Handle products as object or array
        const product = Array.isArray(item.products) ? item.products[0] : item.products
        return {
          name: product?.name || item.name || 'Unknown Product',
          quantity: item.quantity || 1,
          price: item.unit_price || item.price || 0
        }
      })
    } else if (bill.items && Array.isArray(bill.items)) {
      mappedItems = bill.items.map((item: any) => ({
        name: item.name || 'Unknown Product',
        quantity: item.quantity || 1,
        price: item.price || item.unit_price || 0
      }))
    }

    const billWithMappedItems = {
      ...bill,
      customer_email: customer?.email || 'N/A',
      items: mappedItems
    }

    // Check for download query parameter
    const { searchParams } = new URL(request.url)
    const shouldDownload = searchParams.get('download') === 'true'

    // Generate HTML for PDF
    const htmlContent = generateInvoiceHTML(billWithMappedItems)

    // Return HTML that can be printed/saved as PDF by the browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': shouldDownload
          ? `attachment; filename="invoice-${billId.slice(0, 8)}.html"`
          : 'inline',
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(bill: any): string {
  const items = bill.items || []
  const totalAmount = bill.total_amount || 0
  const subtotal = bill.subtotal || totalAmount / 1.18
  const gst = bill.tax_amount || (totalAmount - subtotal)
  const invoiceDate = new Date(bill.created_at).toLocaleDateString('en-IN')

  const itemsHTML = items.length > 0 ? items
    .map(
      (item: any) =>
        `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `
    )
    .join('') :
    `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666;">No item details available</td></tr>`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #0066cc;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .details-section {
          border: 1px solid #eee;
          padding: 15px;
          border-radius: 4px;
        }
        .details-section h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #0066cc;
        }
        .details-section p {
          margin: 5px 0;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table th {
          background-color: #0066cc;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        .total-section {
          text-align: right;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          margin: 5px 0;
          font-size: 14px;
        }
        .total-amount {
          font-weight: bold;
          color: #0066cc;
          font-size: 18px;
        }
        .no-print {
          display: block;
          text-align: right;
          margin-bottom: 20px;
        }
        .print-btn {
          background: #0066cc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        @media print {
          .no-print { display: none; }
          .container { border: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body onload="if(window.location.search.includes('print=true')) window.print()">
      <div class="container">
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="header">
          <h1>INVOICE</h1>
          <p style="margin: 5px 0; color: #666;">BillMate - Billing & Payment System</p>
        </div>

        <div class="invoice-details">
          <div class="details-section">
            <h3>Invoice Information</h3>
            <p><strong>Invoice #:</strong> ${bill.bill_number || bill.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">${bill.status.toUpperCase()}</span></p>
          </div>

          <div class="details-section">
            <h3>Bill To</h3>
            <p><strong>Email:</strong> ${bill.customer_email}</p>
            <p><strong>Amount:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span style="width: 150px; text-align: right;">₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="total-row">
            <span>GST (18%):</span>
            <span style="width: 150px; text-align: right;">₹${gst.toLocaleString('en-IN')}</span>
          </div>
          <div class="total-row total-amount">
            <span>Total Amount:</span>
            <span style="width: 150px; text-align: right;">₹${totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business! This is a computer-generated invoice.</p>
          <p>For support, contact support@billmate.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}
