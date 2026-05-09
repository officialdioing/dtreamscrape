'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2Icon, InfoIcon } from 'lucide-react';
import {
  type AvailabilitySettings,
  type TimeSlot,
  DEFAULT_AVAILABILITY,
  normalizeAvailabilitySettings,
  formatTimeRange,
  validateTimeSlot,
  hasOverlappingSlots
} from '@/src/lib/availability-manager';

const DAYS_OF_WEEK = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
] as const;

const DAY_NAMES = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday'
};

export function AvailabilityManager() {
  const [settings, setSettings] = useState<AvailabilitySettings>(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load availability settings on component mount
  useEffect(() => {
    fetchAvailabilitySettings();
  }, []);

  const fetchAvailabilitySettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/availability-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch availability settings');
      }

      const data = await response.json();
      setSettings(normalizeAvailabilitySettings(data));
    } catch (error) {
      console.error('Error fetching availability settings:', error);
      setMessage({ type: 'error', text: 'Failed to load availability settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveAvailabilitySettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      console.log('Saving availability settings:', settings);

      const response = await fetch('/api/admin/availability-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', data);
        throw new Error(data.error || data.message || 'Failed to save availability settings');
      }

      console.log('Save successful:', data);
      setMessage({ type: 'success', text: 'Availability settings saved successfully!' });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error saving availability settings:', error);
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to save availability settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDayEnabled = (day: keyof AvailabilitySettings['weekly']) => {
    setSettings(prev => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: {
          ...prev.weekly[day],
          enabled: !prev.weekly[day].enabled
        }
      }
    }));
  };

  const addTimeSlot = (day: keyof AvailabilitySettings['weekly']) => {
    const newSlot: TimeSlot = { start: '09:00', end: '17:00' };

    setSettings(prev => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: {
          ...prev.weekly[day],
          slots: [...prev.weekly[day].slots, newSlot]
        }
      }
    }));
  };

  const removeTimeSlot = (day: keyof AvailabilitySettings['weekly'], index: number) => {
    setSettings(prev => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: {
          ...prev.weekly[day],
          slots: prev.weekly[day].slots.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const updateTimeSlot = (
    day: keyof AvailabilitySettings['weekly'],
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updatedSlots = [...settings.weekly[day].slots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };

    // Validate the updated slot
    if (!validateTimeSlot(updatedSlots[index])) {
      setMessage({ type: 'error', text: 'Invalid time slot. End time must be after start time.' });
      return;
    }

    // Check for overlaps
    if (hasOverlappingSlots(updatedSlots)) {
      setMessage({ type: 'error', text: 'Time slots cannot overlap.' });
      return;
    }

    setSettings(prev => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: {
          ...prev.weekly[day],
          slots: updatedSlots
        }
      }
    }));
  };

  const addDateOverride = () => {
    const newOverride = {
      date: new Date().toISOString().split('T')[0],
      available: true,
      notes: ''
    };

    setSettings(prev => ({
      ...prev,
      overrides: [...prev.overrides, newOverride]
    }));
  };

  const removeDateOverride = (index: number) => {
    setSettings(prev => ({
      ...prev,
      overrides: prev.overrides.filter((_, i) => i !== index)
    }));
  };

  const updateDateOverride = (index: number, field: string, value: any) => {
    const updatedOverrides = [...settings.overrides];
    updatedOverrides[index] = { ...updatedOverrides[index], [field]: value };

    setSettings(prev => ({
      ...prev,
      overrides: updatedOverrides
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <div className="border-b border-border/70 px-6 py-6">
            <div className="flex items-center gap-3">
              <Spinner className="size-5 text-primary" />
              <div>
                <div className="text-lg font-semibold text-gray-900">Working Hours</div>
                <div className="text-sm text-gray-600">Loading availability settings…</div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-b border-border/70 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-b border-border/70 p-6 md:border-b-0 md:border-r last:border-r-0">
                <div className="h-4 w-36 rounded-full bg-gray-100 animate-pulse" />
                <div className="mt-3 h-8 w-20 rounded-full bg-gray-100 animate-pulse" />
                <div className="mt-2 h-4 w-48 rounded-full bg-gray-100/80 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="px-6 py-6">
            <div className="h-6 w-56 rounded-full bg-gray-100 animate-pulse" />
            <div className="mt-2 h-4 w-80 rounded-full bg-gray-100/80 animate-pulse" />

            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_rgba(64,21,63,0.04)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-gray-100 animate-pulse" />
                      <div className="h-4 w-28 rounded-full bg-gray-100 animate-pulse" />
                    </div>
                    <div className="h-9 w-28 rounded-xl bg-gray-100 animate-pulse" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-10 w-full rounded-xl bg-gray-100/80 animate-pulse" />
                    <div className="h-10 w-full rounded-xl bg-gray-100/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Working Hours</h2>
          <p className="text-gray-600 mt-1">
            Set the hours that appear on the public booking calendar.
          </p>
        </div>
        <Button
          onClick={saveAvailabilitySettings}
          disabled={saving}
          className="bg-brand-purple hover:bg-brand-pink"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          {message.type === 'success' ? <CheckCircle2Icon /> : <InfoIcon />}
          <AlertTitle>
            {message.type === 'success' ? 'Availability saved' : 'Availability issue'}
          </AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Weekly Availability */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Weekly Working Hours</h3>
        <p className="text-sm text-gray-600 mb-4">
          Define the days and time ranges clients can book. These settings drive the public consultation calendar.
        </p>
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`${day}-enabled`}
                    checked={settings.weekly[day].enabled}
                    onCheckedChange={() => toggleDayEnabled(day)}
                  />
                  <Label htmlFor={`${day}-enabled`} className="font-medium">
                    {DAY_NAMES[day]}
                  </Label>
                </div>
                {settings.weekly[day].enabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addTimeSlot(day)}
                  >
                    + Add Time Slot
                  </Button>
                )}
              </div>

              {settings.weekly[day].enabled && (
                <div className="space-y-2 ml-8">
                  {settings.weekly[day].slots.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No time slots set</p>
                  ) : (
                    settings.weekly[day].slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeTimeSlot(day, index)}
                        >
                          Remove
                        </Button>
                        <span className="text-sm text-gray-600">
                          {formatTimeRange(slot)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Booking Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Booking Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Slot Interval</Label>
            <Select
              value={String(settings.slotIntervalMinutes)}
              onValueChange={(value) => setSettings(prev => ({
                ...prev,
                slotIntervalMinutes: parseInt(value, 10) || 30
              }))}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Choose interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Spacing between each visible booking time</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Buffer Time (minutes)</Label>
            <Input
              type="number"
              min="0"
              max="60"
              value={settings.bufferTime}
              onChange={(e) => setSettings(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 0 }))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Time between bookings</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Min Booking Notice (hours)</Label>
            <Input
              type="number"
              min="0"
              max="168"
              value={settings.minBookingNotice}
              onChange={(e) => setSettings(prev => ({ ...prev, minBookingNotice: parseInt(e.target.value) || 0 }))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">How far in advance bookings can be made</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Max Booking Advance (days)</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={settings.maxBookingAdvance}
              onChange={(e) => setSettings(prev => ({ ...prev, maxBookingAdvance: parseInt(e.target.value) || 90 }))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">How many days ahead people can book</p>
          </div>
        </div>
      </Card>

      {/* Date Overrides */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Date Overrides</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={addDateOverride}
          >
            + Add Override
          </Button>
        </div>

        <div className="space-y-3">
          {settings.overrides.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No date overrides set</p>
          ) : (
            settings.overrides.map((override, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Input
                  type="date"
                  value={override.date}
                  onChange={(e) => updateDateOverride(index, 'date', e.target.value)}
                  className="w-40"
                />
                <Checkbox
                  checked={override.available}
                  onCheckedChange={(checked) => updateDateOverride(index, 'available', checked)}
                />
                <Label>Available</Label>
                <Input
                  placeholder="Notes (optional)"
                  value={override.notes || ''}
                  onChange={(e) => updateDateOverride(index, 'notes', e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeDateOverride(index)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Use overrides to block specific dates (like holidays) or make unavailable days available.
        </p>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Availability Preview</h3>
        <div className="grid grid-cols-7 gap-2 text-center">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="p-2 border border-gray-200 rounded">
              <div className="font-medium text-sm">{DAY_NAMES[day].slice(0, 3)}</div>
              <div className={`text-xs mt-1 ${settings.weekly[day].enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.weekly[day].enabled
                  ? `${settings.weekly[day].slots.length} slot(s)`
                  : 'Unavailable'
                }
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AvailabilityManager;
