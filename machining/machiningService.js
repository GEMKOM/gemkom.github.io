// --- machiningService.js ---
import {
  proxyBase,
  backendBase,
  jiraBase
} from '../base.js';
import { authedFetch } from '../authService.js';
import { formatTime, formatJiraDate } from '../generic/formatters.js';

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


export async function fetchTasksForMachining(filterId) {
    const jql = `filter=${filterId} AND status="To Do"`;
    const encodedJql = encodeURIComponent(jql);
    
    const url = `${jiraBase}/rest/api/3/search?jql=${encodedJql}&fields=summary,customfield_10117,customfield_10184,customfield_10185,customfield_10187,customfield_11411`;
    const res = await authedFetch(proxyBase + encodeURIComponent(url), {
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data.issues;
}


export async function stopTimerShared({ timerId, finishTime, syncToJira }) {
    const response = await authedFetch(`${backendBase}/machining/timers/stop/`, {
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
                        text: comment || `Logged via Admin Panel: ${formatTime(elapsedSeconds)}`
                    }]
                }]
            }
        })
    });
    return response.ok;
}