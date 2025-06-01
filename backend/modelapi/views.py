import re
import os
from django.db import transaction, IntegrityError
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from .serializers import RaterSerializer, AssessmentTaskSerializer, WritingTaskSerializer
from .models import CustomUser, WritingTask, AssessmentTask, Student, BEClass
from .utils import parse_zip_and_extract_texts, superuser_required
from .authentication import CognitoJWTAuthentication


from django.http import JsonResponse


@api_view(["GET"])
@permission_classes([AllowAny])
def debug_headers(request):   
    return JsonResponse({
        "is_secure": request.is_secure(),
        "proto": request.META.get("HTTP_X_FORWARDED_PROTO"),
         "HTTP_X_FORWARDED_PROTO": request.META.get("HTTP_X_FORWARDED_PROTO"),
          "ALL_HEADERS": {k: v for k, v in request.META.items() if k.startswith("HTTP_")},

    })



@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def get_csrf_token(request):
    return JsonResponse({"csrftoken": get_token(request)})

@api_view(["POST"])
@permission_classes([AllowAny]) 
def bootstrap_user_from_token(request):
    # DEVELOPMENT MODE (local login without Cognito)
    if getattr(settings, "USE_FAKE_AUTH", False):
        dev_username = os.environ.get("DEV_USER_NAME", "devuser")
        user, _ = CustomUser.objects.get_or_create(
            username=dev_username,
            defaults={
                "rater_digital_id": "fake-dev-id",
                "active": True,
                "usertype": os.environ.get("DEV_USER_TYPE", "Admin"),
                "is_superuser": True,
            },
        )

        login(request, user)
        response = Response({"message": "Django login established"})
        response["X-CSRFToken"] = get_token(request)
        return response

    # PRODUCTION MODE (with Cognito token)
    token = request.data.get("access_token")

    if not token:
        return Response({"error": "Missing access_token"}, status=400)

    auth = CognitoJWTAuthentication()
    try:
        claims = auth._decode_jwt(token)
        user, _ = auth.get_or_create_user(claims)
        login(request, user)
        request.session.save()
        request.session["bootstrap_authenticated"] = True
        response = Response({"message": "Django login established"})
        response.set_cookie(
            "csrftoken",
            get_token(request),
            secure=True,
            samesite="None",
            httponly=False,
        )
        return response
    except Exception as e:
        return Response({"error": str(e)}, status=401)

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"})

class RaterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = [IsAuthenticated]
    queryset = CustomUser.objects.filter(usertype='Rater').order_by('username')
    serializer_class = RaterSerializer

    def list (self, request):
        if not request.user.is_superuser:
            return Response({"message": "No permission", "Code": 403}) # Ensure permissions are checked

        raters=CustomUser.objects.filter(usertype='Rater').order_by('username')
        data = []
        if raters.exists():
            for rater in raters:
                tasks_total = AssessmentTask.objects.filter(rater = rater, active=True).count()
                data.append({"username": rater.username, "rater_digital_id": rater.rater_digital_id, "active": rater.active, "tasks_total": tasks_total})
 
        return Response(data)     
            
    
    def create(self, request):
        print("create raters")
        if not request.user.is_superuser:
            return Response({"message": "No permission", "Code": 403})

        raters = request.data.get('raters', [])
        usernames_seen = set()

        for rater in raters:
            rater_name = rater['name']
            if rater_name in usernames_seen:
                continue
            usernames_seen.add(rater_name)

            rater_digital_id = rater['rater_digital_id']
            classes = None
            if rater.get('class_name'):
                classes, _ = BEClass.objects.get_or_create(class_name=int(rater['class_name']))

            try:
                user = CustomUser.objects.get(username=rater_name)
                # Update existing user if inactive
                if not user.active:
                    user.active = rater.get('active', True)
                    user.task_access = rater.get('task_access', 1)
                    user.rater_digital_id = rater_digital_id
                    user.classes = classes
                    user.save()
            except CustomUser.DoesNotExist:
                # Create new rater
                user = CustomUser(
                    username=rater_name,
                    first_name=rater['first_name'],
                    last_name=rater['last_name'],
                    rater_digital_id=rater_digital_id,
                    usertype='Rater',
                    active=rater.get('active', True),
                    task_access=rater.get('task_access', 1),
                    classes=classes
                )
                # user.set_password(rater.get("password", get_random_string()))
                user.save()
                print("created user:", rater_name)

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
        task_id = request.GET.get('id', None)


        if rater_name:
            rater = get_object_or_404(CustomUser, username=rater_name)
            
            if not rater.active:
                return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                queryset = AssessmentTask.objects.filter(
                    rater=rater, 
                    writing_task__trait__in=[f"Writing {rater.task_access}", f"Writing {int(rater.task_access)+2}"],
                    active=True 
                )
            except Exception as e:
                print(f"Error fetching tasks for rater {rater_name}: {e}")
                return Response({"message": "No tasks found for this rater", "Code": 404}, status=status.HTTP_404_NOT_FOUND)
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
        student_code = request.data.get('student_code')
        trait = request.data.get('trait')
        rater_name = request.data.get('rater_name')

        if student_code and trait and rater_name:
            try:
                writing_task = get_object_or_404(WritingTask, trait=trait, student_code=student_code)
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

                return Response(serializer.data, status=201)
            except Exception as e:
                return Response({"message": f"Error creating review assignment {e}", "Code": 500})        
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

