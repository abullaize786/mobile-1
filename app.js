/**
 * AgriRide Main Dashboard Logic - Home, Bookings, Alerts, Profile
 * Synchronizes with local storage to capture bookings and alerts from the booking flow.
 */

// Default data sets
const defaultBookings = [];

const defaultAlerts = [
  {
    id: 1,
    title: 'Feedback Requested',
    message: 'How was your booking AR-84729 for JCB? Share your feedback now.',
    time: '2 days ago',
    unread: false
  },
  {
    id: 2,
    title: 'Discount Alert! 🚜',
    message: 'Get 10% off on your next Tractor booking using code FARM10.',
    time: '3 days ago',
    unread: true
  }
];

// App State
let state = {
  currentTab: 'home',
  bookings: [],
  alerts: [],
  selectedLocation: 'Kumbakonam, Tamil Nadu'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (!verifySession()) return;
  initLocalStorage();
  setupEventListeners();
  checkUrlParams();
  applyRoleView();
  fetchStateFromBackend(); // Load and sync from Python server
});

// Session Verification
function verifySession() {
  const role = localStorage.getItem('agriride-role');
  const path = window.location.pathname;
  const isBookingPage = path.includes('booking.html');

  // Auto-set default role if not set (login page removed)
  if (!role) {
    localStorage.setItem('agriride-role', 'farmer');
  }

  if (role === 'worker' && isBookingPage) {
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

// Load records from LocalStorage or seed default data
function initLocalStorage() {
  let storedBookings = localStorage.getItem('agriride_bookings');
  if (!storedBookings) {
    localStorage.setItem('agriride_bookings', JSON.stringify(defaultBookings));
    state.bookings = [...defaultBookings];
  } else {
    state.bookings = JSON.parse(storedBookings);
  }

  let storedAlerts = localStorage.getItem('agriride_alerts');
  if (!storedAlerts) {
    localStorage.setItem('agriride_alerts', JSON.stringify(defaultAlerts));
    state.alerts = [...defaultAlerts];
  } else {
    state.alerts = JSON.parse(storedAlerts);
  }
}

// Check if tab redirect exists in query string
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam && ['home', 'bookings', 'alerts', 'profile', 'analytics'].includes(tabParam)) {
    switchTab(tabParam);
  }
}

// Setup Interaction Handlers
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Location Selector Dropdown Change
  const locSelect = document.getElementById('location-dropdown');
  if (locSelect) {
    locSelect.addEventListener('change', (e) => {
      state.selectedLocation = e.target.value;
    });
    // set initial state from dropdown
    state.selectedLocation = locSelect.value;
  }

  // Cross-tab Synchronization (Real-time updates)
  window.addEventListener('storage', (e) => {
    if (e.key === 'agriride_bookings' || e.key === 'agriride_alerts') {
      reloadFromStorage();
      
      // Show a toast/popup if it was a new alert
      if (e.key === 'agriride_alerts' && state.alerts.length > 0) {
        showToast(state.alerts[0].title + ': ' + state.alerts[0].message);
      }
    }
  });
}

// Simple Toast Notification
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: var(--bg-card); color: var(--text-main);
      padding: 16px 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      border-left: 4px solid var(--primary); z-index: 9999; transform: translateX(120%);
      transition: transform 0.3s ease; max-width: 300px; font-size: 14px;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.transform = 'translateX(0)';
  setTimeout(() => { toast.style.transform = 'translateX(120%)'; }, 4000);
}

