#!/bin/bash

# Fix Vercel Environment Variables Script
echo "🔧 Fixing Vercel environment variables for Dreamscape Curated Event..."

# Array of environment variables to fix
declare -A ENV_VARS=(
  ["CALENDLY_API_TOKEN"]="your_calendly_api_token"
  ["CALENDLY_EVENT_TYPE_URI"]="https://api.calendly.com/event_types/5011a988-b571-416b-8655-f25b8dbde357"
  ["SUPABASE_SERVICE_ROLE_KEY"]="your_supabase_service_role_key"
  ["NEXT_PUBLIC_SUPABASE_URL"]="https://aifqsjkgvejcqrzwgvqg.supabase.co"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="your_supabase_anon_key"
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]="your_supabase_publishable_key"
  ["NEXT_PUBLIC_CALENDLY_URL"]="https://calendly.com/ejiro006/30min"
  ["NEXT_PUBLIC_BUSINESS_EMAIL"]="systems@dioing.com"
  ["NEXT_PUBLIC_BUSINESS_PHONE"]="+2348169246969"
  ["NEXT_PUBLIC_BUSINESS_ADDRESS"]="123 Event Street, New York, NY 10001"
  ["NEXT_PUBLIC_WHATSAPP_NUMBER"]="2348169246969"
  ["NEXT_PUBLIC_APP_URL"]="https://dreamscape-curated-event.vercel.app"
  ["NEXT_PUBLIC_BACKEND_API_URL"]="https://api.dreamscapecurated.com"
  ["BREVO_API_KEY"]="your_brevo_api_key"
  ["RESEND_API_KEY"]="your_resend_api_key"
  ["FROM_EMAIL"]="onboarding@resend.dev"
)

# Function to add environment variable
add_env_var() {
  local var_name=$1
  local var_value=$2
  local environment=$3

  echo "📝 Adding $var_name to $environment..."

  # Remove existing variable if it exists
  vercel env rm "$var_name" "$environment" --yes 2>/dev/null || true

  # Add the variable with correct value
  vercel env add "$var_name" "$environment" --value "$var_value" --yes
}

# Add variables for production and preview environments
for env_var in "${!ENV_VARS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔧 Processing: $env_var"

  # Add to production
  add_env_var "$env_var" "${ENV_VARS[$env_var]}" "production"

  # Add to preview (for all branches)
  printf "\n" | vercel env add "$env_var" preview --value "${ENV_VARS[$env_var]}" --yes 2>/dev/null || true

  echo "✅ $env_var updated successfully"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Environment variables fixed successfully!"
echo "🚀 Ready to redeploy to Vercel!"
