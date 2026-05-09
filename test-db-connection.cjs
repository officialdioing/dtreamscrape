// Test database connection
const https = require('https');

const url = 'https://aifqsjkgvejcqrzwgvqg.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running this script.');
}

console.log('🔍 Testing Supabase connection...\n');

const options = {
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  }
};

https.get(`${url}/rest/v1/events?limit=1`, options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS: Can connect to Supabase!');
      console.log('📊 Response:', data.substring(0, 100));
    } else {
      console.log('❌ Status:', res.statusCode, data);
    }
  });
}).on('error', (err) => {
  console.log('❌ Error:', err.message);
});
