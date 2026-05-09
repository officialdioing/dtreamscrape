-- Prevent two active bookings from using the same consultation date + time.
-- Cancelled bookings are excluded so a freed slot can be booked again.

create unique index if not exists bookings_active_slot_unique_idx
on bookings (consultation_date, consultation_time)
where status is distinct from 'cancelled';
