( async function (){
    let config = {
        roomsLoaded: false,
    }

const roomSelectButton = document.getElementById('room-select-btn');
const roomSelectDropdown = document.getElementById('room-select-menu');
const roomSelectContainer = document.getElementById('room-select-container');

    roomSelectContainer.addEventListener('click', (e) => {
        const roomBtn = e.target.closest('.room-option');
        
        if (roomBtn) {
            const roomId = roomBtn.id;
            selectRoom(roomId);
        }
    });

    function selectRoom(roomId){
        appState.currentRoom = roomId;
        loadDesks(roomId);
    }
    
    roomSelectButton.addEventListener('click', async () => {
        roomSelectDropdown.classList.toggle('hidden');
        try {
            const response = await fetch('/load-rooms/');
            if (!response.ok) throw new Error("error");
            
            const result = await response.json();
            renderRooms(result.data)
            roomsLoaded = true;
        } catch (error) {
            console.error(error);
        }
    });
    
    function renderRooms(floors){

        roomSelectContainer.innerHTML = '';
        floors.forEach(floor => {
            roomSelectContainer.innerHTML+=(`<div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking- wider bg-gray-50">${floor.floor_label}</div>`)
            floor.rooms.forEach(room => {
                roomSelectContainer.innerHTML+=(`<a id="${room.room_id}" class="room-option block px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors cursor-pointer">${room.room_label}</a>`);
                })
            })
    }
})();
