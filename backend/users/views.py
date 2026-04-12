from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Sum
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from shop.models import Customization, Order, Product
from .serializers import RegisterSerializer, LoginSerializer

@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        role = "admin" if user.is_staff else "user"
        return Response(
            {
                "message": "User registered successfully",
                "token": token.key,
                "role": role,
                "user": {
                    "name": user.first_name or user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_user(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        user_auth = authenticate(username=user.username, password=password)
        if user_auth is not None:
            token, _ = Token.objects.get_or_create(user=user_auth)
            role = "admin" if user_auth.is_staff else "user"
            return Response(
                {
                    "message": "Login successful",
                    "token": token.key,
                    "role": role,
                    "user": {
                        "name": user_auth.first_name or user_auth.username,
                        "email": user_auth.email,
                    },
                }
            )
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    role = "admin" if request.user.is_staff else "user"
    return Response(
        {
            "id": request.user.id,
            "role": role,
            "is_superuser": request.user.is_superuser,
            "user": {
                "name": request.user.first_name or request.user.username,
                "email": request.user.email,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    if not request.user.is_staff:
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    totals = {
        "users": User.objects.count(),
        "products": Product.objects.count(),
        "orders": Order.objects.count(),
        "customizations": Customization.objects.count(),
    }

    recent_users = _recent_users_payload()

    recent_orders_qs = Order.objects.select_related("user", "customization", "customization__product").order_by(
        "-placed_at"
    )[:8]
    recent_orders = [
        {
            "id": o.id,
            "customer": (o.user.first_name or o.user.username) if o.user else (o.guest_email or "Guest"),
            "product": o.customization.product.name,
            "status": o.status,
            "quantity": o.quantity,
            "total_price": o.total_price,
            "placed_at": o.placed_at,
        }
        for o in recent_orders_qs
    ]

    return Response(
        {
            "totals": totals,
            "recent_users": recent_users,
            "recent_orders": recent_orders,
        }
    )


def _recent_users_payload():
    recent_users_qs = User.objects.filter(is_staff=False).order_by("-date_joined")[:50]
    return [
        {
            "id": u.id,
            "name": (u.first_name or u.username),
            "email": u.email,
            "role": "admin" if u.is_staff else "user",
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
            "is_active": u.is_active,
            "date_joined": u.date_joined,
        }
        for u in recent_users_qs
    ]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    if not request.user.is_staff:
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    return Response({"users": _recent_users_payload()})


def _payment_fields(order):
    """Align with customer track-order payment display (shop/views.py)."""
    st = order.status
    if st == Order.Status.CANCELLED:
        return {
            "payment_status": "Cancelled",
            "paid_amount": Decimal("0"),
            "balance_due": order.total_price,
        }
    if st == Order.Status.PENDING:
        return {
            "payment_status": "Pending",
            "paid_amount": Decimal("0"),
            "balance_due": order.total_price,
        }
    if st == Order.Status.SHIPPED:
        return {
            "payment_status": "Paid",
            "paid_amount": order.total_price,
            "balance_due": Decimal("0"),
        }
    # confirmed
    half = order.total_price / Decimal(2)
    return {
        "payment_status": "Partially paid",
        "paid_amount": half,
        "balance_due": order.total_price - half,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_orders_list(request):
    if not request.user.is_staff:
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    recent_orders_qs = Order.objects.select_related("user", "customization", "customization__product").order_by(
        "-placed_at"
    )[:200]
    orders = []
    for o in recent_orders_qs:
        pf = _payment_fields(o)
        customer = (o.user.first_name or o.user.username) if o.user else (o.guest_email or "Guest")
        orders.append(
            {
                "id": o.id,
                "customer": customer,
                "customer_email": (o.user.email if o.user else o.guest_email) or "",
                "product": o.customization.product.name,
                "status": o.status,
                "quantity": o.quantity,
                "unit_price": str(o.unit_price),
                "total_price": str(o.total_price),
                "placed_at": o.placed_at,
                "payment_status": pf["payment_status"],
                "paid_amount": str(pf["paid_amount"]),
                "balance_due": str(pf["balance_due"]),
            }
        )
    return Response({"orders": orders})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_products_list(request):
    if not request.user.is_staff:
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    products = []
    for p in Product.objects.all().order_by("name"):
        image_url = None
        if p.image and p.image.name:
            try:
                image_url = request.build_absolute_uri(p.image.url)
            except Exception:
                image_url = None
        products.append(
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "product_type": p.product_type,
                "base_price": str(p.base_price),
                "is_active": p.is_active,
                "image": image_url,
                "created_at": p.created_at,
            }
        )
    return Response({"products": products})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_report(request):
    if not request.user.is_staff:
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    orders_by_status = list(
        Order.objects.values("status").annotate(count=Count("id"), revenue=Sum("total_price")).order_by("status")
    )
    for row in orders_by_status:
        if row.get("revenue") is not None:
            row["revenue"] = str(row["revenue"])

    top_products = list(
        Order.objects.values(
            "customization__product_id",
            "customization__product__name",
        )
        .annotate(order_count=Count("id"), revenue=Sum("total_price"))
        .order_by("-revenue")[:12]
    )
    for row in top_products:
        if row.get("revenue") is not None:
            row["revenue"] = str(row["revenue"])

    agg = Order.objects.aggregate(
        order_count=Count("id"),
        revenue_sum=Sum("total_price"),
    )
    return Response(
        {
            "summary": {
                "total_orders": agg["order_count"] or 0,
                "total_revenue": str(agg["revenue_sum"] or Decimal("0")),
                "active_products": Product.objects.filter(is_active=True).count(),
                "catalog_products": Product.objects.count(),
                "registered_users": User.objects.filter(is_staff=False).count(),
            },
            "orders_by_status": orders_by_status,
            "top_products": top_products,
        }
    )


def _admin_user_or_403(request):
    if not request.user.is_staff:
        return None, Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    return request.user, None


def _get_target_user(user_id):
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return None


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    admin_user, err = _admin_user_or_403(request)
    if err:
        return err

    target = _get_target_user(user_id)
    if not target:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PATCH":
        if target.pk == admin_user.pk:
            return Response({"detail": "You cannot change your own account here."}, status=status.HTTP_400_BAD_REQUEST)

        if target.is_superuser and not admin_user.is_superuser:
            return Response({"detail": "Only superusers can modify superuser accounts."}, status=status.HTTP_403_FORBIDDEN)

        if "is_active" not in request.data:
            return Response({"detail": "Field is_active is required."}, status=status.HTTP_400_BAD_REQUEST)

        active = request.data["is_active"]
        if not isinstance(active, bool):
            return Response({"detail": "is_active must be a boolean."}, status=status.HTTP_400_BAD_REQUEST)

        if target.is_superuser and active is False:
            return Response(
                {"detail": "Superuser accounts cannot be blocked via API."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.is_active = active
        target.save(update_fields=["is_active"])

        if not active:
            Token.objects.filter(user=target).delete()

        return Response(
            {
                "id": target.id,
                "is_active": target.is_active,
                "message": "User blocked." if not active else "User unblocked.",
            }
        )

    # DELETE
    if target.pk == admin_user.pk:
        return Response({"detail": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

    if target.is_superuser:
        return Response({"detail": "Superuser accounts cannot be deleted via API."}, status=status.HTTP_403_FORBIDDEN)

    if target.is_staff and not admin_user.is_superuser:
        return Response({"detail": "Only superusers can delete staff accounts."}, status=status.HTTP_403_FORBIDDEN)

    with transaction.atomic():
        Customization.objects.filter(user=target).update(user=None)
        target.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)

