import json
from django.http import JsonResponse
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.contrib.auth.models import User
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.decorators.http import etag
from desks.models import *

from users.models import CustomUser

WEEKDAYS = {
    0: 'Poniedziałek',
    1: 'Wtorek',
    2: 'Środa',
    3: 'Czwartek',
    4: 'Piątek',
}

#* impressive. very nice. 
def rooms_etag(request):
    last_update = RoomData.objects.aggregate(Max('updated_at'))['updated_at__max']
    return str(last_update.timestamp()) if last_update else "empty" 

@login_required(redirect_field_name='/accounts/login')
@etag(rooms_etag)
def load_rooms(request):
    if request.method == 'GET':
        floors = FloorData.objects.prefetch_related('rooms').all()
        data = []
        
        for floor in floors:
            data.append({
                'floor': floor.floor_id,
                'floor_label': floor.floor_label,
                'rooms': [
                    {
                        'room_id': room.room_id,
                        'room_label': room.room_label,
                    }
                    for room in floor.rooms.all()
                ]
            })
        unassignedRooms = RoomData.objects.filter(floor__isnull=True)
        if unassignedRooms.exists():
            data.append({
                'floor_name': 'unassigned',
                'room_id': [{'room_id': r.room_id} for r in unassignedRooms]
            })
    return JsonResponse({'data': data})

@login_required(redirect_field_name='/accounts/login')
def load_desk_layout(request):
    data = []
    if request.method == 'GET':
        room_id = request.GET.get('room_id')
        if not room_id:
            return JsonResponse({'status': 'error', 'message': 'room_id is required'}, status=400)
        room = RoomData.objects.get(room_id=room_id)
        desks = DeskData.objects.filter(room_id=room)
        data = [
            {
                "id": desk.desk_id,
                "x": desk.x,
                "y": desk.y,
                "width": desk.width,
                "height": desk.height,
            }
            for desk in desks
        ]            
    return JsonResponse({'desks': data}, safe=False)

@login_required(redirect_field_name='/accounts/login')
def load_desk_schedule(request):
    if request.method == 'GET':
        desk_id = request.GET.get('desk_id')
        if not desk_id:
            return JsonResponse({'status': 'error', 'message': 'desk_id is required'}, status=400)
        assignments_qs = BookSchedule.objects.filter(desk_id=desk_id)
        assignments = [
            {'weekday': int(a.claim_day), 'user': CustomUser.objects.get(id=a.desk_user_id).username}
            for a in assignments_qs
        ]
    return JsonResponse(assignments, safe=False)

@login_required(redirect_field_name='/accounts/login')
def load_personal_schedule(request):
    if request.method == 'GET':
        user_id = CustomUser.objects.get(id=request.GET.get('user_id'))
        if not user_id:
            return JsonResponse({'status': 'error', 'message': 'user_id is required'}, status=400)
        assignment_qs = BookSchedule.objects.filter(desk_user_id=user_id)
        assignments = [
            {'weekday': int(a.claim_day), 'desk_id': str(a.desk_id), 'floor_label': str(a.desk_id.room_id.floor.floor_label)}
            for a in assignment_qs
        ]

    return JsonResponse(assignments, safe=False)

@login_required(redirect_field_name='/accounts/login')  
def load_assigned_users(request):
    if request.method == 'GET':
        room_id = request.GET.get('room_id')
        week_day = request.GET.get('week_day')
        if not room_id:
            return JsonResponse({'status': 'error', 'message': 'room_id is required'}, status=400)
        if not week_day:
            return JsonResponse({'status': 'error', 'message': 'week_day is required'}, status=400)
        desks = DeskData.objects.filter(room_id=room_id)
        assignments = BookSchedule.objects.filter(
            claim_day=week_day,
            desk_id__in=desks
        ).select_related('desk_id', 'desk_user_id')

        users = []
        for assign in assignments:
            users.append({
                'id': str(assign.desk_id.desk_id),
                'user': assign.desk_user_id.username
            })
    return JsonResponse(users, safe=False)

# ======================================================== #
# ================ MODYFIKACJA KALENDARZA ================ #
# ======================================================== #

