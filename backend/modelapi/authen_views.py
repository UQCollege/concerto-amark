import requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])  # Allow anyone to hit this endpoint (for login callback)
def cognito_oauth_callback(request):
    # Extract the authorization code from the request
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'Authorization code missing'}, status=400)

    # Step 1: Exchange code for access and refresh tokens
    token_url = f"{settings.COGNITO_ISSUER}/oauth2/token"
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': settings.APP_CLIENT_ID,
        'code': code,
        'redirect_uri': settings.REDIRECT_URI,  # Make sure this matches the redirect_uri registered in Cognito
    }

    token_response = requests.post(token_url, data=token_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})

    if token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to exchange authorization code for tokens'}, status=400)

    # Step 2: Extract access token and refresh token from the response
    tokens = token_response.json()
    access_token = tokens.get('access_token')
    refresh_token = tokens.get('refresh_token')

    if not access_token or not refresh_token:
        return JsonResponse({'error': 'Missing tokens in response'}, status=400)

    # Step 3: Store tokens in HttpOnly cookies
    response = JsonResponse({'message': 'Login successful'})
    response.set_cookie('access_token', access_token, httponly=True, secure=True, samesite='Strict')
    response.set_cookie('refresh_token', refresh_token, httponly=True, secure=True, samesite='Strict')

    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    refresh_token = request.COOKIES.get("refresh_token")

    if not refresh_token:
        return JsonResponse({'error': 'No refresh token found'}, status=401)

    # Step 1: Make a request to Cognito's token endpoint
    token_url = f"{settings.COGNITO_ISSUER}/oauth2/token"
    token_data = {
        'grant_type': 'refresh_token',
        'client_id': settings.APP_CLIENT_ID,
        'refresh_token': refresh_token,
    }

    token_response = requests.post(token_url, data=token_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})

    if token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to refresh token'}, status=401)

    # Step 2: Extract the new access token from the response
    tokens = token_response.json()
    access_token = tokens.get('access_token')

    if not access_token:
        return JsonResponse({'error': 'Missing access token in response'}, status=401)

    # Step 3: Return the new access token and update the HttpOnly cookie
    response = JsonResponse({'message': 'Token refreshed'})
    response.set_cookie('access_token', access_token, httponly=True, secure=True, samesite='Strict')
    
    return response
