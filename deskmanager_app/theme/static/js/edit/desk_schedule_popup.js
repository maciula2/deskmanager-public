(function(){
  const config = {
    api: {
      createAssignment: '/create-assignment/',
      removeAssignment: '/remove-assignment/',
      loadPersonalSchedule: '/load-personal-schedule/?user_id=',
      loadDeskSchedule: '/load-desk-schedule/?desk_id=',
      searchUsers: '/search-users/?q='
    },
    workdays: {
      0: 'Poniedziałek',
      1: 'Wtorek',
      2: 'Środa',
      3: 'Czwartek',
      4: 'Piątek',
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
      assignTitle: 'Przypisz stanowisko',
      deskTitle: 'Stanowisko',
      userTitle: 'Użytkownik',
      guideAvailable: 'Dostępne',
      guideAssigned: 'Przypisane (obecny użytkownik)',
      guideAlreadySomewhere: 'Przypisane (obecny użytkownik, inne stanowisko)',
      guideTaken: 'Zajęte',
    },
  };

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }



  function openDeskPopup(assignments = {}, deskName) {
    // ====================================================== //
    // ==================== HTML TEMPLATE =================== //
    // ====================================================== //  
    
  const deskPopupTemplate = `
  <div id="modal-container" class="relative z-50" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true"></div>

    <div class="fixed inset-0 z-50 w-screen overflow-hidden">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        
        <div class="relative transform overflow-hidden rounded-lg bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
          
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                  Edycja użytkowników dla: <span id="desk-name" class="text-violet-600">${deskName}</span>
                </h3>
                <p class="mt-1 text-sm text-gray-500">Pokój: <span id="desk-room" class="font-medium">${appState.currentRoom}</span></p>
              </div>
            </div>
          </div>

          <div class="bg-white px-4 py-5 sm:p-6 overflow-hidden">
            <div class="space-y-6">
              
              <div>
                <label for="user-search" class="block text-sm font-medium text-gray-700 mb-1">Wyszukaj użytkownika</label>
                <div class="relative mt-1 rounded-md">
                  <input type="text" id="user-search" 
                        class="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6" 
                        placeholder="Imię, nazwisko lub e-mail">
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="border border-gray-200 rounded-xl overflow-hidden bg-white ">
                <div class="max-h-48 overflow-y-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Użytkownik</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Działanie</th>
                      </tr>
                    </thead>
                    <tbody id="user-list" class="divide-y divide-gray-200 bg-white">
                      <tr>
                        <td colspan="2" class="px-4 py-8 text-center text-sm text-gray-500">
                          Wpisz co najmniej 3 znaki, aby wyszukać użytkownika 
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-4">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Obecny terminarz</h4>
                <div id="current-assignment" class="bg-gray-50 rounded-xl p-4 ring-1 ring-gray-200/50">
                  <div class="grid grid-cols-5 gap-2 text-sm" id="week-grid">
                    </div>
                </div>
              </div>

            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
            <button id="close-edit-popup" type="button" 
                    class="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto">
              Zamknij
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
  `;
  
    const wrapper = document.createElement('div');
    wrapper.innerHTML = deskPopupTemplate;
    document.body.appendChild(wrapper);

    wrapper.querySelector('#desk-name').textContent = deskName;

    wrapper.querySelector('#close-edit-popup').addEventListener('click', () => {
      wrapper.remove();
    });

    wrapper.querySelector('[aria-hidden="true"]').addEventListener('click', () => {
      wrapper.remove();
    });

    const weekGrid = wrapper.querySelector('#week-grid');

    const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });

    const renderWeekGrid = () => {
      weekGrid.innerHTML = '';

      Object.entries(config.workdays).forEach(([dayNumber, dayName]) => {
        dayNumber = parseInt(dayNumber);
        const isToday = dayName.toLowerCase() === today.toLowerCase();
        const assignedUsers = assignments.filter(a => a.weekday === dayNumber);

        const dayCard = document.createElement('div');
        dayCard.className = `border rounded p-2 ${isToday ? 'bg-violet-50 border-violet-200' : 'border-gray-200'}`;
        dayCard.innerHTML = `
          <div class="font-medium text-center ${isToday ? 'text-violet-600' : 'text-gray-700'}">
            ${dayName.substring(0, 3)}
          </div>
          <div class="mt-2 space-y-1">
            ${
              assignedUsers.length
                ? assignedUsers.map(a => `
                    <div class="text-xs group relative p-1 bg-gray-100 rounded overflow-hidden">
                      <button class="remove-btn w-full text-left truncate transition-all duration-200" 
                        data-day="${dayNumber}" 
                        data-user="${a.user}">
                        ${a.user}
                        <div class="select-none absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                        <span class="text-red-600 text-xs font-semibold">Usuń</span>
                      </div>
                      </button>
                    </div>
                  `).join('')
                : '<div class="select-none text-xs text-gray-400 text-center py-2">Dostępne</div>'
            }
          </div>
        `;

        dayCard.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            removeAssignment(day);
          });
        });

        weekGrid.appendChild(dayCard);
      });
    };

    const removeAssignment = (day) => {
      fetch('/remove-assignment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          desk_id: deskName,
          claim_day: day
        }),
      })
      .then(response => {
        if (response.ok) {
          const index = assignments.findIndex(a => a.weekday === parseInt(day));
          if (index > -1) assignments.splice(index, 1);
          renderWeekGrid();
        } else {
          console.error('Failed to remove assignment.');
        }
      })
      .catch(error => {
        console.error('Error removing assignment: ', error);
      });
    };

    // ====================================================== //
    // ===================== USER SEARCH ==================== //
    // ====================================================== //

    const userListTbody = wrapper.querySelector('#user-list');
    const userSearchInput = wrapper.querySelector('#user-search');

    const getUserAssignments = (user) => {
      return fetch(`${config.api.loadPersonalSchedule}${user.id}`)
        .then(result =>{
          return result.json();
        });
    }

    const addUserToTable = (user, deskName) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      row.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center">
            <div class="ml-3">
              <div style="display: flex;">
                <div class="text-sm font-medium text-gray-900">${user.first_name} ${user.last_name}</div>
                <div class="text-sm text-gray-500">&ensp;(@${user.username})</div>
              </div>
              <div class="text-sm text-gray-500">${user.email}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
          <button class="assign-btn text-xs text-violet-600 hover:text-violet-900 px-3 py-1 rounded border border-transparent hover:border-violet-200 hover:bg-violet-50 transition-colors" 
            data-user="${user.username}">
            Przypisz
          </button>
        </td>
      `;

      row.querySelector('.assign-btn').addEventListener('click', () => {
        getUserAssignments(user).then(userAssignments => {
          showDaySelectionDialog(user, deskName, userAssignments);
        })
      });

      userListTbody.appendChild(row);
    };

    const showDaySelectionDialog = (user, deskName, userAssignments) => {
      const dayDialog = document.createElement('div');
      dayDialog.className = 'fixed inset-0 bg-gray-500/45 transition-opacity z-50 flex items-center justify-center p-4';
      dayDialog.innerHTML = `
        <div class="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <div class="mb-6">
            <h3 class="text-xl font-semibold leading-6 text-gray-900 mb-2">
              ${config.messages.assignTitle}
            </h3>
            <p class="text-sm text-gray-500">
              ${config.messages.userTitle}: <span class="font-medium text-gray-900">${user.username}</span>
            </p>
            <p class="text-sm text-gray-500">
              ${config.messages.deskTitle}: <span class="font-medium text-gray-900">${deskName}</span>
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">Wybierz dzień</label>
            <div class="grid grid-cols-5 gap-3">
              ${Object.entries(config.workdays).map(([dayNumber, dayName]) => {
                const isAlreadyTaken = assignments.some(a => a.weekday == parseInt(dayNumber) && a.user != user.username && a.desk_id != deskName)
                const isAssignedOnDay = assignments.some(a => a.weekday === parseInt(dayNumber) && a.user === user.username);
                const isAlreadyAssigned = userAssignments.some(a => a.weekday == parseInt(dayNumber) && a.desk_id != deskName);
                
                let bgColor, borderColor, textColor, hoverBg, cursor;
                let disabled = isAlreadyTaken || isAlreadyAssigned;
                
                if (isAlreadyAssigned) {
                  bgColor = '#fee2e2';
                  borderColor = '#dc2626';
                  textColor = '#7f1d1d';
                  hoverBg = '#fca5a5';
                  cursor = 'not-allowed';
                } else if (isAlreadyTaken) {
                  bgColor = '#dbeafe';
                  borderColor = '#3b82f6';
                  textColor = '#1e3a8a';
                  hoverBg = '#93c5fd';
                  cursor = 'not-allowed';
                } else if (isAssignedOnDay) {
                  bgColor = '#ede9fe';
                  borderColor = '#9333ea';
                  textColor = '#581c87';
                  hoverBg = '#d8b4fe';
                  cursor = 'not-allowed';
                } else {
                  bgColor = '#ffffff';
                  borderColor = '#d1d5db';
                  textColor = '#1f2937';
                  hoverBg = '#f3f4f6';
                  cursor = 'pointer';
                }
                
                return `
                <button 
                  class="day-select-btn py-3 px-2 border-1 rounded-lg text-sm font-semibold flex flex-col items-center justify-center transition-all"
                  style="background-color: ${bgColor}; border-color: ${borderColor}; color: ${textColor}; cursor: ${cursor};"
                  onmouseover="if(this.style.cursor !== 'not-allowed') this.style.backgroundColor='${hoverBg}'"
                  onmouseout="this.style.backgroundColor='${bgColor}'"
                  ${disabled ? 'disabled' : ''}
                  data-day="${dayNumber}">
                  <div>${dayName.substring(0, 3)}</div>
                </button>
              `;
              }).join('')}
            </div>
          </div>

          <div class="mb-6 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span class="text-gray-700">${config.messages.guideAvailable}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-violet-100 border-2 border-violet-600 rounded"></div>
              <span class="text-gray-700">${config.messages.guideAssigned}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-100 border-2 border-red-600 rounded"></div>
              <span class="text-gray-700">${config.messages.guideAlreadySomewhere}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
              <span class="text-gray-700">${config.messages.guideTaken}</span>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button class="cancel-day-select mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
            Zamknij
          </button>
          </div>
        </div>
      `;

      dayDialog.querySelectorAll('.day-select-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          const day = btn.getAttribute('data-day')
          assignUser(user.id, day, deskName);
          dayDialog.remove();
        });
      });

      dayDialog.querySelector('.cancel-day-select').addEventListener('click', () => {
        dayDialog.remove();
      });

      document.body.appendChild(dayDialog);
    };

    const assignUser = (userId, day, deskId) => {
      fetch(config.api.createAssignment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          desk_id: deskId,
          claim_day: day,
          user_id: userId
        })
      })
      .then(response => {
        if (response.ok) {
          fetch(`${config.api.loadDeskSchedule}${deskName}`)
            .then(res => res.json())
            .then(data => {
              assignments.length = 0;
              assignments.push(...data);
              renderWeekGrid(); 
            });
        } else {
          console.error(`Failed to assign user`);
        }
      })
      .catch(error => {
        console.error('Error assigning user: ', error);
      });
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

      fetch(`${config.api.searchUsers}${encodeURIComponent(query)}`)
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

          users.forEach(user => addUserToTable(user, deskName));
          
        })
        .catch(error => {
          console.error('Error fetching users: ', error);
          userListTbody.innerHTML = `
            <tr>
              <td colspan="2" class="px-4 py-3 text-center text-sm text-red-500">
                Error loading users
              </td>
            </tr>
          `;
        });
    }, 300));

    renderWeekGrid();
    userSearchInput.focus();
  };

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('desk-item') && !appState.editMode) {
      const deskId = e.target.id || 'none';

      fetch(`${config.api.loadDeskSchedule}${deskId}`)
        .then(response => response.json())
        .then(data => {
          if(appState.editMode === false){
            openDeskPopup(data, deskId);
          }
        });
      }
  });

})();