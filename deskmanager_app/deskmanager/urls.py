"""
URL configuration for deskmanager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import Http404
from django.conf import settings
from django.conf.urls.static import static
from desks import views as desks_views
from users import views as user_views
from two_factor.urls import urlpatterns as tf_urls

def test_404(request):
    raise Http404("Test 404 error.")

urlpatterns = [
    #auth
    path('admin/', admin.site.urls),
    path('grappelli', include('grappelli.urls')),
    path('', include(tf_urls)),
    path('login/', include('django.contrib.auth.urls')),
    path('request-otp/', user_views.request_otp, name='request_otp'),
    path('verify-otp/', user_views.verify_otp_only, name='verify_otp'),
    path('user-logout/', user_views.user_logout, name='user-logout'),
    path('accounts/', include('django.contrib.auth.urls')),
    #loading data
    path('load-desk-layout/', desks_views.load_desk_layout, name='load-desk-layout'),
    path('load-desk-schedule/', desks_views.load_desk_schedule, name='load-desk-schedule'),
    path('load-rooms/', desks_views.load_rooms, name='load-rooms'),
    path('load-personal-schedule/', desks_views.load_personal_schedule, name='load-personal-schedule'),
    path('load-assigned-users/', desks_views.load_assigned_users, name='load-assigned-users'),
    path('search-users/', desks_views.search_users, name='search-users'),
    #assignment modification
    path('desk-management/', desks_views.desk_management, name='desk-management'),
    path('create-assignment/', desks_views.create_assignment, name='create-assignment'),
    path('remove-assignment/', desks_views.remove_assignment, name='remove-assignment'),
    #desk modification
    path('desk-create/', desks_views.desk_create, name='desk-create'),
    path('desk-read/', desks_views.desk_read, name='desk-read'),
    path('desk-update/', desks_views.desk_update, name='desk-update'),
    path('desk-remove/', desks_views.desk_remove, name='desk-remove'),
    #core
    path('', include('core.urls')),
]

if not settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
