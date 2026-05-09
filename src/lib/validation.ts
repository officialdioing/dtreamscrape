import { z } from 'zod';

// Validation schemas using Zod

export const bookingSchema = z.object({
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),

  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format'),

  event_date: z.string().optional().refine((val) => {
    if (!val) return true;
    // Parse as local date (YYYY-MM-DD) to avoid UTC-vs-local midnight mismatch
    const [y, m, d] = val.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Event date must be today or in the future'),

  event_location: z.string().max(255, 'Location must be less than 255 characters').optional(),

  event_types: z.array(z.string()).min(1, 'Please select at least one event type').optional(),

  budget: z.string().max(50, 'Budget must be less than 50 characters').optional(),

  guests: z.string().max(20, 'Guest count must be less than 20 characters').optional(),

  how_did_you_hear: z.string().max(100, 'Please keep your response under 100 characters').optional(),

  additional_details: z.string().max(2000, 'Additional details must be less than 2000 characters').optional(),

  consultation_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .refine((val) => {
      // Parse as local date (YYYY-MM-DD) to avoid UTC-vs-local midnight mismatch
      const [y, m, d] = val.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Consultation date must be today or in the future'),

  consultation_time: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)')
    .refine((val) => {
      const hour = parseInt(val.split(':')[0]);
      return hour >= 8 && hour <= 17; // Business hours: 8 AM - 5 PM
    }, 'Consultation time must be between 8:00 AM and 5:00 PM'),

  file_urls: z.array(z.string().url('Invalid file URL')).optional(),
  file_names: z.array(z.string().min(1)).optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// Rate limiting configuration
export const RATE_LIMITS = {
  // API requests per time window
  booking: {
    maxRequests: 3, // Max 3 booking attempts
    windowMs: 3600000, // Per hour
  },
  contact: {
    maxRequests: 5, // Max 5 contact form submissions
    windowMs: 3600000, // Per hour
  },
  upload: {
    maxRequests: 10, // Max 10 file uploads
    windowMs: 3600000, // Per hour
  },
  general: {
    maxRequests: 100, // Max 100 general API requests
    windowMs: 60000, // Per minute
  },
};

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

// Email validation for common disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

// Phone number validation and formatting
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as international if needed
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  } else if (!cleaned.startsWith('+') && cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

// SQL injection prevention
export function escapeSqlLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

// XSS prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// File validation
export const FILE_VALIDATION = {
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILENAME_LENGTH: 255,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
};

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${FILE_VALIDATION.MAX_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check filename length
  if (file.name.length > FILE_VALIDATION.MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: 'Filename too long',
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}
