from django.db import models
from django.contrib.auth.models import AbstractUser
from collections import Counter

# Create your models here.
class Rater(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Rater's firstname_lastname
    rater_digital_id = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100, default="test123")  # Rater's password
    active = models.BooleanField()  # Rater's status
    task_access=models.IntegerField(default=1)

    def __str__(self):
        return self.name
    


class WritingTask(models.Model):
    '''
    WritingTask model represents the writing tasks that raters will review.
    The data is from Concerto database: assessResponse_Writingtask table.
    '''

    started_time = models.DateTimeField()
    trait = models.CharField(max_length=100)
    student_name = models.CharField(max_length=100)
    assign_all = models.BooleanField(default=False)
    response = models.TextField()
    words_count= models.IntegerField(null=True)

    def __str__(self):
        return f"{self.trait} in test on #{self.started_time} by {self.student_name}"


    def assign_raters(self, raters):
        """
        Assigns two different raters for a writing task, ensuring:
        - No repetition between 'writing task 1' and 'writing task 2' for the same user, if possible.
        - Avoids assigning raters multiple times to the same task.
        """
        if len(raters) < 4:
            raise ValueError("At least 4 raters are required for unique assignments.")

        # Prevent duplicate assignment if this task already has raters

        existedTask = AssessmentTask.objects.filter(writing_task=self)
        if existedTask.exists():
            # student_name = self.student_name
            usedRaterforstu = AssessmentTask.objects.filter(writing_task__student_name=self.student_name)
            if(len(existedTask)<2):
                print(f"existedTask: {existedTask}")
                assigned_rater_ids = usedRaterforstu.values_list("rater", flat=True)
                available_raters = [r for r in raters if r.id not in assigned_rater_ids and r.active == True]
                rater=available_raters[0]
                AssessmentTask.objects.create(writing_task=self, rater=rater)
          
            return
        elif existedTask.exists() and len(existedTask)==1:
           
            available_raters = [r for r in raters if r not in existedTask.values_list("rater", flat=True) and r.active == True]
            rater=available_raters[0]
            AssessmentTask.objects.create(writing_task=self, rater=rater)
            

        # Get other writing task for the same user
        opposite_trait = "writing task 1" if self.trait == "writing task 2" else "writing task 2"
        other_task = WritingTask.objects.filter(student_name=self.student_name, trait=opposite_trait).first()

        excluded_raters = set()
        if other_task:
            excluded_raters = set(
                AssessmentTask.objects.filter(writing_task=other_task).values_list("rater_id", flat=True)
            )

        rater_assignments_count = Counter(
            AssessmentTask.objects.filter(rater__in=raters).values_list('rater_id', flat=True)
        )

        sorted_raters = sorted(raters, key=lambda r: rater_assignments_count[r.id])
        available_raters = [r for r in sorted_raters if r.id not in excluded_raters and r.active == True]

        if len(available_raters) < 2:
            available_raters = sorted_raters

        selected_raters = available_raters[:2]
        for rater in selected_raters:
            AssessmentTask.objects.create(writing_task=self, rater=rater)

        return {
            "trait": self.trait,
            "assigned_raters": [r.name for r in selected_raters]
        }


class AssessmentTask(models.Model):

    writing_task = models.ForeignKey(WritingTask, on_delete=models.CASCADE, related_name="reviews")
    rater = models.ForeignKey(Rater, on_delete=models.CASCADE, related_name="assignments")
    ta = models.IntegerField(null=True)
    gra = models.IntegerField(null=True)
    voc = models.IntegerField(null=True)
    coco = models.IntegerField(null=True)
    completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.writing_task.id} - {self.writing_task.trait} on {self.writing_task.started_time} reviewed by {self.rater.name} "
    