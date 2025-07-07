// components/taskTimerView.js
// Generic task timer/detail view for machining, cutting, etc.

export function createTaskTimerView({
    containerId = 'timer-container',
    task,
    timerState = {},
    onStart,
    onStop,
    onManualLog,
    onMarkDone,
    onFaultReport,
    onBack,
    renderTaskInfo // function (task) => HTML string or DOM
}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <div class="timer-container">
            <div id="title-row" class="title-row">
                <h2 id="task-title" class="task-title">${task.key || ''}</h2>
                <div class="task-right">${renderTaskInfo ? renderTaskInfo(task) : ''}</div>
            </div>
            <div class="timer-display" id="timer-display">00:00:00</div>
            <div class="timer-controls">
                <button id="start-stop" class="action-button green">Başlat</button>
                <button id="stop-only-button" class="action-button secondary-button hidden">Sadece Durdur</button>
                <button id="manual-log-button" class="action-button secondary-button">Manuel Giriş</button>
                <button id="mark-done-button" class="action-button secondary-button">Tamamlandı</button>
                <button id="fault-report-button" class="action-button danger-button">Arıza Bildir</button>
                <button id="back-button" class="action-button danger-button">Geri Dön</button>
            </div>
        </div>
    `;
    // Timer display update logic and button event handlers should be set up by the caller
}
