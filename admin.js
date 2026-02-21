/* ===================================================
   admin.js – Hungry Hub Admin Dashboard (async/DB)
   =================================================== */

const ADMIN_PIN = 'admin1234';
const SESSION_KEY = 'hhAdminAuth';

/* ── Live Clock ── */
function updateClock() {
    const el = document.getElementById('adminClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

/* ── Login ── */
const loginOverlay = document.getElementById('loginOverlay');
const adminShell = document.getElementById('adminShell');

async function checkAuth() {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
        loginOverlay.style.display = 'none';
        adminShell.style.display = 'flex';
        await renderDashboard();
    }
}

document.getElementById('loginBtn')?.addEventListener('click', doLogin);
document.getElementById('adminPin')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
    const pin = document.getElementById('adminPin').value;
    const err = document.getElementById('pinError');
    const btn = document.getElementById('loginBtn');
    const icon = document.getElementById('loginBtnIcon');

    btn.disabled = true;
    icon.className = 'fas fa-spinner fa-spin';

    await new Promise(r => setTimeout(r, 600));

    if (pin === ADMIN_PIN) {
        sessionStorage.setItem(SESSION_KEY, '1');
        loginOverlay.style.display = 'none';
        adminShell.style.display = 'flex';
        await renderDashboard();
    } else {
        err.textContent = 'Incorrect PIN. Please try again.';
        btn.disabled = false;
        icon.className = 'fas fa-sign-in-alt';
        document.getElementById('adminPin').value = '';
        document.getElementById('adminPin').focus();
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
});

/* ── Navigation ── */
const navLinks = document.querySelectorAll('.admin-nav-link');
navLinks.forEach(link => {
    if (!link.dataset.view) return;
    link.addEventListener('click', e => {
        e.preventDefault();
        switchView(link.dataset.view);
    });
});

document.getElementById('adminHamburger')?.addEventListener('click', () => {
    document.querySelector('.admin-sidebar')?.classList.toggle('open');
});

async function switchView(view) {
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === view));
    document.querySelectorAll('.admin-view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    const titles = { dashboard: 'Dashboard', bookings: 'All Bookings', tables: 'Tables' };
    document.getElementById('adminPageTitle').textContent = titles[view] || view;

    if (view === 'bookings') await renderAllBookings();
    if (view === 'tables') await renderAdminTables();
}

document.getElementById('goToBookings')?.addEventListener('click', () => switchView('bookings'));

/* ── Dashboard ── */
async function renderDashboard() {
    const all = await getAllBookings();
    const stats = getTodayStats(all);
    const today = new Date().toISOString().slice(0, 10);
    const v = getVacancy(today, '', all);

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statToday').textContent = stats.todayCount;
    document.getElementById('statAdvance').textContent = '₹' + stats.totalAdvance.toLocaleString('en-IN');
    document.getElementById('statAvailable').textContent = v.available + '/' + v.total;
    const pendingEl = document.getElementById('statPending');
    if (pendingEl) pendingEl.textContent = stats.pending;

    const todayBookings = all.filter(b => b.date === today);
    renderBookingsTable(todayBookings, 'todayTableBody', 'todayEmpty');
}

