import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vxzagfvbnfgipoqlpjel.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_ANON_KEY before running this script.');
}

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect to the bookings table
    console.log('\n📊 Testing bookings table...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1);

    if (bookingsError) {
      console.log('❌ Bookings table error:', bookingsError.message);
    } else {
      console.log('✅ Bookings table accessible!');
    }

    // Test 2: Check if blog_posts table exists
    console.log('\n📝 Testing blog_posts table...');
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('count')
      .limit(1);

    if (blogError) {
      console.log('❌ Blog posts table error:', blogError.message);
      console.log('   (This table needs to be created)');
    } else {
      console.log('✅ Blog posts table accessible!');
    }

    // Test 3: Get actual booking count
    console.log('\n📈 Getting booking statistics...');
    const { data: allBookings, error: countError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: false });

    if (countError) {
      console.log('❌ Error getting booking count:', countError.message);
    } else {
      console.log(`✅ Total bookings in database: ${allBookings?.length || 0}`);
    }

    // Test 4: Get recent bookings
    console.log('\n📋 Getting recent bookings...');
    const { data: recentBookings, error: recentError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentError) {
      console.log('❌ Error getting recent bookings:', recentError.message);
    } else {
      console.log(`✅ Found ${recentBookings?.length || 0} recent bookings:`);
      recentBookings?.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.first_name} ${booking.last_name} - ${booking.email}`);
        console.log(`      Consultation: ${booking.consultation_date} at ${booking.consultation_time}`);
      });
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection().then(() => {
  console.log('\n🎉 Test complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
