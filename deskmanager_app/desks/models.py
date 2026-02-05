from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FloorData(models.Model):
    floor_id = models.CharField(default='floor_', primary_key=True, max_length=100)
    floor_label = models.CharField(default='Piętro ', max_length=100)
    class Meta:
        managed = True
        db_table='dm_floors'
        verbose_name_plural = "Floors"

    def __str__(self):
        return f"{self.floor_id}"

class RoomData(models.Model):
    room_id = models.CharField(default='room_', primary_key=True, max_length=50)
    room_label = models.CharField(default='Pokój ', max_length=50)
    floor = models.ForeignKey(
        'FloorData',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='rooms',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table='dm_rooms'
        verbose_name_plural = "Rooms"
    
    def __str__(self):
        if self.floor:
            return f"{self.room_id}, {self.floor.floor_id} "
        else:
            return f"${self.room_id}, no floor assigned."

class DeskData(models.Model):
    desk_id = models.CharField(default='desk_', primary_key=True, max_length=100)
    room_id = models.ForeignKey(RoomData, on_delete=models.CASCADE, related_name='desks', db_column='room_id')
    x = models.FloatField(default=0)
    y = models.FloatField(default=0)
    width = models.FloatField(default=100)
    height = models.FloatField(default=200)
    
    
    class Meta:
        managed = True
        db_table='dm_desks'
        verbose_name_plural = "Desks"
        constraints = [
            models.UniqueConstraint(
                fields=['desk_id'],
                name='unique_desk_id'
            )
        ]
    
    def __str__(self):
        return f"{self.desk_id}"

class BookSchedule(models.Model):
    WEEKDAYS = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
    ]
    desk_id = models.ForeignKey(DeskData, on_delete=models.SET_NULL, null=True, blank=True, db_column='desk_id')
    desk_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    claim_day = models.IntegerField(choices=WEEKDAYS)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        managed = True
        db_table='dm_schedule'
        verbose_name_plural = "Schedule assignments"
        constraints = [
            models.UniqueConstraint(
                fields=['desk_user', 'claim_day'],
                name='unique_user_per_day'
            ),
            models.UniqueConstraint(
                fields=['desk_id', 'claim_day'],
                name='one_user_per_day'
            ),
            
        ]
        
    def __str__(self):
        return f"{self.desk_id}"
    
    
