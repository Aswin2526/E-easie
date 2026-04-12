
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('me/', views.me, name='me'),
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('admin/users/', views.admin_users_list, name='admin-users-list'),
    path('admin/users/<int:user_id>/', views.admin_user_detail, name='admin-user-detail'),
    path('admin/orders/', views.admin_orders_list, name='admin-orders-list'),
    path('admin/products/', views.admin_products_list, name='admin-products-list'),
    path('admin/report/', views.admin_report, name='admin-report'),
]