/* ── Status Badge & Action Buttons ── */
function statusBadge(status) {
    const map = { pending: 'badge-pending', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled', rejected: 'badge-rejected' };
    return `<span class="status-badge ${map[status] || ''}">${status}</span>`;
}

function actionBtns(ref, status) {
    let html = `<button class="action-btn btn-detail" onclick="showDetail('${ref}')"><i class="fas fa-eye"></i></button>`;
    if (status === 'pending') {
        html += `<button class="action-btn btn-accept" onclick="changeStatus('${ref}','confirmed')" title="Accept"><i class="fas fa-check"></i></button>`;
        html += `<button class="action-btn btn-reject" onclick="changeStatus('${ref}','rejected')" title="Reject"><i class="fas fa-ban"></i></button>`;
    } else if (status === 'confirmed') {
        html += `<button class="action-btn btn-complete" onclick="changeStatus('${ref}','completed')" title="Complete"><i class="fas fa-check-double"></i></button>`;
        html += `<button class="action-btn btn-cancel"  onclick="changeStatus('${ref}','cancelled')"  title="Cancel"><i class="fas fa-times"></i></button>`;
    }
    html += `<button class="action-btn btn-cancel" style="color: #ef4444;" onclick="deleteBookingModal('${ref}')" title="Permanently Delete"><i class="fas fa-trash-alt"></i></button>`;
    return html;
}

function renderBookingsTable(bookings, tbodyId, emptyId) {
    const tbody = document.getElementById(tbodyId);
    const empty = document.getElementById(emptyId);
    if (!tbody) return;
    if (bookings.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><code>${b.bookingRef}</code></td>
      <td>${b.firstName} ${b.lastName}</td>
      <td>${b.email}<br/><small class="text-muted">${b.phone}</small></td>
      <td>${b.dateFormatted || b.date}</td>
      <td>${b.time}</td>
      <td>${b.guests}</td>
      <td>${b.tableLabel || 'TBD'}</td>
      <td>${b.occasion || '—'}</td>
      <td>₹${b.totalAdvance}</td>
      <td>${statusBadge(b.status)}</td>
      <td>${actionBtns(b.bookingRef, b.status)}</td>
    </tr>
  `).join('');
}

/* ── All Bookings View ── */
let currentFilter = { search: '', status: '', date: '' };
let _cachedBookings = [];

async function renderAllBookings() {
    _cachedBookings = await getAllBookings();
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    let all = [..._cachedBookings];
    const count = document.getElementById('bookingCount');

    if (currentFilter.search) {
        const s = currentFilter.search.toLowerCase();
        all = all.filter(b =>
            `${b.firstName} ${b.lastName}`.toLowerCase().includes(s) ||
            b.email.toLowerCase().includes(s) ||
            b.bookingRef.toLowerCase().includes(s)
        );
    }
    if (currentFilter.status) all = all.filter(b => b.status === currentFilter.status);
    if (currentFilter.date) all = all.filter(b => b.date === currentFilter.date);

    if (count) count.textContent = `(${all.length})`;
    renderBookingsTable(all, 'allBookingsBody', 'allEmpty');
}

document.getElementById('searchInput')?.addEventListener('input', e => {
    currentFilter.search = e.target.value; applyFiltersAndRender();
});
document.getElementById('statusFilter')?.addEventListener('change', e => {
    currentFilter.status = e.target.value; applyFiltersAndRender();
});
document.getElementById('dateFilter')?.addEventListener('change', e => {
    currentFilter.date = e.target.value; applyFiltersAndRender();
});
document.getElementById('clearFilters')?.addEventListener('click', () => {
    currentFilter = { search: '', status: '', date: '' };
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    applyFiltersAndRender();
});

/* ── Change Status ── */
window.changeStatus = async function (ref, newStatus) {
    const msgs = {
        confirmed: `Accept booking ${ref}? A table will be auto-assigned.`,
        rejected: `Reject booking ${ref}? The customer will be notified.`,
        cancelled: `Cancel confirmed booking ${ref}?`,
        completed: `Mark booking ${ref} as completed?`,
    };
    // if (!confirm(msgs[newStatus] || `Update booking ${ref}?`)) return;

    try {
        await updateBookingStatus(ref, newStatus);
        await renderDashboard();
        await renderAllBookings();
        await renderAdminTables();
    } catch (err) {
        alert('Error updating booking: ' + err.message);
    }
};

window.deleteBookingModal = async function (ref) {
    try {
        await deleteBookingRecord(ref);
        if (document.getElementById('bookingDetailModal').classList.contains('active')) {
            closeDetail();
        }
        await renderDashboard();
        await renderAllBookings();
        await renderAdminTables();
    } catch (err) {
        alert('Error deleting booking: ' + err.message);
    }
};

/* ── Booking Detail Modal ── */
window.showDetail = async function (ref) {
    const all = await getAllBookings();
    const booking = all.find(b => b.bookingRef === ref);
    if (!booking) return;

    const content = document.getElementById('bookingDetailContent');
    const actionHtml = (() => {
        if (booking.status === 'pending') return `
      <div class="detail-actions">
        <button class="btn btn-accept-lg" onclick="changeStatus('${ref}','confirmed');closeDetail()">
          <i class="fas fa-check"></i> Accept Booking
        </button>
        <button class="btn btn-reject-lg" onclick="changeStatus('${ref}','rejected');closeDetail()">
          <i class="fas fa-ban"></i> Reject Booking
        </button>
      </div>`;
        if (booking.status === 'confirmed') return `
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="changeStatus('${ref}','completed');closeDetail()">
          <i class="fas fa-check-double"></i> Mark Completed
        </button>
        <button class="btn btn-danger" onclick="changeStatus('${ref}','cancelled');closeDetail()">
          <i class="fas fa-times"></i> Cancel Booking
        </button>
      </div>`;
        return '';
    })();

    content.innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span>Booking Ref</span><strong>${booking.bookingRef}</strong></div>
      <div class="detail-row"><span>Guest</span><strong>${booking.firstName} ${booking.lastName}</strong></div>
      <div class="detail-row"><span>Email</span><strong>${booking.email}</strong></div>
      <div class="detail-row"><span>Phone</span><strong>${booking.phone}</strong></div>
      <div class="detail-row"><span>Date</span><strong>${booking.dateFormatted || booking.date}</strong></div>
      <div class="detail-row"><span>Time</span><strong>${booking.time}</strong></div>
      <div class="detail-row"><span>Guests</span><strong>${booking.guests}</strong></div>
      <div class="detail-row"><span>Table</span><strong>${booking.tableLabel || 'TBD'}</strong></div>
      <div class="detail-row"><span>Occasion</span><strong>${booking.occasion || '—'}</strong></div>
      <div class="detail-row"><span>Special Requests</span><strong>${booking.requests || '—'}</strong></div>
      <div class="detail-row"><span>Advance Paid</span><strong>₹${booking.totalAdvance}</strong></div>
      <div class="detail-row"><span>Status</span><strong>${statusBadge(booking.status)}</strong></div>
      <div class="detail-row"><span>Booked At</span><strong>${new Date(booking.bookedAt).toLocaleString('en-IN')}</strong></div>
    </div>
    ${actionHtml}
    <div style="margin-top: 24px; text-align: center; padding-top: 16px; border-top: 1px solid #1f2937;">
      <button class="btn btn-danger" style="background-color: #ef4444; width: 100%; border: none; padding: 12px; border-radius: 8px; font-weight: 500; cursor: pointer; color: white;" onclick="deleteBookingModal('${ref}')">
        <i class="fas fa-trash-alt"></i> Permanently Delete Booking
      </button>
    </div>
  `;
    document.getElementById('bookingDetailModal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeDetail = function () {
    document.getElementById('bookingDetailModal').classList.remove('active');
    document.body.style.overflow = '';
};

document.getElementById('closeDetailModal')?.addEventListener('click', closeDetail);
document.getElementById('bookingDetailModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('bookingDetailModal')) closeDetail();
});

/* ── CSV Export ── */
document.getElementById('exportBtn')?.addEventListener('click', async () => {
    const all = await getAllBookings();
    const headers = ['Ref', 'First', 'Last', 'Email', 'Phone', 'Date', 'Time', 'Guests', 'Table', 'Occasion', 'Requests', 'Advance', 'Status', 'BookedAt'];
    const rows = all.map(b => [
        b.bookingRef, b.firstName, b.lastName, b.email, b.phone,
        b.date, b.time, b.guests, b.tableLabel || '', b.occasion || '',
        (b.requests || '').replace(/,/g, ';'), b.totalAdvance, b.status, b.bookedAt
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `hungryhub_bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
});

/* ── Admin Tables View ── */
const adminTableDate = document.getElementById('adminTableDate');
const adminTableTime = document.getElementById('adminTableTime');
if (adminTableDate) adminTableDate.value = new Date().toISOString().slice(0, 10);

[adminTableDate, adminTableTime].forEach(el => {
    el?.addEventListener('change', renderAdminTables);
});

function getCapClass(cap) {
    if (cap <= 2) return 'cap-2';
    if (cap <= 4) return 'cap-4';
    return 'cap-6';
}

async function renderAdminTables() {
    const date = adminTableDate?.value || new Date().toISOString().slice(0, 10);
    const time = adminTableTime?.value || '';
    const all = await getAllBookings();
    const v = getVacancy(date, time, all);

    const vacRow = document.getElementById('adminVacancyRow');
    if (vacRow) {
        vacRow.innerHTML = `
      <div class="admin-vac-card total"><i class="fas fa-th"></i><span>${v.total}</span>Total</div>
      <div class="admin-vac-card available"><i class="fas fa-check-circle"></i><span>${v.available}</span>Available</div>
      <div class="admin-vac-card booked"><i class="fas fa-times-circle"></i><span>${v.booked}</span>Booked</div>
    `;
    }

    const rows = {
        'admin-row-indoor-2': HH_TABLES.filter(t => t.section === 'Indoor' && t.capacity === 2),
        'admin-row-indoor-4': HH_TABLES.filter(t => t.section === 'Indoor' && t.capacity === 4),
        'admin-row-indoor-6': HH_TABLES.filter(t => t.section === 'Indoor' && t.capacity === 6),
        'admin-row-outdoor-2': HH_TABLES.filter(t => t.section === 'Outdoor' && t.capacity === 2),
        'admin-row-outdoor-4': HH_TABLES.filter(t => t.section === 'Outdoor' && t.capacity === 4),
    };

    Object.entries(rows).forEach(([rowId, tables]) => {
        const row = document.getElementById(rowId);
        if (!row) return;
        row.innerHTML = '';
        tables.forEach(table => {
            const isBooked = v.bookedTableIds.includes(table.id);
            const card = document.createElement('div');
            card.className = `floor-table ${getCapClass(table.capacity)} ${isBooked ? 'booked' : 'available'}`;
            card.title = `${table.label} · ${table.capacity}-person`;
            const booking = isBooked
                ? all.find(b => b.tableId === table.id && b.date === date && (time ? b.time === time : true) && b.status !== 'cancelled')
                : null;
            card.innerHTML = `
        <div class="ft-icon"><i class="fas fa-chair"></i></div>
        <div class="ft-label">${table.label}</div>
        <div class="ft-cap">${table.capacity}p</div>
        <div class="ft-status">${isBooked ? (booking ? booking.firstName : 'Booked') : 'Free'}</div>
      `;
            if (isBooked && booking) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => showDetail(booking.bookingRef));
            }
            row.appendChild(card);
        });
    });
}

/* ── Init ── */
checkAuth();
