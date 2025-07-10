// --- taskState.js ---
// State management for task functionality

import { state } from '../cuttingService.js';
import { getMachine } from '../../generic/machines.js';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export function setCurrentIssueState(issue) {
    state.currentIssue = issue;
}

export function setCurrentTimerState(timer) {
    state.currentTimer = timer;
}

export async function setCurrentMachineState() {
    const machineId = new URLSearchParams(window.location.search).get('machine_id');
    if (machineId) {
        const machine = await getMachine(machineId);
        state.currentMachine = machine;
    }
} 