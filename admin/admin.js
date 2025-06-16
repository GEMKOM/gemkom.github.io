import { populateUserFilter, loadTimerTable, startDurationUpdater, setupAdminListeners } from './adminView.js';
import { isAdmin } from '../login/loginService.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!isAdmin()) {
    return window.location.href = '/login';
  }
  await populateUserFilter();
  await loadTimerTable();
  setupAdminListeners();
  startDurationUpdater();
});
