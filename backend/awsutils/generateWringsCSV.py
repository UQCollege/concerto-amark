import boto3
import pandas as pd
from urllib.parse import urlparse
from datetime import datetime
import io

# Constants
BUCKET_NAME = 'your-bucket-name'
PREFIX = 'your/prefix/'  # Optional, if files are in a subfolder
REGION = 'your-region'   # e.g. 'us-east-1'

# S3 setup
s3 = boto3.client('s3', region_name=REGION)

# Helper to extract data from file content
def extract_student_code_and_trait(file_content):
    """
    Custom logic to parse student_code and trait from file content.
    You should modify this function based on your file format.
    """
    lines = file_content.strip().splitlines()
    student_code = lines[0].strip() if lines else "unknown"
    trait = lines[1].strip() if len(lines) > 1 else "unknown"
    return student_code, trait

# List objects in the bucket
response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=PREFIX)

rows = []

for obj in response.get('Contents', []):
    key = obj['Key']
    if key.endswith('/'):
        continue  # skip folders

    # Get the S3 object
    file_obj = s3.get_object(Bucket=BUCKET_NAME, Key=key)
    file_content = file_obj['Body'].read().decode('utf-8')

    # Parse the file content
    student_code, trait = extract_student_code_and_trait(file_content)

    # Generate the S3 URL
    s3_url = f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{key}"

    # Create the row
    row = {
        "started_time": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "trait": trait,
        "student_code": student_code,
        "response": s3_url,
        "words_count": 0  # Placeholder
    }

    rows.append(row)

# Save to CSV
df = pd.DataFrame(rows)
df.to_csv("output.csv", index=False)
print("CSV generated: output.csv")
