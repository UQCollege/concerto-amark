from django.core.management.base import BaseCommand
from modelapi.models import Raters, WritingTasks

class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **kwargs):
        self.seed_writing_tasks()
        self.stdout.write(self.style.SUCCESS('Database seeded successfully'))

    def seed_writing_tasks(self):
        students = [str(i) for i in range(501) ]  # Add more users as needed
        start_date = "2025-02-27"
        end_date = "2025-02-28"
        writing_tasks_data = []

        # Generate tasks for each user
        for student in students:
            for i in range(2):  # Each user has 2 tasks
                task_trait = f"Writing {i + 1}"  # Writing 1, Writing 2
                started_time = start_date if i == 0 else end_date  # Alternate the start date
                response = f"This is test example {i + 1} for User {student}"

                writing_tasks_data.append({
                    'student_name': student,
                    'trait': task_trait,
                    'started_time': started_time,
                    'response': response,
                    'words_count':100
                })


        for writing_task_data in writing_tasks_data:
            WritingTasks.objects.get_or_create(**writing_task_data)
        self.stdout.write(self.style.SUCCESS('WritingTasks table seeded'))