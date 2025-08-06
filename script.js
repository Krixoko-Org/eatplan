// Theme toggle with localStorage
(function() {
  const body = document.body;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || 'light';
  body.classList.toggle('light', saved === 'light');
  body.classList.toggle('dark', saved === 'dark');
  updateBtn();

  btn.addEventListener('click', () => {
    const isLight = body.classList.contains('light');
    body.classList.toggle('light', !isLight);
    body.classList.toggle('dark', isLight);
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
    updateBtn();
  });

  function updateBtn(){
    const isLight = body.classList.contains('light');
    btn.textContent = isLight ? '🌙 Dark' : '☀️ Light';
    btn.setAttribute('aria-pressed', (!isLight).toString());
  }
})();

// Dynamically load meal plan
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      const weekGrid = document.getElementById('weekGrid');
      weekGrid.innerHTML = ''; // Clear existing content
      data.weekPlan.forEach(dayData => {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `<h2>${dayData.day}</h2>`;

        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';

        const mealList = document.createElement('ul');
        dayData.meals.forEach(meal => {
          const mealItem = document.createElement('li');
          mealItem.innerHTML = `<strong>${meal.time} – ${meal.type}:</strong> ${meal.description} <span class="meal-chip">${meal.type}</span>`;
          mealList.appendChild(mealItem);
        });

        dayContent.appendChild(mealList);
        dayEl.appendChild(dayHeader);
        dayEl.appendChild(dayContent);
        weekGrid.appendChild(dayEl);
      });

      // After loading data, initialize other scripts that depend on the DOM
      initializePage();
    })
    .catch(error => {
      console.error('Error fetching or parsing data:', error);
      const weekGrid = document.getElementById('weekGrid');
      weekGrid.innerHTML = '<p style="color: red; text-align: center;">Could not load meal plan. Please try again later.</p>';
    });
});


function showModal(text, onConfirm, onCancel) {
  const modal = document.getElementById('modal');
  const modalText = document.getElementById('modal-text');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  modalText.textContent = text;

  // Clone and replace buttons to remove old event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  newConfirmBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (onConfirm) onConfirm();
  });

  newCancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (onCancel) onCancel();
  });

  if (onCancel) {
    newCancelBtn.style.display = 'inline-block';
  } else {
    newCancelBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function initializePage() {
  // Browser notifications opt-in and simple reminders
  (function() {
    const btn = document.getElementById('notifyBtn');
    if (!btn) return;
    let reminderIntervalId = null;

    btn.addEventListener('click', async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showModal('Benachrichtigungen wurden nicht erlaubt.');
          return;
        }
        new Notification('Benachrichtigungen aktiviert', { body: 'Du erhältst Erinnerungen zu Mahlzeiten.' });

        if (reminderIntervalId) clearInterval(reminderIntervalId);
        reminderIntervalId = setInterval(() => {
          const hours = new Date().getHours();
          const message = (
            hours < 9 ? 'Frühstück' : hours < 12 ? 'Snack' : hours < 15 ? 'Mittagessen' : hours < 18 ? 'Snack' : 'Abendessen'
          );
          new Notification('Essens-Erinnerung', { body: `Zeit für: ${message}. Viel trinken nicht vergessen!` });
        }, 3 * 60 * 60 * 1000);
      } catch (e) {
        console.error(e);
        showModal('Benachrichtigungen konnten nicht aktiviert werden.');
      }
    });

    if (!('Notification' in window)) return;
    const asked = localStorage.getItem('askedNotify');
    if (!asked) {
      setTimeout(() => {
        if (Notification.permission === 'default') {
          showModal(
            'Möchtest du Benachrichtigungen für Essens-Erinnerungen aktivieren?',
            () => document.getElementById('notifyBtn').click(),
            () => {}
          );
        }
        localStorage.setItem('askedNotify', 'yes');
      }, 5000);
    }
  })();

  // Live date/time in header
  (function() {
    const el = document.getElementById('now');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    function upd(){ el.textContent = fmt.format(new Date()); }
    upd();
    setInterval(upd, 1000 * 30);
  })();

  // Current day highlighting and time marker
  (function() {
    const weekDays = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    const todayIndex = new Date().getDay();
    const todayName = weekDays[todayIndex];

    let todayEl = null;
    document.querySelectorAll('.day').forEach(day => {
      const h2 = day.querySelector('.day-header h2');
      if (h2 && h2.textContent.trim() === todayName) {
        day.classList.add('today');
        todayEl = day;
      } else {
        day.classList.remove('today');
        day.querySelectorAll('.time-marker, .time-band').forEach(n => n.remove());
      }
    });

    if (todayEl) {
      todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    function fmtTime(d){ return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
    function toMinutes(hhmm){ const [h,m] = hhmm.split(':').map(Number); return h*60 + (m||0); }

    function getAnchorsForDay(dayEl){
      const anchors = [];
      const items = dayEl.querySelectorAll('li');
      const re = /^(\d{2}:\d{2})\s*[–-]/;
      items.forEach(li => {
        const strong = li.querySelector('strong');
        if (!strong) return;
        const text = strong.textContent.trim();
        const m = text.match(re);
        if (!m) return;
        const timeStr = m[1];
        const rect = li.getBoundingClientRect();
        const parentRect = dayEl.getBoundingClientRect();
        const y = rect.top - parentRect.top + dayEl.scrollTop;
        anchors.push({ minutes: toMinutes(timeStr), y });
      });
      return anchors.sort((a,b)=>a.minutes-b.minutes);
    }

    function updateMarker() {
      if (!todayEl) return;
      const anchors = getAnchorsForDay(todayEl);
      if (anchors.length === 0) return;

      const now = new Date();
      const nowMin = now.getHours()*60 + now.getMinutes();

      let y;
      if (nowMin <= anchors[0].minutes) {
        y = anchors[0].y;
      } else if (nowMin >= anchors[anchors.length-1].minutes) {
        y = anchors[anchors.length-1].y;
      } else {
        for (let i=0; i<anchors.length-1; i++) {
          const a = anchors[i], b = anchors[i+1];
          if (nowMin >= a.minutes && nowMin <= b.minutes) {
            const t = (nowMin - a.minutes) / Math.max(1, (b.minutes - a.minutes));
            y = a.y + t * (b.y - a.y);
            break;
          }
        }
      }

      let marker = todayEl.querySelector('.time-marker');
      let band = todayEl.querySelector('.time-band');
      if (!marker) { marker = document.createElement('div'); marker.className = 'time-marker'; todayEl.appendChild(marker); }
      if (!band) { band = document.createElement('div'); band.className = 'time-band'; todayEl.appendChild(band); }

      const headerH = (todayEl.querySelector('.day-header')?.offsetHeight || 0);
      const minTop = headerH + 8;
      const content = todayEl.querySelector('.day-content');
      const maxTop = (content?.getBoundingClientRect().bottom || todayEl.getBoundingClientRect().bottom) - todayEl.getBoundingClientRect().top - 16;
      const top = Math.min(maxTop, Math.max(minTop, y));
      marker.style.top = top + 'px';
      band.style.top = top + 'px';
      marker.setAttribute('data-time', fmtTime(now));
    }

    updateMarker();
    setInterval(updateMarker, 30 * 1000);
    window.addEventListener('resize', updateMarker);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateMarker(); });
  })();

  // Print button
  (function() {
    const btn = document.getElementById('printBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.print();
    });
  })();
}
