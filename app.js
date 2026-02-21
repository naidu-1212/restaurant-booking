/* ===================================================
   app.js – Hungry Hub Restaurant Booking Logic
   South Indian & Fast Food Multi-page version
   =================================================== */

/* ── Navbar hamburger ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
if (navbar && !navbar.classList.contains('scrolled')) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

/* ── Menu Data ── */
const menuData = {
  southindian: [
    { name: 'Masala Dosa', desc: 'Crispy golden crepe filled with spiced potato masala, served with sambar & three chutneys.', price: '₹149', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Ghee Roast Dosa', desc: 'Paper-thin dosa loaded with generous ghee, served with coconut chutney & sambar.', price: '₹169', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Idli Sambar (4 pcs)', desc: 'Soft steamed rice cakes with piping hot sambar, coconut & tomato chutney.', price: '₹99', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Chettinad Chicken Curry', desc: 'Aromatic South Indian curry with freshly ground spices, curry leaves & coconut milk.', price: '₹299', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Kerala Fish Curry', desc: 'Tender fish pieces simmered in a tangy coconut-Kodampuli gravy. Served with rice.', price: '₹349', tag: 'spicy', tagLabel: 'Spicy' },
    { name: 'Veg Biryani', desc: 'Fragrant basmati rice layered with seasonal vegetables, fried onions & saffron. Served with raita.', price: '₹199', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Mutton Biryani', desc: 'Slow-cooked tender mutton with long-grain basmati, caramelised onions & aromatic spices.', price: '₹399', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Medu Vada (3 pcs)', desc: 'Crispy fried lentil doughnuts with a soft centre, served with sambar & chutney.', price: '₹79', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Paneer Butter Masala', desc: 'Cottage cheese cubes in a rich, creamy tomato-cashew gravy. Served with parotta.', price: '₹249', tag: 'veg', tagLabel: 'Vegetarian' },
  ],
  fastfood: [
    { name: 'Margherita Pizza', desc: 'Classic hand-tossed base with San Marzano tomato sauce, fresh mozzarella & basil.', price: '₹349', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Spicy Paneer Pizza', desc: 'Tangy tomato base with paneer tikka, onions, peppers & jalapeños. Extra spicy!', price: '₹399', tag: 'spicy', tagLabel: 'Spicy' },
    { name: 'Chicken BBQ Pizza', desc: 'BBQ-sauced base with grilled chicken chunks, red onions & smoked cheddar.', price: '₹449', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Classic Veg Burger', desc: 'Crispy aloo tikki patty, cheddar cheese, lettuce, tomato & house sauce in a brioche bun.', price: '₹179', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Chicken Zinger Burger', desc: 'Crispy spiced chicken fillet, coleslaw, pickles & chipotle mayo in a toasted sesame bun.', price: '₹229', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Loaded Fries', desc: 'Golden fries topped with melted cheese, jalapeños, sour cream & peri-peri seasoning.', price: '₹149', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Pasta Arrabbiata', desc: 'Penne in a spicy tomato-garlic sauce with fresh herbs & a parmesan finish.', price: '₹249', tag: 'spicy', tagLabel: 'Spicy' },
    { name: 'Crispy Chicken Wings (6 pcs)', desc: 'Double-fried wings tossed in choice of buffalo, honey-garlic or schezwan sauce.', price: '₹299', tag: 'chef', tagLabel: "Chef's Fav" },
  ],
  desserts: [
    { name: 'Gulab Jamun (2 pcs)', desc: 'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup, served warm.', price: '₹89', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Rava Kesari', desc: 'Traditional South Indian semolina pudding with ghee, cashews, raisins & saffron.', price: '₹99', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Payasam', desc: 'Kerala-style vermicelli kheer slow-cooked in coconut milk with cardamom & jaggery.', price: '₹119', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Mango Lassi', desc: 'Thick blended Alphonso mango with chilled yoghurt, a pinch of cardamom & saffron.', price: '₹99', tag: 'veg', tagLabel: 'Vegetarian' },
    { name: 'Chocolate Brownie Sundae', desc: 'Warm fudge brownie, two scoops of vanilla ice cream, chocolate sauce & hazelnuts.', price: '₹229', tag: 'chef', tagLabel: "Chef's Fav" },
    { name: 'Filter Coffee', desc: 'Authentic South Indian decoction coffee served in a traditional dabarah-tumbler set.', price: '₹59', tag: 'veg', tagLabel: 'Vegetarian' },
  ]
};

/* ── Render Menu ── */
const menuGrid = document.getElementById('menuGrid');
const tabs = document.querySelectorAll('.menu-tab');

if (menuGrid) {
  function renderMenu(category) {
    menuGrid.innerHTML = '';
    menuData[category].forEach((item, i) => {
      const tagHtml = item.tag
        ? `<span class="menu-tag tag-${item.tag}">${item.tagLabel}</span>`
        : '';
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.style.animationDelay = `${i * 0.07}s`;
      card.innerHTML = `
        <div class="menu-card-header">
          <h3>${item.name}</h3>
          <span class="menu-price">${item.price}</span>
        </div>
        <p>${item.desc}</p>
        ${tagHtml}
      `;
      menuGrid.appendChild(card);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMenu(tab.dataset.category);
    });
  });

  renderMenu('southindian');
}

/* ── Time Slots ── */
const timeSlots = [
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM'
];
const unavailableSlots = ['12:30 PM', '8:00 PM'];
let selectedTime = '';

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  container.innerHTML = '';
  timeSlots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot' + (unavailableSlots.includes(slot) ? ' unavailable' : '');
    btn.textContent = slot;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime = slot;
      document.getElementById('err-time').textContent = '';
    });
    container.appendChild(btn);
  });
}

