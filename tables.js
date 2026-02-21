/* ===================================================
   tables.js – Hungry Hub Table Availability Page
   =================================================== */

// Seed demo data if empty
seedDemoData();

/* ── Set default date to today ── */
const filterDate = document.getElementById('filterDate');
const filterTime = document.getElementById('filterTime');
const filterGuests = document.getElementById('filterGuests');

const todayISO = new Date().toISOString().slice(0, 10);
if (filterDate) {
    filterDate.value = todayISO;
    filterDate.min = todayISO;
}

/* ── Render Floor Plan ── */
function getCapClass(cap) {
    if (cap <= 2) return 'cap-2';
    if (cap <= 4) return 'cap-4';
    return 'cap-6';
}

function renderFloorPlan() {
    const date = filterDate?.value || todayISO;
    const time = filterTime?.value || '';
    const minGuests = parseInt(filterGuests?.value || '0');

    const { bookedTableIds } = getVacancy(date, time);

    const rows = {
        'row-indoor-2': HH_TABLES.filter(t => t.section === 'Indoor' && t.capacity === 2),
        'row-indoor-4': HH_TABLES.filter(t => t.section === 'Indoor' && t.capacity === 4),
        'row-indoor-6': HH_TABLES.filter(t => t.section === 'Indoor' && t.capacity === 6),
        'row-outdoor-2': HH_TABLES.filter(t => t.section === 'Outdoor' && t.capacity === 2),
        'row-outdoor-4': HH_TABLES.filter(t => t.section === 'Outdoor' && t.capacity === 4),
    };

    Object.entries(rows).forEach(([rowId, tables]) => {
        const row = document.getElementById(rowId);
        if (!row) return;
        row.innerHTML = '';
        tables.forEach(table => {
            const isBooked = bookedTableIds.includes(table.id);
            const tooSmall = minGuests > 0 && table.capacity < minGuests;
            const card = document.createElement('div');
            card.className = `floor-table ${getCapClass(table.capacity)} ${isBooked ? 'booked' : 'available'} ${tooSmall ? 'too-small' : ''}`;
            card.setAttribute('data-id', table.id);
            card.title = `${table.label} · ${table.capacity}-person · ${isBooked ? 'Booked' : 'Available'}`;
            card.innerHTML = `
        <div class="ft-icon"><i class="fas fa-chair"></i></div>
        <div class="ft-label">${table.label}</div>
        <div class="ft-cap">${table.capacity}p</div>
        <div class="ft-status">${isBooked ? 'Booked' : 'Free'}</div>
      `;
            card.addEventListener('click', () => showTableDetail(table, isBooked, date, time));
            row.appendChild(card);
        });
    });

    updateVacancy(date, time);
}

/* ── Update vacancy banner ── */
function updateVacancy(date, time) {
    const v = getVacancy(date, time);
    const vAvail = document.getElementById('vAvailable');
    const vBooked = document.getElementById('vBooked');
    const vTotal = document.getElementById('vTotal');
    if (vTotal) vTotal.textContent = v.total;
    if (vAvail) vAvail.textContent = v.available;
    if (vBooked) vBooked.textContent = v.booked;

    const bookBtn = document.getElementById('bookNowBtn');
    if (bookBtn) {
        bookBtn.textContent = v.available > 0
            ? `${v.available} Tables Free – Book Now`
            : 'Join Waitlist';
        bookBtn.style.background = v.available === 0 ? '#c0392b' : '';
    }
}

/* ── Table Detail Card ── */
function showTableDetail(table, isBooked, date, time) {
    const card = document.getElementById('tableDetailCard');
    const content = document.getElementById('tableDetailContent');
    if (!card || !content) return;

    let bookingInfo = '';
    if (isBooked) {
        const bookings = getAllBookings().filter(b =>
            b.tableId === table.id && b.date === date &&
            (time ? b.time === time : true) && b.status !== 'cancelled'
        );
        if (bookings.length) {
            bookingInfo = bookings.map(b => `
        <div class="td-booking">
          <div class="td-row"><i class="fas fa-user"></i> ${b.firstName} ${b.lastName}</div>
          <div class="td-row"><i class="fas fa-clock"></i> ${b.time} · ${b.guests} guests</div>
          <div class="td-row"><i class="fas fa-hashtag"></i> ${b.bookingRef}</div>
        </div>
      `).join('');
        }
    }

    // Build the reserve URL with pre-fill params
    const reserveParams = new URLSearchParams({
        tableId: table.id,
        tableLabel: table.label,
        capacity: table.capacity,
        section: table.section,
    });
    if (date) reserveParams.set('date', date);
    if (time) reserveParams.set('time', time);

    const bookUrl = `reserve.html?${reserveParams.toString()}`;

    content.innerHTML = `
    <div class="td-head">
      <div class="td-label">${table.label}</div>
      <div class="td-status ${isBooked ? 'booked' : 'available'}">${isBooked ? '🔴 Booked' : '🟢 Available'}</div>
    </div>
    <div class="td-info">
      <div class="td-row"><i class="fas fa-chair"></i> Capacity: ${table.capacity} guests</div>
      <div class="td-row"><i class="fas fa-door-${table.section === 'Indoor' ? 'closed' : 'open'}"></i> Section: ${table.section}</div>
      ${date ? `<div class="td-row"><i class="fas fa-calendar"></i> Date: ${date}</div>` : ''}
      ${time ? `<div class="td-row"><i class="fas fa-clock"></i> Time: ${time}</div>` : ''}
    </div>
    ${isBooked ? bookingInfo : `
      <a href="${bookUrl}" class="btn btn-primary" style="margin-top:16px;width:100%;text-align:center;display:block;">
        <i class="fas fa-calendar-plus"></i> Book Table ${table.label}
      </a>
    `}
  `;

    card.style.display = 'block';
}

/* ── Close detail card ── */
const closeBtn = document.getElementById('tableDetailClose');
if (closeBtn) closeBtn.addEventListener('click', () => {
    document.getElementById('tableDetailCard').style.display = 'none';
});

/* ── Filter listeners ── */
[filterDate, filterTime, filterGuests].forEach(el => {
    if (el) el.addEventListener('change', renderFloorPlan);
});

/* ── Initial render ── */
renderFloorPlan();
