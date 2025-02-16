import random
from django.db import models

# Create your models here.
class Raters(models.Model):
    name = models.CharField(max_length=100)  # Rater's name
    password = models.CharField(max_length=100)  # Rater's password

    def __str__(self):
        return self.name

class WritingTasks(models.Model):
    itemId= models.IntegerField(unique=True)
    testId = models.CharField(max_length=50) # test number
    content = models.TextField()

    def __str__(self):
        return f"{self.itemId} in test #{self.testId}"

    def assign_raters(self, raters):
        """
        Assigns two different raters for Day 1 and Day 2, ensuring no repetition.
        """
        if len(raters) < 4:
            raise ValueError("At least 4 raters are required for unique assignments.")

        available_raters = list(raters)

        # Assign Day 1 raters
        day1_raters = random.sample(available_raters, 2)
        for rater in day1_raters:
            ReviewAssignment.objects.create(writing_task=self, rater=rater, day=1, testId=self.testId)
    
        available_raters = [r for r in available_raters if r not in day1_raters]  # Remove used raters

        # Assign Day 2 raters (different from Day 1)
        day2_raters = random.sample(available_raters, 2)
        for rater in day2_raters:
            ReviewAssignment.objects.create(writing_task=self, rater=rater, day=2, testId=self.testId)

        return {
            "Day 1": [r.name for r in day1_raters],
            "Day 2": [r.name for r in day2_raters],
        }


class ReviewAssignment(models.Model):
    DAY_CHOICES =[(1, "Day 1"), (2, "Day 2")]

    writing_task = models.ForeignKey(WritingTasks, on_delete=models.CASCADE, related_name="reviews")
    rater = models.ForeignKey(Raters, on_delete=models.CASCADE, related_name="assignments")
    testId = models.CharField(max_length=50)
    day = models.IntegerField(choices = DAY_CHOICES)
    rate1 = models.IntegerField(null=True)
    rate2 = models.IntegerField(null=True)
    rate3 = models.IntegerField(null=True)
    rate4 = models.IntegerField(null=True)




    def __str__(self):
        return f"{self.writing_task.itemId} reviewed by {self.rater.name} on {self.day}"
    
    