if (document.getElementById('timeSlots')) renderTimeSlots();

/* ── Date Minimum (today) ── */
const dateInput = document.getElementById('date');
if (dateInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

/* ── Pre-fill: read table pre-selection set by reserve.html inline script ── */
let preSelectedTableId = sessionStorage.getItem('preSelectedTableId')
  ? parseInt(sessionStorage.getItem('preSelectedTableId')) : null;
let preSelectedTableLabel = sessionStorage.getItem('preSelectedTableLabel') || null;

/* ── Form Validation & Submission (Booking) ── */
const form = document.getElementById('bookingForm');

if (form) {
  const userData = sessionStorage.getItem('hhUserAuth');
  if (!userData) {
    alert("Please sign in or create an account to reserve a table.");
    window.location.href = 'user.html';
  } else {
    try {
      const user = JSON.parse(userData);
      const emailEl = document.getElementById('email');
      const fnameEl = document.getElementById('firstName');
      const lnameEl = document.getElementById('lastName');

      if (emailEl) {
        emailEl.value = user.email;
        emailEl.readOnly = true;
        // Make it look uneditable visually
        emailEl.style.backgroundColor = 'rgba(255,255,255,0.01)';
        emailEl.style.color = '#888';
      }

      if (user.name) {
        const parts = user.name.split(' ');
        if (fnameEl && !fnameEl.value) fnameEl.value = parts[0];
        if (lnameEl && !lnameEl.value && parts.length > 1) lnameEl.value = parts.slice(1).join(' ');
      }
    } catch (e) { }
  }
}

function showError(fieldId, message) {
  const el = document.getElementById('err-' + fieldId);
  if (el) el.textContent = message;
  const input = document.getElementById(fieldId);
  if (input) input.classList.add('error');
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('date').value;
    const guests = document.getElementById('guests').value;

    let valid = true;
    if (!firstName) { showError('firstName', 'First name is required.'); valid = false; }
    if (!lastName) { showError('lastName', 'Last name is required.'); valid = false; }
    if (!email || !validateEmail(email)) { showError('email', 'Please enter a valid email address.'); valid = false; }
    if (!phone || !validatePhone(phone)) { showError('phone', 'Please enter a valid phone number.'); valid = false; }
    if (!date) { showError('date', 'Please select a date.'); valid = false; }
    if (!guests) { showError('guests', 'Please select number of guests.'); valid = false; }
    if (!selectedTime) { document.getElementById('err-time').textContent = 'Please select a time slot.'; valid = false; }

    if (!valid) {
      const firstError = form.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    btn.disabled = true;
    btnText.textContent = 'Processing...';
    btnIcon.className = 'fas fa-spinner fa-spin';

    // Save booking details to sessionStorage and redirect to payment page
    const numGuests = parseInt(guests);
    const advancePerPerson = 199;
    const bookingData = {
      firstName, lastName, email, phone, date, guests: numGuests, time: selectedTime,
      occasion: document.getElementById('occasion') ? document.getElementById('occasion').value : '',
      requests: document.getElementById('requests') ? document.getElementById('requests').value.trim() : '',
      dateFormatted: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      advancePerPerson,
      totalAdvance: numGuests * advancePerPerson,
      bookingRef: 'HH' + Date.now().toString().slice(-6),
      // Preserve pre-selected table if customer chose one from floor plan
      ...(preSelectedTableId ? { tableId: preSelectedTableId, tableLabel: preSelectedTableLabel } : {}),
    };
    sessionStorage.setItem('hungryHubBooking', JSON.stringify(bookingData));
    // Clear pre-selection so it doesn't persist to future visits
    sessionStorage.removeItem('preSelectedTableId');
    sessionStorage.removeItem('preSelectedTableLabel');

    setTimeout(() => { window.location.href = 'payment.html'; }, 800);
  });
}

/* ── Modal (Booking) ── */
const modal = document.getElementById('successModal');
function openModal() { if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; } }
function closeModal() { if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } }

const modalCloseBtn = document.getElementById('modalClose');
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

/* ── Contact Form ── */
const contactForm = document.getElementById('contactForm');
const contactModal = document.getElementById('contactModal');

if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    const btnText = document.getElementById('cBtnText');
    const btnIcon = document.getElementById('cBtnIcon');
    btn.disabled = true;
    btnText.textContent = 'Sending...';
    btnIcon.className = 'fas fa-spinner fa-spin';
    setTimeout(() => {
      btn.disabled = false;
      btnText.textContent = 'Send Message';
      btnIcon.className = 'fas fa-paper-plane';
      contactModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      contactForm.reset();
    }, 1200);
  });
}

