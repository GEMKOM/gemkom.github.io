// --- adminView.js ---
import { fetchActiveTimers, formatDuration } from './adminService.js';
import { state } from './adminState.js';
import { getSyncedNow, syncServerTime } from '../timeService.js';
import { backendBase } from '../base.js';

let timerIntervals = {};

export async function updateActiveTimers() {
    state.activeTimers = await fetchActiveTimers();
    if (state.activeTimers.length > 0){
        await syncServerTime();
    }
    const tbody = document.getElementById('active-timers');
    tbody.innerHTML = '';

    state.activeTimers.filter(t => !t.finish_time).forEach(t => {
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
    state.machines.forEach(u => {
        const match = state.activeTimers.find(t => t.machine === u.name);
        const isActive = !!match;
        const badge = `<span class="badge rounded-pill ${isActive ? 'bg-success' : 'bg-danger'}">${isActive ? 'Aktif' : 'Pasif'}</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${badge}</td>
            <td></td>
        `;
        tbody.appendChild(tr);
    });
}

