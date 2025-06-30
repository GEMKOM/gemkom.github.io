// --- taskUI.js ---
// UI management functions for task functionality

import { state, formatTime } from '../machiningService.js';
import { getSyncedNow } from '../../timeService.js';
import { 
    setupStartStopHandler, 
    setupStopOnlyHandler, 
    setupManualLogHandler, 
    setupMarkDoneHandler, 
    setupFaultReportHandler, 
    setupBackHandler 
} from './taskActions.js';

// ============================================================================
// UI MANAGEMENT
// ============================================================================

export function getUIElements() {
    return {
        startBtn: document.getElementById('start-stop'),
        stopOnlyBtn: document.getElementById('stop-only-button'),
        manualBtn: document.getElementById('manual-log-button'),
        doneBtn: document.getElementById('mark-done-button'),
        faultBtn: document.getElementById('fault-report-button'),
        backBtn: document.getElementById('back-button'),
        timerDisplay: document.getElementById('timer-display'),
        taskTitle: document.getElementById('task-title')
    };
}

export function updateTimerDisplay() {
    const elapsed = Math.round((getSyncedNow() - state.startTime) / 1000);
    document.getElementById('timer-display').textContent = formatTime(elapsed);
}

export function setActiveTimerUI() {
    const { startBtn, stopOnlyBtn, manualBtn, doneBtn, faultBtn, backBtn } = getUIElements();
    
    startBtn.textContent = 'Durdur ve İşle';
    startBtn.classList.remove('green');
    startBtn.classList.add('red');
    stopOnlyBtn.classList.remove('hidden');
    manualBtn.style.display = 'none';
    doneBtn.style.display = 'none';
    faultBtn.style.display = 'none';
    backBtn.style.display = 'none';
    
    // Reattach handlers for visible buttons
    setupStartStopHandler();
    setupStopOnlyHandler();
}

export function setInactiveTimerUI() {
    const { startBtn, stopOnlyBtn, manualBtn, doneBtn, faultBtn, backBtn, timerDisplay } = getUIElements();
    
    startBtn.textContent = 'Başlat';
    startBtn.classList.remove('red');
    startBtn.classList.add('green');
    stopOnlyBtn.classList.add('hidden');
    doneBtn.style.display = 'block';
    manualBtn.style.display = 'block';
    faultBtn.style.display = 'block';
    backBtn.style.display = 'block';
    startBtn.disabled = false;
    stopOnlyBtn.disabled = false;
    timerDisplay.textContent = '00:00:00';
    
    // Reattach handlers for all visible buttons
    setupStartStopHandler();
    setupManualLogHandler();
    setupMarkDoneHandler();
    setupFaultReportHandler();
    setupBackHandler();
}

export function setupTaskInfoDisplay() {
    const { taskTitle } = getUIElements();
    taskTitle.textContent = state.currentIssueKey;
    
    const timerContainer = document.getElementById('timer-container');
    const titleRow = document.createElement('div');
    titleRow.className = 'title-row';
    
    taskTitle.classList.add('task-title');
    
    const right = document.createElement('div');
    right.className = 'task-right';
    
    right.innerHTML = `
        <div class="field-row"><span class="label">İş Emri:</span><span class="value">${state.selectedIssue.customfield_10117 || '-'}</span></div>
        <div class="field-row"><span class="label">Resim No:</span><span class="value">${state.selectedIssue.customfield_10184 || '-'}</span></div>
        <div class="field-row"><span class="label">Poz No:</span><span class="value">${state.selectedIssue.customfield_10185 || '-'}</span></div>
        <div class="field-row"><span class="label">Adet:</span><span class="value">${state.selectedIssue.customfield_10187 || '-'}</span></div>
    `
    
    titleRow.appendChild(taskTitle);
    titleRow.appendChild(right);
    timerContainer.prepend(titleRow);
} 