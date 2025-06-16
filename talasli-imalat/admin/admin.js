import { backendBase } from "../../base";
const activeRows = {};  // { issue_key: { startTime, rowElement, durationCell } }

if (localStorage.getItem('is-admin') !== 'true') {
  window.location.href = '/login';
}

async function loadUserOptions() {
  try {
    const res = await fetch(`${backendBase}/user/list`);
    const users = await res.json();
    const select = document.getElementById('user-filter');
    select.innerHTML = '<option value="">Tümü</option>'; // temizle
    users.forEach(u => {
      const option = document.createElement('option');
      option.value = u.user_id;
      option.textContent = u.user_id;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Kullanıcı listesi alınamadı:", err);
  }
}

function formatDuration(startTime) {
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsedSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function updateDurations() {
  for (const key in activeRows) {
    const row = activeRows[key];
    row.durationCell.textContent = formatDuration(row.startTime);
  }
}

async function loadTimers() {
  const res = await fetch(`${backendBase}/active`);
  const timers = await res.json();

  const userFilter = document.getElementById('user-filter').value.toLowerCase();
  const issueFilter = document.getElementById('issue-filter').value.toLowerCase();

  const tableBody = document.querySelector('#admin-table tbody');
  const newKeys = new Set();

  timers.filter(t => {
    if (t.finish_time) return false;
    const matchesUser = userFilter ? t.user_id.toLowerCase() === userFilter : true;
    const matchesIssue = issueFilter ? t.issue_key.toLowerCase().includes(issueFilter) : true;
    return matchesUser && matchesIssue;
  }).forEach(t => {
    newKeys.add(t.issue_key);

    if (activeRows[t.issue_key]) {
      // Satır zaten varsa sadece startTime güncelle
      activeRows[t.issue_key].startTime = t.start_time;
    } else {
      // Yeni satır ekle
      const tr = document.createElement('tr');
      const userTd = document.createElement('td');
      const issueTd = document.createElement('td');
      const durationTd = document.createElement('td');

      userTd.textContent = t.user_id;
      issueTd.textContent = t.issue_key;
      durationTd.textContent = formatDuration(t.start_time);

      tr.appendChild(userTd);
      tr.appendChild(issueTd);
      tr.appendChild(durationTd);
      tableBody.appendChild(tr);

      activeRows[t.issue_key] = {
        startTime: t.start_time,
        rowElement: tr,
        durationCell: durationTd
      };
    }
  });

  // Bitmiş ya da filtre dışı kalanları kaldır
  for (const key in activeRows) {
    if (!newKeys.has(key)) {
      activeRows[key].rowElement.remove();
      delete activeRows[key];
    }
  }
}

async function checkAccessAndLoad() {
  const userId = localStorage.getItem('user-id');
  if (!userId) return window.location.href = '/';

  const res = await fetch(`${backendBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, password: '__validate__' })
  });

  if (res.status !== 200) return window.location.href = '/';

  await loadUserOptions();
  await loadTimers();
}

document.getElementById('user-filter').addEventListener('change', loadTimers);
document.getElementById('issue-filter').addEventListener('input', loadTimers);
document.getElementById('refresh-button').addEventListener('click', async () => {
  const btn = document.getElementById('refresh-button');
  btn.classList.add('loading');
  await loadTimers();
  btn.classList.remove('loading');
});

document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('user-id');
  localStorage.removeItem('is-admin');
  window.location.href = '/login';
});

checkAccessAndLoad();
setInterval(updateDurations, 1000);
