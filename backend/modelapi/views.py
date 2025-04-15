from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse

# Create your views here.
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.permissions import BasePermission
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import RaterSerializer, AssessmentTaskSerializer, WritingTaskSerializer
from rest_framework import status
from .models import Rater, WritingTask, AssessmentTask, Student, BEClass
from rest_framework.decorators import api_view, permission_classes


class RaterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Rater.objects.all().order_by('username')
    serializer_class = RaterSerializer

    def create(self, request):
        if request.user.is_superuser == "False":
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked
        raters = request.data.get('raters', [])  # raters are object array with [{'name':'rater1', 'rater_digital_id':'rater1', 'password':'test123'}....]
        existed_raters = Rater.objects.in_bulk(field_name='rater_digital_id')

        for rater in raters:
            rater_digital_id = rater['rater_digital_id']
            if rater_digital_id not in existed_raters:
                # Create a new rater if it doesn't exist
                Rater.objects.create(
                    username=rater['name'],
                    rater_digital_id=rater_digital_id,
                    password=rater['password'],
                    active=rater.get('active', True)
                )
            else:
                # Check if the existing rater is inactive and reactivate it
                existing_rater = existed_raters[rater_digital_id]
                if not existing_rater.active:
                    existing_rater.active = True
                    existing_rater.save()

        return Response({"message": "Raters processed successfully", "Code": 200})
    
    def destroy(self, request):
        """
        Delete a rater by digital Id.
        """
        if request.user.is_superuser == "False":
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked
        rater_digital_id = request.data.get('rater_digital_id')

        rater = get_object_or_404(Rater, rater_digital_id=rater_digital_id)
        rater.active = False
        rater.save()
        return Response({"message": "Rater deleted successfully", "Code": 200}, status=status.HTTP_204_NO_CONTENT)
    
    def update(self, request):
        if request.user.is_superuser == False:
            return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN) # Ensure permissions are checked
        
        if request.user.is_superuser:
            task_access = request.data.get('taskAccess')

            if task_access:
                # Update all raters' task_access with the provided data
                raters = Rater.objects.all()
                for rater in raters:
                    rater.task_access = task_access
                    rater.save()
                return Response({"message": "All raters' task_access updated successfully", "Code": 200})
        return Response({"message": "No task_access provided", "Code": 400})


class WritingTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows writing tasks to be viewed or edited.
    """
    queryset = WritingTask.objects.all().order_by('id')
    serializer_class = WritingTaskSerializer

    def get_permissions(self):
        """
        Assign permissions based on the request type.
        """
        if self.request.GET.get('rater_name'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    def list(self, request):
        """
        List writing tasks, optionally filtered by rater_name.
        """
        rater_name = request.GET.get('rater_name')
        context = []

        if rater_name:
            rater = get_object_or_404(Rater, username=rater_name)
            query_class = rater.classes
            students = Student.objects.filter(classes=query_class).prefetch_related('writingtask_set')

            for student in students:
                writings = student.writingtask_set.all()
                student_writings = {
                    "student": student.student_name,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "writings": WritingTaskSerializer(writings, many=True).data
                }
                context.append(student_writings)
        else:
            context = WritingTaskSerializer(self.queryset, many=True).data

        return Response(context)
                





class AssessmentTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = [IsAuthenticated]
    queryset = AssessmentTask.objects.all().order_by('id')
    serializer_class = AssessmentTaskSerializer


    def list(self, request):
        """
        Allows filtering by rater_name via a query parameter.
        Example: GET /api/review-assignments/?rater_name=Rater1
        """
        rater_name = request.GET.get('rater_name', None)
        if rater_name:
            rater = get_object_or_404(Rater, username=rater_name)
            queryset = AssessmentTask.objects.filter(rater=rater, writing_task__trait=f"Writing {rater.task_access}")
        elif request.user.is_superuser:
            queryset=AssessmentTask.objects.all().order_by('id')
        else:
            queryset =[]
            return Response({"message": "Error creating review assignment", "Code": 500})
       
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """
        Create a new review assignment.
        """
        student_name = request.data.get('student_name')
        trait = request.data.get('trait')
        rater_name = request.data.get('rater_name')

        if student_name and trait and rater_name:
            try:
                writing_task = get_object_or_404(WritingTask, trait=trait, student_name=student_name)
                rater = get_object_or_404(Rater, username=rater_name)

                # Check if the assignment already exists
                AssessmentTask.objects.create(
                    writing_task=writing_task,
                    rater=rater,
                    completed=False,
                    ta=None,
                    gra=None,
                    voc=None,
                    coco=None,
                    comments=None,)
                serializer = self.get_serializer(writing_task)
                print(f"successfully create the Writing task {writing_task.id} assigned to rater {rater.username}")
                return Response(serializer.data, status=201)
            except Exception as e:
                print(f"Error creating review assignment: {e}")
                return Response({"message": "Error creating review assignment", "Code": 500})        
        return Response({"message": "Invalid data", "Code": 400})
    
    def update(self, request):
        """
        Update assignedTasks for each allocated writing task.
        """
        update_data = request.data

        if update_data:
            for item in update_data:
                if 'ratings' in item: # Save the assessment result of a writing task
                    allocatedTask = AssessmentTask.objects.get(id=item['id']) 
                    allocatedTask.ta, allocatedTask.gra, allocatedTask.voc, allocatedTask.coco = item.get('ratings', {}).get('ta'), item.get('ratings', {}).get('gra'), item.get('ratings', {}).get('voc'), item.get('ratings', {}).get('coco')
                    allocatedTask.completed = item.get('completed')
                    allocatedTask.comments = item.get('comments', None)
                    allocatedTask.save()
                if 'idList' in item: # For Admin changes raters
                    rater_name = item.get('raterName')
                    idList = item.get('idList')
                    for id in idList:
                        allocatedTask = AssessmentTask.objects.get(id=id)
                        if rater_name:
                            rater = Rater.objects.filter(username=rater_name).first()
                            if rater:
                                allocatedTask.rater = rater
                            else:
                                return Response({"message": f"Rater '{rater_name}' not found", "Code": 404})
                        allocatedTask.save()
            return Response({"message": "Update successful", "Code": 200})
        return Response({"message": "No data provided", "Code": 400})

        

    
@permission_classes([IsAdminUser])
def assign_raters_view(request):
    """
    View to assign raters to a writing task.
    """

    tasks = WritingTask.objects.all()
    for task in tasks:
        raters = Rater.objects.filter(is_superuser=False)  # Fetch all available raters
        task.assign_raters(raters)   
    
    return JsonResponse({"message": "Raters assigned successfully", "Code": 200})

@permission_classes([IsAdminUser])
def verify_view(request):
    """
    Verify each student has 4 unique raters.
    """
    student_list = WritingTask.objects.values_list("student_name", flat=True).distinct()
    invalid_students = {}

    for student in student_list:
        # Get all raters assigned to the student's writing tasks
        raters = AssessmentTask.objects.filter(writing_task__student_name=student).values_list("rater__username", flat=True)
        unique_raters = set(raters)
        # Check if the student has exactly 4 unique raters
        if len(unique_raters) != 4:
            invalid_students[student] = list(unique_raters)

    if invalid_students:
        return JsonResponse({"message": "Some students do not have exactly 4 unique raters", "details": invalid_students, "Code": 400})

    return JsonResponse({"message": "All students have 4 unique raters", "Code": 200})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def assign_to_all(request):
    """
    View to assign certain tasks to all raters.
    """
    student_names = request.data.get("studentNames", [])
    if not student_names:
        return JsonResponse({"message": "No student names provided", "Code": 400})
    tasks = WritingTask.objects.filter(student_name__in=student_names)

    for task in tasks:
        task.assign_all = True
        task.save()

        raters = Rater.objects.all()
        for rater in raters:
            # Check if the assignment already exists
            if not AssessmentTask.objects.filter(rater=rater, writing_task=task).exists():
                AssessmentTask.objects.create(
                    writing_task=task,
                    rater=rater,
                    ta=None,
                    gra=None,
                    voc=None,
                    coco=None,
                    completed=False,
                    comments=None,
                )
    print("all")

    return JsonResponse({"message": "Tasks assigned to all raters successfully", "Code": 200})
            
@permission_classes([IsAdminUser]) 
def clear_tasks_view(request):
    """
    View to clear all writing tasks.
    """
    AssessmentTask.objects.all().delete()
    return JsonResponse({"message": "Tasks cleared successfully", "Code": 200})


