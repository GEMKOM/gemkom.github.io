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
    document.getElementById('timer-display').textContent = '';
    state.timerActive = false;
    state.startTime = null;
    saveTimerState();
  }

  state.currentIssueKey = issue.key;
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('timer-view').classList.remove('hidden');
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
      state.startTime = getSyncedNow()
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
          machine: state.selectedMachine
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
          finish_time: state.finish_time,
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

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Bir hata oluştu: ${res.status}\n${errorText}`);
      } else {
        alert(`${issue.key} işine ${formatTime(elapsed)} süresi eklendi.`);
      }

      resetTimerUI();
    }
  };

  stopOnlyBtn.onclick = async () => {
    clearInterval(state.intervalId);
    state.timerActive = false;
    stopOnlyBtn.disabled = true;
    startBtn.disabled = true;
    saveTimerState();

    await fetch(`${backendBase}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        issue_key: state.currentIssueKey,
        finish_time: getSyncedNow(),
        synced_to_jira: false
      })
    });

    alert("Zamanlayıcı durduruldu. Jira’ya yazılmadı.");
    resetTimerUI();
  };

  manualBtn.onclick = () => {
    const input = prompt("Dakika cinsinden süre girin (örn: 30):");
    const mins = parseInt(input);
    if (isNaN(mins) || mins <= 0) return alert("Geçersiz giriş.");
    const seconds = mins * 60;
    const started = formatJiraDate(getSyncedNow() - seconds);

    fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/worklog`), {
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
    }).then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        alert(`Hata: ${res.status} - ${errText}`);
      } else {
        alert(`${issue.key} için manuel olarak ${mins} dakika giriş yapıldı.`);
      }
    });
  };

  doneBtn.onclick = () => {
    if (state.timerActive) {
      alert("Lütfen önce zamanlayıcıyı durdurun.");
      return;
    }

    const confirmDone = confirm("Bu görevi tamamen bitirdiniz mi?\nBu işlem görev durumunu 'Tamamlandı' yapacak.");
    if (!confirmDone) return;

    fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issue.key}/transitions`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transition: { id: "41" }
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
}

syncServerTime();
