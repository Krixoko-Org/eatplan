// Global data store
let mealData = {};

// Theme toggle with localStorage
(function() {
  const body = document.body;
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
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
    btn.textContent = isLight ? '🌙' : '☀️';
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

      // Always initialize general components
      initializePage();

      // Page-specific initializations
      if (document.getElementById('weekGrid')) {
        renderWeekPlan();
        initializeIndexPage();
      }
      if (document.getElementById('lexikonContainer')) {
        renderLexikon();
      }
      if (document.getElementById('oxalateCalculator')) {
        populateFoodSelector();
        initializeOxalateCalculator();
      }
    })
    .catch(error => {
      console.error('Error fetching or parsing data:', error);
      const container = document.getElementById('weekGrid') || document.getElementById('lexikonContainer') || document.getElementById('oxalateCalculator');
      if (container) {
          container.innerHTML = '<p style="color: red; text-align: center;">Could not load data. Please try again later.</p>';
      }
    });
});

function renderLexikon() {
  const lexikonContainer = document.getElementById('lexikonContainer');
  if (!lexikonContainer || !mealData.lexikon) return;
  lexikonContainer.innerHTML = '';
  mealData.lexikon.sort((a, b) => a.term.localeCompare(b.term)).forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'lexikon-entry';
    const termEl = document.createElement('h3');
    termEl.textContent = entry.term;
    const definitionEl = document.createElement('p');
    definitionEl.textContent = entry.definition;
    entryEl.appendChild(termEl);
    entryEl.appendChild(definitionEl);
    lexikonContainer.appendChild(entryEl);
  });
}

function renderWeekPlan() {
  const weekGrid = document.getElementById('weekGrid');
  weekGrid.innerHTML = '';
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
    dayActions.innerHTML = `<button class="btn btn-secondary change-meals-btn">Ändere Mahlzeiten</button><button class="btn create-shopping-list-btn">Erstelle Einkaufsliste</button>`;
    dayEl.appendChild(dayHeader);
    dayEl.appendChild(dayContent);
    dayEl.appendChild(dayActions);
    weekGrid.appendChild(dayEl);
  });
}

function showModal(text, onConfirm, onCancel) {
  const modal = document.getElementById('modal');
  if (!modal) return;
  const modalText = document.getElementById('modal-text');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  modalText.innerHTML = text;
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
  (function() { // Hamburger menu
    const menuToggle = document.getElementById('menu-toggle');
    const topbar = document.querySelector('.topbar');
    if (!menuToggle || !topbar) return;
    menuToggle.addEventListener('click', () => {
      topbar.classList.toggle('menu-open');
    });
  })();
  (function() { // Live date/time in header
    const el = document.getElementById('now');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    function upd(){ el.textContent = fmt.format(new Date()); }
    upd();
    setInterval(upd, 1000 * 30);
  })();
}

function initializeIndexPage() {
  initializeHydrationTracker();
  (function() { // Browser notifications
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
          const message = (hours < 9 ? 'Frühstück' : hours < 12 ? 'Snack' : hours < 15 ? 'Mittagessen' : hours < 18 ? 'Snack' : 'Abendessen');
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
          showModal('Möchtest du Benachrichtigungen für Essens-Erinnerungen aktivieren?', () => document.getElementById('notifyBtn').click(), () => {});
        }
        localStorage.setItem('askedNotify', 'yes');
      }, 5000);
    }
  })();
  (function() { // Current day highlighting and time marker
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
    function updateTimeline() {
      if (!todayEl) return;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const dayPlan = mealData.weekPlan[todayEl.dataset.dayIndex];
      if (!dayPlan) return;
      const dayContent = todayEl.querySelector('.day-content');
      const contentHeight = dayContent.scrollHeight;
      const startOfDay = 7 * 60;
      const endOfDay = 21 * 60;
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
  (function() { // Print button
    const btn = document.getElementById('printBtn');
    if (!btn) return;
    btn.addEventListener('click', () => window.print());
  })();
  (function() { // Change Meals button
    const weekGrid = document.getElementById('weekGrid');
    if (!weekGrid) return;
    weekGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('change-meals-btn')) {
        const dayEl = e.target.closest('.day');
        const dayIndex = parseInt(dayEl.dataset.dayIndex, 10);
        changeMealsForDay(dayIndex);
      }
    });
  })();

  (function() { // Create Shopping List button
    const weekGrid = document.getElementById('weekGrid');
    if (!weekGrid) return;
    weekGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('create-shopping-list-btn')) {
        const dayEl = e.target.closest('.day');
        const dayIndex = parseInt(dayEl.dataset.dayIndex, 10);
        createShoppingListForDay(dayIndex);
      }
    });
  })();
  (function() { // Weekly Shopping List button
    const btn = document.getElementById('weeklyShoppingListBtn');
    if (!btn) return;
    btn.addEventListener('click', () => createWeeklyShoppingList());
  })();
}

