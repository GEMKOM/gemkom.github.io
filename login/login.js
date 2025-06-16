// login/login.js
import { isLoggedIn, isAdmin } from './loginService.js';
import { setupLoginUI, populateUserSelect } from './loginView.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (isLoggedIn()) {
    window.location.href = isAdmin() ? '/talasli-imalat/admin' : '/talasli-imalat';
    return;
  }

  await populateUserSelect();
  setupLoginUI();
});
