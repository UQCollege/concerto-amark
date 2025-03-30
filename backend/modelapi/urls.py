
from django.urls import path, include
from .views import WritingTasksViewSet, RatersViewSet, assign_raters_view, ReviewAssignmentViewSet, clear_tasks_view
urlpatterns = [
    path('raters/', RatersViewSet.as_view({'get': 'list', 'post': 'create', 'put': 'update', 'delete': 'destroy'}), name='raters-api'),
    path('tasks/', WritingTasksViewSet.as_view({'get':'list'}), name='writing-tasks-list'),
    path('raters-assignment/', ReviewAssignmentViewSet.as_view({'get': 'list'}), name='assignment-api'),
    path('assign-tasks/', assign_raters_view, name='assign-tasks'),
    path('clear-tasks/', clear_tasks_view, name='clear-tasks'),
]
