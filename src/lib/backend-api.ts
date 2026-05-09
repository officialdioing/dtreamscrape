/**
 * Backend API Client
 *
 * This module provides a centralized way to make API requests to the Go backend.
 * It handles authentication, error handling, and response formatting.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

interface BackendApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

interface BackendApiError {
  message: string;
  status: number;
  details?: any;
}

class BackendApiError extends Error implements BackendApiError {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'BackendApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Get authentication headers including the session token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Note: Cookies are automatically sent by the browser when making requests
  // The NextAuth session token cookie will be included automatically
  // If we need to explicitly include it, we can do:
  // headers['Cookie'] = `next-auth.session-token=${getToken()}`;

  return headers;
}

/**
 * Make a request to the backend API
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      // Include credentials for cookies
      credentials: 'include',
    });

    const data: BackendApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new BackendApiError(
        data.error || data.message || 'An error occurred',
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw error;
    }

    // Network or parsing errors
    throw new BackendApiError(
      error instanceof Error ? error.message : 'Failed to connect to backend',
      0,
      error
    );
  }
}

/**
 * Backend API Client
 */
export const backendApi = {
  /**
   * Portfolio Items
   */
  portfolio: {
    list: () => request('/api/portfolio-items'),
    get: (id: string) => request(`/api/portfolio-items/${id}`),
    create: (data: any) => request('/api/portfolio-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/portfolio-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/portfolio-items/${id}`, {
      method: 'DELETE',
    }),
  },

  /**
   * Blog Posts (alias for portfolio)
   */
  blogPosts: {
    list: () => request('/api/blog-posts'),
    get: (id: string) => request(`/api/blog-posts/${id}`),
    create: (data: any) => request('/api/blog-posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/blog-posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/blog-posts/${id}`, {
      method: 'DELETE',
    }),
  },

  /**
   * Admin - Portfolio Items
   */
  adminPortfolio: {
    list: () => request('/api/admin/portfolio-items'),
    get: (id: string) => request(`/api/admin/portfolio-items/${id}`),
    create: (data: any) => request('/api/admin/portfolio-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/portfolio-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/portfolio-items/${id}`, {
      method: 'DELETE',
    }),
  },

  /**
   * Admin - Blog Posts
   */
  adminBlogPosts: {
    list: () => request('/api/admin/blog-posts'),
    get: (id: string) => request(`/api/admin/blog-posts/${id}`),
    create: (data: any) => request('/api/admin/blog-posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/blog-posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/blog-posts/${id}`, {
      method: 'DELETE',
    }),
  },

  /**
   * Admin - Events
   */
  adminEvents: {
    list: () => request('/api/admin/events'),
    get: (id: string) => request(`/api/admin/events/${id}`),
    create: (data: any) => request('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/events/${id}`, {
      method: 'DELETE',
    }),
    reorder: (data: any) => request('/api/admin/events/reorder', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },

  /**
   * Admin - Services
   */
  adminServices: {
    list: () => request('/api/admin/services'),
    get: (id: string) => request(`/api/admin/services/${id}`),
    create: (data: any) => request('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/services/${id}`, {
      method: 'DELETE',
    }),
    reorder: (data: any) => request('/api/admin/services/reorder', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },

  /**
   * Admin - Bookings
   */
  adminBookings: {
    list: () => request('/api/admin/bookings'),
    get: (id: string) => request(`/api/admin/bookings/${id}`),
    updateStatus: (id: string, status: string) => request(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    delete: (id: string) => request(`/api/admin/bookings/${id}`, {
      method: 'DELETE',
    }),
    cancel: (id: string) => request(`/api/admin/bookings/${id}/cancel`, {
      method: 'POST',
    }),
    confirm: (id: string) => request(`/api/admin/bookings/${id}/confirm`, {
      method: 'POST',
    }),
  },

  /**
   * Admin - Users
   */
  adminUsers: {
    list: () => request('/api/admin/users'),
    get: (id: string) => request(`/api/admin/users/${id}`),
    create: (data: any) => request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),
    lock: (id: string) => request(`/api/admin/users/${id}/lock`, {
      method: 'POST',
    }),
    resetPassword: (id: string, data: any) => request(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  /**
   * Admin - Media Library
   */
  adminMedia: {
    list: () => request('/api/admin/media-library'),
    upload: (formData: FormData) => {
      // For file uploads, we need to use fetch directly without JSON
      const url = `${BACKEND_URL}/api/admin/media-library/upload`;
      return fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }).then(res => res.json());
    },
    create: (data: any) => request('/api/admin/media-library', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/media-library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/media-library/${id}`, {
      method: 'DELETE',
    }),
  },

  /**
   * Admin - Content
   */
  adminContent: {
    get: () => request('/api/admin/content'),
    create: (data: any) => request('/api/admin/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/api/admin/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/api/admin/content/${id}`, {
      method: 'DELETE',
    }),
  },

  /**
   * Admin - Site Settings
   */
  adminSettings: {
    get: () => request('/api/admin/site-settings'),
    update: (data: any) => request('/api/admin/site-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  /**
   * Public - Events
   */
  events: {
    list: () => request('/api/events'),
    getBySlug: (slug: string) => request(`/api/events/${slug}`),
  },

  /**
   * Public - Services
   */
  services: {
    list: () => request('/api/services'),
    getBySlug: (slug: string) => request(`/api/services/${slug}`),
  },

  /**
   * Public - Bookings
   */
  bookings: {
    create: (data: any) => request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAvailability: (params: any) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/api/bookings/availability?${queryString}`);
    },
    getTakenSlots: (params: any) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/api/bookings/taken-slots?${queryString}`);
    },
    getRealTimeAvailability: (params: any) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/api/bookings/real-time-availability?${queryString}`);
    },
  },

  /**
   * Utilities
   */
  health: () => request('/health'),
  dbTables: () => request('/api/db/tables'),
  dbStats: () => request('/api/db/stats'),
};

export { BackendApiError, type BackendApiResponse, type BackendApiError as BackendApiErrorType };
