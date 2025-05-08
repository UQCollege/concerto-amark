from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from modelapi.models import Student, BEClass

CustomUser = get_user_model()

class CreateStudentsAPITestCase(APITestCase):
    def setUp(self):
        self.superuser = CustomUser.objects.create_superuser(
            username='admin',
            password='adminpass',
            rater_digital_id='SUPER001',
            usertype='Admin'
        )
        self.user = CustomUser.objects.create_user(
            username='normaluser',
            password='userpass',
            rater_digital_id='USER001',
            usertype='Rater'
        )
        self.url = '/api/students/'

    def test_permission_denied_for_non_superuser(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        response = client.post(self.url, {"students": []}, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['Code'], 403)
        self.assertEqual(response.json()['message'], 'No permission')

    def test_create_student_as_superuser(self):
        client = APIClient()
        client.force_authenticate(user=self.superuser)

        payload = {
            "students": [
                {
                    "student_code": "ST001",
                    "student_digital_id": "D001",
                    "first_name": "Alice",
                    "last_name": "Smith",
                    "class_name": 101
                }
            ]
        }

        response = client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['Code'], 200)

        student = Student.objects.get(student_code="ST001")
        self.assertEqual(student.first_name, "Alice")
        self.assertEqual(student.classes.class_name, 101)

    def test_update_existing_student_class(self):
        client = APIClient()
        client.force_authenticate(user=self.superuser)

        old_class = BEClass.objects.create(class_name=102, class_desc="BEadv")
        student = Student.objects.create(
            student_code="ST002",
            student_digital_id="D002",
            first_name="Bob",
            last_name="Brown",
            classes=old_class
        )

        payload = {
            "students": [
                {
                    "student_code": "ST002",
                    "student_digital_id": "D002",
                    "first_name": "Bob",
                    "last_name": "Brown",
                    "class_name": 202
                }
            ]
        }

        response = client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['Code'], 200)

        student.refresh_from_db()
        self.assertEqual(student.classes.class_name, 202)
