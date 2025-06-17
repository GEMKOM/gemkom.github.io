// --- machiningView.js ---
import {
  state,
  formatTime,
  formatJiraDate,
  saveTimerState
} from './machiningService.js';

import {
  proxyBase,
  backendBase
} from '../base.js';

import { syncServerTime, getSyncedNow } from '../timeService.js';

export function renderTaskList(issues, openTimerCallback) {
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';
  issues.forEach(issue => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.onclick = () => {
      if (state.timerActive) {
        alert("Lütfen önce mevcut zamanlayıcıyı durdurun.");
        return;
      }
      window.location.href = `/talasli-imalat/task.html?key=${issue.key}`;
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

export function setupMachineFilters(filters, onClick) {
  const select = document.getElementById('filter-select');
  select.innerHTML = '<option value="">Seçiniz...</option>'; // Reset options with placeholder

  filters.forEach(f => {
    const option = document.createElement('option');
    option.value = f.id;
    option.textContent = f.name;
    select.appendChild(option);
  });

  select.onchange = () => {
    onClick(select.value); // Call handler with selected value
  };
}

export function setupSearchInput() {
  document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = state.allIssues.filter(issue =>
      issue.key.toLowerCase().includes(term)
    );
    renderTaskList(filtered, setupTimerHandlers);
  };
}

export function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.onclick = () => {
      if (state.timerActive) {
        alert("Lütfen önce zamanlayıcıyı durdurun.");
        return;
      }
      // Clear all states
      localStorage.clear();
      // Redirect to login page
      window.location.href = '/login';
    };
  }
}

export function setupTimerHandlers(issue, restoring = false) {
  const startBtn = document.getElementById('start-stop');
  const stopOnlyBtn = document.getElementById('stop-only-button');
  const manualBtn = document.getElementById('manual-log-button');
  const doneBtn = document.getElementById('mark-done-button');
  const backBtn = document.getElementById('back-button');

  function updateTimerDisplay() {
    const elapsed = Math.round((getSyncedNow() - state.startTime) / 1000);
    document.getElementById('timer-display').textContent = formatTime(elapsed);
  }

  function resetTimerUI() {
    startBtn.textContent = 'Başlat';
    startBtn.classList.remove('red');
    startBtn.classList.add('green');
    stopOnlyBtn.classList.add('hidden');
    doneBtn.style.display = 'block';
    manualBtn.style.display = 'block';
    backBtn.style.display = 'block';
    startBtn.disabled = false;
    stopOnlyBtn.disabled = false;
    document.getElementById('timer-display').textContent = '00:00:00';
    state.timerActive = false;
    state.startTime = null;
    saveTimerState();
  }

  state.currentIssueKey = issue.key;
  document.getElementById('task-title').textContent = issue.key;

  if (restoring) {
    state.startTime = parseInt(state.startTime);
    state.timerActive = true;
    updateTimerDisplay();
    state.intervalId = setInterval(updateTimerDisplay, 1000);
    startBtn.textContent = 'Durdur ve İşle';
    startBtn.classList.remove('green');
    startBtn.classList.add('red');
    stopOnlyBtn.classList.remove('hidden');
  } else {
    resetTimerUI();
  }

  startBtn.onclick = async () => {
    if (!state.timerActive) {
      state.startTime = getSyncedNow();
      state.timerActive = true;
      startBtn.textContent = 'Durdur ve İşle';
      startBtn.classList.remove('green');
      startBtn.classList.add('red');
      stopOnlyBtn.classList.remove('hidden');
      manualBtn.style.display = 'none';
      doneBtn.style.display = 'none';
      backBtn.style.display = 'none';

      state.intervalId = setInterval(updateTimerDisplay, 1000);
      saveTimerState();

      await fetch(`${backendBase}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          issue_key: state.currentIssueKey,
          start_time: state.startTime,
          machine: state.selectedIssue.customfield_11411.value
        })
      });
    } else {
      clearInterval(state.intervalId);
      let elapsed = Math.round((getSyncedNow() - state.startTime) / 1000);
      if (elapsed < 60) elapsed = 60;
      const started = formatJiraDate(state.startTime);
      state.finish_time = getSyncedNow();
      state.timerActive = false;
      startBtn.disabled = true;
      startBtn.textContent = 'İşleniyor...';
      saveTimerState();

      await fetch(`${backendBase}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          finish_time: getSyncedNow(),
          synced_to_jira: true
        })
      });

      const res = await fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/worklog`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started,
          timeSpentSeconds: elapsed,
          comment: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: `Logged via GitHub Page: ${formatTime(elapsed)}`
              }]
            }]
          }
        })
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Hata oluştu. Lütfen tekrar deneyin.");
        resetTimerUI();
      }
    }
  };

  stopOnlyBtn.onclick = async () => {
    clearInterval(state.intervalId);
    resetTimerUI();
    await fetch(`${backendBase}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        finish_time: getSyncedNow(),
        synced_to_jira: false
      })
    });
    window.location.reload();
  };

  backBtn.onclick = () => {
    if (state.timerActive) {
      if (!confirm("Zamanlayıcı aktif. Geri dönmek istediğinize emin misiniz?")) {
        return;
      }
      clearInterval(state.intervalId);
      resetTimerUI();
    }
    window.location.href = '/talasli-imalat';
  };

  manualBtn.onclick = async () => {
    const minutes = prompt("Kaç dakika çalıştınız?");
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return;
    }

    const seconds = Math.round(parseFloat(minutes) * 60);
    const started = formatJiraDate(getSyncedNow() - seconds * 1000);

    try {
      const res = await fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/worklog`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started,
          timeSpentSeconds: seconds,
          comment: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: `Manuel giriş: ${formatTime(seconds)}`
              }]
            }]
          }
        })
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Error logging time:', error);
      alert("Hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  doneBtn.onclick = async () => {
    if (!confirm("Bu işi tamamlandı olarak işaretlemek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/transitions`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transition: { id: "41" }
        })
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Error marking as done:', error);
      alert("Hata oluştu. Lütfen tekrar deneyin.");
    }
  };
}
