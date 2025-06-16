import { backendBase } from "../base.js";

async function loadUsers() {
  try {
    const res = await fetch(`${backendBase}/user/list`);
    const users = await res.json();
    const userSelect = document.getElementById('user-select');

    users.forEach(u => {
      const option = document.createElement('option');
      option.value = u.user_id;
      option.textContent = u.user_id;
      userSelect.appendChild(option);
    });
  } catch (err) {
    alert("Kullanıcılar yüklenemedi: " + err.message);
  }
}

function checkExistingLogin(){
  const userId = localStorage.getItem('user-id');
  const isAdmin = localStorage.getItem('is-admin');
  if (userId){
    if (isAdmin){
      window.location.href = '/talasli-imalat/admin'
    } else {
      window.location.href = '/talasli-imalat'
    }
  } else {
    if (window.location.href !== '/login'){
      window.location.href = '/login'
    }
  }

}

async function checkLogin(user_id, password) {
  const res = await fetch(`${backendBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, password })
  });
  return res;
}

document.getElementById('login-button').addEventListener('click', async () => {
  const user = document.getElementById('user-select').value;
  const pass = document.getElementById('password-input').value;
  if (!user || !pass) return alert("Lütfen kullanıcı ve şifre giriniz.");
  const res = await checkLogin(user, pass);
  if (res.ok) {
    const login_data = await res.json();
    localStorage.setItem('user-id', user);
    localStorage.setItem('is-admin', login_data.admin ? 'true' : 'false');
    if (login_data.admin) {
      window.location.href = '/talasli-imalat/admin'; // 🔁 Redirect to admin page
    } else {
      window.location.href = '/talasli-imalat'
    }
  } else {
    alert("Şifre hatalı.");
  }
});

checkExistingLogin();
loadUsers();
