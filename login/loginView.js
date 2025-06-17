// login/loginView.js
import { fetchUsers, checkLogin, saveLogin } from './loginService.js';

export function setupLoginUI() {
  const loginButton = document.getElementById('login-button');
  const userSelect = document.getElementById('user-select');
  const passwordInput = document.getElementById('password');

  loginButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const user = userSelect.value;
    const pass = passwordInput.value;

    if (!user || !pass) {
      alert("Lütfen kullanıcı ve şifre giriniz.");
      return;
    }

    try {
      loginButton.disabled = true;
      loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Giriş yapılıyor...';
      
      const data = await checkLogin(user, pass);
      if (data) {
        saveLogin(user, data.admin);
        window.location.href = data.admin ? '/admin' : '/talasli-imalat';
      } else {
        alert("Şifre hatalı.");
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      loginButton.disabled = false;
      loginButton.innerHTML = 'Giriş Yap';
    }
  });

  // Add enter key support
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginButton.click();
    }
  });
}

export async function populateUserSelect() {
  try {
    const users = await fetchUsers();
    const userSelect = document.getElementById('user-select');
    userSelect.innerHTML = '<option value="">Seçiniz...</option>';
    
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.user_id;
      opt.textContent = u.user_id;
      userSelect.appendChild(opt);
    });
  } catch (error) {
    console.error('Error populating users:', error);
    alert("Kullanıcı listesi yüklenirken bir hata oluştu. Lütfen sayfayı yenileyiniz.");
  }
}
