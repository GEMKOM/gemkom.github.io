// --- adminView.js ---
import { fetchActiveTimers, formatDuration } from './adminService.js';
import { getSyncedNow, syncServerTime } from '../generic/timeService.js';
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
            <td>${t.machine_name}</td>
            <td><a href="#" class="task-info-link" data-task='${JSON.stringify(t)}'>${t.issue_key}</a></td>
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
    
    // Add event listeners for task info links
    document.querySelectorAll('.task-info-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const taskData = JSON.parse(link.getAttribute('data-task'));
            showTaskInfoModal(taskData);
        });
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

function showTaskInfoModal(taskData) {
    // Remove existing modal if present
    const existingModal = document.getElementById('task-info-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal" tabindex="-1" id="task-info-modal" style="display:none; background:rgba(0,0,0,0.5); position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:1050; align-items:center; justify-content:center;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Görev Bilgileri - ${taskData.issue_key}</h5>
                        <button type="button" class="btn-close" id="close-task-info-modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Görev Adı:</strong><br>
                                <span>${taskData.issue_name || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="col-md-6">
                                <strong>İş No:</strong><br>
                                <span>${taskData.job_no || 'Belirtilmemiş'}</span>
                            </div>
                        </div>
                        <hr>
                        ${taskData.issue_is_hold_task ? `
                        <div class="row">
                            <div class="col-md-12">
                                <strong>Yorum:</strong><br>
                                <span>${taskData.comment || 'Belirtilmemiş'}</span>
                            </div>
                        </div>
                        ` : `
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Resim No:</strong><br>
                                <span>${taskData.image_no || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="col-md-6">
                                <strong>Pozisyon No:</strong><br>
                                <span>${taskData.position_no || 'Belirtilmemiş'}</span>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Adet:</strong><br>
                                <span>${taskData.quantity || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="col-md-6">
                                <strong>Makine:</strong><br>
                                <span>${taskData.machine_name || 'Belirtilmemiş'}</span>
                            </div>
                        </div>
                        `}
                        <hr>
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Kullanıcı:</strong><br>
                                <span>${taskData.username || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="col-md-6">
                                <strong>Başlangıç Zamanı:</strong><br>
                                <span>${new Date(taskData.start_time).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                        ${taskData.issue_is_hold_task ? `
                        <hr>
                        <div class="alert alert-warning">
                            <strong>⚠️ Bu görev özel görevler kategorisindedir.</strong>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="close-task-info-btn">Kapat</button>
                    </div>
                </div>
            </div>
        </div>`;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('task-info-modal');
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add event listeners for modal controls
    document.getElementById('close-task-info-modal').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('close-task-info-btn').onclick = () => { modal.style.display = 'none'; };
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

