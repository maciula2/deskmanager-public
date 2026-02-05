async function fetchAssignedUsernames(roomId, weekDay) {
    const res = await fetch(`/load-assigned-users/?room_id=${roomId}&week_day=${weekDay}`);
    const data = await res.json();
    return Object.values(data);
};

async function loadDesksEdit(roomId) {
    if (!roomId || appState.currentRoom != roomId) return;

    const res = await fetch(`/load-desk-layout/?room_id=${roomId}`);
    const data = await res.json();
    const container = document.getElementById('desk-layout-container');

    container.innerHTML = '';

    data.desks.forEach(desk => {
      const deskDiv = document.createElement('div');
      deskDiv.id = desk.id;
      deskDiv.textContent = appState.userDisplayMode.active ? '' : desk.id;
      deskDiv.className = `
        desk-item absolute
        bg-violet-500 text-white font-semibold text-md
        rounded-xl shadow-md
        flex items-center justify-center select-none
      `.trim();
      deskDiv.style.position = 'absolute';

      let posX = desk.x || 0;
      let posY = desk.y || 0;

      Object.assign(deskDiv.style, {
            width: `${desk.width}px`,
            height: `${desk.height}px`,
            position: 'absolute',
            left: '0',
            top: '0',
            transform: `translate(${posX}px, ${posY}px)`
      });

      deskDiv.setAttribute('data-x', posX);
      deskDiv.setAttribute('data-y', posY);

      interact(deskDiv).resizable({
        edges: {left: false, right: true, bottom: true, top: false},
          modifiers: [
            interact.modifiers.snapSize({
              targets: [
                { width: 10, height: 10 },
                interact.snappers.grid({ width: 10, height: 10 }),
              ],
            }),
          ],
        listeners: {
          move (event) {
            let target = event.target
            let x = (parseFloat(target.getAttribute('data-x')) || 0);
            let y = (parseFloat(target.getAttribute('data-y')) || 0);

            target.style.width = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';

            x += event.deltaRect.left;
            y += event.deltaRect.top;

            target.style.transform = `translate(${x}px, ${y}px)`
          }
        }
      });
      interact(deskDiv).resizable(false);

      interact(deskDiv).draggable({
            modifiers: [
                interact.modifiers.restrict({
                    restriction: container,
                    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                })
            ],
            listeners: {
                move(event) {
                    let target = event.target;
                    let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
                    target.setAttribute('data-x', Math.round(x));
                    target.setAttribute('data-y', Math.round(y));
                }
            }
        });
      interact(deskDiv).draggable(false);

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