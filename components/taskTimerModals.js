// components/taskTimerModals.js
// Generic modals for task timer/detail views (manual time, fault report)

import { formatTime, formatJiraDate } from '../machining/machiningService.js';
import { createMaintenanceRequest } from '../maintenance/maintenance.js';

export function createManualTimeModal() {
    const modal = document.createElement('div');
    modal.className = 'manual-time-modal';
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const endDateTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTimeStr = endDateTime.toTimeString().slice(0, 5);
    modal.innerHTML = `
        <div class="manual-time-modal-content" lang="tr">
            <div class="manual-time-modal-header">
                <h3>Manuel Zaman Girişi</h3>
                <button class="manual-time-close" id="manual-time-close">&times;</button>
            </div>
            <div class="manual-time-modal-body">
                <div class="time-input-group">
                    <label>Başlangıç:</label>
                    <div class="datetime-inputs">
                        <input type="date" id="start-date" value="${currentDate}" required>
                        <input type="time" id="start-time" value="${currentTime}" required>
                    </div>
                </div>
                <div class="time-input-group">
                    <label>Bitiş:</label>
                    <div class="datetime-inputs">
                        <input type="date" id="end-date" value="${currentDate}" required>
                        <input type="time" id="end-time" value="${endTimeStr}" required>
                    </div>
                </div>
                <div class="manual-time-preview" id="time-preview">
                    Süre: <span id="duration-preview">01:00:00</span>
                </div>
            </div>
            <div class="manual-time-modal-footer">
                <button class="btn btn-secondary" id="manual-time-cancel">İptal</button>
                <button class="btn btn-primary" id="manual-time-submit">Kaydet</button>
            </div>
        </div>
    `;
    setupManualTimeModalEvents(modal);
    return modal;
}

function setupManualTimeModalEvents(modal) {
    const startDate = modal.querySelector('#start-date');
    const startTime = modal.querySelector('#start-time');
    const endDate = modal.querySelector('#end-date');
    const endTime = modal.querySelector('#end-time');
    const durationPreview = modal.querySelector('#duration-preview');
    function updateDuration() {
        try {
            const startDateTime = new Date(`${startDate.value}T${startTime.value}`);
            const endDateTime = new Date(`${endDate.value}T${endTime.value}`);
            if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime()) && endDateTime > startDateTime) {
                const elapsedSeconds = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 1000);
                durationPreview.textContent = formatTime(elapsedSeconds);
            } else {
                durationPreview.textContent = '00:00:00';
            }
        } catch (error) {
            durationPreview.textContent = '00:00:00';
        }
    }
    startDate.addEventListener('change', updateDuration);
    startTime.addEventListener('change', updateDuration);
    endDate.addEventListener('change', updateDuration);
    endTime.addEventListener('change', updateDuration);
    updateDuration();
}

export function showManualTimeModal({ createManualTimeEntry, logTimeToJiraShared }) {
    const modal = createManualTimeModal();
    document.body.appendChild(modal);
    return new Promise((resolve) => {
        const submitBtn = modal.querySelector('#manual-time-submit');
        const cancelBtn = modal.querySelector('#manual-time-cancel');
        const closeBtn = modal.querySelector('#manual-time-close');
        function closeModal() {
            document.body.removeChild(modal);
            resolve();
        }
        submitBtn.onclick = async () => {
            const startDate = modal.querySelector('#start-date').value;
            const startTime = modal.querySelector('#start-time').value;
            const endDate = modal.querySelector('#end-date').value;
            const endTime = modal.querySelector('#end-time').value;
            if (!startDate || !startTime || !endDate || !endTime) {
                alert("Lütfen tüm alanları doldurun.");
                return;
            }
            try {
                const startDateTime = new Date(`${startDate}T${startTime}`);
                const endDateTime = new Date(`${endDate}T${endTime}`);
                if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                    alert("Geçersiz tarih formatı.");
                    return;
                }
                if (endDateTime <= startDateTime) {
                    alert("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
                    return;
                }
                const elapsedSeconds = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 1000);
                if (elapsedSeconds < 60) {
                    alert("Minimum 1 dakika çalışma süresi gereklidir.");
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Kaydediliyor...';
                const timerCreated = await createManualTimeEntry(startDateTime, endDateTime);
                if (!timerCreated) {
                    throw new Error('Failed to create timer in database');
                }
                const started = formatJiraDate(startDateTime.getTime());
                const startDateStr = `${startDate} ${startTime}`;
                const endDateStr = `${endDate} ${endTime}`;
                const comment = `Manuel giriş: ${formatTime(elapsedSeconds)} (${startDateStr} - ${endDateStr})`;
                const jiraLogged = await logTimeToJiraShared({
                    startTime:started, 
                    elapsedSeconds: elapsedSeconds, 
                    comment: comment
                });
                if (jiraLogged) {
                    alert(`Manuel zaman girişi başarılı: ${formatTime(elapsedSeconds)}`);
                    window.dispatchEvent(new CustomEvent('softReload'));
                } else {
                    alert("Jira'ya kayıt yapılırken hata oluştu.");
                }
                closeModal();
            } catch (error) {
                console.error('Error logging manual time:', error);
                alert("Hata oluştu. Lütfen tekrar deneyin.");
                submitBtn.disabled = false;
                submitBtn.textContent = 'Kaydet';
            }
        };
        cancelBtn.onclick = closeModal;
        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    });
}

