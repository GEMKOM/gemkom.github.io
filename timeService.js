import { backendBase } from './base.js';

let serverTimeOffset = 0;

/**
 * Syncs client time with server once by calculating the offset.
 */
export async function syncServerTime() {
  try {
    const res = await fetch(`${backendBase}/now`);
    const { now } = await res.json();
    const localNow = Date.now();
    serverTimeOffset = now - localNow;
    console.log(`⏱ Server time offset: ${serverTimeOffset}ms`);
  } catch (err) {
    console.warn('⚠️ Failed to sync server time:', err);
    serverTimeOffset = 0;
  }
}

/**
 * Returns current timestamp adjusted to server clock.
 * Use instead of Date.now()
 */
export function getSyncedNow() {
  return Date.now() + serverTimeOffset;
}