from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
from .models import Raters, WritingTasks, ReviewAssignment
# Register your models here.

@admin.register(Raters)
class RatersAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'rater_digital_id']  # Add any fields you want to see

@admin.register(WritingTasks)
class WritingTasksAdmin(admin.ModelAdmin):
    list_display = ['id', 'student_name', 'trait', 'started_time', 'response']  # Show columns in list view

@admin.register(ReviewAssignment)
class ReviewAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'writing_task', 'get_rater', 'ta', 'gra', 'voc', 'coco', 'completed']  # Adjust fields to match your model
    @admin.display(description='Rater')
    def get_rater(self, obj):
        return obj.rater.rater_digital_id  # Adjust based on your actual Raters model