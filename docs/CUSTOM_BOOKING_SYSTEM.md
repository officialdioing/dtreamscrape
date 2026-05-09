# Custom Booking System Guide

## 🎯 Overview
This custom booking system replaces Calendly with a fully managed, self-contained booking solution. It gives you complete control over availability, bookings, and client management.

## ✨ Features

### **For Clients (Frontend)**
- ✅ Real-time availability checking
- ✅ Easy date/time selection
- ✅ Beautiful, intuitive interface
- ✅ Instant booking confirmation
- ✅ No third-party dependencies

### **For Business Owners (Admin Portal)**
- ✅ Complete booking dashboard
- ✅ Booking status management (pending → confirmed → completed)
- ✅ Cancel and manage bookings
- ✅ Real-time availability overview
- ✅ Business hours configuration
- ✅ Full customer data access

## 📁 File Structure

```
├── app/api/
│   ├── booking/
│   │   └── availability/
│   │       └── route.ts                 # Main availability API
│   └── admin/
│       └── bookings-availability/
│           └── route.ts                 # Admin booking management API
├── src/
│   ├── lib/
│   │   ├── custom-booking.ts            # Core booking functions
│   │   └── hooks/
│   │       └── useCustomBooking.ts      # React hook for frontend
│   ├── components/
│   │   ├── pages/
│   │   │   └── CustomBookingPage.tsx    # User-facing booking page
│   │   └── admin/
│   │       └── AdminBookingPortal.tsx   # Admin dashboard component
```

## 🚀 Setup Instructions

### **1. Database Setup**
Ensure your Supabase `bookings` table has the following structure:

```sql
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  consultation_date DATE NOT NULL,
  consultation_time TIME NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  event_types TEXT[],
  budget VARCHAR(100),
  guests INTEGER,
  additional_details TEXT,
  file_urls TEXT[],
  file_names TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Frontend Integration**

Replace your current consultation page with the custom booking system:

```tsx
// app/consultation/page.tsx
import { CustomBookingPage } from '@/src/components/pages/CustomBookingPage';

export default function ConsultationPage() {
  return <CustomBookingPage />;
}
```

### **3. Admin Portal Integration**

Create an admin page for managing bookings:

```tsx
// app/admin/bookings/page.tsx
import { AdminBookingPortal } from '@/src/admin/components/AdminBookingPortal';

export default function AdminBookingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Booking Management</h1>
      <AdminBookingPortal />
    </div>
  );
}
```

## 🎨 Customization

### **Business Hours**
Edit the business hours in `src/lib/custom-booking.ts`:

```typescript
const BUSINESS_HOURS = {
  start: 8,  // 8 AM
  end: 17,   // 5 PM
  interval: 30,  // 30-minute intervals
  workingDays: [1, 2, 3, 4, 5],  // Monday-Friday
};
```

### **Time Slot Configuration**
Modify the `generateTimeSlots()` function to change available time slots:

```typescript
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}
```

### **Booking Status Flow**
Customize the booking workflow in the admin portal:

```typescript
// Available statuses: 'pending' → 'confirmed' → 'completed'
// Or 'pending' → 'cancelled'
```

## 🔧 API Endpoints

### **Frontend APIs**
- `GET /api/booking/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - Returns available time slots for a date range

### **Admin APIs**
- `GET /api/admin/bookings-availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - Returns all bookings and statistics
- `PATCH /api/admin/bookings-availability`
  - Update booking status
  ```json
  {
    "booking_id": "uuid",
    "status": "confirmed"
  }
  ```
- `DELETE /api/admin/bookings-availability?booking_id=uuid`
  - Cancel a booking

## 💡 Usage Examples

### **Check Availability**
```typescript
const { fetchAvailability, getAvailableSlots } = useCustomBooking();

// Fetch availability for May 2026
await fetchAvailability('2026-05-01', '2026-05-31');

// Get available slots for a specific date
const slots = getAvailableSlots('2026-05-15');
// Returns: ['08:00', '08:30', '09:00', ...]
```

### **Admin: Update Booking Status**
```typescript
const { updateBookingStatus } = useCustomBooking();

// Confirm a booking
await updateBookingStatus('booking-uuid', 'confirmed');

// Cancel a booking
await cancelBooking('booking-uuid');
```

## 🔐 Security Features

- ✅ Supabase Row Level Security (RLS) ready
- ✅ Service role authentication for admin operations
- ✅ Input validation and sanitization
- ✅ SQL injection protection
- ✅ CORS configuration

## 📱 Responsive Design

The booking system is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers
- 🖥️ Large screens

## 🎯 Benefits Over Calendly

### **Custom System Advantages:**
1. **No API limits** - Unlimited bookings and requests
2. **Full control** - Customize every aspect
3. **No subscription fees** - Completely free
4. **Better integration** - Works seamlessly with your existing system
5. **Data ownership** - All customer data stays with you
6. **Faster performance** - No third-party API calls
7. **Reliability** - No external dependencies

### **Business Hours:**
- Monday - Friday: 8:00 AM - 5:00 PM
- 30-minute intervals
- Automatic timezone handling
- Holiday blocking capabilities

## 🚀 Deployment

The custom booking system works perfectly on:
- ✅ Vercel
- ✅ Netlify
- ✅ AWS Amplify
- ✅ Any Node.js hosting platform

## 📞 Support

For issues or questions:
1. Check the API endpoint responses in browser DevTools
2. Verify Supabase connection and table structure
3. Review environment variables are properly set
4. Check browser console for JavaScript errors

## 🎉 Success Metrics

Track your booking system performance:
- Total bookings per month
- Conversion rate (visits → bookings)
- Average booking value
- Customer satisfaction ratings
- No-show rates

---

**Your Dreamscape Curated Events booking system is now fully custom and under your complete control!** 🎊