from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.shortcuts import render, redirect

@login_required(login_url='/accounts/login/')
def landing_page(request):
    return render(request, 'base.html')