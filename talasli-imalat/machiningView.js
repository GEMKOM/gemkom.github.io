import { state, formatTime, fetchIssuesByFilter, saveTimerState, formatJiraDate } from './machiningService.js';

export function setupMachineFilters(filters, onClick) {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '';

  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.textContent = f.name;
    btn.className = 'filter-button';
    btn.onclick = () => {
      document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onClick(f.id);
    };
    bar.appendChild(btn);
  });
}

export async function renderTaskList(issues, openTimerCallback) {
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';
  issues.forEach(issue => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.onclick = (e) => {
      e.preventDefault();
      if (state.timerActive) return alert("Lütfen önce mevcut zamanlayıcıyı durdurun.");
      openTimerCallback(issue);
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
    right.innerHTML = `
      <div>İş Emri: ${fields.customfield_10117 || '-'}</div>
      <div>Resim No: ${fields.customfield_10184 || '-'}</div>
      <div>Poz No: ${fields.customfield_10185 || '-'}</div>
      <div>Adet: ${fields.customfield_10187 || '-'}</div>
    `;

    card.appendChild(left);
    card.appendChild(right);
    ul.appendChild(card);
  });
}

export function setupSearchInput() {
  document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = state.allIssues.filter(issue =>
      issue.key.toLowerCase().includes(term)
    );
    renderTaskList(filtered, openTimer);
  };
}

export function setupLogoutButton() {
  document.getElementById('logout-button').addEventListener('click', () => {
    if (state.timerActive) {
      alert("Lütfen önce zamanlayıcıyı durdurun.");
      return;
    }
    localStorage.removeItem('user-id');
    localStorage.removeItem('jira-timer-state');
    window.location.href = '/login';
  });
}
