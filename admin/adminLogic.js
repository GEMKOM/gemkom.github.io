// --- adminLogic.js ---
// Pure business logic for admin functionality

import Sidebar from '../components/sidebar.js';
import { showUserCreateForm } from './createUser.js';
import { showUserList } from './listUsers.js';
import { showMesaiTalebiForm } from './mesaiTalebi.js';
import { showMachiningLiveReport } from './machiningReport.js';
import { showMachineList } from './machineList.js';
import { showJiraSettings } from './jiraSettings.js';
import { showMesaiTaleplerim } from './mesaiTaleplerim.js';
import { showBulkUserCreateForm } from './bulkUserCreate.js';
import { showMachineCreateForm } from './createMachine.js';
import { isAdmin } from '../authService.js';
import { showMachiningDetailedReport } from './machiningDetailedReport.js';
import { showFinishedTimers } from './finishedTimers.js';
import { showTaskListSection } from './taskList.js';

export function handleSidebarClick(label, callback) {
    return (e) => {
        e.stopPropagation();
        localStorage.setItem('admin_last_view', label);
        callback();
    };
}

export function setupAdminSidebar(sidebarRoot) {
    if (!sidebarRoot) return null;
    
    const sidebar = new Sidebar(sidebarRoot);
    const user = JSON.parse(localStorage.getItem('user'));
    if (isAdmin()) {
        sidebar.addItem('Özet');
        sidebar.addItem('Kullanıcılar', { subItems: ['Kullanıcı Ekle', 'Kullanıcı Listesi', 'Çoklu Kullanıcı Ekle'] });
        sidebar.addItem('Mesailer', { subItems: ['Mesai Talebi Gönder', 'Mesai Taleplerim'] });
        sidebar.addItem('Talaşlı İmalat', { subItems: ['Aktif Zamanlayıcılar', 'İşler', 'Biten Zamanlayıcılar', 'Grup Rapor', 'Makine Listesi'] });
        sidebar.addItem('Kesim', { subItems: ['Aktif Zamanlayıcılar', 'İşler', 'Biten Zamanlayıcılar', 'Makine Listesi'] });
        sidebar.addItem('Makineler', { subItems: ['Makine Ekle', 'Makine Listesi'] });
        sidebar.addItem('Ayarlar', { subItems: ['Jira Ayarları'] });
    }
    
    //sidebar.addItem('Kaynaklı İmalat', { subItems: ['Makine Ekle', 'Makine Listesi'] });
    //sidebar.addItem('CNC Kesim', { subItems: ['Makine Ekle', 'Machine Listesi'] });  
    

    return sidebar;
}

export function setupSidebarEventListeners() {
    const kullaniciEkleItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Kullanıcı Ekle');
    if (kullaniciEkleItem) {
        kullaniciEkleItem.addEventListener('click', handleSidebarClick('Kullanıcı Ekle', showUserCreateForm));
    }

    const kullaniciListesiItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Kullanıcı Listesi');
    if (kullaniciListesiItem) {
        kullaniciListesiItem.addEventListener('click', handleSidebarClick('Kullanıcı Listesi', showUserList));
    }

    const cokluKullaniciEkleItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Çoklu Kullanıcı Ekle');
    if (cokluKullaniciEkleItem) {
        cokluKullaniciEkleItem.addEventListener('click', handleSidebarClick('Çoklu Kullanıcı Ekle', showBulkUserCreateForm));
    }

    const mesaiTalebiItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Mesai Talebi Gönder');
    if (mesaiTalebiItem) {
        mesaiTalebiItem.addEventListener('click', handleSidebarClick('Mesai Talebi Gönder', showMesaiTalebiForm));
    }

    const canliTakipItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Aktif Zamanlayıcılar');
    if (canliTakipItem) {
        canliTakipItem.addEventListener('click', handleSidebarClick('Aktif Zamanlayıcılar', showMachiningLiveReport));
    }

    // Handle all "Makine Listesi" items with different contexts
    const machineListItems = Array.from(document.querySelectorAll('.sidebar-subitem')).filter(el => el.textContent.trim() === 'Makine Listesi');
    
    machineListItems.forEach((item, index) => {
        // Determine context based on parent sidebar item
        const parentItem = item.closest('.sidebar-item');
        if (parentItem) {
            const parentLabel = parentItem.querySelector('.sidebar-label').textContent.trim();
            
            if (parentLabel === 'Talaşlı İmalat') {
                item.addEventListener('click', handleSidebarClick('Makine Listesi (Talaşlı İmalat)', () => showMachineList('machining')));
            } else if (parentLabel === 'Kesim') {
                item.addEventListener('click', handleSidebarClick('Makine Listesi (Kesim)', () => showMachineList('cutting')));
            } else if (parentLabel === 'Makineler') {
                item.addEventListener('click', handleSidebarClick('Makine Listesi (Genel)', () => showMachineList()));
            }
        }
    });

    const jiraAyarlariItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Jira Ayarları');
    if (jiraAyarlariItem) {
        jiraAyarlariItem.addEventListener('click', handleSidebarClick('Jira Ayarları', showJiraSettings));
    }

    // Add event for Mesai Taleplerim
    const mesaiTaleplerimItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Mesai Taleplerim');
    if (mesaiTaleplerimItem) {
        mesaiTaleplerimItem.addEventListener('click', handleSidebarClick('Mesai Taleplerim', showMesaiTaleplerim));
    }

    const detayliRaporItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Grup Rapor');
    if (detayliRaporItem) {
        detayliRaporItem.addEventListener('click', handleSidebarClick('Grup Rapor', showMachiningDetailedReport));
    }

    const finishedTimersItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Biten Zamanlayıcılar');
    if (finishedTimersItem) {
        finishedTimersItem.addEventListener('click', handleSidebarClick('Biten Zamanlayıcılar', showFinishedTimers));
    }


    const islerItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'İşler');
    if (islerItem) {
        islerItem.addEventListener('click', handleSidebarClick('İşler', showTaskListSection));
    }

    const makineEkleItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Makine Ekle');
    if (makineEkleItem) {
        makineEkleItem.addEventListener('click', handleSidebarClick('Makine Ekle', showMachineCreateForm));
    }
}

export function restoreLastView() {
    const lastView = localStorage.getItem('admin_last_view');
    if (lastView) {
        switch (lastView) {
            case 'Kullanıcı Ekle': showUserCreateForm(); break;
            case 'Kullanıcı Listesi': showUserList(); break;
            case 'Çoklu Kullanıcı Ekle': showBulkUserCreateForm(); break;
            case 'Mesai Talebi Gönder': showMesaiTalebiForm(); break;
            case 'Mesai Taleplerim': showMesaiTaleplerim(); break;
            case 'Aktif Zamanlayıcılar': showMachiningLiveReport(); break;
            case 'Makine Listesi (Talaşlı İmalat)': showMachineList('machining'); break;
            case 'Makine Listesi (Kesim)': showMachineList('cutting'); break;
            case 'Makine Listesi (Genel)': showMachineList(); break;
            case 'Jira Ayarları': showJiraSettings(); break;
            case 'Grup Rapor': showMachiningDetailedReport(); break;
            case 'Biten Zamanlayıcılar': showFinishedTimers(); break;
            case 'İşler': showTaskListSection(); break;
            case 'Makine Ekle': showMachineCreateForm(); break;
            // Add more as needed
            default: break;
        }
    }
}

export function showWelcomeMessage() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (mainContent) {
        mainContent.innerHTML = `<div class="row"><div class="col-12 text-center mt-5"><h3>Yönetim Paneline Hoşgeldiniz</h3></div></div>`;
    }
} 