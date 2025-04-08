from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse

# Create your views here.
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import RatersSerializer, ReviewAssignmentSerializer, WritingTasksSerializer
from rest_framework import status
from .models import Raters, WritingTasks, ReviewAssignment

class RatersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Raters.objects.all().order_by('name')
    serializer_class = RatersSerializer

    # def list(self, request):
    #     pass

    def create(self, request):
        raters = request.data.get('raters', []) # raters are object array with [{'name':'rater1', 'rater_digital_id':'rater1', 'password':'test123'}....]
        existed_raters = Raters.objects.values_list('rater_digital_id', flat=True)
        new_raters = [rater for rater in raters if rater['rater_digital_id'] not in existed_raters]
        if new_raters:
            print(f"Creating new raters: {new_raters}")
            for rater in new_raters:
                Raters.objects.create(name=rater['name'], rater_digital_id=rater['rater_digital_id'], password=rater['password'])
        objects_raters = Raters.objects.all()
        print(f"All raters: {objects_raters}")
        return Response({"message": "Raters created successfully", "Code": 200, "data": RatersSerializer(objects_raters, many=True).data})
    
    def destroy(self, request):
        """
        Delete a rater by digital Id.
        """
        rater_digital_id = request.data.get('rater_digital_id')

      
        rater = get_object_or_404(Raters, rater_digital_id=rater_digital_id)
        rater.active = False
        print(f"Deactivating rater with name '{rater.name}' instead of deleting.")
        rater.save()
        return Response({"message": "Rater deleted successfully", "Code": 200}, status=status.HTTP_204_NO_CONTENT)




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
    
    def create(self, request):
        """
        Create a new review assignment.
        """
        student_name = request.data.get('student_name')
        trait = request.data.get('trait')
        rater_name = request.data.get('rater_name')

        if student_name and trait and rater_name:
            try:
                writing_task = get_object_or_404(WritingTasks, trait=trait, student_name=student_name)
                rater = get_object_or_404(Raters, name=rater_name)

                # Check if the assignment already exists
                ReviewAssignment.objects.create(
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
                    allocatedTask = ReviewAssignment.objects.get(id=item['id']) 
                    allocatedTask.ta, allocatedTask.gra, allocatedTask.voc, allocatedTask.coco = item.get('ratings', {}).get('ta'), item.get('ratings', {}).get('gra'), item.get('ratings', {}).get('voc'), item.get('ratings', {}).get('coco')
                    allocatedTask.completed = item.get('completed')
                    allocatedTask.save()
                if 'idList' in item:
                    rater_name = item.get('raterName')
                    idList = item.get('idList')
                    for id in idList:
                        allocatedTask = ReviewAssignment.objects.get(id=id)
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