@staff_member_required
def desk_management(request):
    return render(request, 'edit.html')

@staff_member_required 
def create_assignment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = CustomUser.objects.get(id=data.get('user_id', None)).id
            desk_id = DeskData.objects.get(desk_id=data.get('desk_id', None))
            claim_day = data.get('claim_day', None)
            if BookSchedule.objects.filter(desk_id=desk_id, claim_day=claim_day, desk_user_id=user_id).exists():
                return JsonResponse({'status': 'failed', 'error': 'Assignment already exists.'}, status=400)
            try:
                BookSchedule.objects.create(desk_id=desk_id, claim_day=claim_day, desk_user_id=user_id)
                return JsonResponse({'status': 'success'})
            except IntegrityError as e:
                return JsonResponse({'status': 'failed', 'error': 'Assignment already exists or constraint error.'}, status=400)
            
        except json.JSONDecodeError as e:
            print('Decoding error', e)
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'error'})
            
@staff_member_required
def remove_assignment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            desk_id = data.get('desk_id', None)
            claim_day = data.get('claim_day', None)
            BookSchedule.objects.filter(desk_id=desk_id, claim_day=claim_day).delete()
            
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError as e:
            print('Decoding error', e)
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'error'})

@staff_member_required
def search_users(request):
    query = request.GET.get('q', '')
    if query:
        users = CustomUser.objects.filter(username__icontains=query) | CustomUser.objects.filter(email__icontains=query) | CustomUser.objects.filter(first_name__icontains=query) |CustomUser.objects.filter(last_name__icontains=query)
    else:
        users = User.objects.none()
    user_data = [{"id": user.id, "username": user.username, "email": user.email, "first_name": user.first_name, "last_name": user.last_name} for user in users]
    return JsonResponse(user_data, safe=False)

# ======================================================== #
# ================== MODYFIKACJA BIUREK ================== #
# ======================================================== #

@staff_member_required
def desk_update(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            desk_id = data.get('desk_id', None)
            data_x = data.get('x', None)
            data_y = data.get('y', None)
            data_width = data.get('width', None)
            data_height = data.get('height', None)
            DeskData.objects.filter(desk_id=desk_id).update(x=data_x, y=data_y, width=data_width, height = data_height)
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError as e:
            print('Decoding error', e)
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'error'})

@staff_member_required
def desk_create(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            desk_id = data.get('desk_id', None)
            room_id = data.get('room_id', None)
            width = data.get('width', None)
            height = data.get('height', None)
            if not (desk_id or room_id or width or height):
                return JsonResponse({'status': 'error', 'message': 'one of the request parameters is missing'}, status=400)
            try:
                DeskData.objects.create(desk_id=desk_id, room_id=RoomData.objects.get(room_id=room_id), width=width, height=height, x=0, y=0)
                return JsonResponse({'status': 'success', 'message': f'Desk f{desk_id} created.'})
            except IntegrityError:
                return JsonResponse({'status': 'failed', 'error': f'Desk with given id already exists.'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid JSON format.'
                }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

@staff_member_required
def desk_remove(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            desk_id = data.get('desk_id', None)
            if not desk_id:
                return JsonResponse({'status': 'error', 'message': 'Missing desk_id'}, status=400)
            with transaction.atomic():
                desk = DeskData.objects.get(desk_id=desk_id)
                BookSchedule.objects.filter(desk_id=desk_id).delete()
                desk.delete()
            return JsonResponse({'status': 'success', 'message': f'Desk {desk_id} removed.'})
        except DeskData.DoesNotExist:
            return JsonResponse({
                'status': 'failed',
                'message': f'Desk with id {desk_id} does not exist'
                }, status=404)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON format.'
                }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
                }, status=500)
        
@staff_member_required
def desk_read(request):
    if request.method == 'GET':
        desk_id = request.GET.get('desk_id')
        if not desk_id:
            return JsonResponse({'status': 'error', 'message': 'desk_id is required'})
        desk = DeskData.objects.get(desk_id=desk_id)
        data = {
                "id": desk.desk_id,
                "x": desk.x,
                "y": desk.y,
                "width": desk.width,
                "height": desk.height
            }
    return JsonResponse(data, safe=False)
