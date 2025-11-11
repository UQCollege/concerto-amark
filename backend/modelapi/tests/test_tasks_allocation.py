from django.test import TestCase
from collections import Counter
from ..models import WritingTask, CustomUser, AssessmentTask, Student

class AssignRatersMultipleTasksTestCase(TestCase):
    def setUp(self):
        # Create 10 active raters
        self.raters = [
            CustomUser.objects.create(username=f"rater{i}", active=True, rater_digital_id=f"RID{i}",task_access=1, usertype="Rater")
            for i in range(10)
        ]
        # Create 10 active test raters
        self.raters = [
            CustomUser.objects.create(username=f"test_rater{i}", active=True, rater_digital_id=f"tRID{i}",task_access=1, usertype="Test-Rater")
            for i in range(10)
        ]

        self.students = [Student.objects.create(student_code=str(i)) for i in range(20)]
        self.tasks = []

        # Create 2 tasks per student: writing task 1 and 2
        for student in self.students:
            task1 = WritingTask.objects.create(
                started_time="2024-01-01",
                trait="writing task 1",
                student_code=student,
                response=f"{student}'s response 1",
                words_count=100,
            )
            task2 = WritingTask.objects.create(
                started_time="2024-01-01",
                trait="writing task 2",
                student_code=student,
                response=f"{student}'s response 2",
                words_count=120,
            )
            self.tasks.append((task1, task2))

    def test_assign_raters_multiple_students(self):
        for task1, task2 in self.tasks:
            task1.assign_raters(self.raters)
            task2.assign_raters(self.raters)

        all_assignments = AssessmentTask.objects.all()
        self.assertEqual(all_assignments.count(), len(self.students) * 2 * 2)  # 2 raters per task

        # Check uniqueness of raters per student
        for student in self.students:
            task1_raters = AssessmentTask.objects.filter(
                writing_task__student_code=student,
                writing_task__trait="writing task 1",
                rater__usertype="Rater"
            ).values_list("rater_id", flat=True)

            task2_raters = AssessmentTask.objects.filter(
                writing_task__student_code=student,
                writing_task__trait="writing task 2",
                rater__usertype="Rater"
            ).values_list("rater_id", flat=True)

            # Ensure task1 and task2 raters are different
            self.assertTrue(set(task1_raters).isdisjoint(set(task2_raters)))

        # Check balanced distribution across raters
        rater_counts = Counter(
            AssessmentTask.objects.values_list("rater_id", flat=True)
        )
        counts = list(rater_counts.values())
        self.assertLessEqual(max(counts) - min(counts), 1, "Raters are not evenly distributed")

