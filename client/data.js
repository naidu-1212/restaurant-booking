/* ===================================================
   data.js – Hungry Hub Frontend Data Layer
   All operations go via the REST API (server.js)
   =================================================== */

const API = '/api';

/* ── Table Configuration (client-side, for UI helpers) ── */
const HH_TABLES = [
    { id: 1, capacity: 2, label: 'T01', section: 'Indoor', x: 1, y: 1 },
    { id: 2, capacity: 2, label: 'T02', section: 'Indoor', x: 2, y: 1 },
    { id: 3, capacity: 2, label: 'T03', section: 'Indoor', x: 3, y: 1 },
    { id: 4, capacity: 2, label: 'T04', section: 'Indoor', x: 4, y: 1 },
    { id: 5, capacity: 2, label: 'T05', section: 'Indoor', x: 5, y: 1 },
    { id: 6, capacity: 4, label: 'T06', section: 'Indoor', x: 1, y: 2 },
    { id: 7, capacity: 4, label: 'T07', section: 'Indoor', x: 2, y: 2 },
    { id: 8, capacity: 4, label: 'T08', section: 'Indoor', x: 3, y: 2 },
    { id: 9, capacity: 4, label: 'T09', section: 'Indoor', x: 4, y: 2 },
    { id: 10, capacity: 4, label: 'T10', section: 'Indoor', x: 5, y: 2 },
    { id: 11, capacity: 6, label: 'T11', section: 'Indoor', x: 1, y: 3 },
    { id: 12, capacity: 6, label: 'T12', section: 'Indoor', x: 2, y: 3 },
    { id: 13, capacity: 6, label: 'T13', section: 'Indoor', x: 3, y: 3 },
    { id: 14, capacity: 6, label: 'T14', section: 'Indoor', x: 4, y: 3 },
    { id: 15, capacity: 2, label: 'T15', section: 'Outdoor', x: 1, y: 4 },
    { id: 16, capacity: 2, label: 'T16', section: 'Outdoor', x: 2, y: 4 },
    { id: 17, capacity: 2, label: 'T17', section: 'Outdoor', x: 3, y: 4 },
    { id: 18, capacity: 4, label: 'T18', section: 'Outdoor', x: 1, y: 5 },
    { id: 19, capacity: 4, label: 'T19', section: 'Outdoor', x: 2, y: 5 },
    { id: 20, capacity: 4, label: 'T20', section: 'Outdoor', x: 3, y: 5 },
];

const TOTAL_TABLES = HH_TABLES.length;

/* ── API Helpers ── */
async function getAllBookings() {
    try {
        const res = await fetch(`${API}/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return await res.json();
    } catch (err) {
        console.error('getAllBookings error:', err);
        return [];
    }
}

async function saveBooking(booking) {
    const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error('Failed to save booking');
    return await res.json();
}

async function updateBookingStatus(bookingRef, status) {
    const res = await fetch(`${API}/bookings/${bookingRef}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return await res.json();
}

async function deleteBookingRecord(bookingRef) {
    const res = await fetch(`${API}/bookings/${bookingRef}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete booking');
    return await res.json();
}

async function seedDemoData() {
    try {
        const res = await fetch(`${API}/seed`);
        return await res.json();
    } catch (err) {
        console.error('Seed error:', err);
    }
}

/* ── Client-side Helpers (computed from bookings array) ── */
function assignTable(date, time, guests) {
    /* Used only for local UI previews — server does the real assignment */
    return null;
}

function getVacancy(date, time, bookings = []) {
    const active = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'rejected');
    const bookedIds = active
        .filter(b => b.date === date && (time ? b.time === time : true))
        .map(b => b.tableId);
    const booked = [...new Set(bookedIds)].length;
    return {
        total: TOTAL_TABLES,
        booked,
        available: TOTAL_TABLES - booked,
        bookedTableIds: [...new Set(bookedIds)],
    };
}

function getTodayStats(bookings = []) {
    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter(b => b.date === today && b.status !== 'cancelled');
    const totalAdvance = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.totalAdvance || 0), 0);
    return {
        total: bookings.length,
        todayCount: todayBookings.length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        totalAdvance,
    };
}
