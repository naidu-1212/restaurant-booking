/* ===================================================
   server.js – Express REST API for Hungry Hub
   Port: 3001
   =================================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const {
    getAllBookings,
    getBookingByRef,
    insertBooking,
    updateBookingStatus,
    deleteBooking,
    isEmpty,
    getUserByEmail,
    insertUser
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

/* ─────────────────────────────────────────────────────
   Table config (mirrors data.js HH_TABLES)
───────────────────────────────────────────────────── */
const HH_TABLES = [
    { id: 1, capacity: 2, label: 'T01', section: 'Indoor' },
    { id: 2, capacity: 2, label: 'T02', section: 'Indoor' },
    { id: 3, capacity: 2, label: 'T03', section: 'Indoor' },
    { id: 4, capacity: 2, label: 'T04', section: 'Indoor' },
    { id: 5, capacity: 2, label: 'T05', section: 'Indoor' },
    { id: 6, capacity: 4, label: 'T06', section: 'Indoor' },
    { id: 7, capacity: 4, label: 'T07', section: 'Indoor' },
    { id: 8, capacity: 4, label: 'T08', section: 'Indoor' },
    { id: 9, capacity: 4, label: 'T09', section: 'Indoor' },
    { id: 10, capacity: 4, label: 'T10', section: 'Indoor' },
    { id: 11, capacity: 6, label: 'T11', section: 'Indoor' },
    { id: 12, capacity: 6, label: 'T12', section: 'Indoor' },
    { id: 13, capacity: 6, label: 'T13', section: 'Indoor' },
    { id: 14, capacity: 6, label: 'T14', section: 'Indoor' },
    { id: 15, capacity: 2, label: 'T15', section: 'Outdoor' },
    { id: 16, capacity: 2, label: 'T16', section: 'Outdoor' },
    { id: 17, capacity: 2, label: 'T17', section: 'Outdoor' },
    { id: 18, capacity: 4, label: 'T18', section: 'Outdoor' },
    { id: 19, capacity: 4, label: 'T19', section: 'Outdoor' },
    { id: 20, capacity: 4, label: 'T20', section: 'Outdoor' },
];

function assignTable(date, time, guests) {
    const all = getAllBookings().filter(b => b.status !== 'cancelled' && b.status !== 'rejected');
    const bookedIds = all
        .filter(b => b.date === date && b.time === time)
        .map(b => b.tableId);
    const suitable = HH_TABLES.filter(t => t.capacity >= guests && !bookedIds.includes(t.id));
    return suitable.length > 0 ? suitable[0] : null;
}

/* ─────────────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────────────── */

