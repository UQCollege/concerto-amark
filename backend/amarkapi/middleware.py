import os
from django.http import HttpResponseForbidden

def check_custom_header(get_response):
    def middleware(request):
        # Only apply to /api paths
        if request.path.startswith('/api/') or request.path == '/api':
            if request.headers.get('X-Custom-Origin') != os.environ.get('CUSTOM_ORIGIN_HEADER'):
                return HttpResponseForbidden('Forbidden: Invalid header - check_custom_header')
        return get_response(request)
    return middleware