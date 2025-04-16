import requests
import os
from jose import jwt
from jose.exceptions import JWTError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.contrib.auth.models import Group
from .models import Rater

COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-southeast-2")
USERPOOL_ID =  os.environ.get("USERPOOL_ID", None)
APP_CLIENT_ID =  os.environ.get("APP_CLIENT_ID", None)
COGNITO_ISSUER = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USERPOOL_ID}'
JWKS_URL = f'{COGNITO_ISSUER}/.well-known/jwks.json'

JWKS = {"keys": []} if settings.USE_FAKE_AUTH else requests.get(JWKS_URL).json()


class CognitoJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):

        if settings.USE_FAKE_AUTH:
            if not hasattr(self, "_devuser"):
                self._devuser, _ = Rater.objects.get_or_create(
                    username="devuser",
                    defaults={
                        "rater_digital_id": "sub",
                        "email": "email",
                        "active": True,
                        "task_access": 1,
                        "is_staff" : True,
                        "is_superuser" : True,
                    }
                )
                return (self._devuser, None)
            
        auth_header = request.headers.get("Authorization")
      
        if not auth_header or not auth_header.startswith("Bearer "):
            print("no Authen")
            return None

        token = auth_header.split(" ")[1]

        try:
            claims = jwt.decode(
                token,
                JWKS,
                algorithms=["RS256"],
                audience=APP_CLIENT_ID,
                issuer=COGNITO_ISSUER,
                options={
                    "verify_at_hash": False,  # skips the unnecessary check
                }
            )
        except JWTError as e:
 
            raise AuthenticationFailed(f"Invalid token: {e}")

        user = self.get_or_create_user(claims)

        return (user, None)

    def get_or_create_user(self, claims):

        username = (claims.get("username") or claims.get("cognito:username")).capitalize()
   
        sub = claims.get("sub")
        email = claims.get("email", "")
        cognito_groups = claims.get("cognito:groups", [])

        user, created = Rater.objects.get_or_create(
            username=username,
            defaults={
                "rater_digital_id": sub,
                "email": email,
                "active": True,
                "task_access": 1,
            }
        )

        print("add new or check ....")

        if 'Admin' in cognito_groups:
            user.is_staff = True
            user.is_superuser = True
 
        elif 'General' in cognito_groups:
            user.is_staff = True
            user.is_superuser = False
 

        user.save()
        return user
