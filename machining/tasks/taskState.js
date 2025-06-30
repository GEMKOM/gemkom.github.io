// --- taskState.js ---
// State management and utilities for task functionality

import { state, restoreTimerState } from '../machiningService.js';
import { syncServerTime } from '../../timeService.js';
import { getActiveTimer } from './taskApi.js';
import { setInactiveTimerUI } from './taskUI.js';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export async function initializeTaskState(taskKey, issue) {
    // Check for active timer first
    const activeTimer = await getActiveTimer(taskKey);
    
    // Check if machine is under maintenance
    const machineId = sessionStorage.getItem('selectedMachineId');
    let isUnderMaintenance = false;
    
    if (activeTimer) {
        await restoreActiveTimerState(activeTimer);
        return { hasActiveTimer: true, isUnderMaintenance };
    } else {
        await setupInactiveTaskState(issue);
        return { hasActiveTimer: false, isUnderMaintenance };
    }
}

async function restoreActiveTimerState(activeTimer) {
    await syncServerTime();
    
    state.currentIssueKey = activeTimer.issue_key;
    state.currentTimerId = activeTimer.id;
    state.startTime = activeTimer.start_time;
    state.timerActive = true;
    state.selectedIssue = {
        customfield_11411: activeTimer.machine,
        customfield_10117: activeTimer.job_no,
        customfield_10184: activeTimer.image_no,
        customfield_10185: activeTimer.position_no,
        customfield_10187: activeTimer.quantity
    };
}

async function setupInactiveTaskState(issue) {
    state.currentIssueKey = issue.key;
    state.selectedIssue = issue.fields;
    
    // Try to restore timer state from localStorage
    restoreTimerState((restoredIssue, wasRestored) => {
        if (wasRestored) {
            state.selectedIssue = restoredIssue.fields;
        }
    });
}

// ============================================================================
// SOFT RELOAD HANDLING
// ============================================================================

export async function performSoftReload(resetUI = true) {
    console.log('Performing soft reload...');
    
    try {
        // Clear any existing timer state
        clearInterval(state.intervalId);
        state.timerActive = false;
        state.startTime = null;
        state.currentTimerId = null;
        state.finish_time = null;
        
        // Clear localStorage timer state
        localStorage.removeItem('jira-timer-state');
        
        // Check if there's still an active timer for this task
        const taskKey = getTaskKeyFromURL();
        if (taskKey) {
            console.log('Checking for active timer for task:', taskKey);
            const activeTimer = await getActiveTimer(taskKey);
            
            if (activeTimer) {
                console.log('Found active timer, restoring...');
                await restoreActiveTimerState(activeTimer);
                return true; // Indicate timer was restored
            } else {
                console.log('No active timer found, setting up inactive state');
                if (resetUI) {
                    setInactiveTimerUI();
                }
                return false; // Indicate no timer was restored
            }
        }
        
        console.log('Soft reload completed successfully');
        return false;
        
    } catch (error) {
        console.error('Error during soft reload:', error);
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getTaskKeyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('key');
}

export function getStoredTask() {
    const storedTaskJSON = sessionStorage.getItem('selectedTask');
    if (storedTaskJSON) {
        try {
            return JSON.parse(storedTaskJSON);
        } catch (error) {
            console.error('Error parsing stored task:', error);
            return null;
        }
    }
    return null;
}

export function clearStoredTask() {
    sessionStorage.removeItem('selectedTask');
} 