from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse

# Create your views here.
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.permissions import BasePermission
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import RaterSerializer, AssessmentTaskSerializer, WritingTaskSerializer
from rest_framework import status
from .models import CustomUser, WritingTask, AssessmentTask, Student, BEClass
from rest_framework.decorators import api_view, permission_classes


class RaterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = [IsAuthenticated]
    queryset = CustomUser.objects.filter(usertype='Rater').order_by('username')
    serializer_class = RaterSerializer

    def list (self, request):
        if request.user.is_superuser == "False":
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked

        raters=CustomUser.objects.filter(usertype='Rater').order_by('username')
        data = []
        if raters.exists():
            for rater in raters:
                tasks_total = AssessmentTask.objects.filter(rater = rater, active=True).count()
                data.append({"username": rater.username, "rater_digital_id": rater.rater_digital_id, "active": rater.active, "tasks_total": tasks_total})
 
        return Response(data)     
            

    def create(self, request):
        if request.user.is_superuser == "False":
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked
        raters = request.data.get('raters', [])  # raters are object array with [{'name':'rater1', 'rater_digital_id':'rater1', 'password':'test123'}....]
        existed_raters = CustomUser.objects.filter(usertype='Rater').in_bulk(field_name='username')

        for rater in raters:
            rater_name = rater['name']
            if rater_name not in existed_raters:
                # Create a new rater if it doesn't exist
                CustomUser.objects.create(
                    username=rater_name,
                    rater_digital_id=rater['rater_digital_id'],
                    usertype='Rater',
                    active=rater.get('active', True),
                    task_access=rater.get('task_access', 1),
                )
            else:
                # Check if the existing rater is inactive and reactivate it
                existing_rater = existed_raters[rater_name]
                if not existing_rater.active:
                    existing_rater.active = True
                    existing_rater.task_access = rater.get('task_access', 1)
                    existing_rater.rater_digital_id = rater['rater_digital_id']
                    existing_rater.save()

        return Response({"message": "Raters processed successfully", "Code": 200})
    
    def destroy(self, request):
        """
        Delete a rater by digital Id.
        """
        if request.user.is_superuser == "False":
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked
        rater_digital_id = request.data.get('rater_digital_id')

        rater = get_object_or_404(CustomUser, rater_digital_id=rater_digital_id)
        rater.active = False
        related_tasks = AssessmentTask.objects.filter(rater=rater, completed=False)
         # Delete all related tasks
        related_tasks.delete()
        rater.save()
        return Response({"message": "Rater deleted successfully", "Code": 200}, status=status.HTTP_204_NO_CONTENT)
    
    def update(self, request):
        if request.user.is_superuser == False:
            return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN) # Ensure permissions are checked
        
        if request.user.is_superuser:
            task_access = request.data.get('taskAccess')

            if task_access:
                # Update all raters' task_access with the provided data
                raters = CustomUser.objects.all()
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
        if self.request.GET.get('teacher_name'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    def list(self, request):
        """
        List writing tasks, optionally list class tasks for teachers.
        """

        teacher_name = request.GET.get('teacher_name', None)
        context = []

        if teacher_name:
            teacher = get_object_or_404(CustomUser, username=teacher_name, usertype='Teacher')
            query_class = teacher.classes
            students = Student.objects.filter(classes=query_class).prefetch_related('writingtask_set')

            for student in students:
                writings = student.writingtask_set.filter(trait=None).order_by('started_time')
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
    queryset = AssessmentTask.objects.filter(active=True).order_by('id')
    serializer_class = AssessmentTaskSerializer

    def list(self, request):
        """
        Allows filtering by rater_name or task_id via query parameters.
        Example: GET /api/review-assignments/?rater_name=Rater1&id=123
        """
        rater_name = request.GET.get('rater_name')
        task_id = request.GET.get('id', None)


        if rater_name:
            rater = get_object_or_404(CustomUser, username=rater_name)
            print("rater", rater)
            if rater.usertype != "Rater" or not rater.active:
                return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN)
            print(f"Writing {rater.task_access}")
            try:
                queryset = AssessmentTask.objects.filter(
                    rater=rater, 
                    writing_task__trait__iexact=f"Writing {rater.task_access}",
                    active=True 
                )
            except Exception as e:
                print(f"Error fetching tasks for rater {rater_name}: {e}")
                return Response({"message": "No tasks found for this rater", "Code": 404}, status=status.HTTP_404_NOT_FOUND)
        elif request.user.is_superuser:
            queryset = AssessmentTask.objects.filter(
                active=True, 
                id=task_id
            ).order_by('id') if task_id else AssessmentTask.objects.filter(active=True).order_by('id')
        else:
            return Response({"message": "Unauthorized access", "Code": 403}, status=status.HTTP_403_FORBIDDEN)

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
                rater = get_object_or_404(CustomUser, username=rater_name)

                # Check if the assignment already exists
                AssessmentTask.objects.create(
                    writing_task=writing_task,
                    rater=rater,
                    completed=False,
                    ta=None,
                    gra=None,
                    voc=None,
                    coco=None,
                    comments=None,
                    update_by=request.user)
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
                    allocatedTask.update_by = request.user
                    allocatedTask.save()
                if 'idList' in item: # For Admin changes raters
                    rater_name = item.get('raterName')
                    idList = item.get('idList')
                    for id in idList:
                        allocatedTask = AssessmentTask.objects.get(id=id)
                        if rater_name:
                            rater = CustomUser.objects.filter(username=rater_name).first()
                            if rater:
                                allocatedTask.rater = rater
                            else:
                                return Response({"message": f"Rater '{rater_name}' not found", "Code": 404})
                        allocatedTask.update_by = request.user        
                        allocatedTask.save()
            return Response({"message": "Update successful", "Code": 200})
        return Response({"message": "No data provided", "Code": 400})
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.update_by = request.user 
        instance.active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


    
