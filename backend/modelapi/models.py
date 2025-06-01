from django.db import models
from django.contrib.auth.models import AbstractUser
from collections import Counter
import os

# Create your models here.

class BEClass(models.Model):
    class_name = models.IntegerField(unique=True, primary_key=True)
    class_desc = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f'{self.class_name} - {self.class_name}'

class CustomUser(AbstractUser):
    # an option for chosing the user type
    # Rater or Teacher or Admin or Admin-Rater
    USER_TYPE_CHOICES = (
        ('Rater', 'Rater'),
        ('Teacher', 'Teacher'),
        ('Admin', 'Admin'),
        ('Admin-Rater', 'Admin-Rater'),
    )
    usertype = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='Rater')
    username = models.CharField(max_length=100, unique=True)  # Rater's firstname_lastname
    rater_digital_id = models.CharField(max_length=100, unique=True)
    active = models.BooleanField(default=True)  # Rater's status
    task_access=models.IntegerField(default=1)
    classes= models.ForeignKey(BEClass, on_delete=models.SET_NULL, related_name="teacher_classes", null=True, blank=True)

    def __str__(self):
        return self.username
    
    def save(self, *args, **kwargs):
        if self.usertype == 'Admin':
            self.set_password(os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'defaultpassword'))
        else:
            self.set_password(os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'defaultpassword'))
        super().save(*args, **kwargs)
    

class Audit(models.Model):
    update_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    update_date = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Override delete to set active to False instead of deleting
        self.active = False
        kwargs.pop('request', None)  # remove in case it's passed accidentally
        self.save(*args, **kwargs)  # Call save to update the active field

class Student(Audit):
    student_code = models.CharField(max_length=50, unique=True, primary_key=True)
    student_digital_id = models.CharField(max_length=50, null=True, blank=True)
    student_can = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True) 
    first_name = models.CharField(max_length=100, null=True)
    classes=models.ForeignKey(BEClass, on_delete=models.SET_NULL, related_name="student_classes", null=True)
    
    def __str__(self):
        return self.student_code


class WritingTask(Audit):
    '''
    WritingTask model represents the writing tasks that raters will review.
    The data is from Concerto database: assessResponse_Writingtask table.
    '''
    TRAIT_CHOICES = (
        ('Writing 1', 'Writing 1'),
        ('Writing 2', 'Writing 2'),
        ('Writing 3', 'Writing 3'),
        ('Writing 4', 'Writing 4'),
        ('Weekly Writing', 'Weekly Writing'),

    )
    started_time = models.DateTimeField()
    trait = models.CharField(max_length=25, choices=TRAIT_CHOICES, null=True)
    student_code = models.ForeignKey(Student, on_delete=models.CASCADE)
    assign_all = models.BooleanField(default=False)
    response = models.TextField()
    words_count= models.IntegerField(null=True)

    class Meta:
        unique_together = ('trait', 'student_code', 'started_time')


    def __str__(self):
        return f"{self.trait} in test on #{self.started_time} by {self.student_code}"


    def assign_raters(self, raters):
        """
        Assigns two different raters to a writing task, ensuring:
        - A student’s writing task 1 and 2 are rated by different raters.
        - Raters are evenly distributed across tasks.
        - Raters are active.
        """

        if len(raters) < 4:
            raise ValueError("At least 4 raters are required for unique assignments.")

        raters = [r for r in raters]
        if not raters:
            raise ValueError("No active raters available.")

        # Check if task already assigned
        existing_tasks = AssessmentTask.objects.filter(writing_task=self, active=True)
        if existing_tasks.count() >= 2:
            return  # Already fully assigned

        assigned_rater_ids = set(existing_tasks.values_list("rater_id", flat=True))
        excluded_raters = set(
            AssessmentTask.objects.filter(writing_task__student_code=self.student_code)
            .values_list("rater_id", flat=True)
        )

        # Avoid raters already assigned to the same student's opposite task
        eligible_raters = [r for r in raters if r.id not in assigned_rater_ids | excluded_raters]

        # Track how many tasks each rater has across all assignments
        assignment_counts = Counter(
            AssessmentTask.objects.filter(rater__in=raters).values_list("rater_id", flat=True)
        )

        # Separate raters into ones with more task1 or task2 assignments
        task_type_counts = Counter()
        all_tasks = AssessmentTask.objects.filter(rater__in=raters).select_related("writing_task")
        for t in all_tasks:
            task_type_counts[(t.rater_id, t.writing_task.trait)] += 1

        def sort_key(rater):
            return (
                task_type_counts[(rater.id, self.trait)],  # Prefer those who rated less of this trait
                assignment_counts[rater.id]                # Then prefer those with fewer total tasks
            )

        sorted_raters = sorted(eligible_raters, key=sort_key)

        needed = 2 - len(existing_tasks)
        selected = sorted_raters[:needed]

        for rater in selected:
            AssessmentTask.objects.create(writing_task=self, rater=rater)

        return {
            "trait": self.trait,
            "assigned_raters": [r.username for r in selected]
        }

class AssessmentTask(Audit):

    writing_task = models.ForeignKey(WritingTask, on_delete=models.CASCADE, related_name="reviews")
    rater = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="assignments")
    ta = models.IntegerField(null=True)
    gra = models.IntegerField(null=True)
    voc = models.IntegerField(null=True)
    coco = models.IntegerField(null=True)
    completed = models.BooleanField(default=False)
    comments = models.CharField(max_length=250, null=True)
    
    def delete(self, *args, **kwargs):
        # Perform a real delete instead of setting active to False
        super().delete(*args, **kwargs)
    

    def __str__(self):
        return f"{self.writing_task.id} - {self.writing_task.trait} on {self.writing_task.started_time} reviewed by {self.rater.username} "
