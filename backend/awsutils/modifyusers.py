# update user custom attributes in AWS Cognito
import boto3
import csv

USER_POOL_ID = ''
session = boto3.Session(profile_name='')
client = session.client('cognito-idp')

def modify_user_attributes_from_csv(csv_path='./updateusers.csv'):
    """
    Update the custom:Class attribute for a group of Cognito users from a CSV.

    CSV must have headers: "username" and "class".

    Returns a dict with username -> {'success': bool, 'response'|'error': ...}
    """
    results = {}

    with open(csv_path, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        for row in reader:
            username = (row.get('username') or '').strip()
            class_value = (row.get('class') or '').strip()

            if not username:
                # skip rows without a username
                continue

            if not class_value:
                results[username] = {'success': False, 'error': 'missing class value'}
                continue

            try:
                response = client.admin_update_user_attributes(
                    UserPoolId=USER_POOL_ID,
                    Username=username,
                    UserAttributes=[{'Name': 'custom:Class', 'Value': class_value}]
                )
                results[username] = {'success': True, 'response': 'Updated'}
                print(f"Updated {username}: custom:Class = {class_value}")
            except Exception as e:
                results[username] = {'success': False, 'error': str(e)}
                print(f"Error updating {username}: {e}")

    return results


if __name__== "__main__":
    result = modify_user_attributes_from_csv("./updateusers.csv")
    print("Modification results:", result)
    with open("./modifyusers_results.csv", mode='w', newline='') as result_file:
        writer = csv.writer(result_file)
        writer.writerow(["username", "success", "response_or_error"])
        for username, outcome in result.items():
            writer.writerow([username, outcome['success'], outcome.get('response') or outcome.get('error')])
    print("Results written to modifyusers_results.csv")