from collections import defaultdict

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
            writing_task__student_code=student
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
    tasks = WritingTask.objects.filter(student_code__in=student_codes, trait__in=writing_trait_dict[writing_day])


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
def create_students(request):

    if not request.user.is_superuser:
        return Response({"message": "No permission", "Code": 403}, status=status.HTTP_403_FORBIDDEN)
    
    students = request.data.get("students", [])
    try:
        existed_students = Student.objects.in_bulk(field_name='student_code')
        for s in students:
            student_code = str(s.get("student_code"))

            be_class = None
            if s.get("class_name"):
    
                be_class, _ = BEClass.objects.get_or_create(class_name=s["class_name"])
            
            existed_student = existed_students.get(student_code)
            if existed_student:
                existed_student.classes = be_class
                existed_student.save()
            else:
                Student.objects.create(
                    student_code=student_code,
                    student_digital_id = s["student_digital_id"],
                    last_name=s["last_name"],
                    first_name=s["first_name"],
                    classes= be_class,
                    student_can=s["student_can"],
                )
            
        return Response({"message": "Students created successfully", "Code": 200})
    except Exception as e:
        return Response({"message": f"Error creating students: {str(e)}", "Code": 500})

@api_view(["POST"])
def create_writing_tasks(request):
    
    from datetime import datetime


    tasks = request.data.get("tasks", [])
    try:
        # prefetch all students
        existed_students = Student.objects.in_bulk(field_name='student_code')
    
        writing_tasks_objs = []

        for t in tasks: 
            student = existed_students.get(str(t["student_code"])) 

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
                student_code=student,
                trait=t["trait"],
                started_time=started_time,
                response=t["response"],
                words_count=int(t["words_count"]) if t.get("words_count") else 0,
            ))
        existing_keys = set(
            WritingTask.objects.filter(
                student_code__in=[w.student_code for w in writing_tasks_objs],
                trait__in=[w.trait for w in writing_tasks_objs],
                started_time__in=[w.started_time for w in writing_tasks_objs],
                ).values_list("student_code_id", "started_time", "trait")
            )
        unique_objs = [
            w for w in writing_tasks_objs
            if (w.student_code.student_code, w.started_time, w.trait) not in existing_keys
            ]
            # Bulk create writing tasks
        with transaction.atomic():
            WritingTask.objects.bulk_create(unique_objs, batch_size=400) # Adjust batch size
        return Response({"message": f"{len(unique_objs)} Writing tasks created successfully", "Code": 200})
    except Exception as e:
        return Response({"message": f"Error creating writing tasks: {str(e)}", "Code": 500})


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
            # Strict matching all fields
            filters_strict = {}
            if task.get("student_can"):
                filters_strict["student_can__iexact"] = task["student_can"]
            if task.get("student_digital_id"):
                filters_strict["student_digital_id__iexact"] = task["student_digital_id"]
            if student_first_name:
                filters_strict["first_name__iexact"] = student_first_name
            if student_last_name:
                filters_strict["last_name__iexact"] = student_last_name
            if task.get("class_name"):
                filters_strict["classes__class_name"] = task["class_name"]
            
            # matching only student_can
            filters_can = {}
            if task.get("student_can"):
                filters_can["student_can__iexact"] = task["student_can"]
            # matching only student_digital_id
            filters_digital_id = {}
            if task.get("student_digital_id"):
                filters_digital_id["student_digital_id__iexact"] = task["student_digital_id"]

            student_objs = Student.objects.filter(**filters_strict)

            if not student_objs.exists() and task.get("student_can"):
                student_objs = Student.objects.filter(**filters_can)

            if not student_objs.exists() and task.get("student_digital_id"):
                student_objs = Student.objects.filter(**filters_digital_id)

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
            "message": f"File parsed done!, created {created_count} writing records. duplicates: {duplicate_errors}. Not found students: {students_not_found}. Non-parseable files: {non_parseable_files}",    
            "Code": 200 if not duplicate_errors else 207
        })

    except Exception as e:
        return JsonResponse({"message": f"parse get error: {str(e)}", "Code": 500})