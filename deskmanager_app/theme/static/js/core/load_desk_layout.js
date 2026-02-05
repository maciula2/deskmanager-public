function loadDesks(roomId) {
    if (!roomId || roomId === appState.currentRoom) return;
    fetch(`/load-desk-layout/?room_id=${roomId}`)
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('desk-layout-container');
        container.innerHTML = ''; 
  
        data.desks.forEach(desk => {
          const deskDiv = document.createElement('div');
          deskDiv.id = desk.id;
          deskDiv.className = 'desk-item draggable absolute w-[100px] h-[200px] bg-violet-500 rounded-md flex items-center justify-center select-none desk-label text-white font-semibold';
          deskDiv.style.left = desk.x + 'px';
          deskDiv.style.top = desk.y + 'px';
          deskDiv.style.width = desk.width + 'px';
          deskDiv.style.height = desk.height + 'px';
          deskDiv.innerText = desk.id;
          container.appendChild(deskDiv);
        });
      });
  }