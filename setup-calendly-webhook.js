// Setup Calendly Webhook
// Run this script to register your webhook with Calendly

const CALENDLY_API_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzc3NzE3NDE5LCJqdGkiOiJkZDZmZjhjNy1jN2Q0LTQ5MWItODgzOS0zZmU2NjNhYWYxZmMiLCJ1c2VyX3V1aWQiOiI5N2E3OGM4MC03MDcyLTRjYTItYTA0Yy00NGVlYjI0ZmE3ZWUiLCJzY29wZSI6ImF2YWlsYWJpbGl0eTpyZWFkIGF2YWlsYWJpbGl0eTp3cml0ZSBldmVudF90eXBlczpyZWFkIGV2ZW50X3R5cGVzOndyaXRlIGxvY2F0aW9uczpyZWFkIHJvdXRpbmdfZm9ybXM6cmVhZCBzaGFyZXM6d3JpdGUgc2NoZWR1bGVkX2V2ZW50czpyZWFkIHNjaGVkdWxlZF9ldmVudHM6d3JpdGUgc2NoZWR1bGluZ19saW5rczp3cml0ZSBncm91cHM6cmVhZCBvcmdhbml6YXRpb25zOnJlYWQgb3JnYW5pemF0aW9uczp3cml0ZSB1c2VyczpyZWFkIGFjdGl2aXR5X2xvZzpyZWFkIGRhdGFfY29tcGxpYW5jZTp3cml0ZSBvdXRnb2luZ19jb21tdW5pY2F0aW9uczpyZWFkIHdlYmhvb2tzOnJlYWQgd2ViaG9va3M6d3JpdGUifQ.2TW1-cbpnGeIqgFRXAaJw7zd2fO-1W429mYuQsVU4u6jG3CctMdMt8nFKGquo-fheb4WLr4V5288PBX7zOdBOQ';

// IMPORTANT: Calendly requires a publicly accessible URL for webhooks
// Localhost URLs will not work. Update this to your deployed app URL:
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/calendly`
  : 'https://your-deployed-app-url.com/api/webhooks/calendly';

async function setupCalendlyWebhook() {
  console.log('🔗 Setting up Calendly webhook...');
  console.log('   Webhook URL:', WEBHOOK_URL);
  console.log('');

  try {
    // Get current user
    console.log('🔍 Fetching user info...');
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to fetch user:', userResponse.status);
      return;
    }

    const userData = await userResponse.json();
    const userUri = userData.resource.uri;
    console.log('✅ User URI:', userUri);

    // Create webhook subscription
    console.log('🔗 Creating webhook subscription...');

    const webhookPayload = {
      organization: userData.resource.current_organization,
      url: WEBHOOK_URL,
      events: ['invitee.created', 'invitee.canceled'],
      state: 'active',
      scope: 'organization',
    };

    const webhookResponse = await fetch('https://api.calendly.com/webhook_subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.json();
      console.error('❌ Failed to create webhook:', webhookResponse.status);
      console.error('   Error:', errorData);
      return;
    }

    const webhookData = await webhookResponse.json();
    const webhook = webhookData.resource;

    console.log('✅ Webhook created successfully!');
    console.log('');
    console.log('📋 Webhook Details:');
    console.log('   ID:', webhook.id);
    console.log('   URL:', webhook.url);
    console.log('   Status:', webhook.state);
    console.log('   Events:', webhook.events.join(', '));
    console.log('   Created at:', webhook.created_at);
    console.log('');
    console.log('🎉 Your Calendly webhook is now active!');
    console.log('   When events are created/canceled in Calendly,');
    console.log('   they will automatically sync with your Supabase database.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// List existing webhooks
async function listWebhooks() {
  console.log('📋 Listing existing Calendly webhooks...');
  console.log('');

  try {
    const response = await fetch('https://api.calendly.com/webhook_subscriptions', {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch webhooks:', response.status);
      return;
    }

    const data = await response.json();
    const webhooks = data.collection;

    if (webhooks.length === 0) {
      console.log('   No webhooks found.');
      return;
    }

    console.log(`   Found ${webhooks.length} webhook(s):`);
    console.log('');

    webhooks.forEach((wh, index) => {
      console.log(`${index + 1}. ${wh.id}`);
      console.log('   URL:', wh.url);
      console.log('   Events:', wh.events.join(', '));
      console.log('   Status:', wh.state);
      console.log('   Created:', wh.created_at);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Check if user wants to setup or list
const args = process.argv.slice(2);
const command = args[0] || 'setup';

if (command === 'list') {
  listWebhooks();
} else if (command === 'setup') {
  setupCalendlyWebhook();
} else {
  console.log('Usage:');
  console.log('  node setup-calendly-webhook.js setup  - Create new webhook');
  console.log('  node setup-calendly-webhook.js list   - List existing webhooks');
}
