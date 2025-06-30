import { fetchMachinesForMachining } from "../machining/machiningService.js";
import { state } from "./adminState.js";

export async function showMachineList() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <style>
            .machine-properties-table td.key-cell {
                padding-right: 20px;
                white-space: nowrap;
                font-weight: bold;
                width: 1%;
            }
            .machine-properties-table td.value-cell {
                padding-left: 300px;
                text-align: left;
            }
        </style>
        <div class="row justify-content-center machine-list">
            <div class="col-12 col-md-10">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Makine Listesi</h5>
                    </div>
                    <div class="card-body">
                        <div id="machine-list-table-container">Yükleniyor...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    try {
        if (state.machines.length === 0){
            state.machines = await fetchMachinesForMachining();
        }
        const machines = state.machines;
        const tableHtml = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Makine Adı</th>
                        <th>Makine Tipi</th>
                        <th>Özellikler</th>
                    </tr>
                </thead>
                <tbody>
                    ${machines.map(machine => `
                        <tr>
                            <td><strong>${machine.name || ''}</strong></td>
                            <td>${machine.machine_type_label || ''}</td>
                            <td>
                                ${machine.properties && typeof machine.properties === 'object' ? `
                                    <table class="table table-sm mb-0 machine-properties-table">
                                        <tbody>
                                            ${Object.entries(machine.properties).map(([key, value]) => `
                                                <tr><td class="key-cell">${key}</td><td class="value-cell">${renderPropertyValue(value)}</td></tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('machine-list-table-container').innerHTML = tableHtml;
    } catch (err) {
        document.getElementById('machine-list-table-container').innerHTML = 'Bir hata oluştu.';
    }
}

function renderPropertyValue(value) {
    if (typeof value === 'boolean') {
        return value
            ? '<span style="color:green;">&#10004;</span>'
            : '<span style="color:red;">&#10008;</span>';
    }
    return value;
} 