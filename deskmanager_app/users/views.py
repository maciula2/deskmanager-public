import json
import pyotp
import time
from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings
from users.models import CustomUser

def send_otp_email(user_email, otp):
    subject = "Kod logowania"
    message = f'Twój kod weryfikacyjny dla logowania do DeskManager to: {otp}. Kod jest ważny przez 5 minut.'
    from_email = settings.DEFAULT_FROM_EMAIL
    try:
        send_mail(subject, message, from_email, [user_email])
    except Exception as e:
        print(f"Email Error: {e}")

def request_otp(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        identifier = data.get('identifier', '').strip()
        
        if not identifier:
             return JsonResponse({'status': 'error', 'message': 'Brak identyfikatora.'}, status=400)

        # --- 1. ATOMIC LOCK (Prevents Spam/Race Conditions) ---
        # We create a unique lock key for this specific email address
        lock_key = f"otp_lock_{identifier}"
        
        # cache.add returns True if it successfully set the key, False if it already exists.
        # timeout=60 means this email is locked for 60 seconds.
        if not cache.add(lock_key, "locked", timeout=60):
            return JsonResponse({
                'status': 'error', 
                'message': 'Zbyt wiele prób. Odczekaj 60s.'
            }, status=429)

        # --- 2. LOGIC ---
        try:
            user = CustomUser.objects.get(email=identifier)
        except CustomUser.DoesNotExist:
            # Even if user doesn't exist, the lock is active, so they can't spam fake emails either.
            return JsonResponse({'status': 'sent'})
        
        otp_secret = pyotp.random_base32()
        totp = pyotp.TOTP(otp_secret, interval=300)
        otp_code = totp.now()

        
        request.session['pre_auth_user_id'] = user.pk
        request.session['otp_secret'] = otp_secret
        request.session['otp_attempts'] = 0
        request.session.save()

        send_otp_email(user.email, otp_code)

        return JsonResponse({'status': 'sent'})
    
    return JsonResponse({'status': 'error'}, status=405)

def verify_otp_only(request):
    if request.method == 'POST':
        MAX_ATTEMPTS = 3
        attempts = request.session.get('otp_attempts', 0)
        
        if attempts >= MAX_ATTEMPTS:
            request.session.flush()
            return JsonResponse({
                'status': 'error',
                'message': 'Zbyt wiele błędnych prób. Wygeneruj nowy kod.'
            }, status=403)

        data = json.loads(request.body)
        user_otp = data.get('otp')
        user_id = request.session.get('pre_auth_user_id')
        otp_secret = request.session.get('otp_secret')

        if not user_id or not otp_secret:
            return JsonResponse({'status': 'error', 'message': 'Sesja wygasła.'}, status=401)
        
        totp = pyotp.TOTP(otp_secret, interval=300)
        
        if totp.verify(user_otp):
            try:
                user = CustomUser.objects.get(pk=user_id)
                login(request, user)
                
                keys_to_clear = ['pre_auth_user_id', 'otp_secret', 'otp_attempts']
                for key in keys_to_clear:
                    request.session.pop(key, None)
                
                
                return JsonResponse({'status': 'success'})
            except CustomUser.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Błąd użytkownika.'}, status=404)
        else:
            attempts += 1
            request.session['otp_attempts'] = attempts
            remaining = MAX_ATTEMPTS - attempts
            return JsonResponse({
                'status': 'error', 
                'message': f'Błędny kod. Pozostało prób: {remaining}'
            }, status=401)
            
    return JsonResponse({'status': 'error'}, status=405)

def user_logout(request):
    logout(request)
    return redirect('/')