// GET /api/bookings — return all bookings
app.get('/api/bookings', (_req, res) => {
    try {
        res.json(getAllBookings());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/bookings — create a new booking
app.post('/api/bookings', (req, res) => {
    try {
        const b = req.body;
        if (!b.bookingRef || !b.firstName || !b.email || !b.date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Only auto-assign table if not pre-selected
        let tableId = b.tableId || null;
        let tableLabel = b.tableLabel || 'TBD';
        if (!tableId) {
            const assigned = assignTable(b.date, b.time, parseInt(b.guests));
            if (assigned) { tableId = assigned.id; tableLabel = assigned.label; }
        }

        const record = {
            bookingRef: b.bookingRef,
            firstName: b.firstName,
            lastName: b.lastName || '',
            email: b.email,
            phone: b.phone || '',
            date: b.date,
            dateFormatted: b.dateFormatted || b.date,
            time: b.time,
            guests: parseInt(b.guests),
            occasion: b.occasion || '',
            requests: b.requests || '',
            advancePerPerson: b.advancePerPerson || 199,
            totalAdvance: b.totalAdvance || 0,
            status: 'pending',
            tableId,
            tableLabel,
            bookedAt: new Date().toISOString(),
        };

        insertBooking(record);
        res.status(201).json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/bookings/:ref/status — update booking status (accept/reject/complete/cancel)
app.patch('/api/bookings/:ref/status', (req, res) => {
    try {
        const { ref } = req.params;
        const { status } = req.body;
        const allowed = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = getBookingByRef(ref);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Rejection → permanently delete the booking
        if (status === 'rejected') {
            deleteBooking(ref);
            return res.json({ deleted: true, bookingRef: ref });
        }

        let tableId = booking.tableId;
        let tableLabel = booking.tableLabel;

        // Auto-assign table on acceptance if none assigned
        if (status === 'confirmed' && !tableId) {
            const assigned = assignTable(booking.date, booking.time, booking.guests);
            if (assigned) { tableId = assigned.id; tableLabel = assigned.label; }
        }

        updateBookingStatus(ref, status, tableId, tableLabel);
        res.json({ ...booking, status, tableId, tableLabel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/bookings/:ref — permanently delete a booking
app.delete('/api/bookings/:ref', (req, res) => {
    try {
        const { ref } = req.params;
        const deleted = deleteBooking(ref);
        if (deleted) {
            res.json({ deleted: true, bookingRef: ref });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/signup — register a user
app.post('/api/signup', (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

        let user = getUserByEmail(email);
        if (user) return res.status(400).json({ error: 'User already exists' });

        user = { email, password, name, createdAt: new Date().toISOString() };
        insertUser(user);

        // Remove password before sending
        const { password: _, ...userData } = user;
        res.status(201).json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/login — authenticate a user
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

        const user = getUserByEmail(email);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { password: _, ...userData } = user;
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:email/bookings — get bookings for a specific user
app.get('/api/users/:email/bookings', (req, res) => {
    try {
        const email = req.params.email;
        const bookings = getAllBookings().filter(b => b.email === email);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/seed — seed demo data (only if DB is empty)
app.get('/api/seed', (_req, res) => {
    try {
        if (!isEmpty()) return res.json({ seeded: false, message: 'Already has data' });

        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const demos = [
            { bookingRef: 'HH100001', firstName: 'Arjun', lastName: 'Kumar', email: 'arjun@demo.com', phone: '9840011111', date: today, dateFormatted: fmt(today), time: '7:00 PM', guests: 2, occasion: 'anniversary', requests: 'Window seat please', advancePerPerson: 199, totalAdvance: 398, status: 'confirmed', tableId: 6, tableLabel: 'T06' },
            { bookingRef: 'HH100002', firstName: 'Priya', lastName: 'Sharma', email: 'priya@demo.com', phone: '9840022222', date: today, dateFormatted: fmt(today), time: '8:00 PM', guests: 4, occasion: 'birthday', requests: 'Birthday cake', advancePerPerson: 199, totalAdvance: 796, status: 'confirmed', tableId: 7, tableLabel: 'T07' },
            { bookingRef: 'HH100003', firstName: 'Vikram', lastName: 'Nair', email: 'vikram@demo.com', phone: '9840033333', date: today, dateFormatted: fmt(today), time: '1:00 PM', guests: 6, occasion: 'family', requests: '', advancePerPerson: 199, totalAdvance: 1194, status: 'completed', tableId: 11, tableLabel: 'T11' },
            { bookingRef: 'HH100004', firstName: 'Kavitha', lastName: 'Reddy', email: 'kav@demo.com', phone: '9840044444', date: tomorrow, dateFormatted: fmt(tomorrow), time: '7:30 PM', guests: 2, occasion: '', requests: 'Outdoor preferred', advancePerPerson: 199, totalAdvance: 398, status: 'confirmed', tableId: 15, tableLabel: 'T15' },
            { bookingRef: 'HH100005', firstName: 'Murugan', lastName: 'Pillai', email: 'muru@demo.com', phone: '9840055555', date: tomorrow, dateFormatted: fmt(tomorrow), time: '12:00 PM', guests: 3, occasion: 'business', requests: '', advancePerPerson: 199, totalAdvance: 597, status: 'confirmed', tableId: 8, tableLabel: 'T08' },
            { bookingRef: 'HH100006', firstName: 'Sneha', lastName: 'Menon', email: 'sneha@demo.com', phone: '9840066666', date: today, dateFormatted: fmt(today), time: '7:00 PM', guests: 2, occasion: '', requests: 'Allergy: peanuts', advancePerPerson: 199, totalAdvance: 398, status: 'cancelled', tableId: null, tableLabel: 'N/A' },
            { bookingRef: 'HH100007', firstName: 'Ravi', lastName: 'Shankar', email: 'ravi@demo.com', phone: '9840077777', date: today, dateFormatted: fmt(today), time: '8:30 PM', guests: 2, occasion: '', requests: 'Near window', advancePerPerson: 199, totalAdvance: 398, status: 'pending', tableId: null, tableLabel: 'TBD' },
            { bookingRef: 'HH100008', firstName: 'Deepa', lastName: 'Iyer', email: 'deepa@demo.com', phone: '9840088888', date: tomorrow, dateFormatted: fmt(tomorrow), time: '7:00 PM', guests: 4, occasion: 'birthday', requests: 'Surprise cake', advancePerPerson: 199, totalAdvance: 796, status: 'pending', tableId: null, tableLabel: 'TBD' },
        ];

        demos.forEach(d => insertBooking({ ...d, bookedAt: new Date().toISOString() }));
        res.json({ seeded: true, count: demos.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: 'bookings.db' }));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/* ─────────────────────────────────────────────────────
   START
───────────────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`\n🍛 Hungry Hub API running at http://localhost:${PORT}`);
    console.log(`   Bookings DB: bookings.db\n`);
});
