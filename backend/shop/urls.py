from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"customizations", views.CustomizationViewSet, basename="customization")
router.register(r"orders", views.OrderViewSet, basename="order")
router.register(r"wishlist", views.WishlistViewSet, basename="wishlist")
router.register(r"cart/items", views.CartItemViewSet, basename="cart-items")
router.register(r"cart", views.CartViewSet, basename="cart")

urlpatterns = [
    path("", include(router.urls)),
]
