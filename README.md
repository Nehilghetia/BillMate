# BillMate - Online Billing & Checkout System

A full-stack web application that simplifies billing, online payments, and invoice generation for small businesses and online stores.

## Features

### Admin Module
- **Dashboard**: Overview of business metrics (revenue, orders, customers, products)
- **Product Management**: Add, edit, and delete products with pricing
- **Bill Management**: Create bills for customers, track payment status
- **Order Management**: View all customer orders and order details
- **Customer Management**: Manage customer accounts and information
- **Reports & Analytics**: Business performance metrics and top-selling products

### Customer Module
- **Shop**: Browse and purchase products with an intuitive interface
- **Shopping Cart**: Add/remove items, adjust quantities
- **Secure Checkout**: Simple and secure checkout process
- **Order History**: View all past orders and track payment status
- **Invoices**: Download invoices as HTML/PDF documents
- **Account Management**: Manage profile information

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js App Router, Server Actions
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Payments**: Stripe Integration (optional)
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)
- Stripe account (optional, for payment processing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd billmate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. (Optional) Add Stripe keys for payment processing:
```
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## User Roles

### Admin
- Create and manage products
- Create bills for customers
- View and manage all orders
- Access business reports and analytics
- Default login: Use email with "admin" role during signup

### Customer
- Browse and purchase products
- Make secure payments
- View order history
- Download invoices
- Default login: Use email with "customer" role during signup

## Database Schema

### Key Tables
- **users**: User accounts with roles (admin/customer)
- **products**: Product catalog with pricing
- **bills**: Generated bills for customers
- **orders**: Customer order records
- **payments**: Payment transaction records

## Key Routes

### Authentication
- `/auth/login` - Login page
- `/auth/signup` - Registration page

### Admin
- `/admin/dashboard` - Admin dashboard
- `/admin/products` - Product management
- `/admin/bills` - Bill management
- `/admin/bills/create` - Create new bill
- `/admin/orders` - Order management
- `/admin/customers` - Customer management
- `/admin/reports` - Analytics and reports

### Customer
- `/customer/shop` - Product browsing
- `/customer/checkout` - Checkout page
- `/customer/checkout/success` - Order confirmation
- `/customer/orders` - Order history
- `/customer/invoices` - Invoice download

## Features Implemented

✅ User authentication (signup/login)
✅ Role-based access control (Admin/Customer)
✅ Product management system
✅ Shopping cart functionality
✅ Bill creation and management
✅ Order tracking
✅ Invoice generation (HTML)
✅ Payment integration ready (Stripe)
✅ Business analytics dashboard
✅ Responsive design
✅ Row Level Security (RLS) policies

## Payment Integration

### Stripe Setup (Optional)
1. Sign up for a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Manual Testing
Without Stripe configuration, orders can still be created and tracked. The payment status will default to pending.

## Invoice Download

Invoices are available as HTML documents that can be:
- Printed to PDF using browser print functionality
- Downloaded directly
- Emailed to customers

## Project Structure

```
billmate/
├── app/
│   ├── admin/           # Admin routes and pages
│   ├── auth/            # Authentication pages
│   ├── customer/        # Customer routes and pages
│   ├── api/             # API routes
│   ├── actions/         # Server actions
│   └── page.tsx         # Landing page
├── components/
│   ├── admin/           # Admin components
│   ├── customer/        # Customer components
│   └── ui/              # Reusable UI components
├── lib/
│   ├── supabase/        # Supabase client setup
│   └── auth-context.tsx # Authentication context
└── scripts/
    └── setup-database.sql # Database migration
```

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
- Update Supabase connection strings
- Use live Stripe keys (not test keys)
- Set `NEXT_PUBLIC_APP_URL` to your production domain

## Security Features

- Row Level Security (RLS) on all database tables
- Secure password authentication
- Server-side validation for payments
- CSRF protection via Next.js
- Environment variables for sensitive data
- No sensitive data exposed to client

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check that database tables are created (run migration script)
- Ensure firewall/network allows connection

### Authentication Issues
- Clear browser cookies and localStorage
- Verify email format
- Check Supabase auth settings

### Payment Issues
- Verify Stripe keys are correct (test vs live)
- Check Stripe dashboard for error logs
- Ensure webhook URLs are configured (for production)

## Future Enhancements

- [ ] PDF invoice generation using jsPDF
- [ ] Email invoice delivery
- [ ] Multiple payment methods (UPI, Net Banking)
- [ ] Subscription billing
- [ ] Inventory management
- [ ] Customer notifications
- [ ] Mobile app
- [ ] Advanced reporting and exports

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Contact support@billmate.com

## License

This project is provided as-is for educational and commercial use.

---

Built with ❤️ for small businesses and online stores.
