import boto3
import csv

USER_POOL_ID = ''
session = boto3.Session(profile_name='')
client = session.client('cognito-idp')

def get_cognito_users(output_file="getusers.csv"):
    try:
        users_to_csv = []
        pagination_token = None

        while True:
            params = {
                "UserPoolId": USER_POOL_ID,
                "Limit": 60
            }

            if pagination_token:
                params["PaginationToken"] = pagination_token

            response = client.list_users(**params)

            for user in response.get("Users", []):
                users_to_csv.append({
                    "username": user["Username"],
                    "status": user.get("UserStatus", "UNKNOWN")
                })

            # Check for pagination
            pagination_token = response.get("PaginationToken")
            if not pagination_token:
                break

        with open(output_file, mode='w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=["username", "status"])
            writer.writeheader()
            writer.writerows(users_to_csv)

        print(f"Exported {len(users_to_csv)} users to {output_file}")

    except Exception as e:
        print(f"An error occurred: {e}")
        
if __name__=="__main__":
    get_cognito_users("./getusers.csv")