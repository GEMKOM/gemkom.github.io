// --- taskLogic.js ---
// Core business logic for task functionality

import { state } from '../machiningService.js';
import { getSyncedNow } from '../../timeService.js';
import { formatTime } from '../machiningService.js';
import { updateTimerDisplay, setActiveTimerUI, setInactiveTimerUI } from './taskUI.js';
import { performSoftReload } from './taskState.js';

// ============================================================================
// TIMER SETUP
// ============================================================================

export function setupTimerHandlers(restoring = false) {
    if (restoring) {
        state.startTime = parseInt(state.startTime);
        state.timerActive = true;
        updateTimerDisplay();
        state.intervalId = setInterval(updateTimerDisplay, 1000);
        setActiveTimerUI();
    } else {
        setInactiveTimerUI();
        state.timerActive = false;
        state.startTime = null;
        localStorage.removeItem('jira-timer-state');
    }
}

// ============================================================================
// SOFT RELOAD HANDLING
// ============================================================================

export async function handleSoftReload() {
    try {
        const timerRestored = await performSoftReload(false);
        
        if (timerRestored) {
            // Timer was restored, set up active state
            setupTimerHandlers(true);
        } else {
            // No timer was restored, set up inactive state
            setInactiveTimerUI();
            setupTimerHandlers(false);
        }
    } catch (error) {
        console.error('Error during soft reload:', error);
        // Fallback to full page reload if soft reload fails
        window.location.reload();
    }
} 