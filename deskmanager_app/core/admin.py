from django.contrib import admin
from django.core.exceptions import ValidationError
from desks.models import DeskData, RoomData, FloorData, BookSchedule


@admin.register(DeskData)
class DeskDataAdmin(admin.ModelAdmin):
    list_display = ('desk_id', 'room_id', 'x', 'y', 'width', 'height')
    search_fields = ('desk_id',)
    
@admin.register(RoomData)
class RoomDataAdmin(admin.ModelAdmin):
    list_display = ('room_id', 'room_label', 'floor')

@admin.register(FloorData)
class FloorDataAdmin(admin.ModelAdmin):
    list_display = ('floor_id', 'floor_label')

@admin.register(BookSchedule)
class BookScheduleAdmin(admin.ModelAdmin):
    list_filter = ('claim_day', 'is_active',)
    list_display = ('desk_id', 'desk_user', 'claim_day')
    ordering = ('claim_day', 'is_active')
    search_fields = ["desk_user__username"]
    def save_model(self, request, obj, form, change):
        if BookSchedule.objects.filter(
            desk_user=obj.desk_user,
            claim_day=obj.claim_day
        ).exclude(pk=obj.pk).exists():
            raise ValidationError(f"{obj.desk_user} posiada już rezerwację dla tego dnia.")
        super().save_model(request, obj, form, change)