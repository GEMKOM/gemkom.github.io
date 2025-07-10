// --- taskActions.js ---
// Button action handlers for task functionality

import { state, logTimeToJiraShared, markTaskAsDone, checkMachineMaintenance, createManualTimeEntry } from '../cuttingService.js';
import { navigateTo, ROUTES } from '../../authService.js';
import { showManualTimeModal, createFaultReportModal, showCommentModal } from '../../components/taskTimerModals.js';
import { handleStartTimer, handleStopTimer } from './taskLogic.js';

async function checkMaintenanceAndAlert() {
    if (await checkMachineMaintenance(state.currentMachine.id)) {
        alert('Bu makine bakımda. İşlem yapamazsınız.');
        navigateTo(ROUTES.CUTTING);
        return true;
    }
    return false;
}

export async function handleStartStopClick() {
    if (state.currentMachine.is_under_maintenance) {
        alert('Bu makine bakımda. İşlem yapamazsınız.');
        navigateTo(ROUTES.CUTTING);
        return;
    }
    if (!state.currentTimer || !state.currentTimer.start_time) {
        // For hold tasks, show comment modal first
        if (state.currentIssue.is_hold_task && state.currentIssue.key !== 'W-14' && state.currentIssue.key !== 'W-02') {
            const comment = await showCommentModal("Bekletme Görevi Başlatma");
            if (comment) {
                await handleStartTimer(comment);
            }
        } else {
            await handleStartTimer();
        }
    } else {
        await handleStopTimer(true);
    }
}

export async function handleStopOnlyClick() {
    await handleStopTimer(false);
}

export async function handleMarkDoneClick() {
    if (await checkMaintenanceAndAlert()) return;
    
    if (!confirm(`${state.currentIssue.quantity} adetin hepsini tamamladınız mı?`)) {
        return;
    }
    
    try {
        const marked = await markTaskAsDone();
        if (marked) {
            alert('Görev tamamlandı olarak işaretlendi.');
            navigateTo(ROUTES.CUTTING);
        } else {
            alert("Hata oluştu. Lütfen tekrar deneyin.");
        }
    } catch (error) {
        console.error('Error marking as done:', error);
        alert("Hata oluştu. Lütfen tekrar deneyin.");
    }
}

export async function handleManualLogClick() {
    if (await checkMaintenanceAndAlert()) return;
    
    // For hold tasks, show comment modal first
    if (state.currentIssue.is_hold_task && state.currentIssue.key !== 'W-14' && state.currentIssue.key !== 'W-02') {
        const comment = await showCommentModal("Bekletme Görevi Manuel Giriş");
        if (comment) {
            await showManualTimeModal({
                createManualTimeEntry, 
                logTimeToJiraShared, 
                isHoldTask: state.currentIssue.is_hold_task,
                comment: comment
            });
        }
    } else {
        await showManualTimeModal({
            createManualTimeEntry, 
            logTimeToJiraShared, 
            isHoldTask: state.currentIssue.is_hold_task
        });
    }
}

export async function handleFaultReportClick() {
    if (!state.currentMachine.id) {
        navigateTo(ROUTES.CUTTING);
        return;
    }
    await createFaultReportModal(state.currentMachine.id);
}

export function handleBackClick() {
    if (state.currentTimer && state.currentTimer.start_time) {
        if (!confirm("Zamanlayıcı aktif. Geri dönmek istediğinize emin misiniz?")) {
            return;
        }
        clearInterval(state.intervalId);
    }
    navigateTo(ROUTES.CUTTING);
} 