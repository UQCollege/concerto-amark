import random
from django.db import models
from django.contrib.auth.models import AbstractUser
from collections import Counter

# Create your models here.
class Raters(models.Model):
    name = models.CharField(max_length=100)  # Rater's firstname_lastname 
    password = models.CharField(max_length=100)  # Rater's password

    def __str__(self):
        return self.name

class WritingTasks(models.Model):
    '''
    WritingTasks model represents the writing tasks that raters will review.
    The data is from Concerto database: assessResponse_Writingtask table.
    '''

    # Todo: change schema to match data exported from Concerto database: startedTime, trait, userId, response
    id= models.IntegerField(unique=True, primary_key=True) # writing task number
    startedTime = models.DateTimeField()
    trait = models.CharField(max_length=100)
    userId = models.CharField(max_length=100)
    response = models.TextField()

    def __str__(self):
        return f"{self.trait} in test on #{self.startedTime} by {self.userId}"

    def assign_raters(self, raters):
        """
        Assigns two different raters for Day 1 and Day 2, ensuring no repetition.
        """
        if len(raters) < 4:
            raise ValueError("At least 4 raters are required for unique assignments.")

        available_raters = list(raters)
        # Track the number of assignments each rater has
        rater_assignments_count = Counter(
            ReviewAssignment.objects.filter(rater__in=raters).values_list('rater', flat=True)
        )

        # Sort raters by the number of tasks they have already been assigned (ascending order)
        available_raters.sort(key=lambda rater: rater_assignments_count[rater.id])

        # Assign Day 1 raters
        writing_task1_raters = available_raters[:2]
        # Assign Day 1 raters
        
        for rater in writing_task1_raters:
            ReviewAssignment.objects.create(writing_task=self, rater=rater)
    
        available_raters = [r for r in available_raters if r not in  writing_task1_raters]  # Remove used raters

        # Assign Day 2 raters (different from Day 1)
        writing_task2_raters  = available_raters[:2]
        for rater in  writing_task2_raters :
            ReviewAssignment.objects.create(writing_task=self, rater=rater)

        return {
            "writing task 1": [r.name for r in writing_task1_raters],
            "writing task 2": [r.name for r in writing_task2_raters],
        }


class ReviewAssignment(models.Model):
    # todo:  Change columns
    id= models.IntegerField(unique=True, primary_key=True) 
    writing_task = models.ForeignKey(WritingTasks, on_delete=models.CASCADE, related_name="reviews")
    rater = models.ForeignKey(Raters, on_delete=models.CASCADE, related_name="assignments")
   
    ta = models.IntegerField(null=True)
    gra = models.IntegerField(null=True)
    voc = models.IntegerField(null=True)
    coco = models.IntegerField(null=True)



    
    def __str__(self):
        return f"{self.writing_task.itemId} - {self.writing_task.trait} on {self.writing_task.startedTime} reviewed by {self.rater.name} "
    
    
