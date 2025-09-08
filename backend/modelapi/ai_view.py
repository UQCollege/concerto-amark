# and Upload to S3 with training tags and datestamps
import os
import pandas as pd
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
    # Query joined data from WritingTask and AssessmentTask
    # Assume WritingTask has fields: id, response, data_split
    # Assume AssessmentTask has fields: writing_task_id (FK), ta, gra, voc, coco

    # Join WritingTask and AssessmentTask on WritingTask.id == AssessmentTask.writing_task_id
    from .models import AssessmentTask  # Ensure AssessmentTask is imported

    raw_data = (
        AssessmentTask.objects
        .select_related('writing_task')
        .filter(completed=True)
        .values('writing_task__id', 'writing_task__response', 'writing_task__data_split',
                'ta', 'gra', 'voc', 'coco')
    )
    # Convert queryset to DataFrame
    df = pd.DataFrame(list(raw_data))

    # Rename columns for consistency
    df = df.rename(columns={
        'writing_task__id': 'id',
        'writing_task__response': 'response',
        'writing_task__data_split': 'data_split'
    })

    # Split by 'data_split' column
    train_df = df[df['data_split'] == 'train']
    val_df = df[df['data_split'] == 'val']
    test_df = df[df['data_split'] == 'test']
    test_df = df[df['data_split'] == 'test']

    # Prepare JSON data for S3 upload
    # There is no timezone.aest in the standard library.
    # For Australian Eastern Standard Time (AEST), use datetime.timezone with the correct offset:
    # AEST is UTC+10:00
    aest = timezone(timedelta(hours=10))
    date_str = datetime.now(aest).strftime('%Y-%m-%d')
    s3_data = {
        "train": {
            "date": date_str,
            "data": train_df.to_dict(orient='records')
        },
        "val": {
            "date": date_str,
            "data": val_df.to_dict(orient='records')
        },
        "test": {
            "date": date_str,
            "data": test_df.to_dict(orient='records')
        }
    }

    # Example S3 keys (paths)
    s3_keys = {
        "train": f"train/{date_str}/dataset.json",
        "val": f"val/{date_str}/dataset.json",
        "test": f"test/{date_str}/dataset.json"
    }

    # Return JSON ready for S3 upload
    print({
        "message": "Data prepared for S3 upload",
        "train_count": len(train_df),
        "val_count": len(val_df),
        "test_count": len(test_df),
        "s3_data": s3_data,
        "s3_keys": s3_keys
    })
    # Use your SSO profile for boto3
    if os.environ.get("PROD") == "False":
        session = boto3.Session(profile_name='concerto1')
        s3 = session.client('s3')
    else:
        s3 = boto3.client('s3')
    bucket_name = os.environ.get("S3BUCKET_NAME", "pela-training-data")  # 

    for key, data in s3_data.items():
        s3.put_object(Bucket=bucket_name, Key=s3_keys[key], Body=json.dumps(data))

    return JsonResponse({"message": "Data uploaded to S3"}, status=200)
 

