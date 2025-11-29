import requests
import os
from jose import jwt
from jose.exceptions import JWTError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.contrib.auth.models import Group
from .models import CustomUser
from jose.exceptions import JWTError, ExpiredSignatureError, JWTClaimsError

COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-southeast-2")
USERPOOL_ID = os.environ.get("USERPOOL_ID")
APP_CLIENT_ID = os.environ.get("APP_CLIENT_ID")
COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USERPOOL_ID}"
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Optional: preload JWKS on startup for performance (but still allow refetch in method)
JWKS = {"keys": []} if getattr(settings, "USE_FAKE_AUTH", False) else requests.get(JWKS_URL).json()
  # Debugging line to check if JWKS is loaded correctly


class CognitoJWTAuthentication(BaseAuthentication):
    def get_signing_key(self, token, jwks_url=JWKS_URL):
        try:
            headers = jwt.get_unverified_headers(token)
            kid = headers.get("kid")
            if not kid:
                raise AuthenticationFailed("Token header missing 'kid'")
        except Exception:
            raise AuthenticationFailed("Failed to parse JWT headers")

        try:
            jwks = JWKS if JWKS["keys"] else requests.get(jwks_url).json()
        except Exception as e:
            raise AuthenticationFailed(f"Failed to fetch JWKS: {e}")

        for key in jwks["keys"]:
            if key.get("kid") == kid:
                return key

        raise AuthenticationFailed("No matching signing key found for token")

    def _decode_jwt(self, token):
        try:
            # 1. Decode without verifying audience (since Access Tokens don't have 'aud')
            # We still verify the signature and expiration
            payload = jwt.decode(
                token,
                self.get_signing_key(token),
                algorithms=["RS256"],
                issuer=COGNITO_ISSUER,
                options={
                    "verify_at_hash": False,
                    "verify_aud": False  # Disable audience check for Access Tokens
                }
            )

            # 2. Manually verify that the token is for our App Client
            # Access Tokens use 'client_id', ID Tokens use 'aud'
            token_client_id = payload.get("client_id") or payload.get("aud")
            if token_client_id != APP_CLIENT_ID:
                raise AuthenticationFailed("Token was not issued for this client")

            return payload
        except ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except JWTClaimsError as e:
            raise AuthenticationFailed(f"Invalid claims: {e}")
        except JWTError as e:
            raise AuthenticationFailed(f"Invalid token: {e}")

    def authenticate(self, request):
        if settings.USE_FAKE_AUTH: #local development without cognito
            if not hasattr(self, "_devuser"):

                self._devuser, _ = CustomUser.objects.get_or_create(
                    username=os.environ.get("DEV_USER_NAME", "devuser"),
                    defaults={
                        "rater_digital_id": "uniqueId0",
                        "active": True,
                        "task_access": 1,
                        "usertype" : os.environ.get("DEV_USER_TYPE", "Admin"),
                        "is_superuser" : True,
                    }
                )
                return (self._devuser, None)
            
        auth_header = request.headers.get("Authorization")
      
        if not auth_header or not auth_header.startswith("Bearer "):
            print("No valid Authorization header found")
            return None

        token = auth_header.split(" ")[1]
        claims =self._decode_jwt(token)

        user, _ = self.get_or_create_user(claims)
        print(f"Authenticated user: {user.username}")
        return (user, None)

    def get_or_create_user(self, claims):
        cognito_groups = claims.get("cognito:groups", [])
        usertype = self.get_user_type(cognito_groups)
        username = (claims.get("username") or claims.get("cognito:username"))
        print(f"Username from claims: {username}")
        sub = claims.get("sub")
        if not sub or not username:
            raise AuthenticationFailed("Required claims missing: sub or username")
        try:
            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={
                "usertype": usertype,
                "active": usertype not in ["Rater", "Test-Rater"],
                "is_superuser": usertype == "Admin",
                "task_access": 1,
                "rater_digital_id": sub,
                }
            )
        except Exception as e:
            print(f"Error creating or retrieving user: {e}")
            raise AuthenticationFailed("Failed to get or create user")
        
        return user, created
    
    def get_user_type(self, cognito_groups):
        priority = ["Admin", "Admin-Rater", "Teacher", "Rater", "Test-Rater"]
        for role in priority:
            if role in cognito_groups:
                print(f"User role determined from groups: {role}")
                return role
            
        print("No matching user role found in groups, defaulting to Test-Rater")
        return "Test-Rater"
