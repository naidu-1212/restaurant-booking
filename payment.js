/* ===================================================
   payment.js – Hungry Hub Payment Page Logic
   =================================================== */

/* ── Load booking data from sessionStorage ── */
const booking = JSON.parse(sessionStorage.getItem('hungryHubBooking') || '{}');

// If no booking found, redirect back to reserve page
if (!booking.firstName) {
  window.location.href = 'reserve.html';
}

/* ── Populate booking summary ── */
const summaryBody = document.getElementById('summaryBody');
const summaryAmount = document.getElementById('summaryAmount');

if (summaryBody && booking.firstName) {
  const occasionMap = { birthday: '🎂 Birthday', anniversary: '💍 Anniversary', family: '👨‍👩‍👧 Family Gathering', business: '💼 Business Lunch', other: 'Special Event' };
  const occasionLabel = booking.occasion ? (occasionMap[booking.occasion] || booking.occasion) : '';

  summaryBody.innerHTML = `
    <div class="summary-row">
      <span class="summary-label"><i class="fas fa-user"></i> Guest Name</span>
      <span class="summary-value">${booking.firstName} ${booking.lastName}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label"><i class="fas fa-calendar"></i> Date</span>
      <span class="summary-value">${booking.dateFormatted}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label"><i class="fas fa-clock"></i> Time</span>
      <span class="summary-value">${booking.time}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label"><i class="fas fa-users"></i> Guests</span>
      <span class="summary-value">${booking.guests} Guest${booking.guests > 1 ? 's' : ''}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label"><i class="fas fa-envelope"></i> Email</span>
      <span class="summary-value">${booking.email}</span>
    </div>
    ${occasionLabel ? `<div class="summary-row"><span class="summary-label"><i class="fas fa-star"></i> Occasion</span><span class="summary-value">${occasionLabel}</span></div>` : ''}
    <div class="summary-row">
      <span class="summary-label"><i class="fas fa-hashtag"></i> Booking Ref</span>
      <span class="summary-value summary-ref">${booking.bookingRef}</span>
    </div>
  `;

  summaryAmount.innerHTML = `
    <div class="amount-breakdown">
      <div class="amount-row">
        <span>₹${booking.advancePerPerson} × ${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span>
        <span>₹${booking.totalAdvance}</span>
      </div>
      <div class="amount-row total-row">
        <span>Advance Amount Due</span>
        <span class="total-price">₹${booking.totalAdvance}</span>
      </div>
      <p class="amount-note">This advance will be deducted from your final bill at the restaurant.</p>
    </div>
  `;

  // Update pay button with amount
  const payBtnText = document.getElementById('payBtnText');
  if (payBtnText) payBtnText.textContent = `Pay ₹${booking.totalAdvance}`;
}

/* ── Payment Method Tabs ── */
const payTabs = document.querySelectorAll('.pay-tab');
const payPanels = document.querySelectorAll('.pay-panel');

payTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    payTabs.forEach(t => t.classList.remove('active'));
    payPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + tab.dataset.method);
    if (panel) panel.classList.add('active');
  });
});

/* ── Card Number Formatting ── */
const cardNumInput = document.getElementById('cardNum');
if (cardNumInput) {
  cardNumInput.addEventListener('input', () => {
    let v = cardNumInput.value.replace(/\D/g, '').slice(0, 16);
    cardNumInput.value = v.replace(/(.{4})/g, '$1  ').trim();
  });
}

const cardExpiryInput = document.getElementById('cardExpiry');
if (cardExpiryInput) {
  cardExpiryInput.addEventListener('input', () => {
    let v = cardExpiryInput.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
    cardExpiryInput.value = v;
  });
}

/* ── Pay Button Logic ── */
const payBtn = document.getElementById('payBtn');
const successModal = document.getElementById('paymentSuccessModal');

function getActiveMethod() {
  const activeTab = document.querySelector('.pay-tab.active');
  return activeTab ? activeTab.dataset.method : 'upi';
}

