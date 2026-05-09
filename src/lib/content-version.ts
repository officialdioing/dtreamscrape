import 'server-only';
import { publishUpdate } from '@/src/lib/update-bus';

let contentVersion = Date.now();

export function getContentVersion() {
  return contentVersion;
}

export function bumpContentVersion() {
  contentVersion = Date.now();
  publishUpdate({
    version: contentVersion,
    type: 'content_update',
    timestamp: new Date().toISOString(),
  });
  return contentVersion;
}
