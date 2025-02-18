from django.core.management.base import BaseCommand
from modelapi.models import Raters, WritingTasks

class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **kwargs):
        self.seed_raters()
        self.seed_writing_tasks()
        self.stdout.write(self.style.SUCCESS('Database seeded successfully'))

    def seed_raters(self):
        raters_data = [{'name':f'Rater{i}', 'password':f'password{i}'} for i in range(40)]

        for rater_data in raters_data:
            Raters.objects.get_or_create(**rater_data)
        self.stdout.write(self.style.SUCCESS('Raters table seeded'))

    def seed_writing_tasks(self):
        writing_tasks_data = [
            {'itemId': f'{i}{i}{i}', 'testId': '54', 'content': f'Content for writing task by User {i}{i}{i}'} for i in range(500)]

        for writing_task_data in writing_tasks_data:
            WritingTasks.objects.get_or_create(**writing_task_data)
        self.stdout.write(self.style.SUCCESS('WritingTasks table seeded'))