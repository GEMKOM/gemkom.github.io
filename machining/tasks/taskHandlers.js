// --- taskHandlers.js ---
// Event handler setup for task functionality

import { setupStartStopHandler, setupStopOnlyHandler, setupMarkDoneHandler, setupManualLogHandler, setupFaultReportHandler, setupBackHandler } from './taskActions.js';
import { setupTimerHandlers as setupTimerHandlersLogic } from './taskLogic.js';

// ============================================================================
// HANDLER SETUP
// ============================================================================

export function setupAllHandlers(restoring = false) {
    // Setup timer logic
    setupTimerHandlersLogic(restoring);
    console.log("setupAllHandlers");
    // Setup all event handlers
    setupStartStopHandler();
    setupStopOnlyHandler();
    setupBackHandler();
    setupManualLogHandler();
    setupMarkDoneHandler();
    setupFaultReportHandler();
} 