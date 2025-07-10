// --- taskHandlers.js ---
// Event handlers for task functionality

import { 
    handleStartStopClick, 
    handleStopOnlyClick, 
    handleMarkDoneClick, 
    handleManualLogClick, 
    handleFaultReportClick, 
    handleBackClick 
} from './taskActions.js';

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export function setupStartStopHandler() {
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn) {
        startStopBtn.onclick = handleStartStopClick;
    }
}

export function setupStopOnlyHandler() {
    const stopOnlyBtn = document.getElementById('stop-only-button');
    if (stopOnlyBtn) {
        stopOnlyBtn.onclick = handleStopOnlyClick;
    }
}

export function setupMarkDoneHandler() {
    const markDoneBtn = document.getElementById('mark-done-button');
    if (markDoneBtn) {
        markDoneBtn.onclick = handleMarkDoneClick;
    }
}

export function setupManualLogHandler() {
    const manualLogBtn = document.getElementById('manual-log-button');
    if (manualLogBtn) {
        manualLogBtn.onclick = handleManualLogClick;
    }
}

export function setupFaultReportHandler() {
    const faultReportBtn = document.getElementById('fault-report-button');
    if (faultReportBtn) {
        faultReportBtn.onclick = handleFaultReportClick;
    }
}

export function setupBackHandler() {
    const backBtn = document.getElementById('back-button');
    if (backBtn) {
        backBtn.onclick = handleBackClick;
    }
}

export function setupAllHandlers() {
    setupStartStopHandler();
    setupStopOnlyHandler();
    setupMarkDoneHandler();
    setupManualLogHandler();
    setupFaultReportHandler();
    setupBackHandler();
} 