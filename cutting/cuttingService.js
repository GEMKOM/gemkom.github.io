// cutting/cuttingService.js
import { backendBase } from '../base.js';
import { authedFetch } from '../authService.js';

export async function fetchMachinesForCutting() {
    const res = await authedFetch(`${backendBase}/machines?used_in=cutting`);
    return await res.json();
}

export async function fetchTasksForCutting(machineId) {
    // Example endpoint, adjust as needed
    const res = await authedFetch(`${backendBase}/cutting/tasks?machine_id=${machineId}`);
    const data = await res.json();
    return data.issues || [];
} 