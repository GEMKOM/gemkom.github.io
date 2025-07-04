// admin/activeTasks.js
import { backendBase } from '../base.js';

let activeTasks = [];

export async function fetchActiveTasks(filters = {}) {
    let url = `${backendBase}/machining/tasks/?completion_date=null`;
    if (filters.job_no) url += `&job_no=${encodeURIComponent(filters.job_no)}`;
    if (filters.name) url += `&name=${encodeURIComponent(filters.name)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Aktif işler alınamadı');
    return await res.json();
}

export async function showActiveTasksSection() {
    const container = document.getElementById('admin-main-content-root') || document.querySelector('.admin-main-content');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="card-header d-flex flex-wrap align-items-center justify-content-between">
                <h5 class="mb-0">Aktif İşler</h5>
                <div class="d-flex flex-wrap gap-2">
                    <input id="active-tasks-jobno" class="form-control form-control-sm" placeholder="İş No ile filtrele" style="max-width: 140px;">
                    <input id="active-tasks-name" class="form-control form-control-sm" placeholder="Ad ile filtrele" style="max-width: 140px;">
                    <button id="active-tasks-filter-btn" class="btn btn-sm btn-primary">Filtrele</button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>İş No</th>
                                <th>Ad</th>
                                <th>Makine</th>
                                <th>Başlangıç</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody id="active-tasks-table-body">
                            <tr><td colspan="5" class="text-center">Yükleniyor...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    await renderActiveTasksTable();
    document.getElementById('active-tasks-filter-btn').onclick = async () => {
        await renderActiveTasksTable();
    };
}

async function renderActiveTasksTable() {
    const job_no = document.getElementById('active-tasks-jobno').value.trim();
    const name = document.getElementById('active-tasks-name').value.trim();
    const tbody = document.getElementById('active-tasks-table-body');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">Yükleniyor...</td></tr>`;
    try {
        const data = await fetchActiveTasks({ job_no, name });
        activeTasks = data;
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">Kayıt bulunamadı</td></tr>`;
            return;
        }
        tbody.innerHTML = data.map(task => `
            <tr>
                <td>${task.job_no || ''}</td>
                <td>${task.name || ''}</td>
                <td>${task.machine || ''}</td>
                <td>${task.start_date ? new Date(task.start_date).toLocaleString('tr-TR') : ''}</td>
                <td><span class="badge bg-success">Aktif</span></td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Hata: ${err.message}</td></tr>`;
    }
} 