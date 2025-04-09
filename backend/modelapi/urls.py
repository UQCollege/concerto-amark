
from django.urls import path, include
from .views import WritingTaskViewSet, RaterViewSet, assign_raters_view, AssessmentTaskViewSet, clear_tasks_view, assign_to_all
urlpatterns = [
    path('raters/', RaterViewSet.as_view({'get': 'list', 'post': 'create', 'put': 'update', 'delete': 'destroy'}), name='raters-api'),
    path('tasks/', WritingTaskViewSet.as_view({'get':'list', 'post':'create', 'put':'update', 'delete':'destroy'}), name='writing-tasks-list'),
    path('raters-assignment/', AssessmentTaskViewSet.as_view({'get':'list', 'post':'create', 'put':'update'}), name='assignment-api'),
    path('raters-assignment/<int:pk>/', AssessmentTaskViewSet.as_view({'get':'retrieve', 'delete':'destroy'}), name='assignment-api-detail'),
    path('assign-tasks/', assign_raters_view, name='assign-tasks'),
    path('clear-tasks/', clear_tasks_view, name='clear-tasks'),
    path('assign-all/', assign_to_all, name='assign-to-all'  )
]
