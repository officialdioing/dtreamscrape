// Debug Calendly API issues
require('dotenv').config({ path: '.env' });

const CALENDLY_API_TOKEN = process.env.CALENDLY_API_TOKEN;
const CALENDLY_EVENT_TYPE_URI = process.env.CALENDLY_EVENT_TYPE_URI;
const CALENDLY_API_URL = 'https://api.calendly.com';

async function debugCalendly() {
  console.log('🔍 Debugging Calendly API...\n');

  // Test 1: Check if we can get user info
  console.log('1. Testing user endpoint...');
  try {
    const userResponse = await fetch(`${CALENDLY_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${userResponse.status}`);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('   ✅ User authenticated:', userData.resource.name);
      console.log('   User URI:', userData.resource.uri);

      // Test 2: Get availability with proper future dates
      console.log('\n2. Testing availability endpoint...');

      // Use dates that are definitely in the future
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 7); // 1 week from now
      startDate.setMinutes(startDate.getMinutes() + 5); // 5 minutes in the future

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7); // 1 week range

      console.log(`   Start: ${startDate.toISOString()}`);
      console.log(`   End: ${endDate.toISOString()}`);

      const availabilityResponse = await fetch(
        `${CALENDLY_API_URL}/event_type_available_times?event_type=${CALENDLY_EVENT_TYPE_URI}&start_time=${startDate.toISOString()}&end_time=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`   Status: ${availabilityResponse.status}`);

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        console.log(`   ✅ Found ${availabilityData.collection.length} available slots`);

        if (availabilityData.collection.length > 0) {
          console.log('   First few slots:');
          availabilityData.collection.slice(0, 3).forEach((slot, i) => {
            const date = new Date(slot.start_time);
            console.log(`      ${i + 1}. ${date.toLocaleString()}`);
          });

          // Analyze the times to determine working hours
          const hours = availabilityData.collection.map(slot => {
            const date = new Date(slot.start_time);
            return date.getHours();
          });

          const minHour = Math.min(...hours);
          const maxHour = Math.max(...hours);

          console.log(`   Working hours detected: ${minHour}:00 - ${maxHour}:00`);
        }
      } else {
        const errorData = await availabilityResponse.json();
        console.log('   ❌ Error:', JSON.stringify(errorData, null, 2));
      }

    } else {
      const errorData = await userResponse.json();
      console.log('   ❌ Auth failed:', JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Exception:', error.message);
  }
}

debugCalendly().then(() => {
  console.log('\n=== DEBUG COMPLETE ===');
});