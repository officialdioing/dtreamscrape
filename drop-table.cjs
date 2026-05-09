const https = require('https');
const querystring = require('querystring');

const url = 'https://aifqsjkgvejcqrzwgvqg.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running this script.');
}

console.log('🗑️  Dropping blog_posts table...\n');

// First, let's check if the table exists and what it contains
const checkOptions = {
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  }
};

console.log('1️⃣ Checking table contents...');
https.get(`${url}/rest/v1/blog_posts?limit=1`, checkOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const count = data ? JSON.parse(data).length : 0;
      console.log(`   Found table with ${count} records`);
      console.log('   ⚠️  WARNING: This will delete all data in blog_posts table!');
      console.log('   Proceeding with DROP TABLE...\n');
      
      // Now drop the table using PostgreSQL RPC
      dropTable();
    } else {
      console.log('   Table does not exist or already dropped');
    }
  });
}).on('error', (err) => {
  console.log('   Error checking table:', err.message);
});

function dropTable() {
  const dropSQL = 'DROP TABLE IF EXISTS public.blog_posts CASCADE;';
  
  const postData = querystring.stringify({
    query: dropSQL
  });
  
  const dropOptions = {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  
  const req = https.request(`${url}/rest/v1/rpc/exec_sql`, dropOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Successfully dropped blog_posts table!');
      } else {
        console.log('❌ Error dropping table');
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Error:', err.message);
    console.log('\n💡 Alternative: You may need to drop it via Supabase dashboard SQL editor');
  });
  
  req.write(postData);
  req.end();
}
