from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse

# Create your views here.
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import RatersSerializer, ReviewAssignmentSerializer, WritingTasksSerializer
from .models import Raters, WritingTasks, ReviewAssignment

class RatersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Raters.objects.all().order_by('name')
    serializer_class = RatersSerializer

    # def list(self, request):
    #     pass

    # def create(self, request):
    #     pass    

    # def retrieve(self, request, pk=None):
    #     pass

    # def update(self, request, pk=None):
    #     pass


class WritingTasksViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = WritingTasks.objects.all().order_by('id')
    serializer_class = WritingTasksSerializer

    # def list(self, request):
    #     pass

    # def create(self, request):
    #     pass

    # def retrieve(self, request, pk=None):
    #     pass

    # def update(self, request, pk=None):
    #     pass




class ReviewAssignmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = ReviewAssignment.objects.all().order_by('id')
    serializer_class = ReviewAssignmentSerializer

    def list(self, request):
        """
        Allows filtering by rater_id via a query parameter
        Example: GET /api/review-assignments/?rater=Rater1
        """
        queryset = ReviewAssignment.objects.all().order_by('id') # Cannot use self.queryset whay?
        rater_name = request.GET.get('rater_name', None)

        if rater_name:
            queryset = queryset.filter(rater__name=rater_name)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def update(self, request):
        """
        Update assignedTasks for each allocated writing task.
        """
        update_data = request.data

        if update_data:
            for item in update_data:
                allocatedTask = ReviewAssignment.objects.get(id=item['id']) 
                if 'ratings' in item:
                    allocatedTask.ta, allocatedTask.gra, allocatedTask.voc, allocatedTask.coco = item.get('ratings', {}).get('ta'), item.get('ratings', {}).get('gra'), item.get('ratings', {}).get('voc'), item.get('ratings', {}).get('coco')
                    allocatedTask.completed = item.get('completed')
                    allocatedTask.save()
                else:
                    rater_name = item.get('raterName')
                    if rater_name:
                        rater = Raters.objects.filter(name=rater_name).first()
                        if rater:
                            allocatedTask.rater = rater
                        else:
                            return Response({"message": f"Rater '{rater_name}' not found", "Code": 404})
                    allocatedTask.save()
            return Response({"message": "Update successful", "Code": 200})
        return Response({"message": "No data provided", "Code": 400})

        

    
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



