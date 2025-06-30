// --- machiningService.js ---
import {
  proxyBase,
  backendBase
} from '../base.js';
import { authedFetch } from '../authService.js';

export const state = {
  base: 'https://gemkom-1.atlassian.net',
  timerActive: false,
  intervalId: null,
  currentIssueKey: null,
  startTime: null,
  finish_time: null,
  userId: localStorage.getItem('userId'),
  selectedMachine: null,
  allIssues: [],
  selectedIssue: null,
  currentTimerId: null
};

export function formatTime(secs) {
  const hrs = Math.floor(secs / 3600).toString().padStart(2, '0');
  const mins = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const sec = (secs % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${sec}`;
}

export function formatJiraDate(ms) {
  const d = new Date(ms);
  const pad = n => (n < 10 ? '0' + n : n);
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const msms = (d.getMilliseconds() + '').padStart(3, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${msms}${sign}${offsetHours}${offsetMinutes}`;
}

export async function fetchIssuesByFilter(filterId) {
    const jql = `filter=${filterId} AND status="To Do"`;
    const encodedJql = encodeURIComponent(jql);
    
    const url = `${state.base}/rest/api/3/search?jql=${encodedJql}&fields=summary,customfield_10117,customfield_10184,customfield_10185,customfield_10187,customfield_11411`;
    const res = await authedFetch(proxyBase + encodeURIComponent(url), {
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    state.allIssues = data.issues;
    return data.issues;
}

export function saveTimerState() {
  if (state.timerActive && state.startTime && state.currentIssueKey) {
    localStorage.setItem('jira-timer-state', JSON.stringify({
      startTime: state.startTime,
      issueKey: state.currentIssueKey
    }));
  } else {
    localStorage.removeItem('jira-timer-state');
  }
}

export function restoreTimerState(callback) {
  const saved = localStorage.getItem('jira-timer-state');
  if (saved) {
    const { startTime, issueKey } = JSON.parse(saved);
    state.startTime = startTime;
    state.currentIssueKey = issueKey;
    authedFetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issueKey}`))
      .then(res => res.json())
      .then(issue => callback(issue, true));
  }
}

/**
 * Stops a timer in the backend.
 * @param {Object} params
 * @param {string|number} params.timerId
 * @param {string|number} params.userId
 * @param {number} params.finishTime (ms)
 * @param {boolean} params.syncToJira
 * @returns {Promise<boolean>}
 */
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

/**
 * Logs time to Jira for a given issue.
 * @param {Object} params
 * @param {string} params.issueKey
 * @param {string} params.baseUrl
 * @param {number} params.startTime (ms)
 * @param {number} params.elapsedSeconds
 * @param {string} [params.comment]
 * @returns {Promise<boolean>}
 */
export async function logTimeToJiraShared({ issueKey, baseUrl, startTime, elapsedSeconds, comment }) {
    const started = formatJiraDate(startTime);
    const url = `${baseUrl}/rest/api/3/issue/${issueKey}/worklog`;
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

export const fetchMachinesForMachining = async () => {
  const res = await authedFetch(`${backendBase}/machines?used_in=machining`);
  return await res.json();
}