# and Upload to S3 with training tags and datestamps
import os
from django.http import JsonResponse
from datetime import datetime, timezone
from rest_framework.decorators import api_view
from datetime import timedelta
import boto3
import json

@api_view(["POST"])
# @permission_classes([IsAdminUser])
def upload_rated_writing_data_to_s3(request):
    # Access request.user to ensure the request parameter is used
    user = request.user
    if not user.is_superuser:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    print(f"User {user} initiated S3 upload process.")
   
    from .models import AssessmentTask  # Ensure AssessmentTask is imported

    raw_data = (
        AssessmentTask.objects
        .select_related('writing_task')
        .filter(completed=True)
        .values('writing_task__started_time', 'writing_task__trait','writing_task__student_code', 'writing_task__response', 'writing_task__data_split',
                'rater', 'ta', 'gra', 'voc', 'coco')
    )
    
    """ 
    # Generate Json Records from raw_data
    # with the Schema:
    {
    {

        userId: <int>, - this is the student id
        trait: <string>, - this is the writing trait
        started_time: <date-time>, - this is when the writing completed
        text: <string>, - writing response
        Task Achievement: <int>, - Writing score
        Grammar: <int>,
        Vocabulary: <int>,
        Cohesion & Coherence: <int>,
        Marker: <string>, - Rater number
        repeated:<boolean>, - check if the entry repeated for data sanitization
        training_timestamp: [<timeStamp>], - indicate the list of date that the entry has been send to AI for training. it will generate before sending
        val_timestamp: [<timeStamp>], - indicate the list of date that the entry has been send to AI for validation. it will generate before sending
        test_timestamp: [<timeStamp>], - indicate the list of date that the entry has been send to AI for test. it will generate before sending
        tied_model:[<string>], - a list of models
        split_type: <string>, - updates with train, test or val type
        }

    
    }
    """
    # Organize records by split type
    records = {"train": [], "val": [], "test": []}
    for entry in raw_data:
        record = {
            "userId": entry['writing_task__student_code'],
            "trait": entry['writing_task__trait'],
            "started_time": entry['writing_task__started_time'].isoformat() if entry['writing_task__started_time'] else None,
            "task_description": entry.get('writing_task__task_description', ""),
            "text": entry['writing_task__response'],
            "Task Achievement": entry['ta'],
            "Grammar": entry['gra'],
            "Vocabulary": entry['voc'],
            "Cohesion & Coherence": entry['coco'],
            "Marker": f"Rater_{entry['rater']}",
            "split_type": entry['writing_task__data_split'],
            "repeated": False,
            "training_timestamp": [],
            "val_timestamp": [],
            "test_timestamp": [],
            "tied_model": [],
        }
        split = entry['writing_task__data_split']
        if split in records:
            records[split].append(record)

    # Prepare JSONL data for S3 upload
    aest = timezone(timedelta(hours=10))
    date_str = datetime.now(aest).strftime('%Y-%m-%d')

    s3_keys = {
        "train": f"train/{date_str}/dataset.jsonl",
        "val": f"val/{date_str}/dataset.jsonl",
        "test": f"test/{date_str}/dataset.jsonl"
    }

    # Convert records to JSONL strings
    jsonl_data = {
        split: "\n".join(json.dumps(rec) for rec in records[split])
        for split in records
    }

    # S3 upload
    if os.environ.get("DEBUG", "True") == "True":
        session = boto3.Session()
        s3 = session.client('s3')
    else:
        s3 = boto3.client('s3')
    bucket_name = os.environ.get("S3BUCKET_NAME", "pela-ai-finetuning")

    for split, data in jsonl_data.items():
        s3.put_object(Bucket=bucket_name, Key=s3_keys[split], Body=data)

    return JsonResponse({
        "message": "Data uploaded to S3",
        "counts": {split: len(records[split]) for split in records},
        "s3_keys": s3_keys
    }, status=200)
 

