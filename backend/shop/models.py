from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


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
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_product_type_display()})"


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

    def __str__(self) -> str:
        label = self.title or f"Design #{self.pk}"
        return f"{label} — {self.product.name}"


class Order(models.Model):
    """Order placed for a specific customization snapshot."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
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
    placed_at = models.DateTimeField(auto_now_add=True)

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
