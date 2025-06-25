// --- machining.js ---
import {
  state,
  fetchIssuesByFilter,
  restoreTimerState,
  saveTimerState
} from './machiningService.js';

import {
  renderTaskList,
  setupMachineFilters,
  setupSearchInput,
  setupLogoutButton,
  setupTimerHandlers
} from './machiningView.js';

import { syncServerTime } from '../timeService.js';
import { proxyBase } from '../base.js';
import { filters } from '../globalVariables.js';

async function loadAndRender(filterId) {
  const issues = await fetchIssuesByFilter(filterId);
  renderTaskList(issues, openTimer);
}

function openTimer(issue, restoring = false) {
  setupTimerHandlers(issue, restoring);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!state.userId) return (window.location.href = '/login');
  
  await syncServerTime();
  
  // Check if we have a task parameter
  const urlParams = new URLSearchParams(window.location.search);
  
  setupMachineFilters(filters, loadAndRender);
  setupSearchInput();
  setupLogoutButton();
  restoreTimerState(openTimer);
});
