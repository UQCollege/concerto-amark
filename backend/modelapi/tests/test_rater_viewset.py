from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from modelapi.models import AssessmentTask, BEClass, WritingTask, Student

CustomUser = get_user_model()

class RaterViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create a superuser and a rater-type teacher
        self.superuser = CustomUser.objects.create_superuser(
            username="admin", email="admin@example.com", password="admin123"
        )
        self.teacher = CustomUser.objects.create_user(
            username="teacher1", email="teacher@example.com", password="teacher123",
            usertype='Rater', rater_digital_id="teacher1"
        )

        # Create dummy class
        self.dummy_class = BEClass.objects.create(
            class_name=101,
            class_desc="BE"
        )

        # Create dummy student
        self.dummy_student = Student.objects.create(
            classes=self.dummy_class,
            student_code='stu_001',
            student_digital_id="s1"
        )

        # Create writing task
        self.writing_task = WritingTask.objects.create(
            student_code=self.dummy_student,
            trait="Coherence",
            started_time="2025-01-01",
            response="Dummy response",
            words_count=100
        )

        # Create the rater user
        self.rater = CustomUser.objects.create_user(
            username="rater_test1",
            email="rater_test1@example.com",
            password="rater123",
            usertype="Rater",
            rater_digital_id="rdid_test1"
        )

        self.api_url = reverse("raters-api")

    def test_list_raters_as_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(self.api_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(r["username"] == "rater_test1" for r in response.data))

    def test_list_raters_as_non_superuser(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.api_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["Code"], 403)

    def test_create_new_rater_successfully(self):
        self.client.force_authenticate(user=self.superuser)
        payload = {
            "raters": [{
                "name": "new_rater_1",
                "first_name": "New",
                "last_name": "Rater",
                "rater_digital_id": "rdid_new_1",
                "task_access": 2,
                "class_name": 101
            }]
        }
        response = self.client.post(self.api_url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(CustomUser.objects.filter(username="new_rater_1").exists())

    def test_reactivate_existing_rater(self):
        self.client.force_authenticate(user=self.superuser)
        self.rater.active = False
        self.rater.save()

        payload = {
            "raters": [{
                "name": "rater_test1",
                "first_name": "John",
                "last_name": "Doe",
                "rater_digital_id": "rdid_test1",
                "task_access": 3
            }]
        }
        response = self.client.post(self.api_url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.rater.refresh_from_db()
        self.assertTrue(self.rater.active)
        self.assertEqual(self.rater.task_access, 3)

    def test_create_rater_duplicate_username_ignored(self):
        self.client.force_authenticate(user=self.superuser)
        payload = {
            "raters": [{
                "name": "rater_test1",  # already exists
                "first_name": "Dup",
                "last_name": "User",
                "rater_digital_id": "rdid_unused"
            }]
        }
        response = self.client.post(self.api_url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(CustomUser.objects.filter(username="rater_test1").count(), 1)

    def test_destroy_rater(self):
        self.client.force_authenticate(user=self.superuser)
        task = AssessmentTask.objects.create(
            rater=self.rater,
            writing_task=self.writing_task,
            active=True,
            completed=False
        )
        response = self.client.delete(self.api_url, {"rater_digital_id": "rdid_test1"}, format='json')
        self.assertEqual(response.status_code, 204)
        self.rater.refresh_from_db()
        self.assertFalse(self.rater.active)
        self.assertFalse(AssessmentTask.objects.filter(id=task.id).exists())

    def test_update_task_access(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.put(self.api_url, {"taskAccess": 4}, format="json")
        self.assertEqual(response.status_code, 200)
        self.rater.refresh_from_db()
        self.assertEqual(self.rater.task_access, 4)

    def test_update_task_access_missing(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.put(self.api_url, {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["Code"], 400)