// Switch between dashboard views/tabs
function switchTab(tabName) {
  state.currentTab = tabName;
  
  const activeNavTab = tabName === 'booking-details' ? 'bookings' : tabName;

  // Update nav active classes
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-tab') === activeNavTab) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile sidebar active classes
  document.querySelectorAll('#mobile-sidebar .sidebar-nav-item').forEach(link => {
    if (link.getAttribute('data-tab') === activeNavTab) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle Tab Content views
  document.querySelectorAll('.tab-view').forEach(view => {
    if (view.id === `${tabName}-tab`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // If tab is bookings or alerts, reload data from storage to capture background simulation updates
  if (tabName === 'bookings' || tabName === 'alerts') {
    reloadFromStorage();
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('mobile-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  }
}

function handleMobileNav(tabName) {
  toggleMobileSidebar();
  switchTab(tabName);
}

function reloadFromStorage() {
  state.bookings = JSON.parse(localStorage.getItem('agriride_bookings')) || defaultBookings;
  state.alerts = JSON.parse(localStorage.getItem('agriride_alerts')) || defaultAlerts;
  renderBookings();
  renderAlerts();
  updateAlertBadge();
  updateAnalyticsDashboard();
  
  const role = localStorage.getItem('agriride-role');
  if (role === 'worker') {
    renderWorkerJobs();
  }
}

// Fetch all database records from Python backend API
function fetchStateFromBackend() {
  const pBookings = fetch('/api/bookings')
    .then(res => res.json())
    .then(data => {
      state.bookings = data;
      localStorage.setItem('agriride_bookings', JSON.stringify(data));
    });

  const pAlerts = fetch('/api/alerts')
    .then(res => res.json())
    .then(data => {
      state.alerts = data;
      localStorage.setItem('agriride_alerts', JSON.stringify(data));
    });

  return Promise.all([pBookings, pAlerts])
    .then(() => {
      renderBookings();
      renderAlerts();
      updateAlertBadge();
      updateAnalyticsDashboard();
      const role = localStorage.getItem('agriride-role');
      if (role === 'worker') {
        renderWorkerJobs();
      }
    })
    .catch(err => {
      console.warn("Could not sync with Python backend, using offline fallback.", err);
      renderBookings();
      renderAlerts();
      updateAlertBadge();
      updateAnalyticsDashboard();
      const role = localStorage.getItem('agriride-role');
      if (role === 'worker') {
        renderWorkerJobs();
      }
    });
}

// Redirect User to new Standalone Booking Page
function openBookingFlow(machineId) {
  const address = encodeURIComponent(state.selectedLocation);
  let url = 'booking.html';
  if (machineId) {
    url += `?machine=${machineId}&address=${address}`;
  } else {
    url += `?address=${address}`;
  }
  // Navigate to new booking page
  window.location.href = url;
}

// Render Bookings List
function renderBookings() {
  const bookingsGrid = document.getElementById('bookings-grid');
  if (!bookingsGrid) return;
  
  if (state.bookings.length === 0) {
    bookingsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No Bookings Yet</h3>
        <p>Book a tractor or farm machine to get started with your cultivation.</p>
        <button class="sim-btn-primary" style="max-width: 200px; margin-top: 10px;" onclick="switchTab('home')">Book Now</button>
      </div>
    `;
    return;
  }

  bookingsGrid.innerHTML = state.bookings.map(b => `
      <div class="booking-item-card" id="card-${b.id}" style="align-items: flex-start; cursor: pointer;" onclick="openBookingDetails('${b.id}')">
      <img src="${b.image}" class="booking-item-image" alt="${b.machineName}" style="margin-top: 4px;" onerror="this.onerror=null;this.src='assets/tractor.png'">
      <div class="booking-item-details" style="flex: 1;">
        <h4>${b.machineName} Booking</h4>
        <p>📍 Delivery to: <strong>${b.address}</strong></p>
        <div class="booking-meta" style="margin-bottom: 6px;">
          <span>📅 Date: ${b.date}</span>
          <span>⏰ Time: ${b.time}</span>
          <span>⏳ Duration: ${b.duration}</span>
        </div>
        ${b.details ? `<div style="font-size: 13px; color: var(--text-sub); margin-top: 6px; padding: 6px 10px; background: var(--bg-body); border-radius: var(--radius-sm); border-left: 3px solid var(--primary); display: inline-block;">⚙️ <strong>Specs:</strong> ${b.details}</div>` : ''}
        ${b.notes ? `<div style="font-size: 12px; color: var(--text-light); margin-top: 4px; font-style: italic;">"Notes: ${b.notes}"</div>` : ''}
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0;">
        <span style="font-weight: 700; font-size: 16px;">₹${b.price.toLocaleString('en-IN')}</span>
        <span class="booking-status-badge ${b.status}">
          ${capitalizeFirst(b.status)}
        </span>
      </div>
    </div>
  `).join('');
}

window.deleteBooking = function(bookingId) {
  fetch(`/api/bookings/${bookingId}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    fetchStateFromBackend();
  })
  .catch(err => {
    console.error('Error deleting booking:', err);
    state.bookings = state.bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('agriride_bookings', JSON.stringify(state.bookings));
    reloadFromStorage();
  });
};

// Render Alerts List
function renderAlerts() {
  const alertsList = document.getElementById('alerts-list');
  if (!alertsList) return;
  
  if (state.alerts.length === 0) {
    alertsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔔</div>
        <h3>All caught up</h3>
        <p>No new notifications at this time.</p>
      </div>
    `;
    return;
  }

  alertsList.innerHTML = state.alerts.map(a => `
    <div class="alert-item ${a.unread ? 'unread' : ''}" onclick="handleAlertClick(${a.id}, ${a.bookingId ? `'${a.bookingId}'` : 'null'})">
      <div class="alert-icon-wrapper">
        ${a.unread ? '🔵' : '🟢'}
      </div>
      <div class="alert-body">
        <h4 style="display: flex; justify-content: space-between; align-items: center;">
          ${a.title}
        </h4>
        <p>${a.message}</p>
        <span class="alert-time">${a.time}</span>
      </div>
      <div onclick="event.stopPropagation(); deleteAlert(${a.id})" style="padding: 8px; cursor: pointer; color: var(--text-light); font-size: 16px; align-self: flex-start; transition: color 0.2s;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='var(--text-light)'">
        <i class="fa-solid fa-xmark"></i>
      </div>
    </div>
  `).join('');
}

// Handle clicking on an alert
window.handleAlertClick = function(alertId, bookingId) {
  markAlertRead(alertId);
  if (bookingId) {
    openBookingDetails(bookingId);
  }
};

// Mark alert as read
window.markAlertRead = function(alertId) {
  fetch(`/api/alerts/${alertId}/read`, {
    method: 'PUT'
  })
  .then(res => res.json())
  .then(data => {
    fetchStateFromBackend();
  })
  .catch(err => {
    console.error('Error marking alert read:', err);
    state.alerts = state.alerts.map(a => {
      if (a.id === alertId) return { ...a, unread: false };
      return a;
    });
    localStorage.setItem('agriride_alerts', JSON.stringify(state.alerts));
    renderAlerts();
    updateAlertBadge();
  });
};

// Delete alert
window.deleteAlert = function(alertId) {
  fetch(`/api/alerts/${alertId}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    fetchStateFromBackend();
  })
  .catch(err => {
    console.error('Error deleting alert:', err);
    state.alerts = state.alerts.filter(a => a.id !== alertId);
    localStorage.setItem('agriride_alerts', JSON.stringify(state.alerts));
    renderAlerts();
    updateAlertBadge();
  });
};

// Update alert badge count
function updateAlertBadge() {
  const badge = document.getElementById('alerts-badge');
  if (!badge) return;
  
  const unreadCount = state.alerts.filter(a => a.unread).length;
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function capitalizeFirst(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

let currentCancelBookingId = null;

function openBookingDetails(id) {
  const booking = state.bookings.find(b => b.id === id);
  if (!booking) return;

  currentCancelBookingId = id;
  const content = document.getElementById('booking-details-content');
  const role = localStorage.getItem('agriride-role') || 'farmer';

  let paymentText = 'N/A';
  if (booking.paymentMethod) {
    if (booking.paymentMethod === 'cod') paymentText = 'Cash on Delivery';
    else if (booking.paymentMethod === 'upi') paymentText = 'UPI Payment';
    else if (booking.paymentMethod === 'card') paymentText = 'Credit / Debit Card';
    else if (booking.paymentMethod === 'netbanking') paymentText = 'Net Banking';
    else paymentText = booking.paymentMethod;
  }

  // --- LIVE MAP TRACKING UI ---
  if (booking.status === 'ongoing' && role === 'farmer') {
    content.innerHTML = `
      <div class="live-tracking-container">
        
        <!-- Left: Map Area -->
        <!-- Left: Metrics Sidebar -->
        <div class="live-sidebar">
          <div class="live-sidebar-item">
            <div class="live-sidebar-icon"><i class="fa-solid fa-location-dot"></i></div>
            <div class="live-sidebar-text">
              <h4>Real-time Tracking</h4>
              <p>Track machine in real time</p>
            </div>
          </div>
          <div class="live-sidebar-item">
            <div class="live-sidebar-icon"><i class="fa-regular fa-clock"></i></div>
            <div class="live-sidebar-text">
              <h4>ETA & Arrival</h4>
              <p>Estimated arrival 25 min</p>
            </div>
          </div>
          <div class="live-sidebar-item">
            <div class="live-sidebar-icon"><i class="fa-solid fa-chart-line"></i></div>
            <div class="live-sidebar-text">
              <h4>Work Progress</h4>
              <p>Area completed & remaining</p>
            </div>
          </div>
          <div class="live-sidebar-item">
            <div class="live-sidebar-icon"><i class="fa-solid fa-gas-pump"></i></div>
            <div class="live-sidebar-text">
              <h4>Fuel & Cost Tracking</h4>
              <p>Live fuel & cost updates</p>
            </div>
          </div>
          <div class="live-sidebar-item">
            <div class="live-sidebar-icon"><i class="fa-solid fa-stopwatch"></i></div>
            <div class="live-sidebar-text">
              <h4>Work Timer</h4>
              <p>Track start to finish time</p>
            </div>
          </div>
          <div class="live-sidebar-item">
            <div class="live-sidebar-icon"><i class="fa-solid fa-user-tie"></i></div>
            <div class="live-sidebar-text">
              <h4>Driver Details</h4>
              <p>Call or chat with driver</p>
            </div>
          </div>
        </div>

        <div class="live-map-card">
          <div class="live-map-header">Live Track</div>
          <div class="live-map-view">
            <div class="live-map-badge">Live Track</div>
            <div class="live-map-status">Live</div>
            <div class="live-map-polygon"></div>
            <img src="${booking.image}" class="live-map-tractor-marker" style="object-fit: contain; width: 48px; height: 48px;" onerror="this.onerror=null;this.src='assets/tractor.png'">
          </div>

          <div class="live-progress-card">
            <div class="live-progress-header">
              <div>
                <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Work in Progress</h3>
                <p style="font-size: 12px; color: var(--text-sub);">🚜 ${booking.machineName} | Operator: Ramesh</p>
              </div>
              <div style="background: rgba(16, 185, 129, 0.1); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                <i class="fa-solid fa-location-arrow"></i>
              </div>
            </div>

            <div class="live-stats-row">
              <div class="live-stat-box">
                <span class="live-stat-label">Total Area</span>
                <span class="live-stat-value green">${booking.duration || '5.0 Acres'}</span>
              </div>
              <div class="live-stat-box" style="text-align: center;">
                <span class="live-stat-label">Completed</span>
                <span class="live-stat-value green">0</span>
              </div>
              <div class="live-stat-box" style="text-align: right;">
                <span class="live-stat-label">Remaining</span>
                <span class="live-stat-value green">${booking.duration || '5.0 Acres'}</span>
              </div>
            </div>

            <div class="live-progress-bar-container">
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--text-sub);">
                <span>Progress</span>
                <span style="color: var(--primary);">0% <i class="fa-solid fa-caret-down"></i></span>
              </div>
              <div class="live-progress-bar-bg">
                <div class="live-progress-bar-fill" style="width: 0%;"></div>
              </div>
            </div>

            <div class="live-action-buttons">
              <button><i class="fa-solid fa-phone"></i> Call Driver</button>
              <button><i class="fa-regular fa-comment-dots"></i> Chat</button>
              <button class="danger"><i class="fa-solid fa-pause"></i> Pause Work</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // --- STANDARD BOOKING DETAILS ---
    content.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
        <img src="${booking.image}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);" onerror="this.onerror=null;this.src='assets/tractor.png'">
        <div>
          <div style="font-size: 16px; font-weight: 700;">${booking.machineName}</div>
          <div style="color: var(--primary); font-weight: 600;">₹${booking.price.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
        <span style="color: var(--text-sub);">Booking ID</span>
        <span style="font-weight: 600;">${booking.id}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
        <span style="color: var(--text-sub);">Date & Time</span>
        <span style="font-weight: 600;">${booking.date} at ${booking.time}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
        <span style="color: var(--text-sub);">Duration</span>
        <span style="font-weight: 600;">${booking.duration}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
        <span style="color: var(--text-sub);">Status</span>
        <span class="booking-status-badge ${booking.status}" style="font-size: 11px;">${capitalizeFirst(booking.status)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
        <span style="color: var(--text-sub);">Payment Method</span>
        <span style="font-weight: 600;">${paymentText}</span>
      </div>
    `;

    if (booking.status !== 'cancelled' && booking.status !== 'completed') {
      content.innerHTML += `
        <div style="margin-top: 16px;">
          <button class="btn-primary" style="width: 100%; background: #dc2626; padding: 12px;" onclick="openCancelPrompt()">Cancel Booking</button>
        </div>
      `;
    }
  }

  switchTab('booking-details');
}

function openCancelPrompt() {
  document.getElementById('cancel-reason-modal').classList.add('visible');
}

function closeCancelPrompt() {
  document.getElementById('cancel-reason-modal').classList.remove('visible');
  // Reset selections
  document.querySelectorAll('.cancel-reason-option').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('input[name="cancel-reason"]').forEach(r => r.checked = false);
  const notes = document.getElementById('cancel-notes');
  if (notes) notes.value = '';
}

function submitCancellation() {
  if (!currentCancelBookingId) return;

  const reasonEl = document.querySelector('input[name="cancel-reason"]:checked');
  const reason = reasonEl ? reasonEl.value : 'Other';
  const notes = document.getElementById('cancel-notes').value;

  const submitBtn = document.querySelector('#cancel-reason-modal .btn-primary');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
  }

  fetch(`/api/bookings/${currentCancelBookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason, notes: notes })
  })
  .then(res => res.json())
  .then(() => {
    // After server cancel, delete locally and refresh analytics
    return fetch(`/api/bookings/${currentCancelBookingId}`, { method: 'DELETE' });
  })
  .then(() => {
    document.getElementById('cancel-reason-modal').classList.remove('visible');
    document.getElementById('cancel-notes').value = '';
    fetchStateFromBackend().then(() => {
      switchTab('bookings');
      updateAnalyticsDashboard();
    });
  })
  .catch(err => {
    console.error('Offline fallback - removing booking locally:', err);
    // ── Offline: fully remove the booking ──
    const booking = state.bookings.find(b => b.id === currentCancelBookingId);
    state.bookings = state.bookings.filter(b => b.id !== currentCancelBookingId);
    localStorage.setItem('agriride_bookings', JSON.stringify(state.bookings));

    // Add cancellation alert
    if (booking) {
      const alerts = JSON.parse(localStorage.getItem('agriride_alerts') || '[]');
      alerts.unshift({
        id: Date.now(),
        title: 'Booking Cancelled ❌',
        message: `Your ${booking.machineName} booking (${booking.id}) has been cancelled. Reason: ${reason}.`,
        time: 'Just now',
        unread: true
      });
      localStorage.setItem('agriride_alerts', JSON.stringify(alerts));
      state.alerts = alerts;
    }

    // Close modal and reset
    document.getElementById('cancel-reason-modal').classList.remove('visible');
    document.getElementById('cancel-notes').value = '';
    if (submitBtn) {
      submitBtn.innerHTML = 'Confirm Cancellation';
      submitBtn.disabled = false;
    }

    // Refresh all views including analytics
    renderBookings();
    renderAlerts();
    updateAlertBadge();
    updateAnalyticsDashboard();

    // Go back to bookings tab
    switchTab('bookings');
  });
}

// Expose navigation functions
window.openBookingFlow = openBookingFlow;
window.switchTab = switchTab;
window.openBookingDetails = openBookingDetails;
window.openCancelPrompt = openCancelPrompt;
window.closeCancelPrompt = closeCancelPrompt;
window.submitCancellation = submitCancellation;
window.toggleMobileSidebar = toggleMobileSidebar;
window.handleMobileNav = handleMobileNav;

// Worker Dashboard & Role Views
function applyRoleView() {
  const userRole = localStorage.getItem('agriride-role') || 'farmer';
  const farmerView = document.getElementById('farmer-home-view');
  const workerView = document.getElementById('worker-home-view');
  const openBookingBtn = document.querySelector('.view-mode-bar');

  const analyticsNav = document.querySelector('.nav-link[data-tab="analytics"]');
  const parentLi = analyticsNav ? analyticsNav.closest('.nav-item') : null;

  if (userRole === 'worker') {
    if (farmerView) farmerView.style.display = 'none';
    if (workerView) workerView.style.display = 'block';
    if (openBookingBtn) openBookingBtn.style.display = 'none';
    if (parentLi) parentLi.style.display = 'none';
    
    const phone = localStorage.getItem('agriride-phone') || '';
    const welcomeTitle = document.getElementById('worker-welcome-title');
    if (welcomeTitle) {
      welcomeTitle.innerHTML = `Hello, Operator 👋 <span style="font-size: 14px; font-weight: normal; color: var(--text-sub); display: block; margin-top: 4px;">Logged in as: ${phone || 'Partner'}</span>`;
    }

    renderWorkerJobs();
  } else {
    if (farmerView) farmerView.style.display = 'block';
    if (workerView) workerView.style.display = 'none';
    if (openBookingBtn) openBookingBtn.style.display = 'block';
    if (parentLi) parentLi.style.display = 'block';
  }
  
  renderProfile();
}

function renderWorkerJobs() {
  const grid = document.getElementById('worker-jobs-grid');
  if (!grid) return;

  const bookings = JSON.parse(localStorage.getItem('agriride_bookings')) || [];

  if (bookings.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💼</div>
        <h3>No Jobs Available</h3>
        <p>There are no farm machinery bookings from farmers at this moment.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = bookings.map(b => {
    // Safe payment text
    let paymentText = 'N/A';
    if (b.paymentMethod) {
      if (b.paymentMethod === 'cod') paymentText = 'Cash on Delivery';
      else if (b.paymentMethod === 'upi') paymentText = 'UPI Payment';
      else if (b.paymentMethod === 'card') paymentText = 'Credit / Debit Card';
      else if (b.paymentMethod === 'netbanking') paymentText = 'Net Banking';
      else paymentText = b.paymentMethod.toUpperCase();
    }

    // Parse details string into individual rows
    let detailRows = '';
    if (b.details) {
      b.details.split(',').forEach(part => {
        const [label, ...valParts] = part.trim().split(':');
        const val = valParts.join(':').trim();
        if (label && val) {
          let icon = 'fa-info-circle';
          const l = label.trim().toLowerCase();
          if (l === 'crop') icon = 'fa-seedling';
          else if (l === 'size') icon = 'fa-ruler-combined';
          else if (l === 'soil') icon = 'fa-mountain';
          else if (l === 'purpose') icon = 'fa-hammer';
          else if (l === 'terrain') icon = 'fa-mountain';
          else if (l === 'hours') icon = 'fa-clock';
          else if (l === 'material') icon = 'fa-box';
          else if (l === 'load') icon = 'fa-weight-hanging';
          else if (l === 'distance') icon = 'fa-route';
          else if (l === 'depth') icon = 'fa-arrow-down';
          else if (l === 'diameter') icon = 'fa-circle-dot';
          else if (l === 'point') icon = 'fa-droplet';
          detailRows += `
            <div class="worker-detail-row">
              <span class="worker-detail-label"><i class="fa-solid ${icon}"></i> ${label.trim()}</span>
              <span class="worker-detail-value">${val}</span>
            </div>
          `;
        }
      });
    }

    // Action buttons based on status
    let actionButtons = '';
    if (b.status === 'confirmed') {
      actionButtons = `
        <div class="worker-job-actions">
          <button class="sim-btn-primary" style="flex: 1; padding: 13px; font-size: 14px;" onclick="updateJobStatus('${b.id}', 'accepted')">
            <i class="fa-solid fa-check"></i> Accept Job
          </button>
          <button class="sim-btn-primary" style="flex: 1; padding: 13px; font-size: 14px; background: #dc2626;" onclick="updateJobStatus('${b.id}', 'cancelled')">
            <i class="fa-solid fa-xmark"></i> Decline
          </button>
        </div>
      `;
    } else if (b.status === 'accepted') {
      actionButtons = `
        <div class="worker-job-actions">
          <button class="sim-btn-primary" style="flex: 1; padding: 13px; font-size: 14px; background: #d97706;" onclick="updateJobStatus('${b.id}', 'ongoing')">
            <i class="fa-solid fa-play"></i> Start Work
          </button>
        </div>
      `;
    } else if (b.status === 'ongoing') {
      actionButtons = `
        <div class="worker-job-actions">
          <button class="sim-btn-primary" style="flex: 1; padding: 13px; font-size: 14px;" onclick="updateJobStatus('${b.id}', 'completed')">
            <i class="fa-solid fa-circle-check"></i> Mark Completed
          </button>
        </div>
      `;
    }

    return `
      <div class="worker-job-card" id="worker-card-${b.id}">

        <!-- Machine Header -->
        <div class="worker-job-header">
          <img src="${b.image}" alt="${b.machineName}" class="worker-job-img" onerror="this.onerror=null;this.src='assets/tractor.png'">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <span style="font-size:18px; font-weight:700; color:var(--text-main);">${b.machineName}</span>
              <span class="booking-status-badge ${b.status}" style="font-size:11px;">${capitalizeFirst(b.status)}</span>
            </div>
            <div style="font-size:12px; color:var(--text-sub); margin-top:4px;">Job ID: <strong>${b.id}</strong></div>
          </div>
          <div style="font-size:18px; font-weight:700; color:var(--primary); white-space:nowrap;">₹${b.price.toLocaleString('en-IN')}</div>
        </div>

        <!-- Core Booking Details -->
        <div class="worker-detail-row">
          <span class="worker-detail-label"><i class="fa-regular fa-calendar"></i> Booking Date</span>
          <span class="worker-detail-value">${b.date}</span>
        </div>
        <div class="worker-detail-row">
          <span class="worker-detail-label"><i class="fa-regular fa-clock"></i> Start Time</span>
          <span class="worker-detail-value">${b.time}</span>
        </div>
        <div class="worker-detail-row">
          <span class="worker-detail-label"><i class="fa-regular fa-hourglass"></i> Duration</span>
          <span class="worker-detail-value">${b.duration}</span>
        </div>
        <div class="worker-detail-row">
          <span class="worker-detail-label"><i class="fa-solid fa-location-dot"></i> Location</span>
          <span class="worker-detail-value">${b.address}</span>
        </div>
        <div class="worker-detail-row">
          <span class="worker-detail-label"><i class="fa-solid fa-wallet"></i> Payment</span>
          <span class="worker-detail-value">${paymentText}</span>
        </div>

        <!-- Machine Specs (crop, soil, etc.) -->
        ${detailRows}

        <!-- Notes -->
        ${b.notes ? `
        <div class="worker-detail-row" style="border-bottom:none;">
          <span class="worker-detail-label"><i class="fa-solid fa-note-sticky"></i> Notes</span>
          <span class="worker-detail-value" style="font-style:italic; color:var(--text-sub);">${b.notes}</span>
        </div>` : ''}

        <!-- Action Buttons -->
        ${actionButtons}
      </div>
    `;
  }).join('');
}


window.updateJobStatus = function(bookingId, newStatus) {
  fetch(`/api/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    fetchStateFromBackend();
  })
  .catch(err => {
    console.error('Error updating status on server:', err);
    // Offline local fallback
    let bookings = JSON.parse(localStorage.getItem('agriride_bookings')) || [];
    bookings = bookings.map(b => {
      if (b.id === bookingId) return { ...b, status: newStatus };
      return b;
    });
    localStorage.setItem('agriride_bookings', JSON.stringify(bookings));

    const booking = bookings.find(b => b.id === bookingId);
    const alerts = JSON.parse(localStorage.getItem('agriride_alerts') || '[]');
    let title = 'Job Update 🚜';
    let message = `Job ${booking.machineName} (${bookingId}) status changed to ${newStatus}.`;
    if (newStatus === 'accepted') {
      title = 'Job Accepted 🔧';
      message = `Worker accepted your ${booking.machineName} job (${bookingId}).`;
    } else if (newStatus === 'ongoing') {
      title = 'Work Started ⚡';
      message = `Worker started operating your booked ${booking.machineName} (${bookingId}).`;
    } else if (newStatus === 'completed') {
      title = 'Job Completed 🎉';
      message = `Your booked ${booking.machineName} (${bookingId}) has been successfully operated.`;
    } else if (newStatus === 'cancelled') {
      title = 'Job Declined ❌';
      message = `Worker declined your ${booking.machineName} booking (${bookingId}).`;
    }

    alerts.unshift({
      id: Date.now(),
      title: title,
      message: message,
      time: 'Just now',
      unread: true,
      bookingId: bookingId
    });
    localStorage.setItem('agriride_alerts', JSON.stringify(alerts));
    reloadFromStorage();
  });
};



function renderProfile() {
  const profileTab = document.getElementById('profile-tab');
  if (!profileTab) return;

  const role = localStorage.getItem('agriride-role') || 'farmer';
  const phone = localStorage.getItem('agriride-phone') || '';

  // Load saved profile data from localStorage
  const savedProfile = JSON.parse(localStorage.getItem('agriride_profile') || '{}');
  const profileName = savedProfile.name || '';
  const profilePhone = savedProfile.phone || phone || '';
  const profileHub = savedProfile.hub || '';
  const profileAadhaar = savedProfile.aadhaar || '';
  const profileEmail = savedProfile.email || '';
  const profileAddress = savedProfile.address || '';


  const roleLabel = role === 'worker' ? 'Operator Partner' : 'Farmer Partner';
  const roleIcon = role === 'worker' ? 'fa-user-gear' : 'fa-seedling';
  const roleEmoji = role === 'worker' ? '🔧' : '🌾';
  const idPrefix = role === 'worker' ? 'AR-W' : 'AR-F';
  const profileId = savedProfile.userId || `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Save generated ID if new
  if (!savedProfile.userId) {
    savedProfile.userId = profileId;
    localStorage.setItem('agriride_profile', JSON.stringify(savedProfile));
  }

  profileTab.innerHTML = `
    <div class="welcome-section">
      <h2 class="welcome-title">My Profile</h2>
      <p class="welcome-subtitle">Manage your credentials, preferences & settings</p>
    </div>

    <!-- Profile Card: Editable -->
    <div class="profile-card" style="align-items: stretch; text-align: left;">

      <!-- Avatar & Name Header -->
      <div style="display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
        <div class="profile-avatar" style="flex-shrink: 0; font-size: 32px;">
          <i class="fa-solid ${roleIcon}"></i>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); font-weight: 600; margin-bottom: 4px;">${roleEmoji} Registered ${roleLabel}</div>
          <div style="font-size: 12px; color: var(--text-sub); margin-top: 4px;">ID: <strong>${profileId}</strong></div>
        </div>
      </div>

      <!-- Editable Form Fields -->
      <div class="profile-edit-form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 20px;">

        <div class="profile-form-row">
          <label class="profile-form-label"><i class="fa-solid fa-user"></i> Full Name</label>
          <input type="text" id="profile-name" class="profile-form-input" placeholder="Enter your full name" value="${profileName}">
        </div>

        <div class="profile-form-row">
          <label class="profile-form-label"><i class="fa-solid fa-phone"></i> Phone Number</label>
          <input type="tel" id="profile-phone" class="profile-form-input" placeholder="+91 98765 43210" value="${profilePhone}">
        </div>

        <div class="profile-form-row">
          <label class="profile-form-label"><i class="fa-solid fa-envelope"></i> Email Address</label>
          <input type="email" id="profile-email" class="profile-form-input" placeholder="yourname@email.com" value="${profileEmail}">
        </div>

        <div class="profile-form-row">
          <label class="profile-form-label"><i class="fa-solid fa-location-dot"></i> Primary Hub / Village</label>
          <input type="text" id="profile-hub" class="profile-form-input" placeholder="e.g. Kumbakonam, TN" value="${profileHub}">
        </div>

        <div class="profile-form-row">
          <label class="profile-form-label"><i class="fa-solid fa-map-pin"></i> Full Address</label>
          <textarea id="profile-address" class="profile-form-input" rows="2" placeholder="Enter your full address" style="resize: vertical;">${profileAddress}</textarea>
        </div>

        <div class="profile-form-row">
          <label class="profile-form-label"><i class="fa-solid fa-id-card"></i> Aadhaar Number (last 4 digits)</label>
          <input type="text" id="profile-aadhaar" class="profile-form-input" placeholder="XXXX" maxlength="4" value="${profileAadhaar}">
        </div>

        <button class="sim-btn-primary profile-save-btn" onclick="saveProfile()" id="profile-save-btn">
          <i class="fa-solid fa-check-circle"></i> Save Profile
        </button>

      </div>
    </div>

    <!-- Settings Card -->
    <div class="profile-card" style="align-items: stretch; text-align: left; margin-top: 0;">
      <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid fa-sliders" style="color: var(--primary);"></i> App Settings
      </h3>



      <!-- Language -->
      <div class="profile-setting-row" onclick="openLanguageModal()" style="cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #059669, #34d399); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
            <i class="fa-solid fa-language"></i>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-main);" data-i18n="settings_language">Language</div>
            <div style="font-size: 12px; color: var(--text-sub);" id="current-language-name">English (India)</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color: var(--text-light);"></i>
      </div>

      <!-- Notifications (static for now) -->
      <div class="profile-setting-row">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #fbbf24); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
            <i class="fa-solid fa-bell"></i>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">Notifications</div>
            <div style="font-size: 12px; color: var(--text-sub);">Push & SMS alerts enabled</div>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" checked>
          <span class="slider round"></span>
        </label>
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="sim-btn-primary" style="background: var(--bg-card); border: 1px solid var(--border); flex: 1; min-width: 140px; color: var(--text-main);" onclick="clearTestData()">
        <i class="fa-solid fa-trash-can"></i> <span data-i18n="btn_clear_data">Clear Test Data</span>
      </button>
      <button class="sim-btn-primary" style="background: linear-gradient(135deg, #dc2626, #ef4444); flex: 1; min-width: 140px;" onclick="handleLogout()">
        <i class="fa-solid fa-right-from-bracket"></i> <span data-i18n="btn_logout">Logout</span>
      </button>
    </div>
  `;

  // Apply translations for the dynamically rendered profile tab
  if (window.i18n) {
    window.i18n.applyTranslations();
    const currLang = window.i18n.getCurrentLanguage();
    const langObj = window.i18n.getLanguageList().find(l => l.code === currLang);
    if (langObj) {
      document.getElementById('current-language-name').textContent = langObj.nativeName;
    }
  }
}

// Save editable profile data to localStorage
window.saveProfile = function() {
  const profile = {
    name: document.getElementById('profile-name')?.value || '',
    phone: document.getElementById('profile-phone')?.value || '',
    email: document.getElementById('profile-email')?.value || '',
    hub: document.getElementById('profile-hub')?.value || '',
    address: document.getElementById('profile-address')?.value || '',
    aadhaar: document.getElementById('profile-aadhaar')?.value || '',
    userId: (JSON.parse(localStorage.getItem('agriride_profile') || '{}')).userId || ''
  };
  localStorage.setItem('agriride_profile', JSON.stringify(profile));

  // Also update the phone in separate storage for other views
  if (profile.phone) {
    localStorage.setItem('agriride-phone', profile.phone);
  }

  // Visual save feedback
  const btn = document.getElementById('profile-save-btn');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Saved!';
    btn.style.background = 'linear-gradient(135deg, #059669, #34d399)';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Save Profile';
      btn.style.background = '';
    }, 2000);
  }
};



window.clearTestData = function() {
  if (confirm("Are you sure you want to clear all bookings and alerts? This will give you a clean slate.")) {
    fetch('/api/clear', { method: 'POST' })
    .then(() => {
      localStorage.removeItem('agriride_bookings');
      localStorage.removeItem('agriride_alerts');
      window.location.reload();
    })
    .catch(err => {
      console.error('Error clearing data:', err);
      localStorage.removeItem('agriride_bookings');
      localStorage.removeItem('agriride_alerts');
      window.location.reload();
    });
  }
};

window.handleLogout = function() {
  localStorage.removeItem('agriride-role');
  localStorage.removeItem('agriride-phone');
  sessionStorage.removeItem('agriride_splash_shown');
  window.location.href = 'index.html';
};

function updateAnalyticsDashboard() {
  const bookings = JSON.parse(localStorage.getItem('agriride_bookings')) || [];
  
  // Calculate sums starting from 0
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  
  const totalHours = bookings.reduce((sum, b) => {
    let hrs = parseFloat(b.duration) || 0; 
    if (b.duration && b.duration.toLowerCase().includes('day')) {
      const parsedDays = parseFloat(b.duration) || 0;
      hrs = parsedDays * 8; // 8 hours per day
    }
    return sum + hrs;
  }, 0);

  const totalAcres = bookings.reduce((sum, b) => {
    let ac = 0;
    if (b.details) {
      b.details.split(',').forEach(part => {
        const [label, val] = part.split(':');
        if (label && label.trim().toLowerCase() === 'size') {
          ac = parseFloat(val) || 0;
        }
      });
    }
    return sum + ac;
  }, 0);

  // Update DOM elements if they exist
  const bookingsEl = document.getElementById('analytics-total-bookings');
  const revenueEl = document.getElementById('analytics-total-revenue');
  const hoursEl = document.getElementById('analytics-total-hours');
  const acresEl = document.getElementById('analytics-total-acres');

  if (bookingsEl) bookingsEl.textContent = totalBookings.toLocaleString('en-IN');
  if (revenueEl) revenueEl.textContent = '₹ ' + totalRevenue.toLocaleString('en-IN');
  if (hoursEl) hoursEl.textContent = totalHours.toLocaleString('en-IN') + ' h';
  if (acresEl) acresEl.textContent = totalAcres.toLocaleString('en-IN');

  // --- DYNAMIC CHARTS RENDERING ---

  // 1. Monthly Bookings Over Time (Line Chart)
  const monthlyCounts = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0 };
  bookings.forEach(b => {
    if (b.date) {
      const dateStr = b.date.toLowerCase();
      if (dateStr.includes('jan')) monthlyCounts.Jan++;
      else if (dateStr.includes('feb')) monthlyCounts.Feb++;
      else if (dateStr.includes('mar')) monthlyCounts.Mar++;
      else if (dateStr.includes('apr')) monthlyCounts.Apr++;
      else if (dateStr.includes('may')) monthlyCounts.May++;
      else if (dateStr.includes('jun')) monthlyCounts.Jun++;
      else if (dateStr.includes('jul')) monthlyCounts.Jul++;
      else {
        const parts = b.date.split('-');
        if (parts.length >= 2) {
          const monthNum = parseInt(parts[1]);
          if (monthNum === 1) monthlyCounts.Jan++;
          else if (monthNum === 2) monthlyCounts.Feb++;
          else if (monthNum === 3) monthlyCounts.Mar++;
          else if (monthNum === 4) monthlyCounts.Apr++;
          else if (monthNum === 5) monthlyCounts.May++;
          else if (monthNum === 6) monthlyCounts.Jun++;
          else if (monthNum === 7) monthlyCounts.Jul++;
        }
      }
    }
  });

  const pathEl = document.getElementById('analytics-line-path');
  const pathFillEl = document.getElementById('analytics-line-path-fill');
  const dotsEl = document.getElementById('analytics-line-dots');
  const tooltipEl = document.getElementById('analytics-line-tooltip');

  if (pathEl && dotsEl) {
    if (totalBookings === 0) {
      pathEl.style.display = 'none';
      if (pathFillEl) pathFillEl.style.display = 'none';
      dotsEl.style.display = 'none';
      if (tooltipEl) tooltipEl.style.display = 'none';
    } else {
      const maxCount = Math.max(1, ...Object.values(monthlyCounts));
      const yStart = 125;
      const yEnd = 15;
      const getY = (val) => yStart - ((val / maxCount) * (yStart - yEnd));

      const monthsList = Object.keys(monthlyCounts);
      const xCoords = { Jan: 80, Feb: 150, Mar: 220, Apr: 290, May: 360, Jun: 430, Jul: 500 };
      
      let pathD = `M 80 ${getY(monthlyCounts.Jan)}`;
      monthsList.slice(1).forEach(month => {
        pathD += ` L ${xCoords[month]} ${getY(monthlyCounts[month])}`;
      });

      const fillD = pathD + ` L 500 125 L 80 125 Z`;

      let circlesHTML = '';
      monthsList.forEach(month => {
        circlesHTML += `<circle cx="${xCoords[month]}" cy="${getY(monthlyCounts[month])}" r="4" fill="#4ade80" stroke="#111827" stroke-width="2"/>`;
      });

      pathEl.setAttribute('d', pathD);
      pathEl.style.display = 'block';
      if (pathFillEl) {
        pathFillEl.setAttribute('d', fillD);
        pathFillEl.style.display = 'block';
      }
      dotsEl.innerHTML = circlesHTML;
      dotsEl.style.display = 'block';

      if (tooltipEl) {
        let lastActiveMonth = 'Jan';
        for (let i = monthsList.length - 1; i >= 0; i--) {
          if (monthlyCounts[monthsList[i]] > 0) {
            lastActiveMonth = monthsList[i];
            break;
          }
        }
        const activeX = xCoords[lastActiveMonth];
        const activeY = getY(monthlyCounts[lastActiveMonth]);
        tooltipEl.setAttribute('transform', `translate(${activeX}, ${activeY})`);
        const textEl = document.getElementById('analytics-line-tooltip-text');
        if (textEl) {
          textEl.textContent = `${monthlyCounts[lastActiveMonth]} ${lastActiveMonth}`;
        }
        tooltipEl.style.display = 'block';
      }
    }
  }

  // 2. Top Machines (Donut Chart)
  const machineCounts = { Tractor: 0, JCB: 0, Harvester: 0, Lorry: 0, Others: 0 };
  bookings.forEach(b => {
    if (b.machineName) {
      const name = b.machineName.toLowerCase();
      if (name.includes('tractor')) machineCounts.Tractor++;
      else if (name.includes('jcb')) machineCounts.JCB++;
      else if (name.includes('harvester')) machineCounts.Harvester++;
      else if (name.includes('lorry') || name.includes('tipper')) machineCounts.Lorry++;
      else machineCounts.Others++;
    }
  });

  const pctTractor = totalBookings ? Math.round((machineCounts.Tractor / totalBookings) * 100) : 0;
  const pctJcb = totalBookings ? Math.round((machineCounts.JCB / totalBookings) * 100) : 0;
  const pctHarvester = totalBookings ? Math.round((machineCounts.Harvester / totalBookings) * 100) : 0;
  const pctLorry = totalBookings ? Math.round((machineCounts.Lorry / totalBookings) * 100) : 0;
  const pctOthers = totalBookings ? Math.max(0, 100 - pctTractor - pctJcb - pctHarvester - pctLorry) : 0;

  const elTractor = document.getElementById('pct-tractor');
  const elJcb = document.getElementById('pct-jcb');
  const elHarvester = document.getElementById('pct-harvester');
  const elLorry = document.getElementById('pct-lorry');
  const elOthers = document.getElementById('pct-others');

  if (elTractor) elTractor.textContent = pctTractor + '%';
  if (elJcb) elJcb.textContent = pctJcb + '%';
  if (elHarvester) elHarvester.textContent = pctHarvester + '%';
  if (elLorry) elLorry.textContent = pctLorry + '%';
  if (elOthers) elOthers.textContent = pctOthers + '%';

  const donutEl = document.getElementById('analytics-donut-chart');
  if (donutEl) {
    if (totalBookings === 0) {
      donutEl.style.background = '#1e293b';
    } else {
      let accum = 0;
      const parts = [];
      if (pctTractor > 0) { parts.push(`#4ade80 ${accum}% ${accum + pctTractor}%`); accum += pctTractor; }
      if (pctJcb > 0) { parts.push(`#f59e0b ${accum}% ${accum + pctJcb}%`); accum += pctJcb; }
      if (pctHarvester > 0) { parts.push(`#38bdf8 ${accum}% ${accum + pctHarvester}%`); accum += pctHarvester; }
      if (pctLorry > 0) { parts.push(`#06b6d4 ${accum}% ${accum + pctLorry}%`); accum += pctLorry; }
      if (pctOthers > 0) { parts.push(`#8b5cf6 ${accum}% 100%`); }
      donutEl.style.background = `conic-gradient(${parts.join(', ')})`;
    }
  }

  const catDonutEl = document.getElementById('analytics-category-donut');
  if (catDonutEl) {
    if (totalBookings === 0) {
      catDonutEl.style.background = '#1e293b';
    } else {
      let accum = 0;
      const parts = [];
      if (pctTractor > 0) { parts.push(`#4ade80 ${accum}% ${accum + pctTractor}%`); accum += pctTractor; }
      if (pctJcb > 0) { parts.push(`#f59e0b ${accum}% ${accum + pctJcb}%`); accum += pctJcb; }
      if (pctHarvester > 0) { parts.push(`#38bdf8 ${accum}% ${accum + pctHarvester}%`); accum += pctHarvester; }
      if (pctLorry > 0) { parts.push(`#06b6d4 ${accum}% ${accum + pctLorry}%`); accum += pctLorry; }
      if (pctOthers > 0) { parts.push(`#8b5cf6 ${accum}% 100%`); }
      catDonutEl.style.background = `conic-gradient(${parts.join(', ')})`;
    }
  }

  const elCatTractor = document.getElementById('pct-cat-tractor');
  const elCatJcb = document.getElementById('pct-cat-jcb');
  const elCatHarvester = document.getElementById('pct-cat-harvester');
  const elCatLorry = document.getElementById('pct-cat-lorry');
  const elCatOthers = document.getElementById('pct-cat-others');

  if (elCatTractor) elCatTractor.textContent = pctTractor + '%';
  if (elCatJcb) elCatJcb.textContent = pctJcb + '%';
  if (elCatHarvester) elCatHarvester.textContent = pctHarvester + '%';
  if (elCatLorry) elCatLorry.textContent = pctLorry + '%';
  if (elCatOthers) elCatOthers.textContent = pctOthers + '%';

  // 3. Demand Heat Map (Village Level)
  const heatDots = document.querySelectorAll('.heat-dot');
  heatDots.forEach(dot => {
    dot.style.display = (totalBookings === 0) ? 'none' : 'block';
  });

  // 4. Machine Utilization (Bar Chart)
  const utilTractor = totalBookings ? Math.min(100, Math.round((machineCounts.Tractor / totalBookings) * 100)) : 0;
  const utilJcb = totalBookings ? Math.min(100, Math.round((machineCounts.JCB / totalBookings) * 100)) : 0;
  const utilHarvester = totalBookings ? Math.min(100, Math.round((machineCounts.Harvester / totalBookings) * 100)) : 0;
  const utilLorry = totalBookings ? Math.min(100, Math.round((machineCounts.Lorry / totalBookings) * 100)) : 0;

  const fillTractor = document.getElementById('fill-tractor');
  const valTractor = document.getElementById('val-tractor');
  if (fillTractor && valTractor) { fillTractor.style.width = utilTractor + '%'; valTractor.textContent = utilTractor + '%'; }

  const fillJcb = document.getElementById('fill-jcb');
  const valJcb = document.getElementById('val-jcb');
  if (fillJcb && valJcb) { fillJcb.style.width = utilJcb + '%'; valJcb.textContent = utilJcb + '%'; }

  const fillHarvester = document.getElementById('fill-harvester');
  const valHarvester = document.getElementById('val-harvester');
  if (fillHarvester && valHarvester) { fillHarvester.style.width = utilHarvester + '%'; valHarvester.textContent = utilHarvester + '%'; }

  const fillLorry = document.getElementById('fill-lorry');
  const valLorry = document.getElementById('val-lorry');
  if (fillLorry && valLorry) { fillLorry.style.width = utilLorry + '%'; valLorry.textContent = utilLorry + '%'; }

  const overallUtil = totalBookings ? Math.round((utilTractor + utilJcb + utilHarvester + utilLorry) / 4) : 0;
  const gaugeCircle = document.getElementById('analytics-util-gauge');
  const gaugeVal = document.getElementById('analytics-util-val');
  if (gaugeCircle) {
    gaugeCircle.setAttribute('stroke-dasharray', `${overallUtil} 100`);
  }
  if (gaugeVal) {
    gaugeVal.textContent = overallUtil + '%';
  }

  // 5. District Level Revenue List
  const districtRevenueList = document.getElementById('analytics-district-list');
  if (districtRevenueList) {
    if (totalBookings === 0) {
      districtRevenueList.innerHTML = `
        <div class="an-dist-row"><span>Coimbatore</span><strong>₹ 0</strong></div>
        <div class="an-dist-row"><span>Tiruppur</span><strong>₹ 0</strong></div>
        <div class="an-dist-row"><span>Erode</span><strong>₹ 0</strong></div>
        <div class="an-dist-row"><span>Salem</span><strong>₹ 0</strong></div>
        <div class="an-dist-row"><span>Others</span><strong>₹ 0</strong></div>
      `;
    } else {
      const distMap = { Coimbatore: 0, Tiruppur: 0, Erode: 0, Salem: 0, Others: 0 };
      bookings.forEach(b => {
        let dist = 'Others';
        if (b.address) {
          const addr = b.address.toLowerCase();
          if (addr.includes('coimbatore')) dist = 'Coimbatore';
          else if (addr.includes('tiruppur') || addr.includes('tirupur')) dist = 'Tiruppur';
          else if (addr.includes('erode')) dist = 'Erode';
          else if (addr.includes('salem')) dist = 'Salem';
        }
        distMap[dist] = (distMap[dist] || 0) + (parseFloat(b.price) || 0);
      });
      
      districtRevenueList.innerHTML = Object.entries(distMap)
        .sort((a, b) => b[1] - a[1])
        .map(([dist, rev]) => `
          <div class="an-dist-row">
            <span>${dist}</span>
            <strong>₹ ${rev.toLocaleString('en-IN')}</strong>
          </div>
        `).join('');
    }
  }
}

/* ── Language Modal Logic ── */
function injectLanguageModal() {
  if (document.getElementById('lang-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'lang-modal-overlay';
  overlay.id = 'lang-modal-overlay';
  overlay.onclick = (e) => {
    if (e.target === overlay) closeLanguageModal();
  };

  overlay.innerHTML = `
    <div class="lang-modal">
      <div class="lang-modal-header">
        <div class="lang-modal-title" data-i18n="settings_language">Language</div>
        <button class="lang-modal-close" onclick="closeLanguageModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="lang-search-wrapper">
        <i class="fa-solid fa-search"></i>
        <input type="text" class="lang-search-input" id="lang-search-input" placeholder="Search language..." onkeyup="filterLanguages()">
      </div>
      <div class="lang-list" id="lang-list-container">
        <!-- Languages injected here -->
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function renderLanguageList(filterText = '') {
  const container = document.getElementById('lang-list-container');
  if (!container || !window.i18n) return;
  
  const langs = window.i18n.getLanguageList();
  const current = window.i18n.getCurrentLanguage();
  
  container.innerHTML = langs.filter(lang => 
    lang.name.toLowerCase().includes(filterText.toLowerCase()) || 
    lang.nativeName.toLowerCase().includes(filterText.toLowerCase())
  ).map(lang => `
    <div class="lang-item ${lang.code === current ? 'selected' : ''}" onclick="selectLanguage('${lang.code}')">
      <div class="lang-flag">${lang.flag}</div>
      <div class="lang-info">
        <span class="lang-native">${lang.nativeName}</span>
        <span class="lang-english">${lang.name}</span>
      </div>
      <i class="fa-solid fa-check lang-check"></i>
    </div>
  `).join('');
}

window.openLanguageModal = function() {
  injectLanguageModal();
  renderLanguageList();
  if (window.i18n) window.i18n.applyTranslations();
  document.getElementById('lang-search-input').value = '';
  document.getElementById('lang-modal-overlay').classList.add('active');
};

window.closeLanguageModal = function() {
  const overlay = document.getElementById('lang-modal-overlay');
  if (overlay) overlay.classList.remove('active');
};

window.selectLanguage = function(code) {
  if (window.i18n) {
    window.i18n.setLanguage(code);
    renderProfile(); // re-render profile to update language text
  }
  closeLanguageModal();
};

// Language filter
window.filterLanguages = function() {
  const input = document.getElementById('lang-search-input');
  if (input) renderLanguageList(input.value);
};

