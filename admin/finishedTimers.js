import { backendBase } from "../base.js";
import { authedFetch } from "../authService.js";
import { GenericReport } from "../components/genericReport.js";

export function showFinishedTimers() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;

    // Create container for the generic report
    mainContent.innerHTML = '<div id="finished-timers-report" class="generic-report-container"></div>';

    // All possible columns from API
    const allColumns = [
        { key: 'username', label: 'Kullanıcı' },
        { key: 'issue_key', label: 'TI No' },
        { key: 'job_no', label: 'İş No' },
        { key: 'machine_name', label: 'Makine' },
        { key: 'start_time', label: 'Başlangıç' },
        { key: 'finish_time', label: 'Bitiş' },
        { key: 'duration', label: 'Süre (saat)' },
        { key: 'synced_to_jira', label: 'Jira Senkronize' },
        { key: 'comment', label: 'Yorum' },
        { key: 'image_no', label: 'Resim No' },
        { key: 'position_no', label: 'Pozisyon No' },
        { key: 'quantity', label: 'Adet' },
        { key: 'manual_entry', label: 'Manuel Giriş' },
        { key: 'stopped_by', label: 'Durduran' },
        { key: 'id', label: 'ID' },
    ];

    // Default columns
    const defaultColumns = ['username', 'issue_key', 'job_no', 'machine_name', 'start_time', 'finish_time', 'duration'];

    // Set default values for date inputs (today for finish, 7 days ago for start)
    const today = new Date();

    // Configure the generic report
    const report = new GenericReport({
        title: 'Biten Zamanlayıcılar',
        containerId: 'finished-timers-report',
        apiEndpoint: `${backendBase}/machining/timers/`,
        defaultColumns: defaultColumns,
        allColumns: allColumns,
        showEditButton: true,
        showDeleteButton: true,
        pageSize: 25, // Show 25 records per page
        defaultParams: {
            is_active: 'false'
        },
        filters: [
            {
                key: 'user',
                label: 'Kullanıcı',
                type: 'text',
                placeholder: 'Kullanıcı adı'
            },
            {
                key: 'issue_key',
                label: 'TI Numarası',
                type: 'text',
                placeholder: 'TI-123'
            },
            {
                key: 'job_no',
                label: 'İş No',
                type: 'text',
                placeholder: 'İş No'
            },
            {
                key: 'start_after',
                label: 'Başlangıç Tarihi',
                type: 'datetime',
                defaultValue: today.toISOString().slice(0, 10),
                defaultTime: '07:00'
            },
            {
                key: 'start_before',
                label: 'Bitiş Tarihi',
                type: 'datetime',
                defaultValue: today.toISOString().slice(0, 10),
                defaultTime: '17:15'
            }
        ],
        onDataTransform: (row, col, val) => {
            // Custom data transformation for duration calculation
            if (col === 'duration') {
                if (row.finish_time && row.start_time) {
                    return ((row.finish_time - row.start_time) / 3600000).toFixed(2);
                }
                return '';
            }
            return val;
        },
        onDelete: async (id, data) => {
            try {
                const resp = await authedFetch(`${backendBase}/machining/timers/${id}/`, { method: 'DELETE' });
                if (!resp.ok) throw new Error('Silinemedi');
                report.refresh();
            } catch (err) {
                alert('Silme işlemi başarısız: ' + err.message);
            }
        },
        onEdit: async (row, data) => {
            // Populate edit modal
            document.getElementById('edit-timer-id').value = row.id;
            document.getElementById('edit-job_no').value = row.job_no || '';
            document.getElementById('edit-image_no').value = row.image_no || '';
            document.getElementById('edit-position_no').value = row.position_no || '';
            document.getElementById('edit-quantity').value = row.quantity || '';
            document.getElementById('edit-comment').value = row.comment || '';
            document.getElementById('edit-manual_entry').checked = !!row.manual_entry;
            
            // Fetch and populate machines
            const machineSelect = document.getElementById('edit-machine');
            machineSelect.innerHTML = '<option>Yükleniyor...</option>';
            try {
                const machines = await import('../generic/machines.js').then(m => m.fetchMachines('machining'));
                machineSelect.innerHTML = machines.map(machine =>
                    `<option value="${machine.id}"${machine.id == row.machine_fk ? ' selected' : ''}>${machine.name || ''}</option>`
                ).join('');
            } catch (err) {
                machineSelect.innerHTML = '<option>Makine listesi alınamadı</option>';
            }
            
            document.getElementById('edit-finish_time').value = row.finish_time ? toLocalDatetimeInput(row.finish_time) : '';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('edit-timer-modal'));
            modal.show();
        }
    });

    // Add modal HTML for editing
    if (!document.getElementById('edit-timer-modal')) {
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = `
        <div class="modal fade" id="edit-timer-modal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Zamanlayıcıyı Düzenle</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
              </div>
              <div class="modal-body">
                <form id="edit-timer-form">
                  <input type="hidden" id="edit-timer-id">
                  <div class="mb-2"><label class="form-label">İş No</label><input type="text" class="form-control" id="edit-job_no"></div>
                  <div class="mb-2"><label class="form-label">Resim No</label><input type="text" class="form-control" id="edit-image_no"></div>
                  <div class="mb-2"><label class="form-label">Pozisyon No</label><input type="text" class="form-control" id="edit-position_no"></div>
                  <div class="mb-2"><label class="form-label">Adet</label><input type="number" class="form-control" id="edit-quantity"></div>
                  <div class="mb-2"><label class="form-label">Yorum</label><input type="text" class="form-control" id="edit-comment"></div>
                  <div class="mb-2"><label class="form-label">Manuel Giriş</label> <input type="checkbox" id="edit-manual_entry"></div>
                  <div class="mb-2"><label class="form-label">Makine</label><select class="form-select" id="edit-machine"></select></div>
                  <div class="mb-2"><label class="form-label">Bitiş Zamanı</label><input type="datetime-local" class="form-control" id="edit-finish_time"></div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                <button type="button" class="btn btn-primary" id="save-edit-timer-btn">Kaydet</button>
              </div>
            </div>
          </div>
        </div>`;
        document.body.appendChild(modalDiv);
    }

    // Save edit button event
    document.getElementById('save-edit-timer-btn').onclick = async function() {
        const id = document.getElementById('edit-timer-id').value;
        const patch = {
            job_no: document.getElementById('edit-job_no').value,
            image_no: document.getElementById('edit-image_no').value,
            position_no: document.getElementById('edit-position_no').value,
            quantity: parseInt(document.getElementById('edit-quantity').value) || null,
            comment: document.getElementById('edit-comment').value,
            manual_entry: document.getElementById('edit-manual_entry').checked,
            machine_fk: document.getElementById('edit-machine').value,
            finish_time: document.getElementById('edit-finish_time').value ? new Date(document.getElementById('edit-finish_time').value).getTime() : null,
        };
        try {
            const resp = await authedFetch(`${backendBase}/machining/timers/${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch)
            });
            if (!resp.ok) throw new Error('Güncellenemedi');
            bootstrap.Modal.getInstance(document.getElementById('edit-timer-modal')).hide();
            report.refresh();
        } catch (err) {
            alert('Güncelleme başarısız: ' + err.message);
        }
    };

    // Helper to convert timestamp to local datetime-local string
    function toLocalDatetimeInput(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
} 