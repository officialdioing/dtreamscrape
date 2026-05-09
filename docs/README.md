# 📚 Dreamscape Curated Events - Documentation

Welcome to the Dreamscape Curated Events documentation hub. This folder contains all the technical documentation for the project.

## 🎯 Quick Links

### **Deployment & Setup**
- **[Vercel Setup Guide](./VERCEL_SETUP_GUIDE.md)** - Complete guide for setting up environment variables and deploying to Vercel
- **[Environment Variables](../.env.vercel)** - Production environment variables template

### **Features & Systems**
- **[Custom Booking System](./CUSTOM_BOOKING_SYSTEM.md)** - Complete guide to the custom booking system that replaces Calendly

## 🚀 Quick Start

1. **For Vercel Deployment**: Read the [Vercel Setup Guide](./VERCEL_SETUP_GUIDE.md)
2. **For Booking System**: Read the [Custom Booking System Guide](./CUSTOM_BOOKING_SYSTEM.md)
3. **For Environment Setup**: Copy variables from [`.env.vercel`](../.env.vercel)

## 📋 Documentation Index

### **Deployment Guides**
- [Vercel Setup Guide](./VERCEL_SETUP_GUIDE.md) - Step-by-step Vercel deployment instructions

### **Feature Documentation**
- [Custom Booking System](./CUSTOM_BOOKING_SYSTEM.md) - Complete booking system documentation
  - API endpoints
  - Admin portal usage
  - Configuration options

### **Configuration Files**
- [`.env.vercel`](../.env.vercel) - Production environment variables
- [`vercel.json`](../vercel.json) - Vercel deployment configuration

## 🔧 Common Tasks

### **Deploying to Vercel**
1. Read the [Vercel Setup Guide](./VERCEL_SETUP_GUIDE.md)
2. Add environment variables to Vercel Dashboard
3. Deploy and test

### **Configuring Booking System**
1. Read the [Custom Booking System Guide](./CUSTOM_BOOKING_SYSTEM.md)
2. Set up Supabase database tables
3. Configure business hours and availability

### **Troubleshooting**
- **Backend API Errors**: Check `NEXT_PUBLIC_BACKEND_API_URL` in Vercel
- **Booking Issues**: Verify Supabase configuration
- **Email Not Working**: Check `RESEND_API_KEY` and `FROM_EMAIL`

## 🛠️ Technical Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Backend**: Go API (separate repository)
- **Database**: Supabase (PostgreSQL)
- **Storage**: S3-compatible storage
- **Deployment**: Vercel
- **Authentication**: JWT + Custom auth system

## 📞 Support

For issues or questions:
1. Check the relevant documentation above
2. Verify environment variables are set correctly
3. Check Vercel deployment logs for errors

---

**Last Updated**: May 9, 2026