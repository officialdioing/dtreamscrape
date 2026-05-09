'use client';

import React, { useState } from 'react';
import { AdminBookingPortal } from '@/src/admin/components/AdminBookingPortal';
import { AvailabilityManager } from '@/src/admin/components/AvailabilityManager';

export default function BookingManagementPage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability'>('bookings');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
        <p className="text-gray-600">Manage your bookings and availability settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'availability'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Availability Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'bookings' && (
          <div>
            <AdminBookingPortal />
          </div>
        )}

        {activeTab === 'availability' && (
          <div>
            <AvailabilityManager />
          </div>
        )}
      </div>
    </div>
  );
}
