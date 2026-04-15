from decimal import Decimal
import random
from datetime import timedelta
import smtplib

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from shop.models import Customization, Order, Product
from .models import PasswordResetOTP, VendorRegistrationRequest
from .serializers import (
    ForgotPasswordRequestSerializer,
    ForgotPasswordResetSerializer,
    ForgotPasswordVerifySerializer,
    LoginSerializer,
    RegisterSerializer,
    VendorRegistrationRequestAdminUpdateSerializer,
    VendorRegistrationRequestCreateSerializer,
)

SUPER_ADMIN_EMAIL = "admin@eeasie.com"


def _is_super_admin_email(email):
    return (email or "").strip().lower() == SUPER_ADMIN_EMAIL


def _is_super_admin_user(user):
    return _is_super_admin_email(getattr(user, "email", ""))


@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        role = "admin" if _is_super_admin_user(user) else "user"
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
            role = "admin" if _is_super_admin_user(user_auth) else "user"
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


def _send_plain_email(subject, message, recipients):
    sender = getattr(settings, "DEFAULT_FROM_EMAIL", "") or getattr(settings, "EMAIL_HOST_USER", "")
    if not sender:
        raise RuntimeError("Email sender is not configured.")
    if "yourgmail" in sender.lower():
        raise RuntimeError("Email sender is still using placeholder values. Update backend/.env SMTP credentials.")
    send_mail(subject, message, sender, recipients, fail_silently=False)


def _latest_valid_otp(email):
    now = timezone.now()
    return (
        PasswordResetOTP.objects.filter(email=email, is_used=False, expires_at__gt=now)
        .order_by("-created_at")
        .first()
    )


@api_view(["POST"])
def forgot_password_request_otp(request):
    serializer = ForgotPasswordRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()

    user = User.objects.filter(email__iexact=email).first()
    if user:
        PasswordResetOTP.objects.filter(email=email, is_used=False).update(is_used=True)
        otp = f"{random.randint(0, 999999):06d}"
        expires_at = timezone.now() + timedelta(minutes=10)
        PasswordResetOTP.objects.create(email=email, otp_code=otp, expires_at=expires_at)
        try:
            _send_plain_email(
                "Your OTP for password reset",
                (
                    f"Hello {user.first_name or user.username},\n\n"
                    f"Your OTP code is: {otp}\n"
                    "This code is valid for 10 minutes.\n\n"
                    "If you did not request this, you can ignore this email."
                ),
                [email],
            )
        except Exception as exc:
            detail = "Could not send OTP email. Check SMTP settings in backend/.env."
            if isinstance(exc, smtplib.SMTPAuthenticationError):
                detail = (
                    "SMTP authentication failed. Verify EMAIL_USER and Gmail App Password "
                    "(generate a new 16-character App Password, no spaces)."
                )
            return Response(
                {
                    "detail": detail
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    return Response(
        {
            "message": "If this email is registered, an OTP has been sent.",
        }
    )


@api_view(["POST"])
def forgot_password_verify_otp(request):
    serializer = ForgotPasswordVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()
    otp = serializer.validated_data["otp"].strip()

    rec = _latest_valid_otp(email)
    if not rec or rec.otp_code != otp:
        return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "OTP verified."})


@api_view(["POST"])
def forgot_password_reset(request):
    serializer = ForgotPasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()
    otp = serializer.validated_data["otp"].strip()
    password = serializer.validated_data["password"]

    rec = _latest_valid_otp(email)
    if not rec or rec.otp_code != otp:
        return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(password)
    user.save(update_fields=["password"])
    rec.is_used = True
    rec.save(update_fields=["is_used"])
    Token.objects.filter(user=user).delete()
    return Response({"message": "Password reset successful. Please log in again."})


