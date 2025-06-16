// Updated with Cloudflare Worker backend integration and proper CORS support

const state = {
  base: 'https://gemkom-1.atlassian.net',
  timerActive: false,
  intervalId: null,
  currentIssueKey: null,
  startTime: null,
  userId: null,
  selectedMachine: null
};


const proxyBase = 'https://falling-bread-330e.ocalik.workers.dev/?url=';
const backendBase = 'https://falling-bread-330e.ocalik.workers.dev';


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


function formatTime(secs) {
  const hrs = Math.floor(secs / 3600).toString().padStart(2, '0');
  const mins = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const sec = (secs % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${sec}`;
}

function formatJiraDate(ms) {
  const d = new Date(ms);
  const pad = n => (n < 10 ? '0' + n : n);
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const msms = (d.getMilliseconds() + '').padStart(3, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${msms}${sign}${offsetHours}${offsetMinutes}`;
}

function saveTimerState() {
  if (state.timerActive && state.startTime && state.currentIssueKey) {
    localStorage.setItem('jira-timer-state', JSON.stringify({
      startTime: state.startTime,
      issueKey: state.currentIssueKey
    }));
  } else {
    localStorage.removeItem('jira-timer-state');
  }
}

function restoreTimerState() {
  const saved = localStorage.getItem('jira-timer-state');
  if (saved) {
    const { startTime, issueKey } = JSON.parse(saved);
    state.startTime = startTime;
    state.currentIssueKey = issueKey;
    fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issueKey}`))
      .then(res => res.json())
      .then(issue => openTimer(issue, true));
  }
}

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

function setupFilterButtons() {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '';

  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.textContent = f.name;
    btn.className = 'filter-button';
    btn.onclick = () => {
      document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTasksByFilterId(f.id);
    };
    bar.appendChild(btn);
  });
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
  res = await checkLogin(user, pass)
  if (res.ok) {
    login_data = await res.json();
    state.userId = user;
    document.getElementById('current-user-label').textContent = `${state.userId} olarak giriş yapıldı`;
    localStorage.setItem('user-id', user);
    if (login_data.admin) {
      window.location.href = 'file:///C:/Users/ocal%C4%B1k/OneDrive%20-%20GEMKOM/Masa%C3%BCst%C3%BC/Jira%20Timer/admin/index.html'; // 🔁 Redirect to admin page
    } else {
      document.getElementById('login-view').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      restoreTimerState();
    }
  } else {
    alert("Şifre hatalı.");
  }
});


async function loadTasksByFilterId(filterId) {
  try {
    const res = await fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/search?jql=filter=${filterId}&fields=summary,customfield_10117,customfield_10184,customfield_10185,customfield_10187`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    
    state.allIssues = data.issues;
    renderTaskList(state.allIssues);
  } catch (err) {
    alert("Error: " + err.message);
    console.error(err);
  }
}

function renderTaskList(issues){
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';
  issues.forEach(issue => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.onclick = (e) => {
        e.preventDefault();
        if (state.timerActive) {
          alert("Lütfen önce mevcut zamanlayıcıyı durdurun.");
          return;
        }
        openTimer(issue);
      };
      const fields = issue.fields;

      const left = document.createElement('div');
      left.className = 'task-left';
      const title = document.createElement('h3');
      title.textContent = issue.key;
      const summary = document.createElement('p');
      summary.textContent = fields.summary;
      left.appendChild(title);
      left.appendChild(summary);

      const right = document.createElement('div');
      right.className = 'task-right';
      const isEmriNo = document.createElement('div');
      isEmriNo.textContent = `İş Emri: ${fields.customfield_10117 || '-'}`;
      const resimNo = document.createElement('div');
      resimNo.textContent = `Resim No: ${fields.customfield_10184 || '-'}`;
      const pozNo = document.createElement('div');
      pozNo.textContent = `Poz No: ${fields.customfield_10185 || '-'}`;
      const adet = document.createElement('div');
      adet.textContent = `Adet: ${fields.customfield_10187 || '-'}`;
      right.appendChild(isEmriNo);
      right.appendChild(resimNo);
      right.appendChild(pozNo);
      right.appendChild(adet);

      card.appendChild(left);
      card.appendChild(right);
      ul.appendChild(card);
    });
}

