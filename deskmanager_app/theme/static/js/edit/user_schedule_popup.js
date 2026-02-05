(function() {
  const config = {
    minSearchChars: 3,
    debounceDelay: 300,
    api: {
      searchUsers: '/search-users/?q=',
      createAssignment: '/create-assignment/',
      removeAssignment: '/remove-assignment/',
      loadPersonalSchedule: '/load-personal-schedule/?user_id=',
    },
    workdays: {
      0: 'Poniedziałek',
      1: 'Wtorek',
      2: 'Środa',
      3: 'Czwartek',
      4: 'Piątek'
    },
    messages: {
      title: 'Edycja terminarza użytkowników',
      searchLabel: 'Wyszukaj użytkownika',
      searchPlaceholder: 'nazwa użytkownika, imię i nazwisko lub e-mail',
      userTableHeader: 'Użytkownik',
      actionTableHeader: 'Działanie',
      editButtonText: 'Edytuj terminarz',
      closeButtonText: 'Zamknij', 
      minCharsMessage: 'Wprowadź co najmniej 3 znaki',
      noUsersFound: 'Nie znaleziono użytkowników',
      loadError: 'Błąd ładowania użytkowników',
      userScheduleTitle: 'Terminarz dla użytkownika',
      removeButtonText: 'Usuń',
      availableText: 'Dostępne',
      assignmentError: 'Failed to assign user',
      removeError: 'Failed to remove assignment.',
    },
  };

  const styles = {
    overlay: 'fixed inset-0 bg-gray-500/45 transition-opacity z-40',
    dialogWrapper: 'fixed inset-0 z-50 w-screen overflow-y-auto',
    dialogContainer: 'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0',
    dialogBox: 'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl',
    header: 'bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200',
    headerTitle: 'text-lg font-medium leading-6 text-gray-900',
    deskNameSpan: 'font-semibold',
    content: 'bg-white px-4 py-5 sm:p-6',
    searchInput: 'block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 focus:border-violet-500 focus:ring-violet-500 sm:text-sm',
    tableContainer: 'overflow-hidden border border-gray-200 rounded-lg',
    tableScrollable: 'max-h-64 overflow-y-auto',
    table: 'min-w-full divide-y divide-gray-200',
    tableHeader: 'bg-gray-50 sticky top-0 z-10',
    tableBody: 'bg-white divide-y divide-gray-200',
    footer: 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6',
    closeButton: 'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto',
    userRow: 'hover:bg-gray-50',
    editButton: 'text-xs text-violet-600 hover:text-violet-900 px-3 py-1 rounded border border-transparent hover:border-violet-200 hover:bg-violet-50 transition-colors',
    dayDialog: 'fixed inset-0 bg-gray-500/45 transition-opacity z-50 flex items-center justify-center',
    dayDialogInner: 'bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col',
  };

  function debounce(func, wait){
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
  };


  function openUserEditPopup() {
      // ~~~~~~~~~~~~~~ SZABLON HTML ~~~~~~~~~~~~~ //
      const userEditPopupTemplate = `
          <div class="${styles.overlay}" aria-hidden="true"></div>
          <div class="${styles.dialogWrapper}" role="dialog" aria-modal="true">
            <div class="${styles.dialogContainer}">
              <div class="${styles.dialogBox}">
                <!-- Header -->
                <div class="${styles.header}">
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 class="${styles.headerTitle}">
                        ${config.messages.title} <span id="desk-name" class="${styles.deskNameSpan}"></span>
                      </h3>
                    </div>
                  </div>
                </div>
                
                <!-- Main Content -->
                <div class="${styles.content}">
                  <div class="space-y-6">
                    <!-- User Search -->
                    <div>
                      <label for="user-search" class="block text-sm font-medium text-gray-700 mb-1">${config.messages.searchLabel}</label>
                      <div class="relative mt-1 rounded-md shadow-sm">
                        <input type="text" id="user-search" class="${styles.searchInput}" placeholder="${config.messages.searchPlaceholder}">
                        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <!-- User List -->
                  <div class="${styles.tableContainer}">
                    <div class="${styles.tableScrollable}">
                      <table class="${styles.table}">
                        <thead class="${styles.tableHeader}">
                          <tr>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${config.messages.userTableHeader}</th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${config.messages.actionTableHeader}</th>
                          </tr>
                        </thead>
                        <tbody id="user-list" class="${styles.tableBody}">
                          <tr>
                            <td colspan="2" class="px-4 py-3 text-center text-sm text-gray-500">${config.messages.minCharsMessage}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                </div>
                
                <!-- Footer -->
                <div class="${styles.footer}">
                  <button id="close-edit-popup" type="button" class="${styles.closeButton}">
                    ${config.messages.closeButtonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
          `;
        
          const workdays = config.workdays;
        
          const wrapper = document.createElement('div');
          wrapper.innerHTML = userEditPopupTemplate;
          document.body.appendChild(wrapper);
        
          wrapper.querySelector('#close-edit-popup').addEventListener('click', () => {
            wrapper.remove();
          });
        
          wrapper.querySelector('[aria-hidden="true"]').addEventListener('click', () => {
            wrapper.remove();
          });
        
      // ~~~~~~~~~~~~~~ WYSZUKIWANIE UŻYTKOWNIKA ~~~~~~~~~~~~~ //
        
          const userListTbody = wrapper.querySelector('#user-list');
          const userSearchInput = wrapper.querySelector('#user-search');
        
          const addUserToTable = (user) => {
            const userDisplay = {
              username: user.username,
              email: user.email,
              buttonText: config.messages.editButtonText,
              buttonClasses: styles.editButton,
            };

            const row = document.createElement('tr');
            row.className = styles.userRow;
            
            row.innerHTML = `
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">${userDisplay.username}</div>
                    <div class="text-sm text-gray-500">${userDisplay.email}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <button class="${userDisplay.buttonClasses}"
                  data-user="${userDisplay.username}">
                  ${userDisplay.buttonText}
                </button>
              </td>
            `;
        
            row.querySelector('button').addEventListener('click', () => {
              showDaySelectionDialog(user);
            });
        
            userListTbody.appendChild(row);
          };
      
          // ~~~~~~~~~~~~~~ WYBÓR DNIA ~~~~~~~~~~~~~ // 
          const showDaySelectionDialog = (user) => {
              const dayDialog = document.createElement('div');
              dayDialog.className = styles.dayDialog;
              dayDialog.innerHTML = `
                <div class="${styles.dayDialogInner}">
                  <!-- Header and Content -->
                  <div class="p-6 flex-1">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
                      ${config.messages.userScheduleTitle} ${user.username}
                    </h3>

                    <!-- Week Grid -->
                    <div class="mt-4 grid grid-cols-5 gap-2 text-sm" id="week-grid"></div>
                    </div>
                    
                  <!-- Footer -->
                  <div class="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-200">
                  <button id="close-edit-popup" type="button" class="cancel-day-select inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500">
                      ${config.messages.closeButtonText}
                  </button>
                  </div>
                </div>
              `;
            
              // ~~~~~~~~~~~~~~ WEEK GRID ~~~~~~~~~~~~~~ //
              const weekGrid = dayDialog.querySelector('#week-grid');
              const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });

              fetch(`/load-personal-schedule/?user_id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                  const assignments = {};
                  data.forEach(item => {
                    assignments[item.weekday] = item;
                  });

                  Object.entries(workdays).forEach(([workdayIndex, dayLabel]) => {
                    const assignment = assignments[workdayIndex];
                    const isToday = dayLabel.toLowerCase() === today.toLowerCase();
                    const dayCard = document.createElement('div');

                    // debug

                    // debug
                    dayCard.className = `border rounded p-2 ${isToday ? 'bg-violet-50 border-violet-200' : 'border-gray-200'}`;
                    dayCard.innerHTML = `
                      <div class="font-medium text-center ${isToday ? 'text-violet-600' : 'text-gray-700'}">
                        ${dayLabel.substring(0, 3)}
                      </div>
                      <div class="mt-2 space-y-1">
                        ${
                          assignment
                            ?
                                `<div class="text-xs group relative p-1 bg-gray-100 rounded overflow-hidden">
                                  <button class="remove-btn w-full text-left truncate transition-all duration-200" 
                                    data-day="${workdayIndex}" 
                                    data-desk="${assignment.desk_id}">
                                    ${assignment.desk_id}
                                    <div class="select-none absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                                    <span class="text-red-600 text-xs font-semibold">${config.messages.removeButtonText}</span>
                                  </div>
                                  </button>
                                </div>
                              `
                            : `<div class="select-none text-xs text-gray-400 text-center py-2">${config.messages.availableText}</div>`
                        }</div>`
  
                      
                      dayCard.querySelectorAll('.remove-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                          e.stopPropagation();
                          const day = btn.getAttribute('data-day');
                          console.log('Attempted to remove an assignment.');
                        });
                      });
                      
                      weekGrid.appendChild(dayCard);
                  });
                
                  dayDialog.querySelectorAll('.day-select-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                      const day = btn.getAttribute('data-day');
                      dayDialog.remove();
                    });
                  });
                })

              dayDialog.querySelector('.cancel-day-select').addEventListener('click', () => {
                dayDialog.remove();
              });
              document.body.appendChild(dayDialog);
            };
            

          userSearchInput.addEventListener('input', debounce(function(e) {
            const query = e.target.value.trim();
            
            if (query.length < 3) {
              userListTbody.innerHTML = `
                <tr>
                  <td colspan="2" class="px-4 py-3 text-center text-sm text-gray-500">
                    ${config.messages.minCharsMessage}
                  </td>
                </tr>
              `;
              return;
            }
        
            fetch(`/search-users/?q=${encodeURIComponent(query)}`)
              .then(response => response.json())
              .then(users => {                
                userListTbody.innerHTML = '';
        
                if (users.length === 0) {
                  userListTbody.innerHTML = `
                    <tr>
                      <td colspan="2" class="px-4 py-3 text-center text-sm text-gray-500">
                        ${config.messages.noUsersFound}
                      </td>
                    </tr>
                  `;
                  return;
                }
        
                users.forEach(user => addUserToTable(user));
              })
              .catch(error => {
                console.error('Error fetching users: ', error);
                userListTbody.innerHTML = `
                  <tr>
                    <td colspan="2" class="px-4 py-3 text-center text-sm text-red-500">
                      ${config.messages.loadError}
                    </td>
                  </tr>
                `;
              });
          }, 300));
          
        
          // Initial focus
          userSearchInput.focus();
  }
  document.getElementById('schedule-edit-view-btn')?.addEventListener('click', debounce(function (e) {
    openUserEditPopup();
  }, 300))
})();