@api_view(["POST"])
def vendor_request_create(request):
    serializer = VendorRegistrationRequestCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    req = serializer.save()
    return Response(
        {
            "id": req.id,
            "status": req.status,
            "message": "Vendor registration request submitted.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_vendor_requests_list(request):
    if not _is_super_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    rows = []
    for r in VendorRegistrationRequest.objects.all().order_by("-created_at")[:200]:
        rows.append(
            {
                "id": r.id,
                "name": r.name,
                "email": r.email,
                "company_name": r.company_name,
                "details": r.details,
                "status": r.status,
                "admin_note": r.admin_note,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
                "decided_at": r.decided_at,
            }
        )
    return Response({"requests": rows})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_vendor_request_detail(request, request_id):
    if not _is_super_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        req = VendorRegistrationRequest.objects.get(pk=request_id)
    except VendorRegistrationRequest.DoesNotExist:
        return Response({"detail": "Vendor request not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = VendorRegistrationRequestAdminUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    new_status = serializer.validated_data["status"]
    admin_note = serializer.validated_data.get("admin_note", "")
    old_status = req.status

    req.status = new_status
    req.admin_note = admin_note
    req.decided_at = timezone.now()
    req.save(update_fields=["status", "admin_note", "decided_at", "updated_at"])

    if old_status != new_status and new_status in (
        VendorRegistrationRequest.Status.APPROVED,
        VendorRegistrationRequest.Status.DECLINED,
    ):
        decision_text = "approved" if new_status == VendorRegistrationRequest.Status.APPROVED else "declined"
        note_text = f"\n\nAdmin note:\n{admin_note}" if admin_note else ""
        try:
            _send_plain_email(
                "Vendor registration request update",
                (
                    f"Hello {req.name},\n\n"
                    f"Your vendor registration request for {req.company_name} has been {decision_text}.{note_text}\n\n"
                    "Thank you."
                ),
                [req.email],
            )
        except Exception as exc:
            detail = "Vendor status updated, but notification email could not be sent. Check SMTP settings in backend/.env."
            if isinstance(exc, smtplib.SMTPAuthenticationError):
                detail = (
                    "Vendor status updated, but SMTP authentication failed. "
                    "Verify EMAIL_USER and Gmail App Password."
                )
            return Response(
                {
                    "detail": detail
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

    return Response(
        {
            "id": req.id,
            "status": req.status,
            "message": "Vendor request updated.",
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    role = "admin" if _is_super_admin_user(request.user) else "user"
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
    if not _is_super_admin_user(request.user):
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

    order_status_counts = {choice.value: 0 for choice in Order.Status}
    for row in Order.objects.values("status").annotate(c=Count("id")):
        st = row["status"]
        if st in order_status_counts:
            order_status_counts[st] = row["c"]
    order_status_counts["returned"] = 0

    return Response(
        {
            "totals": totals,
            "recent_users": recent_users,
            "recent_orders": recent_orders,
            "order_status_counts": order_status_counts,
        }
    )


def _recent_users_payload():
    recent_users_qs = User.objects.filter(is_staff=False).order_by("-date_joined")[:50]
    return [
        {
            "id": u.id,
            "name": (u.first_name or u.username),
            "email": u.email,
            "role": "admin" if _is_super_admin_user(u) else "user",
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
    if not _is_super_admin_user(request.user):
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


def _admin_order_payload(order):
    pf = _payment_fields(order)
    customer = (order.user.first_name or order.user.username) if order.user else (order.guest_email or "Guest")
    return {
        "id": order.id,
        "customer": customer,
        "customer_email": (order.user.email if order.user else order.guest_email) or "",
        "product": order.customization.product.name,
        "status": order.status,
        "cancel_description": order.cancel_description or "",
        "quantity": order.quantity,
        "unit_price": str(order.unit_price),
        "total_price": str(order.total_price),
        "placed_at": order.placed_at,
        "payment_status": pf["payment_status"],
        "paid_amount": str(pf["paid_amount"]),
        "balance_due": str(pf["balance_due"]),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_orders_list(request):
    if not _is_super_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    recent_orders_qs = (
        Order.objects.select_related("user", "customization", "customization__product")
        .filter(Q(user__isnull=True) | Q(user__is_staff=False))
        .order_by("-placed_at")[:200]
    )
    return Response({"orders": [_admin_order_payload(o) for o in recent_orders_qs]})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_order_detail(request, order_id):
    if not _is_super_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = (
            Order.objects.select_related("user", "customization", "customization__product")
            .filter(Q(user__isnull=True) | Q(user__is_staff=False))
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    raw_status = str(request.data.get("status", "")).strip().lower()
    if raw_status not in {choice.value for choice in Order.Status}:
        return Response(
            {"detail": "Invalid status. Allowed: pending, confirmed, shipped, cancelled."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_cancel = str(request.data.get("cancel_description", "") or "").strip()
    if raw_status == Order.Status.CANCELLED:
        if not raw_cancel:
            return Response(
                {"detail": "Cancel description is required when status is cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        raw_cancel = ""

    order.status = raw_status
    order.cancel_description = raw_cancel
    order.save(update_fields=["status", "cancel_description"])
    return Response({"order": _admin_order_payload(order), "message": "Order status updated."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_products_list(request):
    if not _is_super_admin_user(request.user):
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
    if not _is_super_admin_user(request.user):
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
    if not _is_super_admin_user(request.user):
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

