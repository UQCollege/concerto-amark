from django.core.management.base import BaseCommand
from modelapi.models import CustomUser, WritingTask, Student

class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **kwargs):
        self.seed_student()
        self.seed_writing_tasks()
        self.stdout.write(self.style.SUCCESS('Database seeded successfully'))


    def seed_student(self):
        students = ["s0"+str(i) for i in range(500) ] 
        for student in students:
            Student.objects.get_or_create(student_code = student, first_name='firstn'+student, last_name='lastn'+student)   

    def seed_writing_tasks(self):
        students =Student.objects.all()  # Add more users as needed
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
                    'student_code': student,
                    'trait': task_trait,
                    'started_time': started_time,
                    'response': response,
                    'words_count':100
                })


        for writing_task_data in writing_tasks_data:
            WritingTask.objects.get_or_create(**writing_task_data)
        self.stdout.write(self.style.SUCCESS('WritingTask table seeded'))