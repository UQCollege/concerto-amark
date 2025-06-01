import boto3
import csv

USER_POOL_ID = ''
session = boto3.Session(profile_name='')
client = session.client('cognito-idp')

with open('getusers.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        username = row['username']
        status = row['status']
        if status == "FORCE_CHANGE_PASSWORD":
            try:
                client.admin_delete_user(
                    UserPoolId=USER_POOL_ID,
                    Username=username
                )
                print(f"Deleted user: {username}")
            except Exception as e:
                print(f"Error deleting {username}: {e}")