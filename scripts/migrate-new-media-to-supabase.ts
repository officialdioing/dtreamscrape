#!/usr/bin/env tsx
/**
 * Migration script to sync NEW local media files to Supabase Storage
 * This script checks both local and Supabase storage, only uploading files
 * that don't already exist in Supabase.
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

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Helper function to get MIME type from filename
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function listLocalFiles(): Promise<string[]> {
  try {
    await fs.access(SOURCE_DIR);
  } catch {
    return [];
  }

  const files = await fs.readdir(SOURCE_DIR);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.webm'].includes(ext);
  });
}

async function listSupabaseFiles(): Promise<string[]> {
  try {
    const { data: files, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (error) {
      console.error('⚠️  Warning: Could not list Supabase files:', error.message);
      return [];
    }

    return (files || [])
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => file.name);
  } catch (error) {
    console.error('⚠️  Warning: Error listing Supabase files:', error);
    return [];
  }
}

async function uploadFile(filename: string): Promise<{ success: boolean; error?: string }> {
  const filePath = path.join(SOURCE_DIR, filename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileStats = await fs.stat(filePath);
    const mimeType = getMimeType(filename);

    console.log(`  📤 Uploading: ${filename} (${formatFileSize(fileStats.size)})`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`  ✅ Uploaded: ${filename}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

async function syncNewMediaFiles() {
  console.log('🔄 Checking for new media files to sync...\n');

  // List local files
  const localFiles = await listLocalFiles();
  if (localFiles.length === 0) {
    console.log('ℹ️  No local media files found.');
    return;
  }

  console.log(`📁 Found ${localFiles.length} local media file(s)\n`);

  // List existing Supabase files
  const supabaseFiles = await listSupabaseFiles();
  console.log(`☁️  Supabase already has ${supabaseFiles.length} file(s)\n`);

  // Find new files (in local but not in Supabase)
  const newFiles = localFiles.filter(filename => !supabaseFiles.includes(filename));

  if (newFiles.length === 0) {
    console.log('✅ All local files are already in Supabase! Nothing to sync.\n');
    return;
  }

  console.log(`📦 Found ${newFiles.length} new file(s) to upload:\n`);
  newFiles.forEach(file => console.log(`   • ${file}`));
  console.log('');

  // Upload new files
  let successCount = 0;
  let errorCount = 0;

  for (const filename of newFiles) {
    const result = await uploadFile(filename);
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      console.error(`  ❌ Failed to upload ${filename}: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Sync Summary:`);
  console.log(`   ✅ Successfully uploaded: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📋 Total new files: ${newFiles.length}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n✅ Sync complete! New files have been added to Supabase Storage.');
  }

  if (errorCount > 0) {
    console.log('\n⚠️  Some files failed to upload. Check the errors above.');
    process.exit(1);
  }
}

syncNewMediaFiles();
