import { authedFetch } from '../authService.js';
import { proxyBase, jiraBase } from '../base.js';
import { toJiraDateTimeLocal } from './mesaiTaleplerim.js'

export async function showMesaiTalebiForm() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;
    mainContent.innerHTML = `
    <div class="row justify-content-center mesai-talebi-form"><div class="col-12 col-md-8 col-lg-6"><div class="card"><div class="card-header"><h5 class="mb-0">Mesai Talebi Gönder</h5></div><div class="card-body"><form id="mesai-talebi-form"><div class="mb-3"><label for="start" class="form-label">Başlangıç Tarihi/Saati</label><input type="datetime-local" class="form-control" id="start" required></div><div class="mb-3"><label for="end" class="form-label">Bitiş Tarihi/Saati</label><input type="datetime-local" class="form-control" id="end" required></div><div class="mb-3"><label for="excel" class="form-label">Excel Dosyası</label><input type="file" class="form-control" id="excel" accept=".xlsx,.xlsm" required></div><button type="submit" class="btn btn-primary w-100" style="background-color: #cc0000; border-color: #cc0000;">Gönder</button><div id="mesai-talebi-error" class="text-danger mt-2" style="display:none;"></div><div id="mesai-talebi-success" class="text-success mt-2" style="display:none;"></div></form></div></div></div></div>
    `;
    document.getElementById('mesai-talebi-form').addEventListener('submit', handleMesaiTalebiSubmit);
}

async function handleMesaiTalebiSubmit(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const departman = user.team_label;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    const file = document.getElementById('excel').files[0];
    const errorDiv = document.getElementById('mesai-talebi-error');
    const successDiv = document.getElementById('mesai-talebi-success');
    const submitBtn = document.querySelector('#mesai-talebi-form button[type="submit"]');
    submitBtn.disabled = true;
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Gönderiliyor...';
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    if (!departman || !start || !end || !file) {
        errorDiv.textContent = 'Tüm alanları doldurun ve dosya seçin.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
        return;
    }
    try {
        const data = await file.arrayBuffer();
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Read as array of arrays
        const allRows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        // Find the header row (e.g., row 6 if you want to skip 6 rows)
        const headerRowIndex = 6; // adjust as needed
        const headers = allRows[headerRowIndex];
        const dataRows = allRows.slice(headerRowIndex + 1);

        // Convert to array of objects and filter out empty rows
        const rows = dataRows
            .map(rowArr => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = rowArr[i];
                });
                return obj;
            })
            .filter(rowObj => Object.values(rowObj).some(val => val && val.toString().trim() !== ''));
        if (!rows.length) {
            errorDiv.textContent = 'Excel dosyası boş veya okunamadı!';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
            return;
        }
        // Prepare Epic (parent issue)
        const projectKey = 'MES'; // TODO: Replace with your Jira project key
        const epicSummary = `${departman} - ${new Date(start).toLocaleDateString('tr-TR', { weekday: 'long' })} - ${rows.length} Kişi`;
        const epicFields = {
            project: { key: projectKey },
            summary: epicSummary,
            issuetype: { name: 'Mesai Talebi' },
            "customfield_11172": toJiraDateTimeLocal(start),
            "customfield_11173": toJiraDateTimeLocal(end)
            // Add custom fields as needed
        };
        const epicRes = await authedFetch(proxyBase + encodeURIComponent(`${jiraBase}/rest/api/3/issue`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: epicFields })
        });
        if (!epicRes.ok) {
            errorDiv.textContent = 'Epic oluşturulamadı!';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
            return;
        }
        const epicData = await epicRes.json();
        const epicKey = epicData.key;

        // Create sub-tasks for each row
        for (const row of rows) {
            if (!row['İsim'] || !row['Görev'] || !row['İş Emri Numarası']) continue;
            const subTaskFields = {
                project: { key: projectKey },
                summary: row['İsim'],
                issuetype: { name: 'Çalışan' },
                parent: { key: epicKey },
                "customfield_10117": String(row['İş Emri Numarası']),
                "customfield_11167": departman,
                "customfield_11170": row['Görev'],
                "customfield_11172": toJiraDateTimeLocal(start),
                "customfield_11173": toJiraDateTimeLocal(end),
                "description": {
                        "content": [
                            {
                            "content": [
                                {
                                "text": row["Açıklama (Opsiyonel)"],
                                "type": "text"
                                }
                            ],
                            "type": "paragraph"
                            }
                        ],
                        "type": "doc",
                        "version": 1
                    },
                // Map other fields as needed
            };
            await authedFetch(proxyBase + encodeURIComponent(`${jiraBase}/rest/api/3/issue`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: subTaskFields })
            });
        }
        successDiv.textContent = 'Mesai talebi başarıyla gönderildi!';
        successDiv.style.display = 'block';
        document.getElementById('mesai-talebi-form').reset();
    } catch (err) {
        errorDiv.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        errorDiv.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
} 