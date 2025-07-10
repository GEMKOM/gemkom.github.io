// --- taskApi.js ---
// API calls and data fetching for task functionality

import { state } from '../cuttingService.js';
import { proxyBase, backendBase, jiraBase } from '../../base.js';
import { authedFetch, navigateTo, ROUTES } from '../../authService.js';
import { mapJiraIssueToTask } from '../../generic/formatters.js';
import { getSyncedNow, syncServerTime } from '../../generic/timeService.js';
import { setCurrentTimerState, setCurrentMachineState } from './taskState.js';
import { 
    getActiveTimer, 
    startTimer, 
    createManualTimeEntry, 
    markTaskAsDone, 
    checkMachineMaintenance 
} from '../cuttingService.js';

// ============================================================================
// TASK DATA FETCHING
// ============================================================================

export function getTaskKeyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('key');
}

export async function fetchTaskDetails(taskKey=null) {
    const params = new URLSearchParams(window.location.search);

    const storedTaskJSON = sessionStorage.getItem('selectedTask');
    if (storedTaskJSON) {
        try {
            return JSON.parse(storedTaskJSON);
        } catch (error) {
            console.error('Error parsing stored task:', error);
        }
    }
    else if(params.get('hold') !== '1'){
        const response = await authedFetch(proxyBase + encodeURIComponent(`${jiraBase}/rest/api/3/issue/${taskKey}`), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Task not found');
        }
        
        return mapJiraIssueToTask(await response.json());
    } else {
        return {
                    key: params.get('key'),
                    name: params.get('name') || params.get('key'),                    // Task name
                    job_no: params.get('name') || params.get('key'),           // RM260-01-12
                    image_no: null,         // 8.7211.0005
                    position_no: null,      // 107
                    quantity: null,         // 6
                    machine: null,   // COLLET (optional)
                    is_hold_task: true
                };
    }
    
}

 