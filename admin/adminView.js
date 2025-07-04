// --- adminView.js ---
import { fetchActiveTimers, formatDuration } from './adminService.js';
import { getSyncedNow, syncServerTime } from '../timeService.js';
import { backendBase } from '../base.js';
import { authedFetch } from '../authService.js';

let timerIntervals = {};

export async function updateActiveTimers() {
    const activeTimers = await fetchActiveTimers();
    if (activeTimers.length > 0){
        await syncServerTime();
    }
    const tbody = document.getElementById('active-timers');
    tbody.innerHTML = '';

    activeTimers.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.username}</td>
            <td>${t.machine}</td>
            <td><a href="https://gemkom-1.atlassian.net/browse/${t.issue_key}" target="_blank">${t.issue_key}</a></td>
            <td id="timer-${t.id}">${formatDuration(t.start_time)}</td>
            <td>
                <button class="btn btn-success btn-sm save-jira" data-timer-id="${t.id}">Jira'ya Kaydet</button>
                <button class="btn btn-secondary btn-sm stop-only" data-timer-id="${t.id}">Sadece Durdur</button>
            </td>
        `;
        tbody.appendChild(tr);
        // Start frontend timer
        startTimerInterval(t.id, t.start_time);
    });
}

function startTimerInterval(timerId, startTime) {
    if (timerIntervals[timerId]) {
      clearInterval(timerIntervals[timerId]);
    }
    function update() {
        const elapsed = Math.floor((getSyncedNow() - startTime) / 1000);
        const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
        const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        const el = document.getElementById(`timer-${timerId}`);
        if (el) {
          el.textContent = `${h}:${m}:${s}`;
        }
    }
    update();
    timerIntervals[timerId] = setInterval(update, 1000);
}

export async function updateMachines() {
    const tbody = document.getElementById('machines-list');
    tbody.innerHTML = '';
    // Fetch machines directly from the backend
    const res = await authedFetch(`${backendBase}/machines`);
    if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-danger text-center">Makine verileri alınamadı</td></tr>`;
        return;
    }
    const machines = await res.json();
    machines.forEach(u => {
        const badge = `<span class="badge rounded-pill ${u.has_active_timer ? 'bg-success' : 'bg-danger'}">${u.has_active_timer ? 'Aktif' : 'Pasif'}</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${badge}</td>
            <td></td>
        `;
        tbody.appendChild(tr);
    });
}

