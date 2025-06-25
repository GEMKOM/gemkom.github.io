import { updateActiveTimers, updateMachines, setupLogoutButton, setupEventListeners } from './adminView.js';
import { filters } from '../globalVariables.js';
export const state = {
    machines: filters,
    activeTimers: []
}

document.addEventListener('DOMContentLoaded', async () => {
    await updateActiveTimers();
    updateMachines();
    setupLogoutButton();
    setupEventListeners();
});