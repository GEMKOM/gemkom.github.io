// login/loginView.js
import { fetchUsers, checkLogin, saveLogin } from './loginService.js';

export function setupLoginUI() {
  document.getElementById('login-button').addEventListener('click', async () => {
    const user = document.getElementById('user-select').value;
    const pass = document.getElementById('password-input').value;
    if (!user || !pass) return alert("Lütfen kullanıcı ve şifre giriniz.");

    const data = await checkLogin(user, pass);
    if (data) {
      saveLogin(user, data.admin);
      window.location.href = data.admin ? '/admin' : '/talasli-imalat';
    } else {
      alert("Şifre hatalı.");
    }
  });
}

export async function populateUserSelect() {
  const users = await fetchUsers();
  const userSelect = document.getElementById('user-select');
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.user_id;
    opt.textContent = u.user_id;
    userSelect.appendChild(opt);
  });
}
