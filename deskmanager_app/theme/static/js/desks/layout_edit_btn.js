document.getElementById('layout-edit-btn').addEventListener('click', () => {
   fetch('/desk-management/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
      }) 
      .then(response => {
        if (response.ok) {
            window.location.href = '/desk-management/'
        } else {
            console.error('Failed to authorize user.');
        }
      })
      .catch(error => {
      console.error('Error during authorizing user: ', error);
      })
});
