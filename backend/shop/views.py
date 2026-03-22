from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Customization, Order, Product
from .serializers import (
    CustomizationSerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    ProductSerializer,
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
