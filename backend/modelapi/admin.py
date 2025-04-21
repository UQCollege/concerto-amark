from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, WritingTask, AssessmentTask, Student, BEClass
# Register your models here.

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'rater_digital_id', 'active', 'classes', 'task_access']  # Add any fields you want to see

@admin.register(WritingTask)
class WritingTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'student_name', 'trait', 'started_time', 'response']  # Show columns in list view

@admin.register(AssessmentTask)
class AssessmentTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'active','writing_task', 'get_rater', 'ta', 'gra', 'voc', 'coco', 'comments', 'completed', 'update_by', 'update_date']  # Adjust fields to match your model
    @admin.display(description='Rater')
    def get_rater(self, obj):
        return obj.rater.rater_digital_id  # Adjust based on your actual Raters model

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'first_name', 'last_name', 'classes']  # Show columns in list view


@admin.register(BEClass)
class BEClassAdmin(admin.ModelAdmin):
    list_display = ['class_name']  # Show columns in list view
