// --- adminView.js ---
import { fetchUsers, fetchActiveTimers, formatDuration } from './adminService.js';
import { state } from './admin.js';

let timerIntervals = {};

export async function updateActiveTimers() {
    state.activeTimers = await fetchActiveTimers();
    const tbody = document.getElementById('active-timers');
    tbody.innerHTML = '';

    state.activeTimers.filter(t => !t.finish_time).forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.user_id}</td>
            <td>${t.machine}</td>
            <td>${t.issue_key}</td>
            <td id="timer-${t.id}">${formatDuration(t.start_time)}</td>
            <td>
                <button class="btn btn-danger btn-sm stop-timer" data-timer-id="${t.id}">Durdur</button>
            </td>
        `;
        tbody.appendChild(tr);
        // Start frontend timer
        startTimerInterval(t.id, t.start_time);
    });
}

function startTimerInterval(timerId, startTime) {
    if (timerIntervals[timerId]) clearInterval(timerIntervals[timerId]);
    function update() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
        const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        const el = document.getElementById(`timer-${timerId}`);
        if (el) el.textContent = `${h}:${m}:${s}`;
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

export function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.onclick = () => {
            localStorage.clear();
            window.location.href = '/login';
        };
    }
}

export function setupEventListeners() {
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('stop-timer')) {
            const timerId = e.target.dataset.timerId;
            try {
                const res = await fetch(`/backend/stop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timer_id: timerId })
                });
                if (res.ok) {
                    updateActiveTimers();
                    updateMachines();
                }
            } catch (err) {
                console.error('Error stopping timer:', err);
            }
        }
        if (e.target.id === 'refresh-btn') {
            window.location.reload();
        }
    });
}
