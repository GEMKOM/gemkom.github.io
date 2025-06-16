import {
  state,
  fetchIssuesByFilter,
  restoreTimerState,
  saveTimerState,
  formatTime,
  formatJiraDate,
  proxyBase,
  backendBase
} from './machiningService.js';

import {
  renderTaskList,
  setupMachineFilters,
  setupSearchInput,
  setupLogoutButton
} from './machiningView.js';

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

function updateTimerDisplay() {
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);
  document.getElementById('timer-display').textContent = formatTime(elapsed);
}

function resetTimerUI() {
  document.getElementById('start-stop').textContent = 'Başlat';
  document.getElementById('start-stop').classList.remove('red');
  document.getElementById('start-stop').classList.add('green');
  document.getElementById('stop-only-button').classList.add('hidden');
  document.getElementById('mark-done-button').style.display = 'block';
  document.getElementById('manual-log-button').style.display = 'block';
  document.getElementById('back-button').style.display = 'block';
  document.getElementById('start-stop').disabled = false;
  document.getElementById('stop-only-button').disabled = false;
  document.getElementById('timer-display').textContent = '';
  state.timerActive = false;
  state.startTime = null;
  saveTimerState();
}

function openTimer(issue, restoring = false) {
  state.currentIssueKey = issue.key;
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('timer-view').classList.remove('hidden');
  document.getElementById('task-title').textContent = issue.key;

  const startBtn = document.getElementById('start-stop');
  const stopOnlyBtn = document.getElementById('stop-only-button');
  const manualBtn = document.getElementById('manual-log-button');
  const doneBtn = document.getElementById('mark-done-button');
  const backBtn = document.getElementById('back-button');

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
      state.startTime = Date.now();
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
      let elapsed = Math.round((Date.now() - state.startTime) / 1000);
      if (elapsed < 60) elapsed = 60;
      const started = formatJiraDate(state.startTime);
      state.finish_time = Date.now();
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
        finish_time: Date.now(),
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
    const started = formatJiraDate(Date.now() - seconds);

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

async function loadAndRender(filterId) {
  const issues = await fetchIssuesByFilter(filterId);
  renderTaskList(issues, openTimer);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!state.userId) return (window.location.href = '/login');

  setupMachineFilters(filters, loadAndRender);
  setupSearchInput();
  setupLogoutButton();
  restoreTimerState(openTimer);
});