@permission_classes([IsAdminUser])
def assign_raters_view(request):
    """
    View to assign raters to a writing task.
    """
    
    tasks = WritingTask.objects.all()
    try:
        for task in tasks:
            raters = CustomUser.objects.filter(usertype="Rater", active=True)  # Fetch all available raters
            task.assign_raters(raters)   
        return JsonResponse({"message": "successfully allcated tasks", "Code": 200})
    except Exception as e:
        return JsonResponse({"message": f"Error allocating tasks: {str(e)}", "Code": 500})

from collections import defaultdict

@permission_classes([IsAdminUser])
def verify_view(request):
    """
    Validate that:
    - Each student has at least 4 unique raters.
    - No writing task is rated more than once by the same rater.
    """
    student_list = WritingTask.objects.values_list("student_name", flat=True).distinct()
    invalid_students = defaultdict(list)

    for student in student_list:
        # All assessment tasks for this student's writings
        assessment_tasks = AssessmentTask.objects.filter(
            writing_task__student_name=student
        ).select_related('rater', 'writing_task')

        # Track unique raters
        unique_raters = set()
        # Track writing-task + rater pairs to catch duplicates
        seen_pairs = set()

        for task in assessment_tasks:
            rater = task.rater.username
            task_id = task.writing_task.id
            unique_raters.add(rater)

            pair = (task_id, rater)
            if pair in seen_pairs:
                # Duplicate rating found
                invalid_students[student].append({
                    "rater": rater,
                    "writing_trait": task.writing_task.trait,
                    "issue": "Duplicate rating for the same writing task"
                })
            else:
                seen_pairs.add(pair)

   

    if invalid_students:
        return JsonResponse({
            "message": "Some students have duplicate ratings or fewer than 4 unique raters.",
            "details": invalid_students,
            "Code": 400
        })

    return JsonResponse({
        "message": "All students have valid ratings (>= 4 unique raters, no duplicates).",
        "Code": 200
    })

@api_view(['POST'])
@permission_classes([IsAdminUser]) 
def assign_to_all(request):
    """
    View to assign certain tasks to all raters.
    """

    if request.user.is_superuser == False:
        return JsonResponse({"message": "No permission", "Code":403})
    student_names = request.data.get("studentNames", [])
    if not student_names:
        return JsonResponse({"message": "No student names provided", "Code": 400})
    tasks = WritingTask.objects.filter(student_name__in=student_names)

    for task in tasks:
        task.assign_all = True
        task.save()

        raters = CustomUser.objects.filter(usertype="Rater", active=True)  # Fetch all available raters
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


    return JsonResponse({"message": "Tasks assigned to all raters successfully", "Code": 200})
            
@permission_classes([IsAdminUser]) 
def clear_tasks_view(request):
    """
    View to clear all writing tasks.
    """
    AssessmentTask._base_manager.all().delete()
    return JsonResponse({"message": "Tasks cleared successfully", "Code": 200})


@api_view(["POST"])
@permission_classes([IsAdminUser]) 
def create_students(request):
    students = request.data.get("students", [])
    try:
        existed_students = Student.objects.in_bulk(field_name='student_name')
        for s in students:
            student_name = s.get("student_name")

            be_class = None
            if s.get("class_name"):
                be_class, _ = BEClass.objects.get_or_create(class_name=s["class_name"])
            
            existed_student = existed_students.get(student_name)
            if existed_student:
                existed_student.last_name = s["last_name"]
                existed_student.first_name = s["first_name"]
                existed_student.classes = be_class
                existed_student.save()
            else:
                Student.objects.create(
                    student_name=student_name,
                    last_name=s["last_name"],
                    first_name=s["first_name"],
                    classes= be_class,
                )
            
        return Response({"message": "Students created successfully", "Code": 200})
    except Exception as e:
        return Response({"message": f"Error creating students: {str(e)}", "Code": 500})

@api_view(["POST"])
@permission_classes([IsAdminUser]) 
def create_writing_tasks(request):
    from datetime import datetime
    tasks = request.data.get("tasks", [])
    try:
        # prefetch all students
        existed_students = Student.objecets.in_bulk(field_name='student_name')
        writing_tasks_objs = []
        for t in tasks:
            student = existed_students.get(t["student_name"])
            if not student:
                continue
            
            try:
                # Try parsing DD/MM/YYYY HH:MM
                started_time = datetime.strptime(t["started_time"], "%d/%m/%Y %H:%M")
            except ValueError:
                try:
                    # Try parsing ISO format fallback (already valid input)
                    started_time = datetime.fromisoformat(t["started_time"])
                except ValueError:
                    return Response({
                        "message": f"Invalid date format: {t['started_time']}",
                        "Code": 400
                    })

            writing_tasks_objs.append(WritingTask(
                student_name=student,
                trait=t["trait"],
                started_time=started_time,
                response=t["response"],
                words_count=int(t["words_count"]) if t.get("words_count") else 0,
            ))
            
            # Bulk create writing tasks
            WritingTask.objects.bulk_create(writing_tasks_objs, batch_size=400) # Adjust batch size
        return Response({"message": f"{len(writing_tasks_objs)} Writing tasks created successfully", "Code": 200})
    except Exception as e:
        return Response({"message": f"Error creating writing tasks: {str(e)}", "Code": 500})
