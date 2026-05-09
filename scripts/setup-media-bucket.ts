#!/usr/bin/env tsx
/**
 * Setup script for Supabase Storage media bucket
 * Run this script to create the 'media' bucket in Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const BUCKET_NAME = 'media';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function setupMediaBucket() {
  try {
    console.log('🪣 Setting up Supabase Storage media bucket...');

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (bucketExists) {
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists`);
    } else {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'video/mp4',
          'video/webm',
        ],
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log(`✅ Created bucket '${BUCKET_NAME}'`);
    }

    // Set up bucket policies (public read access)
    const { error: policyError } = await supabase.storage.from(BUCKET_NAME).createSignedUrl('test-policy-check', 60);

    // We expect this to fail since the file doesn't exist, but it validates the bucket is accessible
    if (policyError && !policyError.message.includes('The resource was not found')) {
      console.warn(`⚠️  Note: You may need to set up bucket policies manually in the Supabase dashboard`);
      console.warn(`⚠️  Bucket policies should allow public read access for files`);
    }

    console.log('\n✅ Setup complete!');
    console.log(`\n📝 Next steps:`);
    console.log(`1. Visit your Supabase dashboard: ${supabaseUrl.replace('.co', '.co/project')}`);
    console.log(`2. Go to Storage → ${BUCKET_NAME}`);
    console.log(`3. Verify bucket policies allow public read access`);
    console.log(`4. Optionally migrate existing files from public/media/ to the bucket\n`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupMediaBucket();
