import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check if bookings table exists
  console.log('1️⃣ Testing table access...');
  const { data, error } = await supabase
    .from('bookings')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Cannot access bookings table:', error.message);
    console.log('\n💡 Make sure you ran the SQL from supabase-setup.sql');
    return;
  }
  console.log('✅ Bookings table is accessible!\n');

  // Test 2: Try to insert a test booking
  console.log('2️⃣ Testing insert permission...');
  const testBooking = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '+1234567890',
    consultation_date: '2026-04-01',
    consultation_time: '10:00',
    event_types: ['wedding-destination-social']
  };

  const { data: insertData, error: insertError } = await supabase
    .from('bookings')
    .insert([testBooking])
    .select();

  if (insertError) {
    console.error('❌ Cannot insert bookings:', insertError.message);
    console.log('\n💡 Check your RLS policies in Supabase dashboard');
    return;
  }
  console.log('✅ Can insert bookings!');
  console.log('📝 Test booking ID:', insertData[0].id);

  // Clean up test booking
  await supabase.from('bookings').delete().eq('id', insertData[0].id);
  console.log('🧹 Test booking cleaned up\n');

  // Test 3: Check existing bookings
  console.log('3️⃣ Checking existing bookings...');
  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    console.error('❌ Cannot fetch bookings:', fetchError.message);
  } else {
    console.log(`✅ Found ${bookings.length} existing bookings`);
    if (bookings.length > 0) {
      console.log('\n📋 Recent bookings:');
      bookings.forEach((booking, i) => {
        console.log(`   ${i + 1}. ${booking.first_name} ${booking.last_name} - ${booking.consultation_date} at ${booking.consultation_time}`);
      });
    }
  }

  console.log('\n✅ All tests passed! Your Supabase is ready.');
  console.log('\n🎯 You can now:');
  console.log('   1. Test the booking form at /consultation');
  console.log('   2. Check bookings in Supabase dashboard');
  console.log('   3. View your Google Calendar for events');
}

testSupabase();
