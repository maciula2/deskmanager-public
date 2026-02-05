(function () {
	const config = {
		messages: {
			closeButtonText: 'Zamknij',
		},
	};

	const personalPopupTemplate = `
	<div class="fixed inset-0 bg-gray-500/45 transition-opacity z-50" aria-hidden="true"></div>
	<div class="fixed inset-0 z-50 w-screen overflow-y-auto" role="dialog" aria-modal="true">
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
		<div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
			<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
			<div class="sm:flex sm:items-start">
				<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
				<h3 class="text-base font-semibold text-gray-900">
					Kalendarz użytkownika <span id="user-name">${document.getElementById('username_display').textContent}</span>
				</h3>
				<div class="mt-4 grid grid-cols-5 gap-2 text-sm" id="week-grid"></div>
				</div>
			</div>
			</div>
			<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
			<button id="close-week-view" type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto">
				${config.messages.closeButtonText}
			</button>
			</div>
		</div>
		</div>
	</div
	`;

	function openPersonalPopup(assignments) {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = personalPopupTemplate;
		document.body.appendChild(wrapper);
	
		wrapper.querySelector('#close-week-view').addEventListener('click', () => {
		wrapper.remove();
		});
		
		const weekGrid = wrapper.querySelector('#week-grid');
		const workdays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];
		var today = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });
	
		workdays.forEach((day, dayIndex) => {
		const dayCard = document.createElement('div');
		const isToday = day.toLowerCase() === today.toLowerCase();
		dayCard.className = `border rounded p-2 ${isToday ? 'bg-violet-50 border-violet-200' : 'border-gray-200'}`;
		
		const dayAssignments = assignments.filter(a => a.weekday === dayIndex);
		
		dayCard.innerHTML = `
			<div class="font-medium text-center ${isToday ? 'text-violet-600' : 'text-gray-700'}">
			${day.substring(0, 3)}
			<div class="mt-2 space-y-1.5">
			${
				dayAssignments?.length
				? dayAssignments.map(a => `
				<div class="border border-violet-200 text-xs p-1.5 bg-white rounded-md shadow-sm">
				<div class="truncate font-medium text-gray-600 text-semibold">${a.floor_label}</div>
					<div class="truncate font-medium text-violet-700">${a.desk_id}</div>
				</div>`).join('')
				: '<div class="text-xs text-gray-400 text-center py-2">Brak</div>'
			}
        	</div>
		`;
		weekGrid.appendChild(dayCard);
		});
	}
	
	document.getElementById('user-assigned-btn').addEventListener('click', ()=> {
	const deskUserId = JSON.parse(document.getElementById('user_id').textContent);
		return fetch(`/load-personal-schedule/?user_id=${deskUserId}`)
		.then(response => response.json())
		.then(data => {
			return openPersonalPopup(data)
			})

		});
})();