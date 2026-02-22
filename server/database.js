/* ===================================================
   database.js – Lightweight JSON flat-file database
   No native dependencies — just Node.js fs module
   Data stored in: bookings.json
   =================================================== */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'bookings.json');
const USERS_FILE = path.join(__dirname, 'users.json');

/* ── Read / Write helpers ── */
function readDB() {
  if (!fs.existsSync(DB_FILE)) return { bookings: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { bookings: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readUsersDB() {
  if (!fs.existsSync(USERS_FILE)) return { users: [] };
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return { users: [] };
  }
}

function writeUsersDB(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/* ── Public API ── */
function getAllBookings() {
  const db = readDB();
  return db.bookings.slice().reverse(); // newest first
}

function getBookingByRef(ref) {
  return readDB().bookings.find(b => b.bookingRef === ref) || null;
}

function insertBooking(booking) {
  const db = readDB();
  db.bookings.push(booking);
  writeDB(db);
  return booking;
}

function updateBookingStatus(ref, status, tableId, tableLabel) {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.bookingRef === ref);
  if (idx === -1) return null;
  const existing = db.bookings[idx];
  db.bookings[idx] = {
    ...existing,
    status,
    tableId: tableId ?? existing.tableId ?? null,
    tableLabel: tableLabel ?? existing.tableLabel ?? 'TBD',
  };
  writeDB(db);
  return db.bookings[idx];
}

function deleteBooking(ref) {
  const db = readDB();
  const len = db.bookings.length;
  db.bookings = db.bookings.filter(b => b.bookingRef !== ref);
  if (db.bookings.length < len) { writeDB(db); return true; }
  return false;
}

function isEmpty() {
  return readDB().bookings.length === 0;
}

function getUserByEmail(email) {
  return readUsersDB().users.find(u => u.email === email) || null;
}

function insertUser(user) {
  const db = readUsersDB();
  db.users.push(user);
  writeUsersDB(db);
  return user;
}

module.exports = {
  getAllBookings, getBookingByRef, insertBooking, updateBookingStatus, deleteBooking, isEmpty,
  getUserByEmail, insertUser
};
