# 🧾 BillMate — Online Billing & Checkout System

[![Netlify Status](https://api.netlify.com/api/v1/badges/1ba9a053-26b8-4c48-82a0-d0b7d1b088f8/deploy-status)](https://app.netlify.com/projects/billmate12/deploys)

A modern full-stack billing & checkout platform for small businesses and online stores.
BillMate allows shop owners to manage products, generate invoices, track orders, and accept online payments — all in one system.

---

## 🚀 Live Demo

👉 https://billmate12.netlify.app

Test Accounts
**Admin:** create account and select role = `admin`
**Customer:** normal signup

---

## ✨ Key Highlights

* Full Authentication System (Login / Signup)
* Admin & Customer Role-Based Access
* Product & Inventory Management
* Shopping Cart & Checkout Flow
* Bill & Invoice Generation
* Order Tracking System
* Business Analytics Dashboard
* Supabase Database with Row Level Security (RLS)
* Stripe Payment Ready Integration
* Responsive UI (Mobile + Desktop)

---

## 🧠 Features

### 👨‍💼 Admin Panel

* Dashboard with revenue & order analytics
* Add / Edit / Delete products
* Create bills for customers
* Manage orders & payment status
* Customer account management
* View business reports

### 🛒 Customer Panel

* Browse products
* Add to cart & checkout
* Secure order placement
* Order history tracking
* Download invoices (print to PDF)
* Account management

---

## 🧰 Tech Stack

**Frontend**

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* shadcn/ui

**Backend**

* Next.js App Router
* Server Actions

**Database & Auth**

* Supabase PostgreSQL
* Supabase Authentication
* Row Level Security (RLS)

**Payments**

* Stripe (optional integration)

---

## 🗄️ Database Architecture

Main Tables:

* users
* products
* bills
* orders
* payments

---

## 🔐 Security

* Row Level Security policies
* Protected API routes
* Server-side validation
* Secure authentication
* Environment variables for sensitive data

---

## 🛠️ Installation (Local Setup)

```bash
git clone https://github.com/YOUR_USERNAME/billmate.git
cd billmate
npm install
```

Create environment file:

```
cp .env.example .env.local
```

Add Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run project:

```
npm run dev
```

Open: http://localhost:3000

---

## 💳 Stripe (Optional)

Add keys:

```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Without Stripe, orders still work (payment status = pending).

---

## 📁 Project Structure

```
app/
 ├── admin/
 ├── auth/
 ├── customer/
 ├── api/
 └── actions/

components/
lib/
scripts/
```

---

## 🚧 Future Improvements

* PDF invoice generator
* UPI / NetBanking payments
* Email invoice sending
* Inventory tracking
* Subscription billing
* Notifications system

---

## 👨‍💻 Developer

**Nehil Ghetia**
Full Stack Developer (Student)
Gujarat, India

---

⭐ If you like this project, give it a star on GitHub!
