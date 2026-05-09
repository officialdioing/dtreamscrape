#!/bin/bash

# Fix Critical Backend API URL for Production
echo "🔧 Fixing CRITICAL backend API URL for Dreamscape Curated Event..."

# The ONE critical environment variable that's missing
CRITICAL_VAR="NEXT_PUBLIC_BACKEND_API_URL"
CRITICAL_VALUE="https://api.dreamscapecurated.com"

echo "📝 Setting $CRITICAL_VAR to $CRITICAL_VALUE..."

# Remove existing variable if it exists
vercel env rm "$CRITICAL_VAR" production --yes 2>/dev/null || true

# Add the variable with correct value
vercel env add "$CRITICAL_VAR" production --value "$CRITICAL_VALUE" --yes

echo "✅ $CRITICAL_VAR updated successfully"
echo "🚀 Critical backend URL is now configured!"
echo ""
echo "⚠️  IMPORTANT: Make sure these are also set in Vercel Dashboard:"
echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
echo "   - CSRF_SECRET (generate with: openssl rand -base64 32)"
echo "   - AUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   - DATABASE_URL (with real Supabase password)"
echo ""
echo "🎯 The main authentication issue should now be resolved!"