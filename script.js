// Global data store
let mealData = {};

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

// Load data and initialize the app
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      mealData = data;
      renderWeekPlan();
      initializePage();
    })
    .catch(error => {
      console.error('Error fetching or parsing data:', error);
      const weekGrid = document.getElementById('weekGrid');
      weekGrid.innerHTML = '<p style="color: red; text-align: center;">Could not load meal plan. Please try again later.</p>';
    });
});

function renderWeekPlan() {
  const weekGrid = document.getElementById('weekGrid');
  weekGrid.innerHTML = ''; // Clear existing content

  mealData.weekPlan.forEach((dayData, dayIndex) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.dataset.dayIndex = dayIndex;

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.innerHTML = `<h2>${dayData.day}</h2>`;

    const dayContent = document.createElement('div');
    dayContent.className = 'day-content';

    const mealList = document.createElement('ul');
    dayData.meals.forEach(mealRef => {
      const meal = mealData.mealDatabase[mealRef.type][mealRef.mealIndex];
      const mealItem = document.createElement('li');
      mealItem.innerHTML = `<strong>${mealRef.type}:</strong> ${meal.description} <span class="meal-chip">${mealRef.type}</span>`;
      mealList.appendChild(mealItem);
    });

    dayContent.appendChild(mealList);

    const dayActions = document.createElement('div');
    dayActions.className = 'day-actions';
    dayActions.innerHTML = `
      <button class="btn btn-secondary change-meals-btn">Ändere Mahlzeiten</button>
      <button class="btn create-shopping-list-btn">Erstelle Einkaufsliste</button>
    `;

    dayEl.appendChild(dayHeader);
    dayEl.appendChild(dayContent);
    dayEl.appendChild(dayActions);
    weekGrid.appendChild(dayEl);
  });
}


function showModal(text, onConfirm, onCancel) {
  const modal = document.getElementById('modal');
  const modalText = document.getElementById('modal-text');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  modalText.innerHTML = text; // Use innerHTML to allow for list formatting

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
      }
    });

    if (todayEl) {
      todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // This part of the original script is very complex and depends on the old data structure.
    // I will simplify it for now, as the timeline marker is a secondary feature.
    // A proper implementation would require a more robust way of handling meal times.

    function updateTimeline() {
        if (!todayEl) return;

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const dayPlan = mealData.weekPlan[todayEl.dataset.dayIndex];
        if (!dayPlan) return;

        const mealTimes = dayPlan.meals.map(mealRef => {
            const meal = mealData.mealDatabase[mealRef.type][mealRef.mealIndex];
            // This is a simplification. The original HTML had times like "07:00 - Frühstück".
            // The current data structure doesn't have explicit times, so I'll use approximations.
            // A better data structure would include the time for each meal in weekPlan.
            switch(mealRef.type) {
                case 'Frühstück': return 7 * 60;
                case 'Snack': return (nowMinutes < 12 * 60) ? 10 * 60 : 16 * 60;
                case 'Mittag': return 13 * 60;
                case 'Abend': return 19 * 60;
                default: return 0;
            }
        }).sort((a,b) => a - b);

        const dayContent = todayEl.querySelector('.day-content');
        const contentHeight = dayContent.scrollHeight;

        // Approximate the position based on time of day
        const startOfDay = 7 * 60; // 7am
        const endOfDay = 21 * 60; // 9pm
        const percentOfDay = (nowMinutes - startOfDay) / (endOfDay - startOfDay);
        const yPos = contentHeight * percentOfDay;

        let marker = todayEl.querySelector('.time-marker');
        if (!marker) {
            marker = document.createElement('div');
            marker.className = 'time-marker';
            dayContent.appendChild(marker);
        }
        marker.style.top = `${yPos}px`;
        marker.setAttribute('data-time', now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
    }

    updateTimeline();
    setInterval(updateTimeline, 60000);
    window.addEventListener('resize', updateTimeline);
  })();

  // Print button
  (function() {
    const btn = document.getElementById('printBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.print();
    });
  })();

  // Change Meals button
  (function() {
    const weekGrid = document.getElementById('weekGrid');
    weekGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('change-meals-btn')) {
        const dayEl = e.target.closest('.day');
        const dayIndex = parseInt(dayEl.dataset.dayIndex, 10);
        changeMealsForDay(dayIndex);
      }
    });
  })();

  // Create Shopping List button
  (function() {
    const weekGrid = document.getElementById('weekGrid');
    weekGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('create-shopping-list-btn')) {
        const dayEl = e.target.closest('.day');
        const dayIndex = parseInt(dayEl.dataset.dayIndex, 10);
        createShoppingListForDay(dayIndex);
      }
    });
  })();

  // Weekly Shopping List button
  (function() {
    const btn = document.getElementById('weeklyShoppingListBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      createWeeklyShoppingList();
    });
  })();

  // Hamburger menu
  (function() {
    const menuToggle = document.getElementById('menu-toggle');
    const topbar = document.querySelector('.topbar');
    if (!menuToggle || !topbar) return;
    menuToggle.addEventListener('click', () => {
      topbar.classList.toggle('menu-open');
    });
  })();
}