export function createFaultReportModal() {
    let modal = document.getElementById('fault-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fault-modal';
        modal.className = 'fault-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="fault-modal-content">
                <div class="fault-modal-header">
                    <h3>Arıza Bildirimi</h3>
                    <button class="fault-modal-close" id="fault-modal-close">&times;</button>
                </div>
                <div class="fault-modal-body">
                    <div class="form-group">
                        <label for="fault-description">Arıza Açıklaması:</label>
                        <textarea id="fault-description" rows="4" placeholder="Arıza detaylarını buraya yazın..." required></textarea>
                    </div>
                    <div>
                        <label for="is-operable">Makine çalışır durumda</label>
                        <input class="form-check-input" type="checkbox" id="is-operable" checked>
                    </div>
                </div>
                <div class="fault-modal-footer">
                    <button class="btn btn-secondary" id="fault-modal-cancel">İptal</button>
                    <button class="btn btn-danger" id="fault-modal-submit">Gönder</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const descriptionTextarea = modal.querySelector('#fault-description');
    const submitBtn = modal.querySelector('#fault-modal-submit');
    const cancelBtn = modal.querySelector('#fault-modal-cancel');
    const closeBtn = modal.querySelector('#fault-modal-close');
    const isBreakingCheckbox = modal.querySelector('#is-operable');
    modal.style.display = 'flex';
    descriptionTextarea.focus();
    return new Promise((resolve) => {
        function closeModal() {
            modal.style.display = 'none';
            descriptionTextarea.value = '';
            isBreakingCheckbox.checked = true;
            resolve();
        }
        submitBtn.onclick = async () => {
            if (!isBreakingCheckbox.checked) {
                if (!confirm("Arıza kaydı oluşturmak istediğinize emin misiniz? Makine kullanıma kapatılacaktır.")) {
                    closeModal();
                    return;
                }
                if (!confirm("Bildireceğiniz arıza makinenin çalışmasına engel değilse lütfen 'Makine çalışır durumda' kutucuğunu işaretleyiniz. Emin misiniz?")) {
                    closeModal();
                    return;
                }
            }
            const description = descriptionTextarea.value.trim();
            if (!description) {
                alert("Lütfen arıza açıklaması girin.");
                return;
            }
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Gönderiliyor...';
                const machineId = sessionStorage.getItem('selectedMachineId') || -1;
                if (!machineId || machineId === -1) {
                    alert("Lütfen önce bir makine seçin.");
                    return;
                }
                const success = await createMaintenanceRequest({
                    machine: machineId,
                    is_maintenance: false,
                    description: description,
                    is_breaking: !isBreakingCheckbox.checked
                });
                
                if (success) {
                    alert('Arıza bildirimi başarıyla gönderildi.');
                    closeModal();
                } else {
                    alert('Arıza bildirimi gönderilemedi.');
                }
            } catch (error) {
                console.error('Error reporting fault:', error);
                alert("Arıza bildirimi gönderilirken hata oluştu.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gönder';
            }
        };
        cancelBtn.onclick = closeModal;
        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        descriptionTextarea.onkeydown = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                submitBtn.click();
            }
        };
    });
}