from django.core.management.base import BaseCommand
from modelapi.models import Raters, WritingTasks

class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **kwargs):
        self.seed_raters()
        self.seed_writing_tasks()
        self.stdout.write(self.style.SUCCESS('Database seeded successfully'))

    def seed_raters(self):
        raters_data = [
            {'name': 'Rater1', 'password': 'password1'},
            {'name': 'Rater2', 'password': 'password2'},
            {'name': 'Rater3', 'password': 'password3'},
            {'name': 'Rater4', 'password': 'password4'},
        ]

        for rater_data in raters_data:
            Raters.objects.get_or_create(**rater_data)
        self.stdout.write(self.style.SUCCESS('Raters table seeded'))

    def seed_writing_tasks(self):
        writing_tasks_data = [
            {'itemId': 111, 'testId': '54', 'content': 'Content for writing task by User 111'},
            {'itemId': 222, 'testId': '54', 'content': 'Content for writing task by User 222'},
            {'itemId': 333, 'testId': '54', 'content': 'Content for writing task by User 333'},
            {'itemId': 444, 'testId': '54', 'content': 'Content for writing task by User 444'},
        ]

        for writing_task_data in writing_tasks_data:
            WritingTasks.objects.get_or_create(**writing_task_data)
        self.stdout.write(self.style.SUCCESS('WritingTasks table seeded'))