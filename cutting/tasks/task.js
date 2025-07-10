// --- task.js ---
// Entry point for task page - initialization and coordination

import { initNavbar } from '../../components/navbar.js';
import { guardRoute, navigateTo, ROUTES } from '../../authService.js';
import { 
    getTaskKeyFromURL, 
    fetchTaskDetails
} from './taskApi.js';
import { getActiveTimer } from '../cuttingService.js';
import { 
    setCurrentIssueState,
    setCurrentTimerState,
    setCurrentMachineState
} from './taskState.js';
import { 
    setupTaskDisplay
} from './taskUI.js';
import { setupAllHandlers } from './taskHandlers.js';

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeTaskView() {
    if (!guardRoute()) {
        return;
    }
    
    initNavbar();
    
    const taskKey = getTaskKeyFromURL();
    if (!taskKey) {
        navigateTo(ROUTES.CUTTING);
        return;
    }
    let issue = await fetchTaskDetails(taskKey);
    const activeTimer = await getActiveTimer(taskKey);
    setCurrentIssueState(issue);
    setCurrentTimerState(activeTimer);
    await setCurrentMachineState();
    setupTaskDisplay(activeTimer ? true : false, issue.is_hold_task);
    setupAllHandlers();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTaskView); 