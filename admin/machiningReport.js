import { updateActiveTimers, updateMachines } from './adminView.js';
import { fetchMachinesForMachining } from '../machining/machiningService.js';
import { getSyncedNow } from '../timeService.js';
import { stopTimerShared, logTimeToJiraShared } from '../machining/machiningService.js';
import { TimerWidget } from '../components/timerWidget.js';
import { authedFetch } from '../authService.js';

export async function showMachiningLiveReport() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;
    const machines = await fetchMachinesForMachining();
    mainContent.innerHTML = `
        <div class="d-flex justify-content-end mb-3">
            <button id="refresh-btn" class="btn btn-primary"> ⟳ Yenile</button>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Aktif Zamanlayıcılar</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Kullanıcı</th>
                                        <th>Makine</th>
                                        <th>Görev</th>
                                        <th>Süre</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="active-timers">
                                    <!-- Active timers will be inserted here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Makineler</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Makine Adı</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="machines-list">
                                    <!-- Users will be inserted here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('refresh-btn').addEventListener('click', async () => {
        await updateActiveTimers();
        updateMachines();
    });
    await updateActiveTimers();
    updateMachines();
    setupMachiningTableEventListeners();
}

function setupMachiningTableEventListeners() {
    const tbody = document.getElementById('active-timers');
    if (!tbody) return;
    tbody.addEventListener('click', async (e) => {
        const jiraBtn = e.target.closest('.save-jira');
        const stopBtn = e.target.closest('.stop-only');
        if (jiraBtn) {
            const timerId = jiraBtn.getAttribute('data-timer-id');
            await handleSaveToJira(timerId);
        } else if (stopBtn) {
            const timerId = stopBtn.getAttribute('data-timer-id');
            await handleStopOnly(timerId);
        }
    });
}

async function fetchActiveTimerById(timerId) {
    // Fetch all active timers and find the one with the given ID
    const res = await authedFetch(`/machining/timers?is_active=true`);
    if (!res.ok) return null;
    const timers = await res.json();
    return timers.find(t => t.id == timerId);
}

async function handleSaveToJira(timerId) {
    const finishTime = getSyncedNow();
    // Fetch the timer object by timerId
    const timer = await fetchActiveTimerById(timerId);
    if (!timer) {
        alert('Timer bulunamadı!');
        return;
    }

    // 1. Stop timer with syncToJira=true
    const stopped = await stopTimerShared({ timerId, finishTime, syncToJira: true });
    if (!stopped) {
      return alert('Timer durdurulamadı!');
    }
    // 2. Log to Jira
    let elapsedSeconds = Math.round((finishTime - timer.start_time) / 1000);
    elapsedSeconds = Math.max(elapsedSeconds, 60);

    const logged = await logTimeToJiraShared({ issueKey: timer.issue_key, startTime: timer.start_time, elapsedSeconds: elapsedSeconds });
    if (logged) {
        alert(`Timer ${timerId} Jira'ya kaydedildi ve durduruldu!`);
    } else {
        alert('Jira kaydı başarısız!');
    }

    // Trigger timer widget update
    TimerWidget.triggerUpdate();

    await updateActiveTimers();
    await updateMachines();
}

async function handleStopOnly(timerId) {
    const finishTime = getSyncedNow();
    // Stop timer with syncToJira=false
    const stopped = await stopTimerShared({ timerId, finishTime, syncToJira: false });
    if (stopped) {
        alert(`Timer ${timerId} sadece durduruldu ve veritabanına kaydedildi!`);
    } else {
        alert('Timer durdurulamadı!');
    }
    
    // Trigger timer widget update
    TimerWidget.triggerUpdate();
    
    await updateActiveTimers();
}