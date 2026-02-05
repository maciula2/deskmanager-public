const editDeskPopupTemplate = `
  <div class="fixed inset-0 bg-gray-500/45 transition-opacity z-40" aria-hidden="true"></div>
<div class="fixed inset-0 z-50 w-screen overflow-y-auto" role="dialog" aria-modal="true">
  <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
    <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
      <!-- Header -->
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
        <div class="sm:flex sm:items-start">
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
            <h3 class="">
              Assign User to: <span id="desk-name">desk_1</span>
            </h3>
            <p class="mt-1 text-sm text-gray-500">Current room: <span id="desk-room" class="font-medium">${appState.currentRoom}</span></p>
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="bg-white px-4 py-5 sm:p-6">
        <div class="space-y-6">
          <!-- User Search -->
          <div>
            <label for="user-search" class="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <div class="relative mt-1 rounded-md shadow-sm">
              <input type="text" id="user-search" class="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 focus:border-violet-500 focus:ring-violet-500 sm:text-sm" placeholder="Type user name or email">
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <!-- User List -->
          <div class="overflow-hidden border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody id="user-list" class="bg-white divide-y divide-gray-200">
                <!-- Sample user row (replace with dynamic content) -->
                <tr>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">JD</div>
                      <div class="ml-3">
                        <div class="text-sm font-medium text-gray-900">John Doe</div>
                        <div class="text-sm text-gray-500">john.doe@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">IT</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button class="text-violet-600 hover:text-violet-900">Assign</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Current Assignment -->
          <div class="border-t pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Current Assignment</h4>
            <div id="current-assignment" class="bg-gray-50 rounded-lg p-3">
              <!-- Will be populated dynamically -->
              <p class="text-sm text-gray-500 italic">No user currently assigned</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button id="save-assignment" type="button" class="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 sm:ml-3 sm:w-auto">
          Save Changes
        </button>
        <button id="close-edit-popup" type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
`;
