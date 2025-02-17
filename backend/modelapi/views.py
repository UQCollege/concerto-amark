from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse

# Create your views here.
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import RatersSerializer, ReviewAssignmentSerializer
from .models import Raters, WritingTasks, ReviewAssignment

class RatersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Raters.objects.all().order_by('name')
    serializer_class = RatersSerializer




class ReviewAssignmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = ReviewAssignment.objects.all().order_by('day')
    serializer_class = ReviewAssignmentSerializer

    def list(self, request, *args, **kwargs):
        """
        Allows filtering by rater_id via a query parameter
        Example: GET /api/review-assignments/?rater=Rater1
        """
        rater_id = request.GET.get('rater_id')

        queryset = self.queryset
        if rater_id:
            queryset = queryset.filter(rater_id=int(rater_id))

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    
def assign_raters_view(request):
    """
    View to assign raters to a writing task.
    """

    tasks = WritingTasks.objects.all()
    for task in tasks:
        raters = Raters.objects.all()  # Fetch all available raters
        task.assign_raters(raters)   
    
    return JsonResponse({"message": "Raters assigned successfully", "Code": 200})

def clear_tasks_view(request):
    """
    View to clear all writing tasks.
    """
    ReviewAssignment.objects.all().delete()
    return JsonResponse({"message": "Tasks cleared successfully", "Code": 200})



