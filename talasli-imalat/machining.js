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
  setupLogoutButton
} from './machiningView.js';

const filters = [
  { id: '10698', name: 'BF-V10' },
  { id: '10697', name: 'BF-V13' },
  { id: '10696', name: 'BK-1580-L' },
  { id: '10699', name: 'Collet' },
  { id: '10694', name: 'Doosan CNC' },
  { id: '10692', name: 'Heckert' },
  { id: '10700', name: 'Hyundai CNC Torna' },
  { id: '10969', name: 'Hyundai Yatay İşleme' },
  { id: '10766', name: 'Manuel Torna 1' },
  { id: '10767', name: 'Manuel Torna 2' },
  { id: '10768', name: 'Manuel Torna 3' },
  { id: '10691', name: 'Schiess Froriep 1' },
  { id: '10690', name: 'Schiess Froriep 2' },
  { id: '10695', name: 'Toyoda Yatay' },
];

async function loadAndRender(filterId) {
  const issues = await fetchIssuesByFilter(filterId);
  renderTaskList(issues, openTimer);
}

// Placeholder – you’d move your full timer logic here
function openTimer(issue, restoring = false) {
  alert(`Timer opened for ${issue.key}`);
  // You can move timer DOM and backend logic into another module if needed.
}

document.addEventListener('DOMContentLoaded', () => {
  if (!state.userId) return (window.location.href = '/login');

  setupMachineFilters(filters, loadAndRender);
  setupSearchInput();
  setupLogoutButton();
  restoreTimerState(openTimer);
});
