// components/machineTaskView.js
// Generic machine/task view for machining, cutting, etc.

export async function createMachineTaskView({
    containerId = 'main-view',
    fetchMachines,
    fetchTasks,
    onTaskClick,
    title = '',
    machineLabel = 'Makine Seçimi',
    searchPlaceholder = 'TI numarası ile ara...',
    taskDetailBasePath = '' // e.g. '/machining/tasks/' or '/cutting/tasks/'
}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <div class="row mb-4">
            <div class="col">
                <div class="filter-bar" id="filter-bar">
                    <label for="filter-select" class="form-label">${machineLabel}</label>
                    <select id="filter-select" class="form-select">
                        <option value="" disabled selected>Makine Seçiniz...</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <div class="search-container">
                    <input type="text" id="search-input" class="form-control" placeholder="${searchPlaceholder}">
                </div>
                <div class="task-list" id="task-list"></div>
            </div>
        </div>
    `;
    if (title) {
        const h = document.createElement('h2');
        h.textContent = title;
        container.prepend(h);
    }
    // Fetch and render machines
    const select = container.querySelector('#filter-select');
    const machines = await fetchMachines();
    machines.forEach(f => {
        const option = document.createElement('option');
        option.value = f.jira_id;
        option.dataset.machineId = f.id;
        let label = f.name;
        if (f.has_active_timer) {
            label += ' (Kullanımda)';
            option.disabled = true;
            option.style.color = '#6b7280';
            option.style.fontStyle = 'italic';
        } else if (f.is_under_maintenance) {
            label += ' (Bakımda)';
            option.disabled = true;
            option.style.color = '#dc2626';
            option.style.fontStyle = 'italic';
        }
        option.textContent = label;
        select.appendChild(option);
    });
    let allTasks = [];
    async function loadTasks(machineId) {
        allTasks = await fetchTasks(machineId);
        renderTaskList(allTasks);
    }
    select.onchange = () => {
        const selectedOption = select.options[select.selectedIndex];
        sessionStorage.setItem('selectedMachineId', selectedOption.dataset.machineId || '');
        loadTasks(select.value);
    };
    // Initial load
    sessionStorage.setItem('selectedMachineId', '');

    // Search
    container.querySelector('#search-input').oninput = (e) => {
        const term = e.target.value.trim().toLowerCase();
        const filtered = allTasks.filter(task =>
            (task.key && task.key.toLowerCase().includes(term)) ||
            (task.fields && task.fields.summary && task.fields.summary.toLowerCase().includes(term))
        );
        renderTaskList(filtered);
    };
    function renderTaskList(tasks) {
        const ul = container.querySelector('#task-list');
        ul.innerHTML = '';
        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.onclick = () => {
                if (onTaskClick) onTaskClick(task);
                if (taskDetailBasePath && task.key) {
                    window.location.href = `${taskDetailBasePath}?key=${task.key}`;
                }
            };
            const fields = task.fields || {};
            const left = document.createElement('div');
            left.className = 'task-left';
            const title = document.createElement('h3');
            title.textContent = task.key || '';
            const summary = document.createElement('p');
            summary.textContent = fields.summary || '';
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
} 