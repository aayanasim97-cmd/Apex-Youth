from django.urls import path
from apps.accounts.views import GoogleLoginView, CookieTokenRefreshView, LogoutView, UserProfileView

urlpatterns = [
    path('auth/google/', GoogleLoginView.as_view(), name='auth-google'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/profile/', UserProfileView.as_view(), name='auth-profile'),
]
