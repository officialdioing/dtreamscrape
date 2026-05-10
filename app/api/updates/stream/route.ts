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
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial version
      if (!isClosed) {
        controller.enqueue(sseFrame('version', {
          version: getContentVersion(),
          timestamp: new Date().toISOString(),
        }));
      }

      // Subscribe to updates
      unsubscribe = subscribeToUpdates((event) => {
        if (!isClosed) {
          try {
            controller.enqueue(sseFrame('version', event));
          } catch (error) {
            console.error('Failed to enqueue SSE update:', error);
            isClosed = true;
            controller.close();
          }
        }
      });

      // Send keep-alive ping every 15 seconds to prevent connection timeout
      pingTimer = setInterval(() => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'));
          } catch (error) {
            console.error('Failed to send ping:', error);
            isClosed = true;
            controller.close();
          }
        } else {
          // Connection closed, stop ping timer
          if (pingTimer) clearInterval(pingTimer);
        }
      }, 15000); // Reduced from 25s to 15s for better reliability
    },
    cancel() {
      console.log('SSE stream cancelled');
      isClosed = true;
      unsubscribe();
      if (pingTimer) clearInterval(pingTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
