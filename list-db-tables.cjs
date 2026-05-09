const https = require('https');

const url = 'https://aifqsjkgvejcqrzwgvqg.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running this script.');
}

console.log('🔍 Discovering tables in Supabase database...\n');

// List of common tables to check
const possibleTables = [
  'users', 'accounts', 'sessions', 'verification_tokens',
  'portfolio_items', 'events', 'services', 'bookings', 
  'media_library', 'site_settings', 'site_content',
  'inquiries', 'blog_posts', 'pages', 'audit_logs',
  'password_reset_tokens'
];

const options = {
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  }
};

let found = 0;
let checked = 0;

const checkTable = (tableName) => {
  return new Promise((resolve) => {
    const testUrl = `${url}/rest/v1/${tableName}?limit=1`;
    
    https.get(testUrl, options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 406) {
        console.log(`✅ ${tableName}`);
        found++;
        resolve(true);
      } else {
        resolve(false);
      }
      checked++;
      
      if (checked === possibleTables.length) {
        console.log(`\n📊 Found ${found} out of ${possibleTables.length} checked tables`);
      }
    }).on('error', () => {
      resolve(false);
      checked++;
      
      if (checked === possibleTables.length) {
        console.log(`\n📊 Found ${found} out of ${possibleTables.length} checked tables`);
      }
    });
  });
};

(async () => {
  console.log('Checking for tables:\n');
  for (const table of possibleTables) {
    await checkTable(table);
  }
})();
