// Debug: Check what the blog posts provider is actually receiving
const testFetch = async () => {
  const res = await fetch('http://localhost:3000/api/admin/blog-posts');
  const json = await res.json();
  
  console.log('API Response:');
  console.log('Total items:', json.items.length);
  console.log('\nFirst item structure:');
  const firstItem = json.items[0];
  Object.keys(firstItem).forEach(key => {
    console.log(`  ${key}:`, typeof firstItem[key], firstItem[key]?.substring?.(0, 50) || firstItem[key]);
  });
};

testFetch().catch(console.error);
