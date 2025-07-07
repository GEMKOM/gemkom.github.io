// --- machining.js ---
import { createMachineTaskView } from '../components/machineTaskView.js';
import { fetchMachinesForMachining } from './machiningService.js';
import { fetchIssuesByFilter } from './machiningService.js';
import { initNavbar } from '../components/navbar.js';
import { guardRoute } from '../authService.js';

async function fetchTasksForMachining(machineId) {
    // If machineId is empty, fetch all tasks; otherwise, filter by machine
    // This logic may need to be adjusted based on your backend
    return await fetchIssuesByFilter(machineId);
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!guardRoute()) {
        return;
    }
    initNavbar();
    await createMachineTaskView({
        containerId: 'main-view',
        fetchMachines: fetchMachinesForMachining,
        fetchTasks: fetchTasksForMachining,
        onTaskClick: (task) => {
            sessionStorage.setItem('selectedTask', JSON.stringify(task));
        },
        title: 'Talaşlı İmalat',
        machineLabel: 'Makine Seçimi',
        searchPlaceholder: 'TI numarası ile ara...',
        taskDetailBasePath: '/machining/tasks/'
    });
});
