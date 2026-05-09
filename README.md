# 🎊 Dreamscape Curated Events

A luxury event planning website featuring weddings, private celebrations, and elevated brand experiences. Built with Next.js 16, TypeScript, and a custom booking system.

## ✨ Features

- **Custom Booking System** - Self-contained booking solution with real-time availability
- **Admin Portal** - Complete dashboard for managing bookings, content, and events
- **Portfolio Showcase** - Beautiful display of past events and services
- **Blog System** - Full content management for event stories and tips
- **Contact & Inquiry Management** - Streamlined client communication
- **Responsive Design** - Perfect on mobile, tablet, and desktop

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)
- Vercel account (for deployment)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/your-username/Dreamscape-Curated-Event.git
cd Dreamscape-Curated-Event

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📚 Documentation

**All detailed documentation is in the [`docs/`](./docs) folder:**

- **[Vercel Setup Guide](./docs/VERCEL_SETUP_GUIDE.md)** - Deploy to production
- **[Custom Booking System](./docs/CUSTOM_BOOKING_SYSTEM.md)** - Booking features
- **[Documentation Index](./docs/README.md)** - Complete documentation hub

## 🔧 Environment Setup

The application requires several environment variables. For a complete list, see the [Vercel Setup Guide](./docs/VERCEL_SETUP_GUIDE.md).

**Critical Variables:**
```bash
# Backend API
NEXT_PUBLIC_BACKEND_API_URL=https://api.dreamscapecurated.com

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🏗️ Project Structure

```
├── app/                    # Next.js 16 app directory
│   ├── admin/             # Admin portal pages
│   ├── api/               # API routes
│   └── (pages)/           # Public pages
├── components/            # React components
├── docs/                  # Documentation 📚
├── src/                   # Source files
│   ├── lib/              # Utility functions
│   ├── components/       # Feature components
│   └── admin/            # Admin components
└── public/               # Static assets
```

## 🎯 Key Features

### **Custom Booking System**
- Real-time availability checking
- Admin booking management
- Automated confirmations
- No third-party dependencies

### **Admin Portal**
- Booking dashboard
- Content management
- Media library
- User management
- Analytics overview

### **Public Website**
- Stunning portfolio showcase
- Service descriptions
- Blog/content system
- Contact forms
- FAQ section

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Go API (separate service)
- **Database**: Supabase (PostgreSQL)
- **Storage**: S3-compatible storage
- **Deployment**: Vercel
- **Authentication**: JWT + Custom system

## 📱 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
```

## 🌐 Deployment

### **Vercel (Recommended)**
1. Push code to GitHub
2. Import project in Vercel
3. Follow the [Vercel Setup Guide](./docs/VERCEL_SETUP_GUIDE.md)
4. Add environment variables
5. Deploy!

### **Other Platforms**
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Self-hosted

## 🔐 Security

- JWT-based authentication
- CSRF protection
- Environment variable management
- Supabase Row Level Security (RLS)
- Secure HTTP-only cookies

## 📞 Support

For detailed documentation, visit the [`docs/`](./docs) folder.

**Quick Links:**
- [Deployment Guide](./docs/VERCEL_SETUP_GUIDE.md)
- [Booking System Docs](./docs/CUSTOM_BOOKING_SYSTEM.md)
- [Documentation Index](./docs/README.md)

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ for Dreamscape Curated Events**

*For detailed documentation, see the [`docs/`](./docs) folder.*