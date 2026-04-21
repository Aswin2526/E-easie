"""Customer-facing stock: same rule as admin catalog (on-hand minus non-cancelled order units)."""

from django.db.models import Sum

from .models import Order, Product


def non_cancelled_order_units_for_product(product_id: int) -> int:
    total = (
        Order.objects.filter(customization__product_id=product_id)
        .exclude(status=Order.Status.CANCELLED)
        .aggregate(total=Sum("quantity"))
        .get("total")
    )
    return int(total or 0)


def available_units_for_product(product: Product) -> int:
    base = int(product.quantity or 0)
    committed = non_cancelled_order_units_for_product(product.id)
    return max(0, base - committed)
