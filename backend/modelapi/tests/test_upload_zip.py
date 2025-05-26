import os
import zipfile
import tempfile
import shutil

from django.test import TestCase
from docx import Document

from modelapi.utils import parse_zip_and_extract_texts


class MultipleDocxInZipTests(TestCase):

    def setUp(self):
        self.base_dir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.base_dir)

    def _create_docx(self, lines):
        """Creates a .docx file from lines and returns the path."""
        tmp_docx = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
        doc = Document()
        for line in lines:
            doc.add_paragraph(line)
        doc.save(tmp_docx.name)
        return tmp_docx.name

    def _create_zip_with_files(self, file_paths):
        """Creates a zip file from given (filename, filepath) tuples."""
        zip_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for arcname, filepath in file_paths:
                zipf.write(filepath, arcname=arcname)
        return zip_path

    def test_multiple_different_docx_files(self):
    # Prepare varied test data for 3 students
        students_data = [
            {
                "can": "123", "id": "-s1111111", "name": "First Last", "date": "2025-01-01",
                "trait": "Writing 1", "class": 10, "words": 280,
                "response": "Education is the cornerstone of a progressive society."
            },
            {
                "can": "001", "id": "", "name": "First Last", "date": "2025-01-01",
                "trait": "Writing 1", "class": 10, "words": 280,
                "response": "Education is the cornerstone of a progressive society."
            },
            
            {
                "can": "123", "id":"-", "name": "First Last", "date": "2025-03-03",
                "trait": "Writing 2", "class": 8, "words": 280,
                "response": "Education is the cornerstone of a progressive society."
            },
          
            {
                "can": "", "id": "", "name": "First Last", "date": "2025-03-03",
                "trait": "Writing 1", "class": 7, "words": 280,
                "response": "Education is the cornerstone of a progressive society."
            },
            {
                "can": "", "id": "s1234567", "name": "First Last", "date": "2025-03-03",
                "trait": "Writing 1", "class": 7, "words": 280,
                "response": "Education is the cornerstone of a progressive society."
            },
            {
                "can": "", "id": "s1234567", "name": "First Last", "date": "2025-03-03",
                "trait": "Writing 1", "class": 7, "words": 280,
                "response": "Education is the cornerstone of a progressive society."
            },
           
        ]


        docx_files = []
        expected_results = []
    
        for i, student in enumerate(students_data, start=1):
           
            lines = [
                f"{student['can']}{student['id']} {student['name']} {student['date']} \n",
                f"Exam: Teacher X - {student['trait']} - (01-25) Tuesday 4 February \n",
                f"Class: {student['class']} \n",
                f"Number of words: {student['words']} \n",
                student['response']
            ]
            expected_results.append({
                "student_can": student["can"],
                "student_digital_id": student["id"].replace("-", ""),
                "student_fullname": student["name"].lower(),
                "trait": student["trait"],
                "class_name": student["class"],
                "date": student["date"],
                "response": student["response"],
                "words_count": student["words"]
            })
          
            docx_path = self._create_docx(lines)
            docx_files.append((f"{i}.docx", docx_path))
            print(lines)
        zip_path = self._create_zip_with_files(docx_files)
        results, non_parseable_files, error = parse_zip_and_extract_texts(zip_path, self.base_dir)
 
        self.assertIsNone(error)
        self.assertEqual(len(results), len(students_data))

        results_sorted = sorted(results, key=lambda x: x["student_digital_id"] if x["student_digital_id"] != None else x["student_can"])
        expected_sorted = sorted(expected_results, key=lambda x: x["student_digital_id"] if x["student_digital_id"] != None else x["student_can"])

        self.assertEqual(results_sorted, expected_sorted)
