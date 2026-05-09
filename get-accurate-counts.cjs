const https = require('https');

const url = 'https://aifqsjkgvejcqrzwgvqg.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running this script.');
}

const tables = [
  'portfolio_items', 'events', 'services', 'bookings', 
  'media_library', 'site_settings', 'site_content',
  'blog_posts', 'pages', 'audit_logs', 'sessions',
  'inquiries', 'users', 'accounts', 'verification_tokens'
];

async function getTableCount(tableName) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'count=exact'
      }
    };
    
    https.get(`${url}/rest/v1/${tableName}?select=id`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const countHeader = res.headers['content-range'];
        let count = 0;
        if (countHeader) {
          count = parseInt(countHeader.split('/')[1]) || 0;
        } else if (res.statusCode === 200) {
          try {
            count = JSON.parse(data).length || 0;
          } catch {
            count = 0;
          }
        }
        
        const status = res.statusCode === 200 ? '✅' : '❌';
        resolve({ table: tableName, count, status });
      });
    }).on('error', () => {
      resolve({ table: tableName, count: 0, status: '❌' });
    });
  });
}

(async () => {
  console.log('📊 Accurate Database Table Counts\n');
  console.log('Table'.padEnd(25), 'Records'.padEnd(10), 'Status');
  console.log('─'.repeat(50));
  
  const results = await Promise.all(tables.map(getTableCount));
  const validResults = results.filter(r => r.status === '✅');
  
  validResults.forEach(({ table, count, status }) => {
    console.log(status + ' ' + table.padEnd(24), count.toString().padEnd(10));
  });
  
  const total = validResults.reduce((sum, { count }) => sum + count, 0);
  console.log('─'.repeat(50));
  console.log('Total Records:', total);
  console.log('Active Tables:', validResults.length);
})();
