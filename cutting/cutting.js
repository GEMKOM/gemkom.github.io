// --- cutting.js ---
// Main entry point for cutting module

import { guardRoute } from '../authService.js';
import { initNavbar } from '../components/navbar.js';
import { createMachineTaskView } from '../components/machineTaskView.js';
import { fetchMachines } from '../generic/machines.js';

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeCuttingView() {
    if (!guardRoute()) {
        return;
    }
    
    initNavbar();
    
    try {
        const machines = await fetchMachines('cutting');
        const mainView = document.getElementById('main-view');
        
        if (machines.length === 0) {
            mainView.innerHTML = '<div class="no-machines">Kesim makineleri bulunamadı.</div>';
            return;
        }
        
        createMachineTaskView(mainView, machines, 'cutting');
    } catch (error) {
        console.error('Error initializing cutting view:', error);
        document.getElementById('main-view').innerHTML = '<div class="error">Kesim makineleri yüklenirken hata oluştu.</div>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCuttingView); 