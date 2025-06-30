// --- machiningView.js ---
import {
  state
} from './machiningService.js';
import { fetchMachinesForMachining } from './machiningService.js';
import { navigateTo, ROUTES } from '../authService.js';
import { authedFetch } from '../authService.js';
import { backendBase } from '../base.js';

export function renderTaskList(issues, openTimerCallback) {
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';
  issues.forEach(issue => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.onclick = () => {
      if (state.timerActive) {
        alert("Lütfen önce mevcut zamanlayıcıyı durdurun.");
        return;
      }
      // Store the full issue object in sessionStorage to use on the next page
      sessionStorage.setItem('selectedTask', JSON.stringify(issue));
      navigateTo(`${ROUTES.MACHINING_TASKS}?key=${issue.key}`);
    };

    const fields = issue.fields;

    const left = document.createElement('div');
    left.className = 'task-left';
    const title = document.createElement('h3');
    title.textContent = issue.key;
    const summary = document.createElement('p');
    summary.textContent = fields.summary;
    left.appendChild(title);
    left.appendChild(summary);

    const right = document.createElement('div');
    right.className = 'task-right';
    right.innerHTML = `
      <div>İş Emri: ${fields.customfield_10117 || '-'}</div>
      <div>Resim No: ${fields.customfield_10184 || '-'}</div>
      <div>Poz No: ${fields.customfield_10185 || '-'}</div>
      <div>Adet: ${fields.customfield_10187 || '-'}</div>
    `;

    card.appendChild(left);
    card.appendChild(right);
    ul.appendChild(card);
  });
}

export async function setupMachineFilters(onClick) {
  const select = document.getElementById('filter-select');
  select.innerHTML = '<option value="">Seçiniz...</option>'; // Reset options with placeholder
  
  // Fetch both machines and active timers
  const [machines, activeTimersResponse] = await Promise.all([
    fetchMachinesForMachining(),
    authedFetch(`${backendBase}/machining/timers?is_active=true`)
  ]);
  
  const activeTimers = activeTimersResponse.ok ? await activeTimersResponse.json() : [];
  
  machines.forEach(f => {
    const option = document.createElement('option');
    option.value = f.jira_id; // Keep jira_id for filter functionality
    option.dataset.machineId = f.id; // Store the actual machine id in data attribute
 
    
    // Check if this machine has an active timer
    const isActive = activeTimers.some(t => t.machine === f.name);
    
    if (isActive) {
      option.textContent = `${f.name} (Kullanımda)`;
      option.disabled = true;
      option.style.color = '#6b7280';
      option.style.fontStyle = 'italic';
    } else if(f.is_under_maintenance) {
      option.textContent = `${f.name} (Bakımda)`;
      option.disabled = true;
      option.style.color = '#6b7280';
      option.style.fontStyle = 'italic';
    } else {
      option.textContent = f.name;
    }
    
    select.appendChild(option);
  });

  select.onchange = () => {
    const selectedOption = select.options[select.selectedIndex];
    const selectedValue = select.value;
    const machineId = selectedOption.dataset.machineId || -1;
    sessionStorage.setItem('selectedMachineId', machineId);
    onClick(selectedValue); // Call handler with selected jira_id value
  };
}

export function setupSearchInput() {
  document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = state.allIssues.filter(issue =>
      issue.key.toLowerCase().includes(term)
    );
    renderTaskList(filtered, () => {
      // This callback is not used in the main machining view
      // Timer functionality is handled in task.js
    });
  };
}
