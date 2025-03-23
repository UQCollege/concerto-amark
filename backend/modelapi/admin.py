from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Raters, WritingTasks, ReviewAssignment
# Register your models here.

admin.site.register(Raters, UserAdmin)
admin.site.register(WritingTasks)
admin.site.register(ReviewAssignment)
