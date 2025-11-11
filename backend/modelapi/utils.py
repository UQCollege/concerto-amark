import os
import re
import shutil
from zipfile import ZipFile, is_zipfile
from docx2python import docx2python
from functools import wraps
from django.http import JsonResponse
from .models import CustomUser, AssessmentTask



def superuser_required(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_superuser:
                return JsonResponse({"message": "No permission", "Code": 403})
            return view_func(request, *args, **kwargs)
        return _wrapped_view


def parse_zip_and_extract_texts(file, base_dir):
    if not is_zipfile(file):
        return [], "Uploaded file is not a valid zip file"

    unzip_dir = os.path.join(base_dir, "staticfiles", "unzipped")
    os.makedirs(unzip_dir, exist_ok=True)
    parsed_results = []
    non_parseable_files=[]

    try:
        with ZipFile(file, 'r') as zip_file:
            zip_file.extractall(unzip_dir)

        extracted_files = os.listdir(unzip_dir)
        if not extracted_files:
            return [], "No files found in the zip archive"

        for root, _, files in os.walk(unzip_dir):
            for file_name in files:
                file_path = os.path.join(root, file_name)
                if not os.path.isfile(file_path):
                    continue

                with docx2python(file_path) as docx_content:
                    lines = [line.strip() for line in docx_content.text.split('\n') if line.strip()]

                    if not lines:
                        continue

                    task_data = parse_lines(lines)
                    if task_data:
                        parsed_results.append(task_data)
                    else:
                        non_parseable_files.append(file_name)
    finally:
        shutil.rmtree(unzip_dir, ignore_errors=True)

    return parsed_results, non_parseable_files, None

def parse_lines(lines):
    try:
        # Patterns for matching student info
        patterns = [
            r"(\d+)-(s\d+)\s+([a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1-s1234567 firstname lastname 2025-02-03
            r"(\d+)-(s)\s+([a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1-s firstname lastname 2025-02-03
            r"(\d+)-\s*([a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1- firstname lastname 2025-02-03 or 1-firstname lastname 2025-02-03
            r"(\d+)\s+([a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1 firstname lastname 2025-02-03
            r"(s\d+)\s+([a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., s1234567 firstname lastname 2025-02-03
            r"-(s\d+)\s+([a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., -s1234567 firstname lastname 2025-02-03
            r"([a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., firstname lastname 2025-02-03
            r"(\d+)\s+([a-zA-Z\-]+(?:\s[a-zA-Z\-]+)*)\s+(\d{4}-\d{2}-\d{2})",  # e.g., 215 Min-Ching Lou 2025-05-26 or 215 min-ching Lou 2025-05-26
        ]

        first_line = lines[0]

        match = None
        for pattern in patterns:
            match = re.match(pattern, first_line)

            if match:
                break
        if not match:
            print("no match", first_line)
            return None

        # Extract student info

        if len(match.groups()) == 4:
            student_can = match.group(1)
        
            student_digital_id = match.group(2)
            student_fullname = match.group(3).lower()
            date = match.group(4)
        elif len(match.groups()) == 3:
            # Use match.group(1) as student_can only if it matches 1-3 digits using regex
            student_can = match.group(1) if re.match(r"^\d{1,3}$", match.group(1)) else ""
     
            student_digital_id = match.group(1) if re.match(r"^s\d{7}$", match.group(1)) else ""    
            student_fullname = match.group(2).lower()
            date = match.group(3)
        elif len(match.groups()) == 2:
            student_can = ""
    
            student_digital_id = ""
            student_fullname = match.group(1).lower()
            date = match.group(2)

        # Extract trait, class, word count, and response
        trait_match = re.search(r"Writing \d{1}", lines[1])

        # Match "Class: 7", "Class: 07", "Class: A-07", "Class: B-7", etc.
        class_match = re.search(r"Class:\s*(?:[A-Za-z]*-?)?0*(\d+)\b", lines[2])

        word_count_match = re.search(r'Number of words:\s*(\d+)', lines[3])
     

        if not (trait_match and word_count_match):
            print("Failed to match trait,  or word count.")
            return None

        trait = trait_match.group()
        class_name = int(class_match.group(1)) if class_match else None

        word_count = int(word_count_match.group(1))
        response = "\n".join(lines[4:])

        # Pad student_can with leading zeros if it's 1 or 2 digits
        formatted_can = student_can.zfill(3) if student_can != "" else ""

        return {
            "student_can": formatted_can,
            "student_digital_id": student_digital_id,
            "student_fullname": student_fullname,
            "trait": trait,
            "class_name": class_name,
            "date": date,
            "response": response,
            "words_count": word_count
        }
    except Exception:
        return None


# Copy Writing tasks to Test-Rater
def copy_to_test_rater_view(test_rater):
    """
    View to create/cp new AssessmentTasks for a Test-Rater from a existed Rater's tasks, randomly.
    """
    
    try:
        # randomly select a rater
        random_rater = CustomUser.objects.filter(usertype="Rater", active=True).order_by('?').first()
        assessment_tasks = AssessmentTask.objects.filter(rater=random_rater, writing_task__trait__in=["Writing 1", "Writing 2", "Writing 3", "Writing 4"]).select_related('writing_task')
        for task in assessment_tasks:
            # Prevent creating duplicate AssessmentTask for the same writing_task and test_rater
            exists = AssessmentTask.objects.filter(
            writing_task=task.writing_task,
            rater=test_rater
            ).exists()
            if not exists:
                AssessmentTask.objects.create(
                    writing_task=task.writing_task,
                    rater=test_rater,  # Test-Rater
                    ta=task.ta,
                    gra=task.gra,
                    voc=task.voc,
                    coco=task.coco,
                    completed=task.completed,
                    comments=task.comments,
                    update_by=test_rater
                )
        print("Tasks created!")
    except Exception as e:
        return JsonResponse({"message": f"Error copying tasks: {str(e)}", "Code": 500})
    

def get_rater_tasks(rater, traits):
    return AssessmentTask.objects.filter(
        rater=rater,
        writing_task__trait__in=traits,
        active=True
    )