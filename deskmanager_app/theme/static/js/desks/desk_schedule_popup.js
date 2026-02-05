(function() {
  const config = {
    api:{
      loadDeskSchedule: '/load-desk-schedule/?desk_id=',
    },
    workdays: {
      0: 'Poniedziałek',
      1: 'Wtorek',
      2: 'Środa',
      3: 'Czwartek',
      4: 'Piątek',
    },
    messages: {
      title: 'Kalendarz dla stanowiska:',
      deskAvailable: 'Dostępne',
      closeButtonText: 'Zamknij',
    },
  };
  const styles = {
    overlay: 'fixed inset-0 bg-gray-500/45 transition-opacity z-40',
    dialogWrapper: 'fixed inset-0 z-50 w-screen overflow-y-auto',
    dialogContainer: 'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0',
    dialogBox: 'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl',
    content:'bg-white px-4 pt-5 pb-4 sm:p-16 sm:pb-4',
    headerTitle:'text-base font-semibold text-gray-900',

    dayCard: {
      dayCardBorder: 'border-gray-200',
      dayCardText: 'text-gray-700',
      dayCardStatus: 'text-gray-400',

      dayCardBorderActive: 'bg-violet-50 border-violet-200',
      dayCardTextActive: 'text-violet-600',
      dayCardStatusActive: 'text-violet-400'
    }
  };
  
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // ~~~~~~~~~~~~~~ HTML TEMPLATE ~~~~~~~~~~~~~ //
  const deskPopupTemplate = `
  <div class="${styles.overlay}" aria-hidden="true"></div>
  <div class="${styles.dialogWrapper}" role="dialog" aria-modal="true">
    <div class="${styles.dialogContainer}">
      <div class="${styles.dialogBox}">
        <div class="${styles.content}">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="${styles.headerTitle}">
                ${config.messages.title} <span id="desk-name">desk_id</span>
              </h3>
              <div class="mt-4 grid grid-cols-5 gap-2 text-sm" id="week-grid"></div
            </div>
          </div>
        </div>
        <div class="bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button id="close-week-view" type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset sm:mt-0 sm:w-auto">
            ${config.messages.closeButtonText}
          </button>
        </div>
      </div>
    </div>
  </div>
  `;

  function openDeskPopup(assignments = {}, deskName) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = deskPopupTemplate;
    document.body.appendChild(wrapper);

    wrapper.querySelector('#desk-name').textContent = deskName;

    wrapper.querySelector('#close-week-view').addEventListener('click', () => {
      wrapper.remove();
    });

    const weekGrid = wrapper.querySelector('#week-grid');
    const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });

    Object.entries(config.workdays).forEach(([dayNumber, dayName]) => {
      dayNumber = parseInt(dayNumber);

      const dayCard = document.createElement('div');
      const isToday = dayName.toLowerCase() === today.toLowerCase();
      const assignedUsers = assignments.filter(a => a.weekday === dayNumber) || [];

      dayCard.className = `border rounded p-2 ${isToday ? styles.dayCard.dayCardBorderActive : styles.dayCard.dayCardBorder}`;
      dayCard.innerHTML = `
        <div class="font-medium text-center ${isToday ? styles.dayCard.dayCardTextActive : styles.dayCard.dayCardText}">
          ${dayName.substring(0, 3)}
        </div>
        <div class="mt-2 space-y-1.5">
          ${
            assignedUsers?.length
              ? assignedUsers
                  .map(
                    a => `
              <div class="border border-violet-200 text-xs p-1.5 bg-gradient-to-r from-violet-50 to-violet-100 rounded-md shadow-sm hover:border-violet-300 transition-all duration-200">
                <div class="truncate font-medium text-violet-700">${a.user}</div>
              </div>`
                  )
                  .join('')
               : `<div class="text-xs ${styles.dayCard.dayCardStatus} text-center py-2">${config.messages.deskAvailable}</div>`
          }
        </div>
      `;
      weekGrid.appendChild(dayCard);
    });
  }


  document.addEventListener('click', debounce(function (e) {
  if (e.target.classList.contains('desk-item')) {
    const deskId = e.target.id || 'none';

    fetch(`${config.api.loadDeskSchedule}${deskId}`)
      .then(response => response.json())
      .then(data => {
        openDeskPopup(data, deskId);
      });
    }
  }, 300))
})();