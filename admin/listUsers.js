import { fetchUsers } from '../authService.js';

export async function showUserList() {
    const mainContent = document.querySelector('.admin-main-content .container-fluid');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div class="row justify-content-center user-list">
            <div class="col-12 col-md-10">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Kullanıcı Listesi</h5>
                    </div>
                    <div class="card-body">
                        <div id="user-list-table-container">Yükleniyor...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    try {
        const users = await fetchUsers();
        const tableHtml = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Kullanıcı Adı</th>
                        <th>Admin mi?</th>
                        <th>Takım</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td style="text-align:center; font-size:1.3em;">
                                ${user.is_admin || user.is_superuser
                                    ? '<span style="color:green;">&#10004;</span>'
                                    : '<span style="color:red;">&#10008;</span>'}
                            </td>
                            <td>${user.team_label || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('user-list-table-container').innerHTML = tableHtml;
    } catch (err) {
        document.getElementById('user-list-table-container').innerHTML = 'Kullanıcılar yüklenemedi.';
    }
} 