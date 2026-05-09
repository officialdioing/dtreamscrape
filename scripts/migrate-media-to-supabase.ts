#!/usr/bin/env tsx
/**
 * Migration script to move existing media files from public/media/ to Supabase Storage
 * Run this after setting up the media bucket with setup-media-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
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
const SOURCE_DIR = path.join(process.cwd(), 'public', 'media');

async function migrateMediaFiles() {
  try {
    console.log('📦 Starting media migration to Supabase Storage...');

    // Check if source directory exists
    try {
      await fs.access(SOURCE_DIR);
    } catch {
      console.log(`ℹ️  Source directory ${SOURCE_DIR} does not exist or is empty`);
      console.log('Nothing to migrate.');
      return;
    }

    // Read all files in the media directory
    const files = await fs.readdir(SOURCE_DIR);
    const mediaFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.webm'].includes(ext);
    });

    if (mediaFiles.length === 0) {
      console.log('ℹ️  No media files found to migrate');
      return;
    }

    console.log(`Found ${mediaFiles.length} files to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const filename of mediaFiles) {
      const filePath = path.join(SOURCE_DIR, filename);

      try {
        // Read file
        const fileBuffer = await fs.readFile(filePath);
        const fileStats = await fs.stat(filePath);

        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.pdf': 'application/pdf',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, fileBuffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        console.log(`✅ ${filename} (${(fileStats.size / 1024).toFixed(1)} KB)`);
        successCount++;

      } catch (error) {
        console.error(`❌ ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (successCount > 0) {
      console.log(`\n📝 Next steps:`);
      console.log(`1. Test your media library in the admin panel`);
      console.log(`2. If everything works, you can delete the local files:`);
      console.log(`   rm -rf ${SOURCE_DIR}`);
      console.log(`3. Or keep them as a backup\n`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateMediaFiles();
