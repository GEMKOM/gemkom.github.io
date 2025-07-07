import { createMachineTaskView } from '../components/machineTaskView.js';
import { fetchMachinesForCutting, fetchTasksForCutting } from './cuttingService.js';
import { initNavbar } from '../components/navbar.js';

document.addEventListener('DOMContentLoaded', async () => {
    initNavbar();
    await createMachineTaskView({
        containerId: 'main-view',
        fetchMachines: fetchMachinesForCutting,
        fetchTasks: fetchTasksForCutting,
        onTaskClick: (task) => {
            sessionStorage.setItem('selectedTask', JSON.stringify(task));
        },
        title: 'CNC Kesim',
        machineLabel: 'CNC Makinesi Seçimi',
        searchPlaceholder: 'TI numarası ile ara...',
        taskDetailBasePath: '/cutting/tasks/'
    });
}); 