function initializeHydrationTracker() {
  const tracker = document.getElementById('hydrationTracker');
  if (!tracker) return;
  const progressBar = document.getElementById('hydrationProgressBar');
  const status = document.getElementById('hydrationStatus');
  const controls = tracker.querySelector('.hydration-controls');
  const resetBtn = document.getElementById('resetHydrationBtn');
  const GOAL = 2500;
  const STORAGE_KEY = 'hydrationData';
  let currentAmount = 0;
  function loadData() {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const today = new Date().toISOString().slice(0, 10);
    if (savedData && savedData.date === today) {
      currentAmount = savedData.amount;
    } else {
      currentAmount = 0;
      saveData();
    }
  }
  function saveData() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ amount: currentAmount, date: today }));
  }
  function updateUI() {
    const percentage = Math.min((currentAmount / GOAL) * 100, 100);
    progressBar.style.width = `${percentage}%`;
    status.textContent = `${currentAmount} / ${GOAL} ml`;
    if (currentAmount >= GOAL) {
      progressBar.style.backgroundColor = 'var(--primary-strong)';
    } else {
      progressBar.style.backgroundColor = 'var(--primary)';
    }
  }
  function addAmount(amount) {
    currentAmount += amount;
    updateUI();
    saveData();
  }
  function resetAmount() {
    currentAmount = 0;
    updateUI();
    saveData();
  }
  const addButtons = controls.querySelectorAll('button[data-amount]');
  addButtons.forEach(button => {
    button.addEventListener('click', () => {
      const amount = parseInt(button.dataset.amount, 10);
      addAmount(amount);
    });
  });

  resetBtn.addEventListener('click', resetAmount);
  loadData();
  updateUI();
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
  const personCount = document.getElementById('person-count').value || 1;
  const categorizedIngredients = {};
  dayPlan.meals.forEach(mealRef => {
    const meal = mealData.mealDatabase[mealRef.type][mealRef.mealIndex];
    meal.ingredients.forEach(ingredient => {
      if (!categorizedIngredients[ingredient.category]) {
        categorizedIngredients[ingredient.category] = [];
      }
      const scaledQuantity = ingredient.quantity * personCount;
      categorizedIngredients[ingredient.category].push(`${scaledQuantity} ${ingredient.unit} ${ingredient.name}`);
    });
  });
  let shoppingListHtml = `<h3>Einkaufsliste für ${mealData.weekPlan[dayIndex].day}</h3>`;
  for (const category in categorizedIngredients) {
    shoppingListHtml += `<h4>${category}</h4><ul>`;
    categorizedIngredients[category].forEach(ingredient => {
      shoppingListHtml += `<li>${ingredient}</li>`;
    });
    shoppingListHtml += '</ul>';
  }
  showModal(shoppingListHtml);
}

function populateFoodSelector() {
    const selector = document.getElementById('foodSelector');
    if (!selector || !mealData.oxalateFoods) return;
    const sortedFoods = [...mealData.oxalateFoods].sort((a, b) => a.name.localeCompare(b.name));
    selector.innerHTML = '<option value="">Lebensmittel auswählen...</option>'; // Clear previous options
    sortedFoods.forEach(food => {
        const option = document.createElement('option');
        option.value = food.name;
        option.textContent = `${food.name} (${food.value} mg/100g)`;
        selector.appendChild(option);
    });
}

function initializeOxalateCalculator() {
    const calculator = document.getElementById('oxalateCalculator');
    if (!calculator) return;
    const foodSelector = document.getElementById('foodSelector');
    const quantityInput = document.getElementById('foodQuantity');
    const addBtn = document.getElementById('addFoodBtn');
    const mealList = document.getElementById('mealList');
    const totalOxalateEl = document.getElementById('totalOxalate');
    const resetBtn = document.getElementById('resetCalcBtn');
    let currentMeal = [];
    function renderMeal() {
        mealList.innerHTML = '';
        let totalOxalate = 0;
        currentMeal.forEach((item, index) => {
            const oxalateForItem = (item.quantity / 100) * item.food.value;
            totalOxalate += oxalateForItem;
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.food.name} (${item.quantity}g) - <strong>${oxalateForItem.toFixed(1)} mg</strong></span><button class="remove-item-btn" data-index="${index}">&times;</button>`;
            mealList.appendChild(li);
        });
        totalOxalateEl.textContent = `${totalOxalate.toFixed(1)} mg`;
    }
    addBtn.addEventListener('click', () => {
        const selectedFoodName = foodSelector.value;
        const quantity = parseInt(quantityInput.value, 10);
        if (!selectedFoodName || !quantity || quantity <= 0) {
            showModal('Bitte wählen Sie ein Lebensmittel aus und geben Sie eine gültige Menge ein.');
            return;
        }
        const food = mealData.oxalateFoods.find(f => f.name === selectedFoodName);
        if (!food) return;
        currentMeal.push({ food, quantity });
        renderMeal();
        quantityInput.value = '';
        foodSelector.value = '';
    });
    mealList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            currentMeal.splice(index, 1);
            renderMeal();
        }
    });
    resetBtn.addEventListener('click', () => {
        currentMeal = [];
        renderMeal();
    });
}

function createWeeklyShoppingList() {
  const weeklyIngredients = {};
  const personCount = document.getElementById('person-count').value || 1;
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
  const categorizedIngredients = {};
  Object.values(weeklyIngredients).forEach(ingredient => {
    if (!categorizedIngredients[ingredient.category]) {
      categorizedIngredients[ingredient.category] = [];
    }
    const scaledQuantity = ingredient.quantity * personCount;
    categorizedIngredients[ingredient.category].push(`${scaledQuantity} ${ingredient.unit} ${ingredient.name}`);
  });
  let shoppingListHtml = '<h3>Wocheneinkaufsliste</h3>';
  for (const category in categorizedIngredients) {
    shoppingListHtml += `<h4>${category}</h4><ul>`;
    categorizedIngredients[category].forEach(ingredient => {
      shoppingListHtml += `<li>${ingredient}</li>`;
    });
    shoppingListHtml += '</ul>';
  }
  showModal(shoppingListHtml);
}