const contactModalClose = document.getElementById('contactModalClose');
if (contactModalClose) {
  contactModalClose.addEventListener('click', () => {
    contactModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}
if (contactModal) {
  contactModal.addEventListener('click', e => {
    if (e.target === contactModal) {
      contactModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ── Testimonials Slider ── */
const testimonials = [
  { text: "The Masala Dosa at Hungry Hub is the best I've had outside of Chennai! Crispy, perfectly spiced potato filling and the sambar is incredibly flavourful. A true taste of home.", name: 'Priya R.', location: 'Bengaluru', initials: 'PR', stars: 5 },
  { text: "We came for a birthday dinner and the Mutton Biryani blew everyone away. Perfectly cooked, aromatic and generous portions. The staff were warm and attentive — will definitely return!", name: 'Arjun K.', location: 'Chennai', initials: 'AK', stars: 5 },
  { text: "Ordered the Spicy Paneer Pizza and Chettinad Chicken together — what a combination! Hungry Hub truly does both South Indian and fast food brilliantly. Highly recommended.", name: 'Sneha M.', location: 'Hyderabad', initials: 'SM', stars: 5 },
  { text: "The Kerala Fish Curry brought tears to my eyes — reminded me of my grandmother's cooking. Authentic flavours, fresh fish and the coconut gravy is divine. Amazing place!", name: 'Rajan N.', location: 'Kochi', initials: 'RN', stars: 5 },
  { text: "Brought my whole family here on a Sunday. Everyone found something they loved — kids went for the loaded fries and burgers while we enjoyed the thali and filter coffee. Brilliant menu!", name: 'Kavitha S.', location: 'Coimbatore', initials: 'KS', stars: 5 },
  { text: "The Payasam and Rava Kesari desserts are absolutely heavenly. Ended our meal with a traditional filter coffee served in a dabarah — it was the perfect authentic touch. Loved it!", name: 'Vikram T.', location: 'Madurai', initials: 'VT', stars: 5 },
];

const track = document.getElementById('testimonialsInner');
const dotsContainer = document.getElementById('testimonialsDots');

if (track) {
  let currentSlide = 0;
  const visibleSlides = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

  function renderTestimonials() {
    track.innerHTML = '';
    testimonials.forEach(t => {
      const stars = '★'.repeat(t.stars);
      const card = document.createElement('div');
      card.className = 'testimonial-card';
      card.innerHTML = `
        <div class="testimonial-inner">
          <div class="t-stars">${stars}</div>
          <p class="t-text">"${t.text}"</p>
          <div class="t-author">
            <div class="t-avatar">${t.initials}</div>
            <div>
              <div class="t-name">${t.name}</div>
              <div class="t-location">${t.location}</div>
            </div>
          </div>
        </div>
      `;
      track.appendChild(card);
    });
  }

  function renderDots() {
    const numDots = Math.ceil(testimonials.length / visibleSlides());
    dotsContainer.innerHTML = '';
    for (let i = 0; i < numDots; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === currentSlide ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
    document.querySelectorAll('.testimonial-card').forEach(c => {
      c.style.minWidth = `calc(100% / ${visibleSlides()})`;
    });
  }

  function goToSlide(index) {
    const numDots = Math.ceil(testimonials.length / visibleSlides());
    currentSlide = Math.max(0, Math.min(index, numDots - 1));
    const pct = (currentSlide * visibleSlides()) * (100 / testimonials.length);
    track.style.transform = `translateX(-${pct}%)`;
    renderDots();
  }

  renderTestimonials();
  renderDots();

  let autoSlide = setInterval(() => {
    const numDots = Math.ceil(testimonials.length / visibleSlides());
    goToSlide((currentSlide + 1) % numDots);
  }, 5000);

  track.addEventListener('mouseenter', () => clearInterval(autoSlide));
  track.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => {
      const numDots = Math.ceil(testimonials.length / visibleSlides());
      goToSlide((currentSlide + 1) % numDots);
    }, 5000);
  });

  window.addEventListener('resize', () => { renderDots(); goToSlide(0); });
}

/* ── Full Reviews Grid ── */
const reviewsFullGrid = document.getElementById('reviewsFullGrid');
if (reviewsFullGrid) {
  testimonials.forEach(t => {
    const stars = '★'.repeat(t.stars);
    const card = document.createElement('div');
    card.className = 'review-full-card';
    card.innerHTML = `
      <div class="t-stars">${stars}</div>
      <p class="t-text">"${t.text}"</p>
      <div class="t-author">
        <div class="t-avatar">${t.initials}</div>
        <div>
          <div class="t-name">${t.name}</div>
          <div class="t-location">${t.location}</div>
        </div>
      </div>
    `;
    reviewsFullGrid.appendChild(card);
  });
}

/* ── Intersection Observer (scroll-reveal) ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.feature, .binfo-item, .about-content, .about-image-wrap, .booking-left, .quick-card, .contact-card, .chef-stat-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  observer.observe(el);
});
