import 'server-only';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type ContentAction = 'create' | 'update' | 'delete';

function methodForAction(action: ContentAction) {
  switch (action) {
    case 'create':
      return 'POST';
    case 'delete':
      return 'DELETE';
    case 'update':
    default:
      return 'PUT';
  }
}

export async function triggerContentWebhook(
  action: ContentAction,
  resource: string,
  payload: Record<string, unknown> = {}
) {
  try {
    const response = await fetch(`${APP_URL}/api/webhooks/content`, {
      method: methodForAction(action),
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        action,
        resource,
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to trigger content webhook:', error);
  }
}
