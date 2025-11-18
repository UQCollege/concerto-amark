from django.db import transaction, IntegrityError
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import JsonResponse

import re
from collections import defaultdict

from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from .serializers import RaterSerializer, AssessmentTaskSerializer, WritingTaskSerializer
from .models import CustomUser, WritingTask, AssessmentTask, Student, BEClass
from .readonly_models import  UtilAppPelaWritingseed # UtilAppPelaUqcUsers
from .utils import copy_to_test_rater_view, parse_zip_and_extract_texts, superuser_required, get_rater_tasks

class RaterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = [IsAuthenticated]
    queryset = CustomUser.objects.filter(usertype__in=['Rater', 'Test-Rater']).order_by('username')
    serializer_class = RaterSerializer

    def list (self, request):
        if not request.user.is_superuser:
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked

        raters=CustomUser.objects.filter(usertype__in=['Rater', 'Test-Rater']).order_by('username')
        data = []
        if raters.exists():
            for rater in raters:
                tasks_total = AssessmentTask.objects.filter(rater = rater, active=True).count()
                data.append({"username": rater.username, "rater_digital_id": rater.rater_digital_id, "active": rater.active, "tasks_total": tasks_total, "user_type":rater.usertype})
 
        return Response(data)     
            
    
    def create(self, request):
        if not request.user.is_superuser:
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked
        raters = request.data.get('raters', [])  # raters are object array with [{'name':'rater1', 'rater_digital_id':'rater1', 'password':'test123'}....]
        existed_raters = CustomUser.objects.filter(usertype__in=['Rater', 'Test-Rater']).in_bulk(field_name='username')

        for rater in raters:
            rater_name = rater['name']
            classes=None
            if rater.get('class_name', None):
                classes, _=BEClass.objects.get_or_create(class_name=int(rater.get('class_name', None)))
            if rater_name not in existed_raters:
                # Create a new rater if it doesn't exist

                CustomUser.objects.create(
                    username=rater_name,
                    first_name=rater['first_name'],
                    last_name=rater['last_name'],
                    rater_digital_id=rater['rater_digital_id'],
                    usertype=rater.get('user_type', 'Rater'),
                    active=rater.get('active', True),
                    classes=classes,
                    task_access=rater.get('task_access', 1),
                )
            else:
                # Check if the existing rater is inactive and reactivate it
                existing_rater = existed_raters[rater_name]
                if not existing_rater.active:
                    existing_rater.active = rater.get('active', True)
                    existing_rater.task_access = rater.get('task_access', 1)
                    existing_rater.rater_digital_id = rater['rater_digital_id']
                    existing_rater.classes=classes
                    existing_rater.save()

        return Response({"message": "Raters processed successfully", "Code": 200})
    
    def destroy(self, request):
        """
        Delete a rater by digital Id.
        """
        if not request.user.is_superuser:
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
        if not request.user.is_superuser:
            return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN) # Ensure permissions are checked
        
        if request.user.is_superuser:
            task_access = request.data.get('taskAccess')
            print(f"Received task_access: {task_access}")

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
        Weekly Writing List for teachers to download.
        """

        teacher_name = request.GET.get('teacher_name', None)
        context = []
        try:
            if teacher_name:
                teacher = get_object_or_404(CustomUser, username=teacher_name, classes__gt=0)
                query_class = teacher.classes
                students = Student.objects.filter(classes=query_class).prefetch_related('writingtask_set')
    
                for student in students:
                    writings = student.writingtask_set.filter(trait="Weekly Writing").order_by('started_time')    
                    student_writings = {
                        "student": student.student_code,
                        "first_name": student.first_name,
                        "last_name": student.last_name,
                        "writings": WritingTaskSerializer(writings, many=True).data
                    }
                    context.append(student_writings)
            else:
                context = WritingTaskSerializer(self.queryset, many=True).data

            return Response(context)
        except Exception as e:
            return Response({"message": f"Error fetching class writings {e}", "Code":404})
                


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
        print(f"Rater name from request: {rater_name}")
        task_id = request.GET.get('id', None)


        if rater_name:
            try:
                rater = get_object_or_404(CustomUser, username=rater_name)
            except Exception as e:

                return Response({"message": f"Rater '{rater_name}' not found, error: {e}", "Code": 404}, status=status.HTTP_404_NOT_FOUND)

            if not rater.active:
                return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                traits_map={
                    1:["Writing 1", "Writing 3"],
                    2:["Writing 2", "Writing 4"],
                    3:["PELA3"],
                }
                traits = traits_map.get(rater.task_access, ["Writing 1", "Writing 3"])
                queryset = get_rater_tasks(rater, traits)
                # Todo: delete the following line if not needed
                # if not queryset.exists() and rater.usertype == "Test-Rater":
                #     copy_to_test_rater_view(rater)
                #     queryset = get_rater_tasks(rater, traits)

            except Exception as e:
                print(f"Error fetching tasks for rater {rater_name}: {e}")
                return Response({"message": f"No tasks found for this rater, error: {e}", "Code": 404}, status=status.HTTP_404_NOT_FOUND)
        elif request.user.is_superuser or request.user.usertype == "Admin-Rater":
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
        student_codes = request.data.get('student_code').split(",")
        
        trait = request.data.get('trait')
        rater_name = request.data.get('rater_name')

        if not student_codes or not trait or not rater_name:
            return Response({"message": "Missing required fields: student_code, trait, or rater_name", "Code": 400}, status=status.HTTP_400_BAD_REQUEST)
        created_tasks = []
        errors = []
        for student_code in student_codes:
            student_code = student_code.strip()
        
            if student_code and trait and rater_name:
                try:
                    writing_task = get_object_or_404(WritingTask, trait=trait, student_code=student_code)
                    rater = get_object_or_404(CustomUser, username=rater_name)

                    # Use get_or_create to prevent creating repeated tasks
                    assessment_task, created = AssessmentTask.objects.get_or_create(
                        writing_task=writing_task,
                        rater=rater,
                        active=True,
                        defaults={
                            'completed': False,
                            'ta': None,
                            'gra': None,
                            'voc': None,
                            'coco': None,
                            'comments': None,
                            'update_by': request.user
                        }
                    )
                 
                    serializer = self.get_serializer(assessment_task)
                    created_tasks.append(serializer.data)
                except Exception as e:
                    errors.append({"student_code": student_code, "error": str(e)})
        if created_tasks:
            return Response({"created tasks": created_tasks, "errors": errors, "Code": 201 if not errors else 207})
        else:
            return Response({"message": "Invalid data", "errors": errors, "Code": 400})


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


# Allocate Writing tasks to raters 
@permission_classes([IsAdminUser])
def assign_raters_view(request):
    """
    View to assign raters to a writing task.
    """
    
    tasks = WritingTask.objects.all().exclude(trait="Weekly Writing")
    try:
        for task in tasks:
            raters = CustomUser.objects.filter(usertype="Rater", active=True)  # Fetch all available raters
            task.assign_raters(raters)   
        return JsonResponse({"message": "successfully allcated tasks", "Code": 200})
    except Exception as e:
        return JsonResponse({"message": f"Error allocating tasks: {str(e)}", "Code": 500})


@permission_classes([IsAdminUser])
def verify_view(request):
    """
    Validate that:
    - Each student has at least 4 unique raters.
    - No writing task is rated more than once by the same rater.
    """
    student_list = WritingTask.objects.values_list("student_code", flat=True).distinct()
    invalid_students = defaultdict(list)

    for student in student_list:
        # All assessment tasks for this student's writings
        assessment_tasks = AssessmentTask.objects.filter(
            writing_task__student_code=student,
            active=True
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
def assign_to_all(request):
    """
    View to assign certain tasks to all raters.
    """
    created_tasks=0
    if request.user.is_superuser == False:
        return JsonResponse({"message": "No permission", "Code":403})
    student_codes = request.data.get("studentCodes", [])
    writing_day = request.data.get("writingDay", None)
    writing_trait_dict={
        "day1":["Writing 1", "Writing 3"],
        "day2":["Writing 2", "Writing 4"],
    }

    if not writing_day:
        return JsonResponse({"message": "No Writing Day selected", "Code": 400}) 
 
    if not student_codes:
        return JsonResponse({"message": "No student names provided", "Code": 400})
    writings = WritingTask.objects.filter(student_code__in=student_codes, trait__in=writing_trait_dict[writing_day])


    for writing in writings:
        writing.assign_all = True
        writing.save()

        raters = CustomUser.objects.filter(usertype="Rater", active=True)  # Fetch all available raters
        for rater in raters:
            # Check if the assignment already exists
            if not AssessmentTask.objects.filter(rater=rater, writing_task=writing).exists():
                AssessmentTask.objects.create(
                    writing_task=writing,
                    rater=rater,
                    ta=None,
                    gra=None,
                    voc=None,
                    coco=None,
                    completed=False,
                    comments=None,
                )
                created_tasks += 1
    return JsonResponse({"message": f"Tasks assigned to all raters successfully, created {created_tasks} extra tasks", "Code": 200})
            
@permission_classes([IsAdminUser]) 
def clear_tasks_view(request):
    """
    View to clear all writing tasks.
    """
    
    AssessmentTask._base_manager.all().delete()
    return JsonResponse({"message": "Tasks cleared successfully", "Code": 200})


@api_view(["POST"])
def create_writing_tasks(request):
     
    if not request.user.is_superuser:
        return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        test_id = request.data.get("testId", 54)  # Default to 54 if not provided
        # fetch all records from legacy UtilAppPelaWritingseed table
        writingseed_records = UtilAppPelaWritingseed.objects.filter(active=True, test_id=test_id)
        # convert the writingseed records to list of dict with keys: login, user_id
        writings_students_list = list(writingseed_records.values("user_id", "user_login"))
        writingseed_list = list(writingseed_records.values("user_id", "started_time", "trait", "response", "words_count", "created_at", "writing_subject"))

        # create students if not exist from writings_students_list
        for ws in writings_students_list:
            create, _ = Student.objects.get_or_create(
                student_code=ws["user_id"],
                defaults={
                    "student_digital_id": ws["user_login"],
                }
            )

        for wrecord in writingseed_list:

            writing_task, created=    WritingTask.objects.get_or_create(
                student_code=Student.objects.get(student_code=wrecord["user_id"]),
                started_time = wrecord["created_at"], 
                # Try parsing DD/MM/YYYY HH:MM
                # started_time = datetime.strptime(wrecord["created_at"], "%d/%m/%Y %H:%M")
                trait = wrecord["trait"],
                defaults={
                "data_split": wrecord.get("data_split", "raw"),
                "response": wrecord["response"],
                "words_count": wrecord["words_count"],
                "task_description": wrecord.get("writing_subject", "")
                }
            )
                    

        # uqcusers_list = 
            
        return Response({"message": "Writings created successfully", "Code": 200})
    except Exception as e:
        return Response({"message": f"Error creating students: {str(e)}", "Code": 500})




@api_view(["POST"])
@superuser_required
def handle_upload_file(request):
    file = request.FILES.get("file")
    if not file:
        return JsonResponse({"message": "No file", "Code": 400})
    
    students_not_found=[]
    try:
        parsed_tasks, non_parseable_files, error = parse_zip_and_extract_texts(file, settings.BASE_DIR)
        if error:
            return JsonResponse({"message": error, "Code": 400})

        writing_task_objs = []
  
        for task in parsed_tasks:

            try:
                student_first_name = task['student_fullname'].split()[0] if len(task['student_fullname'].split()) > 0 else ""
                student_last_name = task['student_fullname'].split()[1] if len(task['student_fullname'].split()) > 1 else ""
            except Exception as e:
                return JsonResponse({"message": f"studnent full name parse error: {str(e)}", "Code": 500})

            student_objs = Student.objects.none()
           
            # matching only student_can
            filters_can = {}
            if task.get("student_can"):
                filters_can["student_can__iexact"] = task["student_can"]
            
            # matching only student_digital_id
            filters_digital_id = {}
            if task.get("student_digital_id"):
                filters_digital_id["student_digital_id__iexact"] = task["student_digital_id"]
             
            filters_general = {}
            if student_first_name:
                filters_general["first_name__iexact"] = student_first_name
            if student_last_name:
                filters_general["last_name__iexact"] = student_last_name
            if task.get("class_name"):
                filters_general["classes__class_name"] = task["class_name"]


            if task.get("student_can"):
                student_objs = Student.objects.filter(**filters_can)

            if ( not student_objs.exists() or len(student_objs)>1) and task.get("student_digital_id"):
                student_objs = Student.objects.filter(**filters_digital_id)
            
            if not student_objs.exists() or len(student_objs) >1:
                student_objs = Student.objects.filter(**filters_general)
         
            if not student_objs.exists() or len(student_objs) > 1:
                students_not_found.append({"can":task["student_can"], "digital_id":task["student_digital_id"], "fullname": task['student_fullname']})
                continue

            student_obj = student_objs[0]


            # No need to check for duplicates here, as (student_code, trait, started_time) is unique in WritingTask

            writing_task_objs.append(WritingTask(
                student_code=student_obj,
                trait=task["trait"],
                started_time=task["date"],
                response=task["response"],
                words_count=task["words_count"]
            ))

        duplicate_errors = []
        created_count = 0

        for writing_task in writing_task_objs:
            try:
                writing_task.save()
                created_count += 1
            except IntegrityError as e:
                duplicate_errors.append({
                    "student_code": writing_task.student_code.student_code,
                    "trait": writing_task.trait,
                    "started_time": writing_task.started_time,
                    "error": str(e)
                })

        return JsonResponse({
            "message": f"File parsed done!, created {created_count} writing records. \n!!Duplicates!! : \n{duplicate_errors}. \n!!Not found students!!: \n{students_not_found}. \n!!Non-parseable files!!: \n{non_parseable_files}",    
            "Code": 200 if not duplicate_errors else 207
        })

    except Exception as e:
        return JsonResponse({"message": f"parse get error: {str(e)}", "Code": 500})