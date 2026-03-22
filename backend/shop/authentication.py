from rest_framework.authentication import SessionAuthentication


class SessionAuthenticationWithoutCsrf(SessionAuthentication):
    """Session auth for SPA dev: skips DRF CSRF enforcement (use tokens in production)."""

    def enforce_csrf(self, request):
        return
