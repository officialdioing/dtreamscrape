import { NextRequest } from 'next/server';
import { getContentVersion } from '@/src/lib/content-version';
import { subscribeToUpdates } from '@/src/lib/update-bus';

export const runtime = 'nodejs';

const encoder = new TextEncoder();

function sseFrame(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(_request: NextRequest) {
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let unsubscribe = () => {};

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(sseFrame('version', {
        version: getContentVersion(),
        timestamp: new Date().toISOString(),
      }));

      unsubscribe = subscribeToUpdates((event) => {
        controller.enqueue(sseFrame('version', event));
      });

      pingTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 25000);
    },
    cancel() {
      unsubscribe();
      if (pingTimer) clearInterval(pingTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
