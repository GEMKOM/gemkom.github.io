// --- cuttingService.js ---
import {
  proxyBase,
  backendBase,
  jiraBase
} from '../base.js';
import { authedFetch, navigateTo, ROUTES } from '../authService.js';
import { formatTime, formatJiraDate } from '../generic/formatters.js';
import { getSyncedNow, syncServerTime } from '../generic/timeService.js';
import { setCurrentTimerState, setCurrentMachineState } from './tasks/taskState.js';
import { extractFirstResultFromResponse } from '../generic/paginationHelper.js';

export const state = {
    intervalId: null,
    currentIssue: {
        key: null,
        name: null,
        job_no: null,
        image_no: null,
        position_no: null,
        quantity: null,
        machine_id: null,
        machine_name: null
    },
    currentTimer: {
        id: null,
        start_time: null
    },
    currentMachine: null
};
window.logState = () => {
    console.log(state);
}

// TODO: Replace with cutting-specific API endpoints
export async function fetchTasksForCutting(filterId) {
    const jql = `filter=${filterId} AND status="To Do"`;
    const encodedJql = encodeURIComponent(jql);
    
    const url = `${jiraBase}/rest/api/3/search?jql=${encodedJql}&fields=summary,customfield_10117,customfield_10184,customfield_10185,customfield_10187,customfield_11411`;
    const res = await authedFetch(proxyBase + encodeURIComponent(url), {
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data.issues;
}

// TODO: Replace with cutting-specific API endpoints
export async function stopTimerShared({ timerId, finishTime, syncToJira }) {
    const response = await authedFetch(`${backendBase}/cutting/timers/stop/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            timer_id: timerId,
            finish_time: finishTime,
            synced_to_jira: syncToJira
        })
    });
    return response.ok;
}

// TODO: Replace with cutting-specific API endpoints
export async function logTimeToJiraShared({ startTime, elapsedSeconds, comment, issueKey=null }) {
    if (!issueKey){
      issueKey = state.currentIssue.key;
    }
    const started = formatJiraDate(startTime);
    const url = `${jiraBase}/rest/api/3/issue/${issueKey}/worklog`;
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
                        text: comment || `Logged via Cutting Panel: ${formatTime(elapsedSeconds)}`
                    }]
                }]
            }
        })
    });
    return response.ok;
}

// Additional API functions needed for cutting tasks
export async function getActiveTimer(taskKey) {
    const response = await authedFetch(`${backendBase}/cutting/timers?issue_key=${taskKey}&is_active=true`);
    
    if (!response.ok) {
        return null;
    }
    
    const responseData = await response.json();
    const activeTimer = extractFirstResultFromResponse(responseData);
    
    return activeTimer && activeTimer.finish_time === null ? activeTimer : null;
}

export async function startTimer(comment = null) {
    if (!state.currentMachine.id || !state.currentIssue.key){
        alert("Bir sorun oluştu. Sayfa yeniden yükleniyor.");
        navigateTo(ROUTES.CUTTING);
        return;
    }
    await syncServerTime();
    const timerData = {
        issue_key: state.currentIssue.key,
        start_time: getSyncedNow(),
        machine: state.currentMachine.name,
        machine_fk: state.currentMachine.id,
        job_no: state.currentIssue.job_no,
        image_no: state.currentIssue.image_no,
        position_no: state.currentIssue.position_no,
        quantity: state.currentIssue.quantity
    }
    
    // Add comment if provided
    if (comment) {
        timerData.comment = comment;
    }
    
    const response = await authedFetch(`${backendBase}/cutting/timers/start/`, {
        method: 'POST',
        body: JSON.stringify(timerData)
    });
    if (!response.ok) {
        alert("Bir sorun oluştu. Sayfa yeniden yükleniyor.");
        navigateTo(ROUTES.CUTTING);
        return;
    } else {
        const timer = await response.json();
        timerData.id = timer.id;
        setCurrentTimerState(timerData);
        setCurrentMachineState(state.currentMachine.id);
        return timer;
    }
}

export async function createManualTimeEntry(startDateTime, endDateTime, comment = null) {
    if (!state.currentMachine.id){
        navigateTo(ROUTES.CUTTING);
        return;
    }
    const requestBody = {
        issue_key: state.currentIssue.key,
        start_time: startDateTime.getTime(),
        finish_time: endDateTime.getTime(),
        machine: state.currentIssue.customfield_11411?.value || '',
        machine_fk: state.currentMachine.id,
        job_no: state.currentIssue.customfield_10117 || '',
        image_no: state.currentIssue.customfield_10184 || '',
        position_no: state.currentIssue.customfield_10185 || '',
        quantity: state.currentIssue.customfield_10187 || ''
    };
    
    // Add comment if provided
    if (comment) {
        requestBody.comment = comment;
    }
    
    const response = await authedFetch(`${backendBase}/cutting/manual-time/`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
    
    return response.ok;
}

export async function markTaskAsDone() {
    const url = `${jiraBase}/rest/api/3/issue/${state.currentIssue.key}/transitions`;
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
    authedFetch(`${backendBase}/cutting/tasks/mark-completed/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: state.currentIssue.key
        })
    });
    
    return response.ok;
}


export async function checkMachineMaintenance(machineId) {
    const response = await authedFetch(`${backendBase}/machines/${machineId}/`);
    
    if (!response.ok) {
        return false;
    }
    
    const machine = await response.json();
    return machine ? machine.is_under_maintenance : false;
} 