from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, WritingTask, AssessmentTask, Student, BEClass
from .readonly_models import UtilAppPelaWritingseed
# Register your models here.
class ReadOnlyAdminClass(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False 

@admin.register(UtilAppPelaWritingseed)
class UtilappeelawritingseedAdmin(ReadOnlyAdminClass):
    list_display=[
    "id",
    "active",
    "created_at",
    "updated_at",
    "deleted_at",
    "created_by",
    "updated_by",
    "deleted_by",
    "change_reason",
    "severity",
    "session_id",
    "trait",
    "response",
    "words_count",
    "started_time",
    "test_id",
    "user_id",
    "user_login",
    "timetaken",
    "data_split"
]


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'first_name', 'last_name','rater_digital_id', 'active', 'classes', 'task_access']  # Add any fields you want to see

@admin.register(WritingTask)
class WritingTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'data_split', 'student_code', 'trait', 'task_description', 'started_time', 'response', 'update_by', 'update_date']  # Show columns in list view

@admin.register(AssessmentTask)
class AssessmentTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'active','writing_task', 'get_rater', 'ta', 'gra', 'voc', 'coco', 'comments', 'completed', 'update_by', 'update_date']
    sortable_by = ['id', 'active', 'ta', 'gra', 'voc', 'coco', 'completed', 'update_by', 'update_date']  # Only model fields, not methods

    @admin.display(description='Rater')
    def get_rater(self, obj):
        return obj.rater.rater_digital_id  # Adjust based on your actual Raters model

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_code', 'student_digital_id', 'student_can',  'first_name', 'last_name', 'classes', 'update_by', 'update_date']  # Show columns in list view


@admin.register(BEClass)
class BEClassAdmin(admin.ModelAdmin):
    list_display = ['class_desc', 'class_name']  # Show columns in list view