function openTimer(issue, restoring = false) {
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('timer-view').classList.remove('hidden');
  document.getElementById('task-title').textContent = issue.key;

  const startStopBtn = document.getElementById('start-stop');
  const timerDisplay = document.getElementById('timer-display');
  const manualLogBtn = document.getElementById('manual-log-button');
  const markDoneBtn = document.getElementById('mark-done-button');
  const stopOnlyBtn = document.getElementById('stop-only-button');
  const backBtn = document.getElementById('back-button');


  state.currentIssueKey = issue.key;
  let intervalId = null;

  function updateDisplay() {
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    timerDisplay.textContent = formatTime(elapsed);
  }

  function resetTimerUI() {
    const startStopBtn = document.getElementById('start-stop');
    const timerDisplay = document.getElementById('timer-display');
    markDoneBtn.display = 'block';
    manualLogBtn.style.display = 'block';
    backBtn.style.display = 'block';
    startStopBtn.disabled = false; // 🔹 Bu önemli
    stopOnlyBtn.disabled = false;
    startStopBtn.textContent = 'Başlat';
    startStopBtn.classList.remove('red');
    startStopBtn.classList.add('green');
    stopOnlyBtn.classList.add('hidden');
    timerDisplay.textContent = '';
    state.timerActive = false;
    state.startTime = null;
    saveTimerState();
  }

  if (restoring) {
    state.startTime = parseInt(state.startTime);
    state.timerActive = true;
    updateDisplay();
    intervalId = setInterval(updateDisplay, 1000);
    startStopBtn.textContent = 'Durdur ve İşle';
    startStopBtn.classList.remove('green');
    startStopBtn.classList.add('red');
    stopOnlyBtn.classList.remove('hidden');
  } else {
    resetTimerUI();
  }

  startStopBtn.onclick = async () => {
    if (!state.timerActive) {
      state.startTime = Date.now();
      state.timerActive = true;
      markDoneBtn.style.display = 'none'; // ← add this line
      manualLogBtn.style.display = 'none';
      backBtn.style.display = 'none';
      startStopBtn.textContent = 'Durdur ve İşle';
      startStopBtn.classList.remove('green');
      startStopBtn.classList.add('red');
      stopOnlyBtn.classList.remove('hidden');
      intervalId = setInterval(updateDisplay, 1000);
      saveTimerState();
      await fetch(`${backendBase}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          issue_key: issue.key,
          start_time: state.startTime,
          machine: state.selectedMachine
        })
      });

    } else {
      clearInterval(intervalId);
      let elapsed = Math.round((Date.now() - state.startTime) / 1000);
      if (elapsed < 60) elapsed = 60;
      const started = formatJiraDate(state.startTime);
      state.finish_time = Date.now()
      state.timerActive = false;
      startStopBtn.disabled = true;
      startStopBtn.textContent = 'İşleniyor...';
      saveTimerState();

      await fetch(`${backendBase}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: state.userId,
            finish_time: state.finish_time,
            synced_to_jira: true,
        })
      });

      const logRes = await fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/worklog`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started: started,
          timeSpentSeconds: elapsed,
          comment: {
            type: "doc",
            version: 1,
            content: [{
              type: "paragraph",
              content: [{
                type: "text",
                text: `Logged via GitHub Page: ${formatTime(elapsed)}`
              }]
            }]
          }
        })
      });

      if (!logRes.ok) {
        const errorText = await logRes.text();
        alert(`Bir hata oluştu: ${logRes.status}\n${errorText}`);
      } else {
        alert(`${issue.key} işine ${formatTime(elapsed)} süresi eklendi.`);
      }

      resetTimerUI();
    }
  };

  stopOnlyBtn.onclick = async () => {
    clearInterval(intervalId);
    state.timerActive = false;
    startStopBtn.disabled = true;
    stopOnlyBtn.disabled = true;
    saveTimerState();

    await fetch(`${backendBase}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        issue_key: issue.key,
        finish_time: Date.now(),
        synced_to_jira: false,
        machine: state.selectedMachine || ''
      })
    });

    alert("Zamanlayıcı durduruldu. Jira’ya yazılmadı.");
    resetTimerUI();
  };

  manualLogBtn.onclick = () => {
    const input = prompt("Dakika cinsinden süre girin (örn: 30):");
    const mins = parseInt(input);
    if (isNaN(mins) || mins <= 0) return alert("Geçersiz giriş.");

    const seconds = mins * 60;
    const started = formatJiraDate(Date.now() - seconds);

    fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/worklog`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        started,
        timeSpentSeconds: seconds,
        comment: {
          type: "doc",
          version: 1,
          content: [{
            type: "paragraph",
            content: [{
              type: "text",
              text: `Manuel giriş: ${formatTime(seconds)}`
            }]
          }]
        }
      })
    }).then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        alert(`Hata: ${res.status} - ${errText}`);
      } else {
        alert(`${issue.key} için manuel olarak ${mins} dakika giriş yapıldı.`);
      }
    });
  };

  markDoneBtn.onclick = () => {
    if (state.timerActive){
      alert("Lütfen önce zamanlayıcıyı durdurun.");
      return;
    }
    const confirmDone = confirm("Bu görevi tamamen bitirdiniz mi?\nBu işlem görev durumunu 'Tamamlandı' yapacak.");
    if (!confirmDone) return;

    fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/transitions`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transition: { id: "41" } // "Done" transition ID’si senin Jira’da farklı olabilir
      })
    }).then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        alert(`Durum değiştirilemedi: ${res.status}\n${errText}`);
      } else {
        alert("Görev tamamlandı olarak işaretlendi.");
        document.getElementById('timer-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
      }
    });
  };

  backBtn.onclick = () => {
    if (state.timerActive) {
      alert("Lütfen önce zamanlayıcıyı durdurun.");
      return;
    }
    document.getElementById('timer-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
  };


};

function checkExistingLogin() {
  const savedUser = localStorage.getItem('user-id');
  if (savedUser) {
    state.userId = savedUser;
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    restoreTimerState();
  } else {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
}

document.getElementById('logout-button').addEventListener('click', () => {
  if (state.timerActive){
      alert("Lütfen önce zamanlayıcıyı durdurun.");
      return;
  }
  localStorage.removeItem('user-id');
  localStorage.removeItem('jira-timer-state');
  state.userId = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-view').classList.remove('hidden');
});

document.getElementById('search-input').oninput = (e) => {
  const term = e.target.value.trim().toLowerCase();
  const filtered = state.allIssues.filter(issue =>
    issue.key.toLowerCase().includes(term)
  );
  renderTaskList(filtered);
};

checkExistingLogin();
loadUsers();
restoreTimerState();
setupFilterButtons();
