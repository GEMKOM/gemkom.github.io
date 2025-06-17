// --- machiningService.js ---
import {
  proxyBase,
  backendBase
} from '../base.js';

export const state = {
  base: 'https://gemkom-1.atlassian.net',
  timerActive: false,
  intervalId: null,
  currentIssueKey: null,
  startTime: null,
  finish_time: null,
  userId: localStorage.getItem('user-id'),
  selectedMachine: null,
  allIssues: [],
  selectedIssue: null
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
  const url = `${state.base}/rest/api/3/search?jql=filter=${filterId}&fields=summary,customfield_10117,customfield_10184,customfield_10185,customfield_10187, customfield_11411`;
  const res = await fetch(proxyBase + encodeURIComponent(url), {
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
    fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${issueKey}`))
      .then(res => res.json())
      .then(issue => callback(issue, true));
  }
}