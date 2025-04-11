from django.db import models
from django.contrib.auth.models import AbstractUser
from collections import Counter

# Create your models here.


class Rater(AbstractUser):
    username = models.CharField(max_length=100, unique=True)  # Rater's firstname_lastname
    rater_digital_id = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100, default="test123")  # Rater's password
    active = models.BooleanField()  # Rater's status
    task_access=models.IntegerField(default=1)

    def __str__(self):
        return self.username
    


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
        Assigns two different raters to a writing task, ensuring:
        - A student’s writing task 1 and 2 are rated by different raters.
        - Raters are evenly distributed across tasks.
        - Raters are active.
        """

        if len(raters) < 4:
            raise ValueError("At least 4 raters are required for unique assignments.")

        raters = [r for r in raters if r.active and r.username and "admin" not in r.username.lower()]
        if not raters:
            raise ValueError("No active raters available.")

        # Check if task already assigned
        existing_tasks = AssessmentTask.objects.filter(writing_task=self)
        if existing_tasks.count() >= 2:
            return  # Already fully assigned

        assigned_rater_ids = set(existing_tasks.values_list("rater_id", flat=True))

        # Find other task for this student
        opposite_trait = "writing task 1" if self.trait == "writing task 2" else "writing task 2"
        other_task = WritingTask.objects.filter(student_name=self.student_name, trait=opposite_trait).first()

        excluded_raters = set()
        if other_task:
            excluded_raters = set(
                AssessmentTask.objects.filter(writing_task=other_task).values_list("rater_id", flat=True)
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

class AssessmentTask(models.Model):

    writing_task = models.ForeignKey(WritingTask, on_delete=models.CASCADE, related_name="reviews")
    rater = models.ForeignKey(Rater, on_delete=models.CASCADE, related_name="assignments")
    ta = models.IntegerField(null=True)
    gra = models.IntegerField(null=True)
    voc = models.IntegerField(null=True)
    coco = models.IntegerField(null=True)
    completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.writing_task.id} - {self.writing_task.trait} on {self.writing_task.started_time} reviewed by {self.rater.username} "
    