function validatePayment(method) {
  let valid = true;
  // Clear previous errors
  document.querySelectorAll('.pay-panel .error-msg').forEach(el => el.textContent = '');

  if (method === 'upi') {
    const upiId = document.getElementById('upiId').value.trim();
    if (!upiId || !/^[\w.\-]+@[\w]+$/.test(upiId)) {
      document.getElementById('err-upi').textContent = 'Please enter a valid UPI ID (e.g. name@upi)';
      valid = false;
    }
  } else if (method === 'card') {
    const cardNum = document.getElementById('cardNum').value.replace(/\s/g, '');
    const expiry = document.getElementById('cardExpiry').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();
    const cardName = document.getElementById('cardName').value.trim();
    if (cardNum.length < 12) { document.getElementById('err-cardNum').textContent = 'Enter a valid card number.'; valid = false; }
    if (expiry.replace(/\D/g, '').length < 4) { document.getElementById('err-cardExpiry').textContent = 'Enter expiry as MM / YY.'; valid = false; }
    if (cvv.length < 3) { document.getElementById('err-cardCvv').textContent = 'Enter a valid CVV.'; valid = false; }
    if (!cardName) { document.getElementById('err-cardName').textContent = 'Name on card is required.'; valid = false; }
  } else if (method === 'netbanking') {
    const bank = document.getElementById('bankSelect').value;
    if (!bank) { document.getElementById('err-bank').textContent = 'Please select your bank.'; valid = false; }
  }
  return valid;
}

if (payBtn) {
  payBtn.addEventListener('click', async () => {
    const method = getActiveMethod();
    if (!validatePayment(method)) return;

    payBtn.disabled = true;
    document.getElementById('payBtnText').textContent = 'Processing Payment...';
    document.getElementById('payBtnIcon').className = 'fas fa-spinner fa-spin';

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      // Save booking to database via API
      const savedBooking = await saveBooking(booking);

      if (successModal) {
        document.getElementById('successRef').innerHTML = `
          <div class="ref-badge">Booking Ref: ${savedBooking.bookingRef}</div>
        `;
        document.getElementById('successMsg').textContent =
          `Thank you, ${savedBooking.firstName}! Your booking request for ${savedBooking.guests} guest${savedBooking.guests > 1 ? 's' : ''} on ${savedBooking.dateFormatted} at ${savedBooking.time} has been received.`;
        document.getElementById('successDetails').innerHTML = `
          <div class="success-row"><i class="fas fa-hourglass-half"></i> Status: <strong style="color:var(--gold)">Awaiting Admin Confirmation</strong></div>
          <div class="success-row"><i class="fas fa-rupee-sign"></i> Advance Paid (Refundable): <strong>₹${savedBooking.totalAdvance}</strong></div>
          <div class="success-row"><i class="fas fa-envelope"></i> Confirmation will be sent to: <strong>${savedBooking.email}</strong></div>
          <div class="success-row"><i class="fas fa-info-circle"></i> Balance payable at restaurant after confirmation.</div>
        `;
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        sessionStorage.removeItem('hungryHubBooking');
        sessionStorage.removeItem('preSelectedTableId');
        sessionStorage.removeItem('preSelectedTableLabel');
      }
    } catch (err) {
      console.error('Payment/save error:', err);
      document.getElementById('payBtnText').textContent = 'Pay Now';
      document.getElementById('payBtnIcon').className = 'fas fa-lock';
      payBtn.disabled = false;
      alert('Could not save booking. Please ensure the server is running and try again.');
    }
  });
}

// Close modal on background click
if (successModal) {
  successModal.addEventListener('click', e => {
    if (e.target === successModal) {
      successModal.classList.remove('active');
      document.body.style.overflow = '';
      window.location.href = 'index.html';
    }
  });
}

// Home button
const goHomeBtn = document.getElementById('goHomeBtn');
if (goHomeBtn) {
  goHomeBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}
