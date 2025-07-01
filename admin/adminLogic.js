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
import { isAdmin, isLead } from '../authService.js';

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
        sidebar.addItem('Talaşlı İmalat', { subItems: ['Canlı Takip', 'Makine Listesi'] });
        sidebar.addItem('Ayarlar', { subItems: ['Jira Ayarları'] });
    } else if (isLead() && user.team === 'machining') {
        sidebar.addItem('Talaşlı İmalat', { subItems: ['Canlı Takip', 'Makine Listesi'] });
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

    const canliTakipItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Canlı Takip');
    if (canliTakipItem) {
        canliTakipItem.addEventListener('click', handleSidebarClick('Canlı Takip', showMachiningLiveReport));
    }

    const makineListesiItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Makine Listesi');
    if (makineListesiItem) {
        makineListesiItem.addEventListener('click', handleSidebarClick('Makine Listesi', showMachineList));
    }

    const jiraAyarlariItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Jira Ayarları');
    if (jiraAyarlariItem) {
        jiraAyarlariItem.addEventListener('click', handleSidebarClick('Jira Ayarları', showJiraSettings));
    }

    // Add event for Mesai Taleplerim
    const mesaiTaleplerimItem = Array.from(document.querySelectorAll('.sidebar-subitem')).find(el => el.textContent.trim() === 'Mesai Taleplerim');
    if (mesaiTaleplerimItem) {
        mesaiTaleplerimItem.addEventListener('click', handleSidebarClick('Mesai Taleplerim', showMesaiTaleplerim));
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
            case 'Canlı Takip': showMachiningLiveReport(); break;
            case 'Makine Listesi': showMachineList(); break;
            case 'Jira Ayarları': showJiraSettings(); break;
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