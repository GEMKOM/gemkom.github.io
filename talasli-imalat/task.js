import { state, restoreTimerState } from './machiningService.js';
import { setupTimerHandlers, setupLogoutButton } from './machiningView.js';
import { syncServerTime } from '../timeService.js';
import { proxyBase } from '../base.js';

async function initializeTaskView() {
    if (!state.userId) {
        window.location.href = '/login';
        return;
    }

    await syncServerTime();
    setupLogoutButton();

    // Get the task key from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const taskKey = urlParams.get('key');
    
    if (!taskKey) {
        window.location.href = '/talasli-imalat';
        return;
    }

    // Fetch the task details
    const response = await fetch(proxyBase + encodeURIComponent(`${state.base}/rest/api/3/issue/${taskKey}`), {
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        alert('Task not found');
        window.location.href = '/talasli-imalat';
        return;
    }

    const issue = await response.json();
    state.currentIssueKey = issue.key;
    state.selectedIssue = issue.fields;
    document.getElementById('task-title').textContent = issue.key;
    const timer_container = document.getElementById('timer-container');
    const titleRow = document.createElement('div');
    titleRow.className = 'title-row';

    const title = document.getElementById('task-title');
    title.classList.add('task-title');

    const right = document.createElement('div');
    right.className = 'task-right';
    right.innerHTML = `
  <div class="field-row"><span class="label">İş Emri:</span><span class="value">${issue.fields.customfield_10117 || '-'}</span></div>
  <div class="field-row"><span class="label">Resim No:</span><span class="value">${issue.fields.customfield_10184 || '-'}</span></div>
  <div class="field-row"><span class="label">Poz No:</span><span class="value">${issue.fields.customfield_10185 || '-'}</span></div>
  <div class="field-row"><span class="label">Adet:</span><span class="value">${issue.fields.customfield_10187 || '-'}</span></div>
`;

    // Move the title and right box into the same row
    titleRow.appendChild(title);
    titleRow.appendChild(right);

    // Insert titleRow into timer_container
    timer_container.prepend(titleRow);
    setupTimerHandlers(issue);
    restoreTimerState(setupTimerHandlers);
}

document.addEventListener('DOMContentLoaded', initializeTaskView); 