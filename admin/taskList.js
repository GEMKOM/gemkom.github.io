import { backendBase } from '../base.js';
import { authedFetch } from '../authService.js';

const columns = [
    { key: 'key', label: 'TI No' },
    { key: 'name', label: 'Ad' },
    { key: 'job_no', label: 'İş No' },
    { key: 'image_no', label: 'Resim No' },
    { key: 'position_no', label: 'Pozisyon No' },
    { key: 'quantity', label: 'Adet' },
    { key: 'completion_date', label: 'Bitiş Tarihi' },
    { key: 'completed_by', label: 'Tamamlayan' },
    { key: 'status', label: 'Durum' },
];

export async function showTaskListSection() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div class="row mb-3">
            <div class="col-12">
                <h3>Talaşlı İmalat İşler</h3>
                <form id="task-list-filters" class="row g-3 align-items-end">
                    <div class="col-md-2">
                        <label for="key" class="form-label">TI Numarası</label>
                        <input type="text" class="form-control" id="key" placeholder="TI-123">
                    </div>
                    <div class="col-md-2">
                        <label for="name" class="form-label">Ad</label>
                        <input type="text" class="form-control" id="name" placeholder="Ad">
                    </div>
                    <div class="col-md-2">
                        <label for="job_no" class="form-label">İş No</label>
                        <input type="text" class="form-control" id="job_no" placeholder="İş No">
                    </div>
                    <div class="col-md-2">
                        <label for="image_no" class="form-label">Resim No</label>
                        <input type="text" class="form-control" id="image_no" placeholder="Resim No">
                    </div>
                    <div class="col-md-2">
                        <label for="position_no" class="form-label">Pozisyon No</label>
                        <input type="text" class="form-control" id="position_no" placeholder="Pozisyon No">
                    </div>
                    <div class="col-md-2">
                        <label for="completed_by" class="form-label">Tamamlayan</label>
                        <input type="text" class="form-control" id="completed_by" placeholder="Tamamlayan">
                    </div>
                    <div class="col-md-2">
                        <label for="completion_date_gte" class="form-label">Bitiş Tarihi (En Erken)</label>
                        <input type="date" class="form-control" id="completion_date_gte">
                    </div>
                    <div class="col-md-2">
                        <label for="completion_date_lte" class="form-label">Bitiş Tarihi (En Geç)</label>
                        <input type="date" class="form-control" id="completion_date_lte">
                    </div>
                    <div class="col-md-2">
                        <label for="status_filter" class="form-label">Durum</label>
                        <select class="form-select" id="status_filter">
                            <option value="">Hepsi</option>
                            <option value="active">Aktif</option>
                            <option value="completed">Tamamlanmış</option>
                        </select>
                    </div>
                    <div class="col-md-2 mt-2">
                        <button type="button" id="fetch-task-list-btn" class="btn btn-primary w-100">Listele</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div id="task-list-table-container"></div>
            </div>
        </div>
    `;

    document.getElementById('fetch-task-list-btn').addEventListener('click', async () => {
        await renderTaskListTable();
    });
    // Initial fetch
    document.getElementById('fetch-task-list-btn').click();
}

function buildTaskListQuery() {
    const key = document.getElementById('key').value.trim();
    const name = document.getElementById('name').value.trim();
    const job_no = document.getElementById('job_no').value.trim();
    const image_no = document.getElementById('image_no').value.trim();
    const position_no = document.getElementById('position_no').value.trim();
    const completed_by = document.getElementById('completed_by').value.trim();
    const completion_date_gte = document.getElementById('completion_date_gte').value;
    const completion_date_lte = document.getElementById('completion_date_lte').value;
    const status = document.getElementById('status_filter').value;
    let params = [];
    if (key) params.push(`key=${encodeURIComponent(key)}`);
    if (name) params.push(`name=${encodeURIComponent(name)}`);
    if (job_no) params.push(`job_no=${encodeURIComponent(job_no)}`);
    if (image_no) params.push(`image_no=${encodeURIComponent(image_no)}`);
    if (position_no) params.push(`position_no=${encodeURIComponent(position_no)}`);
    if (completed_by) params.push(`completed_by=${encodeURIComponent(completed_by)}`);
    if (completion_date_gte) {
        const ts = new Date(completion_date_gte).getTime();
        if (!isNaN(ts)) params.push(`completion_date__gte=${ts}`);
    }
    if (completion_date_lte) {
        const ts = new Date(completion_date_lte).getTime();
        if (!isNaN(ts)) params.push(`completion_date__lte=${ts}`);
    }
    if (status === 'active') params.push('completion_date__isnull=true');
    if (status === 'completed') params.push('completion_date__isnull=false');
    return params.length ? '?' + params.join('&') : '';
}

async function renderTaskListTable() {
    const container = document.getElementById('task-list-table-container');
    container.innerHTML = '<div>Yükleniyor...</div>';
    try {
        const query = buildTaskListQuery();
        const url = `${backendBase}/machining/tasks/${query}`;
        const resp = await authedFetch(url);
        if (!resp.ok) throw new Error('Liste alınamadı');
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div>Sonuç bulunamadı.</div>';
            return;
        }
        let html = `<div class="table-responsive"><table class="table table-bordered table-sm"><thead><tr>`;
        for (const col of columns) {
            html += `<th>${col.label}</th>`;
        }
        html += '</tr></thead><tbody>';
        for (const row of data) {
            html += '<tr>';
            for (const col of columns) {
                let val;
                if (col.key === 'status') {
                    if (!row.completion_date) {
                        val = '<span class="badge bg-success">Aktif</span>';
                    } else {
                        val = '<span class="badge bg-primary">Tamamlandı</span>';
                    }
                } else if (col.key === 'key') {
                    val = row.key ? `<a href="https://gemkom-1.atlassian.net/browse/${row.key}" target="_blank">${row.key}</a>` : '';
                } else if (col.key === 'completion_date') {
                    val = row.completion_date ? new Date(row.completion_date).toLocaleString('tr-TR') : '';
                } else {
                    val = row[col.key] == null ? '' : row[col.key];
                }
                html += `<td>${val}</td>`;
            }
            html += '</tr>';
        }
        html += `</tbody></table></div>`;
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div class="text-danger">Hata: ${err.message}</div>`;
    }
} 