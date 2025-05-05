import boto3
import csv

USER_POOL_ID = ''
session = boto3.Session(profile_name='concerto1')
client = session.client('cognito-idp')

with open('users.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        username = row['username']
        try:
            client.admin_delete_user(
                UserPoolId=USER_POOL_ID,
                Username=username
            )
            print(f"Deleted user: {username}")
        except Exception as e:
            print(f"Error deleting {username}: {e}")