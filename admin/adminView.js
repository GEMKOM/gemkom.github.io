import { fetchUsers, fetchActiveTimers, formatDuration } from './adminService.js';

const activeRows = {};

export async function populateUserFilter() {
  const users = await fetchUsers();
  const select = document.getElementById('user-filter');
  select.innerHTML = '<option value="">Tümü</option>';
  users.forEach(u => {
    const option = document.createElement('option');
    option.value = u.user_id;
    option.textContent = u.user_id;
    select.appendChild(option);
  });
}

export async function loadTimerTable() {
  const userFilter = document.getElementById('user-filter').value.toLowerCase();
  const issueFilter = document.getElementById('issue-filter').value.toLowerCase();
  const timers = await fetchActiveTimers();
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
      activeRows[t.issue_key].startTime = t.start_time;
    } else {
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

  // Remove old rows
  for (const key in activeRows) {
    if (!newKeys.has(key)) {
      activeRows[key].rowElement.remove();
      delete activeRows[key];
    }
  }
}

export function startDurationUpdater() {
  setInterval(() => {
    for (const key in activeRows) {
      const row = activeRows[key];
      const start = new Date(row.startTime).getTime();
      row.durationCell.textContent = formatDuration(row.startTime);
    }
  }, 1000);
}

export function setupAdminListeners() {
  document.getElementById('user-filter').addEventListener('change', loadTimerTable);
  document.getElementById('issue-filter').addEventListener('input', loadTimerTable);
  document.getElementById('refresh-button').addEventListener('click', async () => {
    const btn = document.getElementById('refresh-button');
    btn.classList.add('loading');
    await loadTimerTable();
    btn.classList.remove('loading');
  });

  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('user-id');
    localStorage.removeItem('is-admin');
    window.location.href = '/login';
  });
}
