from django.test import TestCase

from django.test import TestCase
from .models import Raters, WritingTasks, ReviewAssignment
from django.db import IntegrityError

class WritingTaskAssignRatersTestCase(TestCase):
    
    def setUp(self):
        # Set up test data
        self.rater1 = Raters.objects.create(name="Rater 1", password="password123")
        self.rater2 = Raters.objects.create(name="Rater 2", password="password123")
        self.rater3 = Raters.objects.create(name="Rater 3", password="password123")
        self.rater4 = Raters.objects.create(name="Rater 4", password="password123")
        
        # Create a writing task
        self.task = WritingTasks.objects.create(itemId=1, testId="Test001", content="This is a writing task.")

    def test_assign_raters(self):
        # Assign raters to the task using the `assign_raters` method
        result = self.task.assign_raters([self.rater1, self.rater2, self.rater3, self.rater4])
        
        # Check that the result contains two raters for each day
        self.assertIn("Day 1", result)
        self.assertIn("Day 2", result)
        self.assertEqual(len(result["Day 1"]), 2)
        self.assertEqual(len(result["Day 2"]), 2)
        
        # Check that the same raters are not assigned to both days
        day1_raters = result["Day 1"]
        day2_raters = result["Day 2"]
        self.assertTrue(not set(day1_raters) & set(day2_raters))  # No overlap between Day 1 and Day 2
        
        # Check that ReviewAssignments are created for both days
        self.assertEqual(ReviewAssignment.objects.filter(writing_task=self.task, day=1).count(), 2)
        self.assertEqual(ReviewAssignment.objects.filter(writing_task=self.task, day=2).count(), 2)

        # Check the names of the raters assigned to Day 1 and Day 2
        day1_rater_names = [r.rater.name for r in self.task.reviews.filter(day=1)]
        day2_rater_names = [r.rater.name for r in self.task.reviews.filter(day=2)]
        
        self.assertTrue(set(day1_rater_names).issubset(day1_raters))
        self.assertTrue(set(day2_rater_names).issubset(day2_raters))

    def test_insufficient_raters(self):
        # Try assigning raters with fewer than 4 raters
        with self.assertRaises(ValueError):
            self.task.assign_raters([self.rater1, self.rater2, self.rater3])
