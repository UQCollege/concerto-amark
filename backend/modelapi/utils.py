import os
import re
import shutil
from zipfile import ZipFile, is_zipfile
from docx2python import docx2python
from functools import wraps
from django.http import JsonResponse

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
            r"(\d+)-(s\d+)\s+([A-Z][a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1-s1234567 firstname lastname 2025-02-03
            r"(\d+)-(s)\s+([A-Z][a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1-s firstname lastname 2025-02-03
            r"(\d+)\s+([A-Z][a-zA-Z]*(?:\s[a-zA-Z]+)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., 1 firstname lastname 2025-02-03
            r"(s\d+)\s+([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., s1234567 firstname lastname 2025-02-03
            r"-(s\d+)\s+([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*)\s+(\d{4}-\d{2}-\d{2})", # e.g., -s1234567 firstname lastname 2025-02-03
           
        ]

        first_line = lines[0]
        match = None
        for pattern in patterns:
            match = re.match(pattern, first_line)
            
            if match:
                break
        if not match:
            return None

        # Extract student info
        if len(match.groups()) == 4:
            student_can = match.group(1)
            student_digital_id = match.group(2)
            student_fullname = match.group(3).lower()
            date = match.group(4)
        else:

            student_can = match.group(1) if "s" not in match.group(1) else ""
            student_digital_id = match.group(1) if "s" in match.group(1) else ""
            student_fullname = match.group(2).lower()
            date = match.group(3)

        # Extract trait, class, word count, and response
        trait_match = re.search(r"Writing \d{1}", lines[1])
        class_match = re.search(r"Class:\s*(\d+)", lines[2])
        word_count_match = re.search(r'Number of words:\s*(\d+)', lines[3])

        if not (trait_match and class_match and word_count_match):
            return None

        trait = trait_match.group()
        class_name = int(class_match.group(1))
        word_count = int(word_count_match.group(1))
        response = "\n".join(lines[4:])

        return {
            "student_can": student_can,
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
