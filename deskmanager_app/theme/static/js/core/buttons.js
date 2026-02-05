document.querySelectorAll('.room-option').forEach(div => {
    div.addEventListener('click', () => {
      const roomId = div.getAttribute('value');
      loadDesks(roomId);
      appState.currentRoom = roomId;
    });
  });

document.getElementById('logout-btn').addEventListener('click', () => {
    fetch('/user-logout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
    })
    .then(response => {
      if (response.ok) {
        window.location.href = '/accounts/login';
      } else {
        console.error('Failed to log out');
      }
    })
    .catch(error => {
      console.error('Error during logout: ', error);
    })
  })

