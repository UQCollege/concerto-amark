from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse

# Create your views here.
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import RaterSerializer, AssessmentTaskSerializer, WritingTaskSerializer
from rest_framework import status
from .models import Rater, WritingTask, AssessmentTask
from rest_framework.decorators import api_view

class RaterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Rater.objects.all().order_by('name')
    serializer_class = RaterSerializer

    # def list(self, request):
    #     pass

    def create(self, request):
        raters = request.data.get('raters', [])  # raters are object array with [{'name':'rater1', 'rater_digital_id':'rater1', 'password':'test123'}....]
        existed_raters = Rater.objects.in_bulk(field_name='rater_digital_id')

        for rater in raters:
            rater_digital_id = rater['rater_digital_id']
            if rater_digital_id not in existed_raters:
                # Create a new rater if it doesn't exist
                Rater.objects.create(
                    name=rater['name'],
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
        rater_digital_id = request.data.get('rater_digital_id')

      
        rater = get_object_or_404(Rater, rater_digital_id=rater_digital_id)
        rater.active = False
        print(f"Deactivating rater with name '{rater.name}' instead of deleting.")
        rater.save()
        return Response({"message": "Rater deleted successfully", "Code": 200}, status=status.HTTP_204_NO_CONTENT)
    
    def update(self, request):
        task_access = request.data.get('taskAccess')

        if task_access:
            # Update all raters' task_access with the provided data
            raters = Rater.objects.all()
            for rater in raters:
                rater.task_access = task_access
                rater.save()
            return Response({"message": "All raters' task_access updated successfully", "Code": 200})
        return Response({"message": "No task_access provided", "Code": 400})




    # def retrieve(self, request, pk=None):
    #     pass

    # def update(self, request, pk=None):
    #     pass


class WritingTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = WritingTask.objects.all().order_by('id')
    serializer_class = WritingTaskSerializer

    # def list(self, request):
    #     pass

    # def create(self, request):
    #     pass

    # def retrieve(self, request, pk=None):
    #     pass

    # def update(self, request, pk=None):
    #     pass




class AssessmentTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = AssessmentTask.objects.all().order_by('id')
    serializer_class = AssessmentTaskSerializer

    def list(self, request):
        """
        Allows filtering by rater_name via a query parameter.
        Example: GET /api/review-assignments/?rater_name=Rater1
        """
        queryset = self.queryset  # Use self.queryset to maintain consistency
        rater_name = request.GET.get('rater_name', None)

        if rater_name:
            try:
                rater = Rater.objects.get(name=rater_name)
                task_access = rater.task_access
                queryset = queryset.filter(rater=rater, writing_task__trait=f"Writing {task_access}")
            except Rater.DoesNotExist:
                return Response({"message": f"Rater '{rater_name}' not found", "Code": 404}, status=status.HTTP_404_NOT_FOUND)
        
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
                rater = get_object_or_404(Rater, name=rater_name)

                # Check if the assignment already exists
                AssessmentTask.objects.create(
                    writing_task=writing_task,
                    rater=rater,
                    completed=False,
                    ta=None,
                    gra=None,
                    voc=None,
                    coco=None)
                serializer = self.get_serializer(writing_task)
                print(f"successfully create the Writing task {writing_task.id} assigned to rater {rater.name}")
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
                if 'ratings' in item:
                    allocatedTask = AssessmentTask.objects.get(id=item['id']) 
                    allocatedTask.ta, allocatedTask.gra, allocatedTask.voc, allocatedTask.coco = item.get('ratings', {}).get('ta'), item.get('ratings', {}).get('gra'), item.get('ratings', {}).get('voc'), item.get('ratings', {}).get('coco')
                    allocatedTask.completed = item.get('completed')
                    allocatedTask.save()
                if 'idList' in item:
                    rater_name = item.get('raterName')
                    idList = item.get('idList')
                    for id in idList:
                        allocatedTask = AssessmentTask.objects.get(id=id)
                        if rater_name:
                            rater = Rater.objects.filter(name=rater_name).first()
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

    tasks = WritingTask.objects.all()
    for task in tasks:
        raters = Rater.objects.all()  # Fetch all available raters
        task.assign_raters(raters)   
    
    return JsonResponse({"message": "Raters assigned successfully", "Code": 200})

@api_view(['POST'])
def assign_to_all(request):
    """
    View to assign certain tasks to all raters.
    """
    student_names = request.data.get("studentNames", [])
    if not student_names:
        return JsonResponse({"message": "No student names provided", "Code": 400})
    print("0")
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
                    completed=False
                )
    print("1")

    return JsonResponse({"message": "Tasks assigned to all raters successfully", "Code": 200})
            
    


def clear_tasks_view(request):
    """
    View to clear all writing tasks.
    """
    AssessmentTask.objects.all().delete()
    return JsonResponse({"message": "Tasks cleared successfully", "Code": 200})



# def login_user(req):
#     if req.user.is_authenticated:
#         return redirect("index")
#     else:
#         if req.method=='POST':
#             form=Login_Form(data=req.POST)
#             username_ldap=req.POST.get('username')
#         # print(user)
#             if form.is_valid():
#                 user=form.get_user()
#                 login(req, user, backend="django_auth_ldap.backend.LDAPBackend",)
#                 return redirect("index")
        
#             else:
#                 messages.warning(req, ' no permission for this application, please contact Admin!')
#                 return redirect("/")
#         else:
#             form = Login_Form()
#         return render(req, 'registration/login.html', {'form': form})    

# #-------------------------------------------------------------------------------------------------
# def logout_user(req):
#     logout(req)    
#     return redirect("/")