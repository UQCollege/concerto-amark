
from django.urls import path, include
from .views import WritingTaskViewSet, RaterViewSet, assign_raters_view, AssessmentTaskViewSet, clear_tasks_view, assign_to_all, verify_view
urlpatterns = [
    path('raters/', RaterViewSet.as_view({'get': 'list', 'post': 'create', 'put': 'update', 'delete': 'destroy'}), name='raters-api'),
    path('tasks/', WritingTaskViewSet.as_view({'get':'list', 'post':'create', 'put':'update', 'delete':'destroy'}), name='students-writing-response'),
    path('allocated-tasks/', AssessmentTaskViewSet.as_view({'get':'list', 'post':'create', 'put':'update'}), name='allocated-task-detail'),
    path('allocated-tasks/<int:pk>/', AssessmentTaskViewSet.as_view({'get':'retrieve', 'delete':'destroy'}), name='tasks-api-detail'),
    path('assign-tasks/', assign_raters_view, name='assign-tasks'),
    path('clear-tasks/', clear_tasks_view, name='clear-tasks'),
    path('assign-all/', assign_to_all, name='assign-to-all'  ),
    path('verify/', verify_view, name='verify' )
]
