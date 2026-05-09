# 🚀 Vercel Environment Variables Setup Guide

## 📋 Quick Setup Instructions

### **Step 1: Go to Vercel Dashboard**
1. Navigate to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings** → **Environment Variables**

### **Step 2: Add Environment Variables**
Add **ALL** the following environment variables to your Vercel project.

## 🔴 CRITICAL VARIABLES (Must Configure)

### **Backend API Configuration**
```
NEXT_PUBLIC_BACKEND_API_URL=https://api.dreamscapecurated.com
BACKEND_URL=https://api.dreamscapecurated.com
```
**Required**: Yes - **Production URL cannot be localhost**

### **Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=https://aifqsjkgvejcqrzwgvqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:YOUR_REAL_SUPABASE_PASSWORD@db.aifqsjkgvejcqrzwgvqg.supabase.co:5432/postgres
SUPABASE_BUCKET=media
```
**Required**: Yes - **For booking system to work**
**Action Required**: Replace `YOUR_REAL_SUPABASE_PASSWORD` with your actual Supabase database password

### **Application URLs**
```
NEXT_PUBLIC_APP_URL=https://www.dreamscapecurated.com
NEXTAUTH_URL=https://www.dreamscapecurated.com
NODE_ENV=production
```
**Required**: Yes - **Update with your actual domain**

### **Admin Credentials**
```
ADMIN_EMAIL=admin@dreamscapeevents.com
ADMIN_PASSWORD=Dreamscape2026!Secure
```
**Required**: Yes - **For admin portal access**

### **Security Keys**
```
JWT_SECRET=CHANGE_THIS_GENERATE_WITH_openssl_rand_-_base64_32
CSRF_SECRET=CHANGE_THIS_GENERATE_WITH_openssl_rand_-_base64_32
AUTH_SECRET=CHANGE_THIS_GENERATE_WITH_openssl_rand_-_base64_32
AUTH_TRUST_HOST=true
COOKIE_SECURE=true
```
**Required**: Yes - **Generate unique secrets with: `openssl rand -base64 32`**

## 🟡 IMPORTANT VARIABLES (Should Configure)

### **Email Configuration**
```
RESEND_API_KEY=your_resend_api_key
BREVO_API_KEY=your_brevo_api_key
FROM_EMAIL=onboarding@resend.dev
```
**Required**: Yes - **For email notifications and booking confirmations**

### **Business Contact Info**
```
NEXT_PUBLIC_BUSINESS_EMAIL=systems@dioing.com
NEXT_PUBLIC_BUSINESS_PHONE=+2348169246969
NEXT_PUBLIC_BUSINESS_ADDRESS="123 Event Street, New York, NY 10001"
NEXT_PUBLIC_WHATSAPP_NUMBER=2348169246969
```
**Required**: Yes - **Displayed on website**

### **Calendly Integration**
```
CALENDLY_API_TOKEN=eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzc3NzE3NDE5LCJqdGkiOiJkZDZmZjhjNy1jN2Q0LTQ5MWItODgzOS0zZmU2NjNhYWYxZmMiLCJ1c2VyX3V1aWQiOiI5N2E3OGM4MC03MDcyLTRjYTItYTA0Yy00NGVlYjI0ZmE3ZWUiLCJzY29wZSI6ImF2YWlsYWJpbGl0eTpyZWFkIGF2YWlsYWJpbGl0eTp3cml0ZSBldmVudF90eXBlczpyZWFkIGV2ZW50X3R5cGVzOndyaXRlIGxvY2F0aW9uczpyZWRyZWFkIHJvdXRpbmdfZm9ybXM6cmVhZCBzaGFyZXM6d3JpdGUgc2NoZWR1bGVkX2V2ZW50czpyZWFkIHNjaGVkdWxlZF9ldmVudHM6d3JpdGUgc2NoZWR1bGluZ19saW5rczp3cml0ZSBncm91cHM6cmVhZCBvcmdhbml6YXRpb25zOnJlYWQgb3JnYW5pemF0aW9uczp3cml0ZSB1c2VyczpyZWFkIGFjdGl2aXR5X2xvZzpyZWFkIGRhdGFfY29tcGxpYW5jZTp3cml0ZSBvdXRnb2luZ19jb21tdW5pY2F0aW9uczpyZWFkIHdlYmhvb2tzOnJlYWQgd2ViaG9va3M6d3JpdGUifQ.2TW1-cbpnGeIqgFRXAaJw7zd2fO-1W429mYuQsVU4u6jG3CctMdMt8nFKGquo-fheb4WLr4V5288PBX7zOdBOQ
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/ejiro006/30min
CALENDLY_EVENT_TYPE_URI=https://api.calendly.com/event_types/5011a988-b571-416b-8655-f25b8dbde357
```
**Required**: Optional - **Only if using Calendly for bookings**

## 🟢 OPTIONAL VARIABLES (Configure as Needed)

### **Storage Configuration**
```
S3_ENDPOINT=https://api.storage.zexfa.com
S3_REGION=us-east-1
S3_BUCKET=dreamscrap
S3_ACCESS_KEY_ID=YOUR_S3_ACCESS_KEY
S3_SECRET_ACCESS_KEY=YOUR_S3_SECRET_KEY
S3_PUBLIC_BASE_URL=https://api.storage.zexfa.com/dreamscrap
NEXT_PUBLIC_S3_ENDPOINT=https://api.storage.zexfa.com
NEXT_PUBLIC_S3_BUCKET=dreamscrap
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://api.storage.zexfa.com/dreamscrap
```
**Required**: Optional - **Only if using custom S3 storage**

### **Google Calendar Integration**
```
NEXT_PUBLIC_CALENDAR_EMAIL=your-email@gmail.com
GOOGLE_CALENDAR_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=primary
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
**Required**: Optional - **Only if using Google Calendar sync**

### **Stripe Payment Integration**
```
STRIPE_SECRET_KEY=replace_with_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=replace_with_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=replace_with_your_stripe_webhook_secret
```
**Required**: Optional - **Only if using Stripe payments**

## ⚙️ Token Duration Settings
```
ACCESS_TOKEN_DURATION=15m
REFRESH_TOKEN_DURATION=168h
MAX_UPLOAD_SIZE_MB=10
```

## 🔧 Rate Limiting (Optional)
```
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

## ✅ Setup Checklist

- [ ] Add all **CRITICAL** variables to Vercel
- [ ] Replace `YOUR_REAL_SUPABASE_PASSWORD` with actual Supabase password
- [ ] Generate unique secrets for `JWT_SECRET`, `CSRF_SECRET`, and `AUTH_SECRET`
- [ ] Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` with your domain
- [ ] Add all **IMPORTANT** variables for email and contact info
- [ ] Configure **OPTIONAL** variables based on your needs
- [ **Redeploy** your Vercel application after adding variables

## 🚨 Common Issues & Solutions

### **Issue: Backend API calls to localhost:8080**
**Solution**: Make sure `NEXT_PUBLIC_BACKEND_API_URL` is set correctly in Vercel Dashboard

### **Issue: Booking system not working**
**Solution**: Verify all Supabase variables are set and database password is correct

### **Issue: Admin portal inaccessible**
**Solution**: Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set correctly

### **Issue: Email notifications not sending**
**Solution**: Verify `RESEND_API_KEY` and `FROM_EMAIL` are configured

---

**Need help?** Check that all environment variables are added to **all environments** (Production, Preview, Development) in Vercel Dashboard.
