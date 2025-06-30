// --- task.js ---
// Entry point for task page - initialization and coordination

import { state } from '../machiningService.js';
import { initNavbar } from '../../components/navbar.js';
import { guardRoute, navigateTo, ROUTES } from '../../authService.js';
import { 
    getTaskKeyFromURL, 
    fetchTaskDetails
} from './taskApi.js';
import { 
    initializeTaskState,
    getStoredTask
} from './taskState.js';
import { 
    setupTaskInfoDisplay
} from './taskUI.js';
import { setupAllHandlers } from './taskHandlers.js';
import { handleSoftReload } from './taskLogic.js';

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeTaskView() {
    if (!guardRoute()) {
        return;
    }
    
    initNavbar();
    
    // Set up soft reload listener
    window.addEventListener('softReload', handleSoftReload);
    
    const taskKey = getTaskKeyFromURL();
    if (!taskKey) {
        navigateTo(ROUTES.MACHINING);
        return;
    }
    
    try {
        // Try to load task from sessionStorage first
        let issue = getStoredTask();
        
        // If not in storage or wrong task, fetch from API
        if (!issue || issue.key !== taskKey) {
            console.log('Task details not in session storage, fetching from API.');
            issue = await fetchTaskDetails(taskKey);
        }
        
        // Initialize task state
        const { hasActiveTimer, isUnderMaintenance } = await initializeTaskState(taskKey, issue);
        
        // Setup UI
        setupTaskInfoDisplay();
        
        // Setup handlers based on timer state
        setupAllHandlers(hasActiveTimer);
        
    } catch (error) {
        console.error('Error initializing task view:', error);
        alert('Task not found');
        navigateTo(ROUTES.MACHINING);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTaskView); 