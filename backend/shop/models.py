from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Fabric differs from this product's catalog default_fabric: +25% on base (order / payment).
FABRIC_NON_COTTON_MARKUP = Decimal("0.25")
# Part colors differ from catalog defaults: +20% (multiplicative with fabric markup).
COLOR_NON_DEFAULT_MARKUP = Decimal("0.20")


class Product(models.Model):
    """Catalog item the user customizes (tshirt, hoodie, pant, etc.)."""

    class ProductType(models.TextChoices):
        TSHIRT = "tshirt", "T-shirt"
        HOODIE = "hoodie", "Hoodie"
        PANT = "pant", "Pant"
        SHIRT = "shirt", "Shirt"
        SKIRT = "skirt", "Skirt"
        JACKET = "jacket", "Jacket"

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    product_type = models.CharField(max_length=20, choices=ProductType.choices)
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=100)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    default_part_colors = models.JSONField(
        default=dict,
        blank=True,
        help_text='Optional map of part keys to #hex defaults for the customize UI, e.g. {"body":"#f5f5f5","sleeves":"#1a1a1a"}.',
    )
    default_fabric = models.CharField(
        max_length=30,
        default="cotton",
        help_text="Fabric shown with this garment in the catalog; used as the customize form default.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_product_type_display()})"

    def effective_catalog_part_colors(self) -> dict:
        """Merged inferred + stored default part colors (same logic as customize UI)."""
        from shop.default_part_colors import default_part_colors_for_seed

        inferred = default_part_colors_for_seed(self.slug, self.product_type)
        raw = self.default_part_colors if isinstance(self.default_part_colors, dict) else {}
        return {**inferred, **raw}


class ProductRating(models.Model):
    """Logged-in user rates a product (1–5 stars); one rating per user per product (updated on resubmit)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_ratings",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    stars = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="shop_productrating_user_product_uniq"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} → {self.product_id}: {self.stars}★"


class Customization(models.Model):
    """Saved design: fabric, segmented colors, size, and style options."""

    class Fabric(models.TextChoices):
        COTTON = "cotton", "Cotton"
        SILK = "silk", "Silk"
        DENIM = "denim", "Denim"
        WOOL = "wool", "Wool"
        LINEN = "linen", "Linen"
        POLYESTER = "polyester", "Polyester"

    class Pattern(models.TextChoices):
        PLAIN = "plain", "Plain"
        CHECK_LINE = "check_line", "Check line"

    class SleeveStyle(models.TextChoices):
        FULL = "full", "Full sleeve"
        HALF = "half", "Half sleeve"
        NONE = "none", "No sleeves"

    class PantLength(models.TextChoices):
        HALF = "half", "Half pant"
        FULL = "full", "Full pant"

    class NeckDesign(models.TextChoices):
        CREW = "crew", "Crew neck"
        V_NECK = "v_neck", "V-neck"
        POLO = "polo", "Polo collar"
        BOAT = "boat", "Boat neck"
        SCOOP = "scoop", "Scoop neck"
        TURTLENECK = "turtleneck", "Turtleneck"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customizations",
        null=True,
        blank=True,
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="customizations",
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional name for this saved design.",
    )
    fabric = models.CharField(max_length=30, choices=Fabric.choices)
    part_colors = models.JSONField(
        default=dict,
        help_text='Map part name to hex color, e.g. {"body": "#222222", "sleeves": "#eeeeee"}.',
    )
    size = models.CharField(
        max_length=10,
        help_text="Preset size label: S, M, L, XL, or CUSTOM when using custom measurements.",
    )
    custom_size = models.CharField(
        max_length=120,
        blank=True,
        help_text="Free text when size is CUSTOM (measurements or notes).",
    )
    pattern = models.CharField(max_length=20, choices=Pattern.choices)
    has_collar = models.BooleanField(default=False)
    sleeve_style = models.CharField(max_length=10, choices=SleeveStyle.choices)
    has_pocket = models.BooleanField(default=False)
    pocket_position = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g. left_chest, right_hip — used when has_pocket is true.",
    )
    has_hoodie = models.BooleanField(default=False)
    pant_length = models.CharField(
        max_length=10,
        choices=PantLength.choices,
        blank=True,
        help_text="Relevant for pants; optional for other product types.",
    )
    neck_design = models.CharField(
        max_length=30,
        choices=NeckDesign.choices,
        blank=True,
    )
    custom_design = models.ImageField(
        upload_to="custom_designs/",
        blank=True,
        null=True,
        help_text="Optional uploaded artwork.",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def _part_colors_differ_from_catalog(self) -> bool:
        from shop.hex_color import normalize_hex_color

        spec = self.product.effective_catalog_part_colors()
        actual = self.part_colors if isinstance(self.part_colors, dict) else {}
        for key, def_val in spec.items():
            d = normalize_hex_color(def_val)
            if not d:
                continue
            if key not in actual:
                continue
            a = normalize_hex_color(str(actual[key]))
            if not a or a != d:
                return True
        return False

    def unit_price_for_order(self) -> Decimal:
        """Per-unit NPR: base ×1.25 if fabric ≠ product catalog default_fabric; ×1.20 if part_colors differ from catalog."""
        base = Decimal(str(self.product.base_price))
        mult = Decimal("1")
        default_fab = (self.product.default_fabric or "").strip().lower() or self.Fabric.COTTON.value
        if str(self.fabric).lower() != default_fab:
            mult *= Decimal("1") + FABRIC_NON_COTTON_MARKUP
        if self._part_colors_differ_from_catalog():
            mult *= Decimal("1") + COLOR_NON_DEFAULT_MARKUP
        out = (base * mult).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return out

    def __str__(self) -> str:
        label = self.title or f"Design #{self.pk}"
        return f"{label} — {self.product.name}"


class Order(models.Model):
    """Order placed for a specific customization snapshot."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        QUALITY_CHECK = "quality_check", "Quality check"
        PACKED = "packed", "Packed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    guest_email = models.EmailField(blank=True)
    customization = models.ForeignKey(
        Customization,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    shipping_address = models.TextField()
    cancel_description = models.TextField(blank=True, default="")
    placed_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Set when the order reaches delivered status; used for the 7-day return window.",
    )

    class Meta:
        ordering = ["-placed_at"]

    def __str__(self) -> str:
        return f"Order #{self.pk} ({self.status})"

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user}'s wishlist item: {self.product.name}"

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart", null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return f"Cart for {self.user}"
        return f"Cart (session: {self.session_key})"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    customization = models.ForeignKey(Customization, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.cart}"
