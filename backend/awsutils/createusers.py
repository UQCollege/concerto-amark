import boto3
import csv

# === CONFIGURATION ===
USER_POOL_ID = ''
DEFAULT_PASSWORD = ''
CSV_FILE = 'users.csv'

session = boto3.Session(profile_name='')
client = session.client('cognito-idp')
# client = boto3.client('cognito-idp')

def create_user(username, group_name=None):
    try:
        # Step 1: Create user with temporary password
        client.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=username,
            TemporaryPassword=DEFAULT_PASSWORD,
            MessageAction='SUPPRESS', 
        )
        # Force password reset at first login
        client.admin_set_user_password(
            UserPoolId=USER_POOL_ID,
            Username=username,
            Password=DEFAULT_PASSWORD,
            Permanent=False  # Forces password change
        )
       
        if group_name:
                client.admin_add_user_to_group(
                    UserPoolId=USER_POOL_ID,
                    Username=username,
                    GroupName=group_name
                )
                
        print(f"Created user: {username} and added to group: {group_name}")


    except client.exceptions.UsernameExistsException:
        print(f" User already exists: {username}")
        if group_name:
                client.admin_add_user_to_group(
                    UserPoolId=USER_POOL_ID,
                    Username=username,
                    GroupName=group_name
                )
                
        print(f"user: {username} added to group: {group_name}")

    except Exception as e:
        print(f" Error creating {username}: {str(e)}")
    

# === MAIN ===
with open(CSV_FILE, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        create_user(row['username'], row.get('group'))
