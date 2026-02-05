
async function fetchAssignedUsernames(roomId, weekDay) {
    const res = await fetch(`/load-assigned-users/?room_id=${roomId}&week_day=${weekDay}`);
    const data = await res.json();
    return Object.values(data);
};

async function loadDesks(roomId) {
    if (!roomId) return;
    const res = await fetch(`/load-desk-layout/?room_id=${roomId}`);
    const data = await res.json();
    const container = document.getElementById('desk-layout-container');

    container.innerHTML = '';

    data.desks.forEach(desk => {
      const deskDiv = document.createElement('div')
      deskDiv.id = desk.id;
      deskDiv.textContent = appState.userDisplayMode.active ? '' : desk.id;
      deskDiv.className = `
            desk-item absolute
            bg-violet-500 text-white font-semibold text-md
            rounded-xl shadow-md
            flex items-center justify-center select-none
            cursor-pointer
            touch-none
      `.trim();

      Object.assign(deskDiv.style, {
        left: `${desk.x}px`,
        top: `${desk.y}px`,
        width: `${desk.width}px`,
        height: `${desk.height}px`,
      });
      container.appendChild(deskDiv);
    });
    if (appState.userDisplayMode.active) {
      const assignments = await fetchAssignedUsernames(roomId, appState.userDisplayMode.selectedDay);

      assignments.forEach(assign => {
        const deskEl = document.getElementById(assign.id);
        if (deskEl) {
          deskEl.textContent = assign.user || '';
        }
      });
    }
}