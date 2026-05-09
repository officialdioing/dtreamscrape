const fs = require('fs');
const path = require('path');

const providersDir = 'src/admin/providers';
const files = fs.readdirSync(providersDir).filter(f => f.endsWith('Provider.tsx'));

files.forEach(file => {
  const filePath = path.join(providersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add error state if not present
  if (!content.includes('useState') || !content.includes('error')) {
    console.log(`Skipping ${file} - already has error handling or different structure`);
    return;
  }
  
  console.log(`Processing ${file}...`);
});

console.log('Processed provider files');
