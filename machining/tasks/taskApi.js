// --- taskApi.js ---
// API calls and data fetching for task functionality

import { state } from '../machiningService.js';
import { proxyBase, backendBase } from '../../base.js';
import { authedFetch } from '../../authService.js';

// ============================================================================
// TASK DATA FETCHING
// ============================================================================

export function getTaskKeyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('key');
}

export async function fetchTaskDetails(taskKey) {
    const response = await authedFetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${taskKey}`), {
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        throw new Error('Task not found');
    }
    
    return response.json();
}

export async function getActiveTimer(taskKey) {
    const response = await authedFetch(`${backendBase}/machining/timers?issue_key=${taskKey}&is_active=true`);
    
    if (!response.ok) {
        return null;
    }
    
    const timerList = await response.json();
    const activeTimer = timerList[0];
    
    return activeTimer && activeTimer.finish_time === null ? activeTimer : null;
}

// ============================================================================
// TIMER OPERATIONS
// ============================================================================

export async function startTimer() {
    const response = await authedFetch(`${backendBase}/machining/timers/start/`, {
        method: 'POST',
        body: JSON.stringify({
            issue_key: state.currentIssueKey,
            start_time: state.startTime,
            machine: state.selectedIssue.customfield_11411?.value || '',
            job_no: state.selectedIssue.customfield_10117 || '',
            image_no: state.selectedIssue.customfield_10184 || '',
            position_no: state.selectedIssue.customfield_10185 || '',
            quantity: state.selectedIssue.customfield_10187|| ''
        })
    });
    
    return response.json();
}

export async function createManualTimeEntry(startDateTime, endDateTime) {
    const response = await authedFetch(`${backendBase}/machining/manual-time/`, {
        method: 'POST',
        body: JSON.stringify({
            issue_key: state.currentIssueKey,
            start_time: startDateTime.getTime(),
            finish_time: endDateTime.getTime(),
            machine: state.selectedIssue.customfield_11411?.value || '',
            job_no: state.selectedIssue.customfield_10117 || '',
            image_no: state.selectedIssue.customfield_10184 || '',
            position_no: state.selectedIssue.customfield_10185 || '',
            quantity: state.selectedIssue.customfield_10187 || ''
        })
    });
    
    return response.ok;
}

// ============================================================================
// JIRA OPERATIONS
// ============================================================================

export async function markTaskAsDone() {
    const url = `${state.base}/rest/api/3/issue/${state.currentIssueKey}/transitions`;
    const response = await authedFetch(proxyBase + encodeURIComponent(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transition: {
                id: '41'
            }
        })
    });
    
    // Also notify backend to set completed_by and completion_date
    authedFetch(`${backendBase}/machining/tasks/mark-completed/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: state.currentIssueKey
        })
    });
    
    return response.ok;
}

export async function logTimeToJira(started, elapsedSeconds, comment) {
    const url = `${state.base}/rest/api/3/issue/${state.currentIssueKey}/worklog`;
    const response = await authedFetch(proxyBase + encodeURIComponent(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            started,
            timeSpentSeconds: elapsedSeconds,
            comment: {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'paragraph',
                    content: [{
                        type: 'text',
                        text: comment
                    }]
                }]
            }
        })
    });
    
    return response.ok;
}

// ============================================================================
// FAULT REPORTING
// ============================================================================

export async function reportMachineFault(machineId, description, isBreaking) {
    const response = await authedFetch(`${backendBase}/machines/faults/`, {
        method: 'POST',
        body: JSON.stringify({
            machine: machineId,
            description: description,
            is_breaking: isBreaking
        })
    });
    
    return response.ok;
}

// ============================================================================
// MAINTENANCE CHECKING
// ============================================================================

export async function checkMachineMaintenance(machineId) {
    const response = await authedFetch(`${backendBase}/machines/?used_in=machining`);
    
    if (!response.ok) {
        return false;
    }
    
    const machines = await response.json();
    // Find the machine by ID and check if it's under maintenance
    const machine = machines.find(machine => machine.id === parseInt(machineId));
    return machine ? machine.is_under_maintenance : false;
} 