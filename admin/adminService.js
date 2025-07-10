import { backendBase } from '../base.js';
import { getSyncedNow } from '../generic/timeService.js'
import { authedFetch } from '../authService.js';
import { extractResultsFromResponse } from '../generic/paginationHelper.js';

export async function fetchActiveTimers() {
  const res = await authedFetch(`${backendBase}/machining/timers?is_active=true`);
  const responseData = await res.json();
  return extractResultsFromResponse(responseData);
}

export function formatDuration(startTime) {
  const elapsed = Math.floor((getSyncedNow() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
