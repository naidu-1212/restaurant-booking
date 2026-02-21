/* ===================================================
   user.js – Hungry Hub User Dashboard (async/DB)
   =================================================== */

const API = 'http://localhost:3001/api';
const SESSION_USER_KEY = 'hhUserAuth';

document.addEventListener('DOMContentLoaded', () => {
    checkUserAuth();
});

function switchAuthTab(tab) {
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('tabSignup').classList.remove('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('authError').textContent = '';

    if (tab === 'login') {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('tabSignup').classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    document.getElementById('authError').textContent = '';

    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(data));
        showDashboard(data);
    } catch (err) {
        document.getElementById('authError').textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const btn = document.getElementById('signupBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    document.getElementById('authError').textContent = '';

    try {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        const res = await fetch(`${API}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');

        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(data));
        showDashboard(data);
    } catch (err) {
        document.getElementById('authError').textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

function handleLogout() {
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';

    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    switchAuthTab('login');
}

function checkUserAuth() {
    const userData = sessionStorage.getItem(SESSION_USER_KEY);
    if (userData) {
        showDashboard(JSON.parse(userData));
    }
}

async function showDashboard(user) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('userName').textContent = user.name;

    await fetchAndRenderBookings(user.email);
}

function statusBadge(status) {
    const colors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        completed: '#10b981',
        cancelled: '#ef4444',
        rejected: '#ef4444'
    };
    return `<span style="padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 500; text-transform: capitalize; background: rgba(255,255,255,0.1); color: ${colors[status] || '#ccc'}">${status}</span>`;
}

async function fetchAndRenderBookings(email) {
    const list = document.getElementById('bookingsList');
    list.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top: 16px;">Loading your reservations...</p></div>`;

    try {
        const res = await fetch(`${API}/users/${email}/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');

        const bookings = await res.json();

        if (!bookings || bookings.length === 0) {
            list.innerHTML = `
                <div class="empty-dashboard" style="text-align: center; padding: 40px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>You haven't made any reservations yet.</p>
                    <a href="reserve.html" class="btn btn-primary" style="margin-top: 16px; display: inline-block;">Book a Table</a>
                </div>
            `;
            return;
        }

        // Sort descending by date/time ideally, but usually backend returns descending
        list.innerHTML = bookings.map(b => `
            <div class="booking-card">
                <div class="status-badge">${statusBadge(b.status)}</div>
                <div class="booking-header">
                    <i class="fas fa-utensils" style="color: var(--primary);"></i>
                    <h3>Reservation for ${b.guests} Guests</h3>
                </div>
                <div class="booking-details">
                    <div>
                        <strong>Date & Time</strong>
                        <i class="far fa-calendar-alt"></i> ${b.dateFormatted || b.date}<br>
                        <i class="far fa-clock"></i> ${b.time}
                    </div>
                    <div>
                        <strong>Details</strong>
                        <i class="fas fa-hashtag"></i> Ref: ${b.bookingRef}<br>
                        <i class="fas fa-chair"></i> Table: ${b.tableLabel || 'Pending'}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        list.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 16px;"></i><p>Error loading reservations: ${err.message}</p></div>`;
    }
}
