import { backendBase } from "../base.js";
import { authedFetch } from "../authService.js";

export function showFinishedTimers() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;

    // All possible columns from API
    const allColumns = [
        { key: 'username', label: 'Kullanıcı' },
        { key: 'issue_key', label: 'TI No' },
        { key: 'job_no', label: 'İş No' },
        { key: 'machine', label: 'Makine' },
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
    const defaultColumns = ['username', 'issue_key', 'job_no', 'machine', 'start_time', 'finish_time', 'duration'];

    // Load column selection from localStorage or use default
    let selectedColumns = [];
    try {
        selectedColumns = JSON.parse(localStorage.getItem('finishedTimersColumns')) || defaultColumns;
    } catch { selectedColumns = defaultColumns; }

    function saveColumns(cols) {
        localStorage.setItem('finishedTimersColumns', JSON.stringify(cols));
    }

    function renderColumnSelector() {
        return `<div class="mb-2"><strong>Gösterilecek Sütunlar:</strong> ` +
            allColumns.map(col =>
                `<label class="me-2"><input type="checkbox" class="column-toggle" value="${col.key}"${selectedColumns.includes(col.key) ? ' checked' : ''}> ${col.label}</label>`
            ).join('') + '</div>';
    }

    mainContent.innerHTML = `
        <div class="row mb-3">
            <div class="col-12">
                <h3>Biten Zamanlayıcılar</h3>
                <form id="finished-timers-filters" class="row g-3 align-items-end">
                    <div class="col-md-2">
                        <label for="user" class="form-label">Kullanıcı</label>
                        <input type="text" class="form-control" id="user" placeholder="Kullanıcı adı">
                    </div>
                    <div class="col-md-2">
                        <label for="issue_key" class="form-label">TI Numarası</label>
                        <input type="text" class="form-control" id="issue_key" placeholder="TI-123">
                    </div>
                    <div class="col-md-2">
                        <label for="job_no" class="form-label">İş No</label>
                        <input type="text" class="form-control" id="job_no" placeholder="İş No">
                    </div>
                    <div class="col-md-3">
                        <label for="start_after" class="form-label">Başlangıç Tarihi</label>
                        <div class="input-group">
                            <input type="date" class="form-control" id="start_after">
                            <input type="time" class="form-control" id="start_after_time" value="07:30">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <label for="start_before" class="form-label">Bitiş Tarihi</label>
                        <div class="input-group">
                            <input type="date" class="form-control" id="start_before">
                            <input type="time" class="form-control" id="start_before_time" value="17:00">
                        </div>
                    </div>
                    <div class="col-md-2 mt-2">
                        <button type="button" id="fetch-finished-timers-btn" class="btn btn-primary w-100">Listele</button>
                    </div>
                </form>
                <div id="column-selector-container">${renderColumnSelector()}</div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div id="finished-timers-table-container"></div>
            </div>
        </div>
    `;

    // Set default values for date inputs (today for finish, 7 days ago for start)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    document.getElementById('start_after').value = startDate.toISOString().slice(0, 10);
    document.getElementById('start_before').value = today.toISOString().slice(0, 10);

    // Column selector event
    mainContent.querySelectorAll('.column-toggle').forEach(cb => {
        cb.addEventListener('change', e => {
            const col = e.target.value;
            if (e.target.checked && !selectedColumns.includes(col)) {
                selectedColumns.push(col);
            } else if (!e.target.checked && selectedColumns.includes(col)) {
                selectedColumns = selectedColumns.filter(c => c !== col);
            }
            saveColumns(selectedColumns);
            document.getElementById('fetch-finished-timers-btn').click();
        });
    });

    document.getElementById('fetch-finished-timers-btn').addEventListener('click', async () => {
        const user = document.getElementById('user').value.trim();
        const issueKey = document.getElementById('issue_key').value.trim();
        const jobNo = document.getElementById('job_no').value.trim();
        const startAfter = document.getElementById('start_after').value;
        const startAfterTime = document.getElementById('start_after_time').value;
        const startBefore = document.getElementById('start_before').value;
        const startBeforeTime = document.getElementById('start_before_time').value;

        function toTimestamp(date, time) {
            if (!date) return null;
            const t = time || '00:00';
            const dt = new Date(`${date}T${t}:00`);
            return dt.getTime();
        }

        const params = new URLSearchParams();
        params.append('is_active', 'false');
        if (user) params.append('user', user);
        if (issueKey) params.append('issue_key', issueKey);
        if (jobNo) params.append('job_no', jobNo);
        const startAfterTs = toTimestamp(startAfter, startAfterTime);
        const startBeforeTs = toTimestamp(startBefore, startBeforeTime);
        if (startAfterTs) params.append('start_after', Math.floor(startAfterTs));
        if (startBeforeTs) params.append('start_before', Math.floor(startBeforeTs));

        const url = `${backendBase}/machining/timers/?${params.toString()}`;
        const container = document.getElementById('finished-timers-table-container');
        container.innerHTML = '<div>Yükleniyor...</div>';
        try {
            const resp = await authedFetch(url);
            if (!resp.ok) throw new Error('Liste alınamadı');
            const data = await resp.json();
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div>Sonuç bulunamadı.</div>';
                return;
            }
            // Render table
            let totalHours = 0;
            let html = `<div class="table-responsive"><table class="table table-bordered table-sm resizable-table"><thead><tr>`;
            for (const col of selectedColumns) {
                const colMeta = allColumns.find(c => c.key === col);
                html += `<th style="position:relative;"><span>${colMeta ? colMeta.label : col}</span><span class="resize-handle" style="position:absolute;right:0;top:0;width:5px;height:100%;cursor:col-resize;"></span></th>`;
            }
            html += '</tr></thead><tbody>';
            for (const row of data) {
                html += '<tr>';
                for (const col of selectedColumns) {
                    let val = row[col];
                    if (col === 'duration') {
                        if (row.finish_time && row.start_time) {
                            val = ((row.finish_time - row.start_time) / 3600000).toFixed(2);
                            totalHours += parseFloat(val);
                        } else {
                            val = '';
                        }
                    } else if (col === 'issue_key' && row.issue_key) {
                        val = `<a href="https://gemkom-1.atlassian.net/browse/${row.issue_key}" target="_blank">${row.issue_key}</a>`;
                    } else if ((col === 'start_time' || col === 'finish_time') && row[col]) {
                        val = new Date(row[col]).toLocaleString('tr-TR');
                    } else if (typeof val === 'boolean') {
                        val = val ? 'Evet' : 'Hayır';
                    } else if (val == null) {
                        val = '';
                    }
                    html += `<td>${val}</td>`;
                }
                // Add edit/delete buttons
                html += `<td>
                    <button class="btn btn-sm btn-outline-primary edit-timer-btn" data-id="${row.id}">Düzenle</button>
                    <button class="btn btn-sm btn-outline-danger delete-timer-btn" data-id="${row.id}">Sil</button>
                </td>`;
                html += '</tr>';
            }
            html += `</tbody><tfoot><tr>`;
            for (let i = 0; i < selectedColumns.length; ++i) {
                if (selectedColumns[i] === 'duration') {
                    html += `<td><strong>${totalHours.toFixed(2)}</strong></td>`;
                } else if (i === selectedColumns.length - 1) {
                    html += '<td></td>';
                } else {
                    html += '<td></td>';
                }
            }
            html += '</tr></tfoot></table></div>';
            container.innerHTML = html;

            // Make columns resizable
            makeTableResizable(container.querySelector('table'));

            // Add event listeners for edit/delete
            container.querySelectorAll('.delete-timer-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = btn.getAttribute('data-id');
                    if (!confirm('Bu zamanlayıcıyı silmek istediğinize emin misiniz?')) return;
                    try {
                        const resp = await authedFetch(`${backendBase}/machining/timers/${id}/`, { method: 'DELETE' });
                        if (!resp.ok) throw new Error('Silinemedi');
                        document.getElementById('fetch-finished-timers-btn').click();
                    } catch (err) {
                        alert('Silme işlemi başarısız: ' + err.message);
                    }
                });
            });
            container.querySelectorAll('.edit-timer-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.getAttribute('data-id');
                    const timer = data.find(r => r.id == id);
                    if (!timer) return;
                    document.getElementById('edit-timer-id').value = timer.id;
                    document.getElementById('edit-job_no').value = timer.job_no || '';
                    document.getElementById('edit-image_no').value = timer.image_no || '';
                    document.getElementById('edit-position_no').value = timer.position_no || '';
                    document.getElementById('edit-quantity').value = timer.quantity || '';
                    document.getElementById('edit-comment').value = timer.comment || '';
                    document.getElementById('edit-manual_entry').checked = !!timer.manual_entry;
                    document.getElementById('edit-machine').value = timer.machine || '';
                    document.getElementById('edit-finish_time').value = timer.finish_time ? toLocalDatetimeInput(timer.finish_time) : '';
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('edit-timer-modal'));
                    modal.show();
                });
            });
            document.getElementById('save-edit-timer-btn').onclick = async function() {
                const id = document.getElementById('edit-timer-id').value;
                const patch = {
                    job_no: document.getElementById('edit-job_no').value,
                    image_no: document.getElementById('edit-image_no').value,
                    position_no: document.getElementById('edit-position_no').value,
                    quantity: parseInt(document.getElementById('edit-quantity').value) || null,
                    comment: document.getElementById('edit-comment').value,
                    manual_entry: document.getElementById('edit-manual_entry').checked,
                    machine: document.getElementById('edit-machine').value,
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
                    document.getElementById('fetch-finished-timers-btn').click();
                } catch (err) {
                    alert('Güncelleme başarısız: ' + err.message);
                }
            };
        } catch (err) {
            container.innerHTML = `<div class="text-danger">Hata: ${err.message}</div>`;
        }
    });

    // Initial fetch
    document.getElementById('fetch-finished-timers-btn').click();

    // Resizable columns helper
    function makeTableResizable(table) {
        if (!table) return;
        let ths = table.querySelectorAll('th');
        let startX, startWidth, col;
        ths.forEach((th, idx) => {
            const handle = th.querySelector('.resize-handle');
            if (!handle) return;
            handle.addEventListener('mousedown', function (e) {
                startX = e.pageX;
                col = th;
                startWidth = th.offsetWidth;
                document.body.style.cursor = 'col-resize';
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
        function onMouseMove(e) {
            if (!col) return;
            let newWidth = startWidth + (e.pageX - startX);
            if (newWidth > 30) col.style.width = newWidth + 'px';
        }
        function onMouseUp() {
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            col = null;
        }
    }

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
                  <div class="mb-2"><label class="form-label">Makine</label><input type="text" class="form-control" id="edit-machine"></div>
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

    // Helper to convert timestamp to local datetime-local string
    function toLocalDatetimeInput(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
} 