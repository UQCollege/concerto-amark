import os
from django.http import JsonResponse
def check_custom_header(get_response):
    def middleware(request):
        # Only apply to /api paths
        if request.path.startswith('/api/') or request.path == '/api':
            if request.headers.get('X-Custom-Origin') != os.environ.get('CUSTOM_ORIGIN_HEADER'):
                return JsonResponse({"message": "Invalid header"}, status=403)
        return get_response(request)
    return middleware