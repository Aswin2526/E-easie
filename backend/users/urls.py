
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('forgot-password/request-otp/', views.forgot_password_request_otp, name='forgot-password-request-otp'),
    path('forgot-password/verify-otp/', views.forgot_password_verify_otp, name='forgot-password-verify-otp'),
    path('forgot-password/reset/', views.forgot_password_reset, name='forgot-password-reset'),
    path('vendor-requests/', views.vendor_request_create, name='vendor-request-create'),
    path('me/', views.me, name='me'),
    path('subscription/activate/', views.activate_subscription, name='activate-subscription'),
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('admin/users/', views.admin_users_list, name='admin-users-list'),
    path('admin/users/<int:user_id>/', views.admin_user_detail, name='admin-user-detail'),
    path('admin/orders/', views.admin_orders_list, name='admin-orders-list'),
    path('admin/orders/<int:order_id>/', views.admin_order_detail, name='admin-order-detail'),
    path('admin/vendor-requests/', views.admin_vendor_requests_list, name='admin-vendor-requests-list'),
    path('admin/vendor-requests/<int:request_id>/', views.admin_vendor_request_detail, name='admin-vendor-request-detail'),
    path('admin/products/', views.admin_products_list, name='admin-products-list'),
    path('admin/products/<int:product_id>/', views.admin_product_detail, name='admin-product-detail'),
    path('admin/report/', views.admin_report, name='admin-report'),
]


