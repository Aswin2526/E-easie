from datetime import timedelta

from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
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

TRACK_STEPS = [
    "Order Confirmed",
    "Design Approved",
    "In Production",
    "Quality Check",
    "Packed",
    "Out for Delivery",
    "Delivered",
]


def _safe_design_image_url(request, order):
    img = getattr(order.customization, "custom_design", None)
    if not img:
        return None
    try:
        if not img.name:
            return None
        return request.build_absolute_uri(img.url)
    except Exception:
        return None


def _build_order_tracking_payload(request, order):
    customization = order.customization
    product = customization.product
    part_colors = customization.part_colors if isinstance(customization.part_colors, dict) else {}
    colors = ", ".join(v for v in part_colors.values() if isinstance(v, str) and v.strip()) or "Default"
    size = customization.custom_size if customization.size == "CUSTOM" and customization.custom_size else customization.size
    needs_design_approval = bool(customization.custom_design) and order.status == Order.Status.PENDING

    status_to_step = {
        Order.Status.PENDING: 1 if needs_design_approval else 0,
        Order.Status.CONFIRMED: 3,
        Order.Status.SHIPPED: 5,
        Order.Status.CANCELLED: 0,
    }
    current_step = status_to_step.get(order.status, 0)

    paid_amount = order.total_price if order.status == Order.Status.SHIPPED else (order.total_price / 2)
    paid_amount = paid_amount if order.status != Order.Status.PENDING else 0
    if paid_amount >= order.total_price:
        payment_status = "Paid"
    elif paid_amount > 0:
        payment_status = "Partially Paid"
    else:
        payment_status = "Pending"

    payment_status_color = {
        "Paid": "green",
        "Pending": "yellow",
        "Partially Paid": "orange",
    }[payment_status]

    step_entries = []
    for idx, title in enumerate(TRACK_STEPS):
        if idx < current_step:
            state = "done"
        elif idx == current_step:
            state = "current"
        else:
            state = "upcoming"
        step_entries.append({"title": title, "state": state})

    tracking_number = f"EE{order.id:06d}"
    order_status_label = "Design Ready" if needs_design_approval else order.get_status_display()
    placed_date = order.placed_at.date()
    expected_delivery = placed_date + timedelta(days=7)
    design_notes = customization.notes.strip() if customization.notes else ""
    summary = (
        f"{product.get_product_type_display()} in {customization.fabric}, pattern: {customization.pattern}. "
        f"Sleeve: {customization.sleeve_style}. Neck: {customization.neck_design or 'default'}."
    )
    messages = [
        {
            "from": "admin",
            "text": "We have received your order and started processing it.",
            "created_at": order.placed_at.isoformat(),
        }
    ]
    if needs_design_approval:
        messages.append(
            {
                "from": "admin",
                "text": "Your design mockup is ready. Please approve or request revision.",
                "created_at": order.placed_at.isoformat(),
            }
        )
    if order.status == Order.Status.CONFIRMED:
        messages.append(
            {
                "from": "admin",
                "text": "Your order is now in production.",
                "created_at": order.placed_at.isoformat(),
            }
        )
    if order.status == Order.Status.SHIPPED:
        messages.append(
            {
                "from": "admin",
                "text": f"Order shipped. Tracking number: {tracking_number}.",
                "created_at": order.placed_at.isoformat(),
            }
        )

    return {
        "order_id": order.id,
        "order_status": order_status_label,
        "placed_at": order.placed_at.isoformat(),
        "placed_date": placed_date.isoformat(),
        "expected_delivery_date": expected_delivery.isoformat(),
        "customer_name": (
            getattr(order.user, "name", "") or getattr(order.user, "username", "") or "Customer"
        )
        if order.user_id
        else "Guest Customer",
        "customer_email": getattr(order.user, "email", "") if order.user_id else order.guest_email,
        "order_details": {
            "clothing_type": product.get_product_type_display(),
            "size": size,
            "color": colors,
            "design_description": design_notes or summary,
            "design_image_url": _safe_design_image_url(request, order),
            "quantity": order.quantity,
        },
        "status_steps": step_entries,
        "payment": {
            "total_price": str(order.total_price),
            "paid_amount": str(paid_amount),
            "remaining_amount": str(order.total_price - paid_amount),
            "status": payment_status,
            "status_color": payment_status_color,
        },
        "shipping": {
            "method": "Standard Delivery",
            "tracking_number": tracking_number,
            "address": order.shipping_address,
        },
        "design_approval": {
            "show": needs_design_approval,
            "status": "Design Ready" if needs_design_approval else "Not required",
            "design_image_url": _safe_design_image_url(request, order),
        },
        "messages": messages,
    }


def _get_authorized_order(request, order_id, email):
    try:
        oid = int(order_id)
    except (TypeError, ValueError):
        return None, Response({"detail": "Invalid order number."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.select_related("user", "customization", "customization__product").get(pk=oid)
    except Order.DoesNotExist:
        return None, Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    email = (email or "").strip().lower()
    if user.is_authenticated:
        if order.user_id == user.id:
            return order, None
        if order.user_id is None and email and (order.guest_email or "").lower() == email:
            return order, None
        return None, Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    if not email or (order.guest_email or "").lower() != email:
        return None, Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    return order, None


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


@api_view(["GET"])
@permission_classes([AllowAny])
def track_order_view(request):
    """
    /api/track-order endpoint.
    Guests: order_number + email required.
    Signed-in users: email optional; can fetch own orders list when order_number omitted.
    """
    order_number = request.query_params.get("order_number") or request.query_params.get("id")
    email = request.query_params.get("email") or ""

    if not order_number:
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Query parameter 'order_number' is required for guests."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        orders = (
            Order.objects.select_related("user", "customization", "customization__product")
            .filter(user=request.user)
            .order_by("-placed_at")
        )
        return Response({"orders": [_build_order_tracking_payload(request, o) for o in orders]})

    order, error = _get_authorized_order(request, order_number, email)
    if error:
        return error
    return Response(_build_order_tracking_payload(request, order))
