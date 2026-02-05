// Helper to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.getElementById('login-btn').addEventListener('click', async (event) => {
    event.preventDefault();

    const btn = event.currentTarget;
    const btnText = document.getElementById('login_default_state');
    const identifierInput = document.getElementById('login-field');
    const otpInput = document.getElementById('password');
    const warning = document.getElementById('incorrect-warning');
    const warningText = warning.querySelector('p');

    const identifier = identifierInput.value;
    const otp = otpInput.value;

    if (!identifier) {
        warning.classList.remove('hidden');
        warningText.innerText = "Wprowadź poprawny email.";
        return;
    }

    if (otpInput.classList.contains('hidden')) {
        try {
            const response = await fetch('/request-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                body: JSON.stringify({ identifier: identifier })
            });

            const data = await response.json();

            if (response.ok && data.status === 'sent') {
                // Success: Show OTP field and lock identifier
                otpInput.classList.remove('hidden');
                identifierInput.readOnly = true;
                identifierInput.classList.add('select-none');
                identifierInput.classList.add('bg-gray-100');
                btnText.innerText = "Zweryfikuj kod";
                warning.classList.add('hidden');
            } else {
                // Error (e.g., 429 Rate Limit)
                warning.classList.remove('hidden');
                warningText.innerText = data.message || "Błąd wysyłania kodu.";
            }
        } catch (e) {
            console.error(e);
        }
    } 
    
    else {
        if (!otp) {
            warning.classList.remove('hidden');
            warningText.innerText = "Wprowadź otrzymany kod.";
            return;
        }
        btn.disabled = true;
        try {
            const response = await fetch('/verify-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                body: JSON.stringify({ otp: otp })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                window.location.href = '/';
            } else {
                warning.classList.remove('hidden');
                warningText.innerText = data.message || "Błędny kod.";
                
                // If 403 (Too many attempts), reset the form so they have to request a new code
                if (response.status === 403) {
                    otpInput.classList.add('hidden');
                    otpInput.value = "";
                    identifierInput.readOnly = false;
                    identifierInput.classList.remove('select-none');
                    identifierInput.classList.remove('bg-gray-100');
                    btnText.innerText = "Login";
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
});