function changeMealsForDay(dayIndex) {
  const dayPlan = mealData.weekPlan[dayIndex];
  dayPlan.meals.forEach(mealRef => {
    const mealType = mealRef.type;
    const currentMealIndex = mealRef.mealIndex;
    const mealOptionsCount = mealData.mealDatabase[mealType].length;

    let newMealIndex;
    do {
      newMealIndex = Math.floor(Math.random() * mealOptionsCount);
    } while (newMealIndex === currentMealIndex && mealOptionsCount > 1);

    mealRef.mealIndex = newMealIndex;
  });

  // Re-render the specific day that was changed
  const dayEl = document.querySelector(`.day[data-day-index='${dayIndex}']`);
  if (dayEl) {
    const mealList = dayEl.querySelector('ul');
    mealList.innerHTML = '';
    dayPlan.meals.forEach(mealRef => {
      const meal = mealData.mealDatabase[mealRef.type][mealRef.mealIndex];
      const mealItem = document.createElement('li');
      mealItem.innerHTML = `<strong>${mealRef.type}:</strong> ${meal.description} <span class="meal-chip">${mealRef.type}</span>`;
      mealList.appendChild(mealItem);
    });
  }
}

function createShoppingListForDay(dayIndex) {
  const dayPlan = mealData.weekPlan[dayIndex];
  const ingredients = new Set();

  dayPlan.meals.forEach(mealRef => {
    const meal = mealData.mealDatabase[mealRef.type][mealRef.mealIndex];
    meal.ingredients.forEach(ingredient => {
      ingredients.add(`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`);
    });
  });

  let shoppingListHtml = `<h3>Einkaufsliste für ${mealData.weekPlan[dayIndex].day}</h3><ul>`;
  ingredients.forEach(ingredient => {
    shoppingListHtml += `<li>${ingredient}</li>`;
  });
  shoppingListHtml += '</ul>';

  showModal(shoppingListHtml);
}

function createWeeklyShoppingList() {
  const weeklyIngredients = {};

  mealData.weekPlan.forEach(dayPlan => {
    dayPlan.meals.forEach(mealRef => {
      const meal = mealData.mealDatabase[mealRef.type][mealRef.mealIndex];
      meal.ingredients.forEach(ingredient => {
        const key = `${ingredient.name}-${ingredient.unit}`;
        if (weeklyIngredients[key]) {
          weeklyIngredients[key].quantity += ingredient.quantity;
        } else {
          weeklyIngredients[key] = { ...ingredient };
        }
      });
    });
  });

  let shoppingListHtml = '<h3>Wocheneinkaufsliste</h3><ul>';
  Object.values(weeklyIngredients).forEach(ingredient => {
    shoppingListHtml += `<li>${ingredient.quantity} ${ingredient.unit} ${ingredient.name}</li>`;
  });
  shoppingListHtml += '</ul>';

  showModal(shoppingListHtml);
}
