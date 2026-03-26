from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Customization, Order, Product, Wishlist, Cart, CartItem
from .serializers import (
    CustomizationSerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    ProductSerializer,
    WishlistSerializer,
    CartSerializer,
    CartItemSerializer,
)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve active catalog products."""

    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_active=True)


class CustomizationViewSet(viewsets.ModelViewSet):
    """Create, list, retrieve, update saved designs."""

    serializer_class = CustomizationSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Customization.objects.select_related("product").filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()


class OrderViewSet(viewsets.ModelViewSet):
    """Place orders (create) and list own orders."""

    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "track"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderListSerializer

    def get_queryset(self):
        return Order.objects.select_related("customization", "customization__product").filter(
            user=self.request.user
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        out = OrderListSerializer(serializer.instance, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["get"], url_path="track")
    def track(self, request):
        """Look up order by id; guests must also pass matching email."""
        raw_id = request.query_params.get("id") or request.query_params.get("order_id")
        email = (request.query_params.get("email") or "").strip().lower()
        if not raw_id:
            return Response(
                {"detail": "Query parameter 'id' (order number) is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            oid = int(raw_id)
        except (TypeError, ValueError):
            return Response({"detail": "Invalid order id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.select_related("customization", "customization__product").get(
                pk=oid
            )
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.is_authenticated:
            if order.user_id == user.id:
                pass
            elif order.user_id is None and email and (order.guest_email or "").lower() == email:
                pass
            else:
                return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            if not email or (order.guest_email or "").lower() != email:
                return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(OrderListSerializer(order, context={"request": request}).data)

class WishlistViewSet(viewsets.ModelViewSet):
    """Manage user wishlist."""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Ensure we don't create duplicates
        product = serializer.validated_data['product']
        if not Wishlist.objects.filter(user=self.request.user, product=product).exists():
            serializer.save(user=self.request.user)

class CartViewSet(viewsets.ViewSet):
    """Retrieve the current user's cart."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def current(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)

    @action(detail=False, methods=["post"])
    def clear(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response({"status": "cart cleared"})

class CartItemViewSet(viewsets.ModelViewSet):
    """Manage items inside the current user's cart."""
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        # Check if identical item already exists to increment quantity
        product = serializer.validated_data.get('product')
        customization = serializer.validated_data.get('customization')
        existing_item = CartItem.objects.filter(cart=cart, product=product, customization=customization).first()
        
        if existing_item:
            existing_item.quantity += serializer.validated_data.get('quantity', 1)
            existing_item.save()
        else:
            serializer.save(cart=cart)
