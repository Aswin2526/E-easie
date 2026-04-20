import re
from decimal import Decimal

from rest_framework import serializers

from .models import Customization, Order, Product, ProductRating, Wishlist, Cart, CartItem

HEX_COLOR = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
PRESET_SIZES = {"S", "M", "L", "XL", "CUSTOM"}


class ProductSerializer(serializers.ModelSerializer):
    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)
    rating_average = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "product_type",
            "product_type_display",
            "description",
            "base_price",
            "quantity",
            "default_part_colors",
            "default_fabric",
            "image",
            "is_active",
            "created_at",
            "rating_average",
            "rating_count",
        )
        read_only_fields = fields

    def get_rating_average(self, obj):
        v = getattr(obj, "rating_avg", None)
        if v is None:
            return None
        return round(float(v), 2)

    def get_rating_count(self, obj):
        return int(getattr(obj, "rating_cnt", 0) or 0)


class ProductRatingWriteSerializer(serializers.Serializer):
    stars = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class ProductRatingListSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductRating
        fields = ("id", "stars", "comment", "created_at", "reviewer_name")

    def get_reviewer_name(self, obj):
        u = obj.user
        name = (u.first_name or "").strip()
        if name:
            return name
        un = (u.username or "").strip()
        return un if un else "Customer"


class CustomizationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_type = serializers.CharField(source="product.product_type", read_only=True)

    class Meta:
        model = Customization
        fields = (
            "id",
            "user",
            "product",
            "product_name",
            "product_type",
            "title",
            "fabric",
            "part_colors",
            "size",
            "custom_size",
            "pattern",
            "has_collar",
            "sleeve_style",
            "has_pocket",
            "pocket_position",
            "has_hoodie",
            "pant_length",
            "neck_design",
            "custom_design",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "created_at", "updated_at", "product_name", "product_type")

    def validate_part_colors(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("part_colors must be an object mapping part names to colors.")
        for part, color in value.items():
            if not isinstance(part, str) or not part.strip():
                raise serializers.ValidationError("Each part key must be a non-empty string.")
            if not isinstance(color, str) or not HEX_COLOR.match(color.strip()):
                raise serializers.ValidationError(
                    f'Invalid color for "{part}": use hex format like #RGB or #RRGGBB.'
                )
        return value

    def validate(self, attrs):
        inst = self.instance
        size = attrs.get("size", inst.size if inst else None)
        size = (size or "").strip().upper()
        attrs["size"] = size
        if size not in PRESET_SIZES:
            raise serializers.ValidationError(
                {"size": f"Must be one of: {', '.join(sorted(PRESET_SIZES))}."}
            )

        custom_size = attrs.get("custom_size", inst.custom_size if inst else "")
        if size == "CUSTOM" and not (custom_size or "").strip():
            raise serializers.ValidationError(
                {"custom_size": "Required when size is CUSTOM."}
            )

        has_pocket = attrs.get("has_pocket", inst.has_pocket if inst else False)
        pocket_position = attrs.get("pocket_position", inst.pocket_position if inst else "")
        pocket_position = (pocket_position or "").strip()
        if has_pocket and not pocket_position:
            raise serializers.ValidationError(
                {"pocket_position": "Set pocket position when pocket is enabled."}
            )
        attrs["pocket_position"] = pocket_position

        product = attrs.get("product") or (inst.product if inst else None)
        if product and product.product_type == Product.ProductType.PANT:
            pant_length = attrs.get("pant_length", inst.pant_length if inst else "")
            if not pant_length:
                raise serializers.ValidationError(
                    {"pant_length": "Required for pant products."}
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user
        return super().create(validated_data)


class OrderCreateSerializer(serializers.ModelSerializer):
    """Create order; unit/total price are computed from the linked product (server-side)."""
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        write_only=True,
        required=False,
    )
    customization = serializers.PrimaryKeyRelatedField(
        queryset=Customization.objects.select_related("product"),
        required=False,
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "user",
            "guest_email",
            "product",
            "customization",
            "quantity",
            "unit_price",
            "total_price",
            "status",
            "shipping_address",
            "placed_at",
        )
        read_only_fields = ("id", "user", "unit_price", "total_price", "status", "placed_at")

    def validate(self, attrs):
        customization = attrs.get("customization")
        product = attrs.get("product")

        if not customization and not product:
            raise serializers.ValidationError(
                {"customization": "Provide customization or product for direct purchase."}
            )
        if customization and product and customization.product_id != product.id:
            raise serializers.ValidationError(
                {"product": "Selected product does not match customization product."}
            )
        if not customization:
            attrs["customization"] = None
        if not product and customization:
            product = customization.product
            attrs["product"] = product

        if not product.is_active:
            raise serializers.ValidationError({"product": "This product is not available for ordering."})

        try:
            qty = int(attrs.get("quantity") or 1)
        except (TypeError, ValueError):
            raise serializers.ValidationError({"quantity": "Invalid quantity."})
        if qty < 1:
            qty = 1
        if product.quantity < qty:
            raise serializers.ValidationError({"detail": "This product is out of stock."})

        request = self.context.get("request")
        guest_email = (attrs.get("guest_email") or "").strip()
        if request and request.user.is_authenticated:
            attrs["guest_email"] = ""
        else:
            if not guest_email:
                raise serializers.ValidationError(
                    {"guest_email": "Required for guests, or sign in to place an order."}
                )
            attrs["guest_email"] = guest_email

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        qty = int(validated_data.get("quantity") or 1)
        product = validated_data["product"]
        customization = validated_data.get("customization")

        if request and request.user.is_authenticated:
            user = request.user
            guest_email = ""
        else:
            user = None
            guest_email = validated_data["guest_email"]

        # Direct buy path: generate a minimal customization snapshot automatically.
        if customization is None:
            valid_fabrics = {c.value for c in Customization.Fabric}
            fab = (getattr(product, "default_fabric", None) or "").strip().lower()
            if fab not in valid_fabrics:
                fab = Customization.Fabric.COTTON.value
            customization = Customization.objects.create(
                user=user,
                product=product,
                title="Direct Purchase",
                fabric=fab,
                part_colors={},
                size="M",
                custom_size="",
                pattern=Customization.Pattern.PLAIN,
                has_collar=False,
                sleeve_style=Customization.SleeveStyle.FULL,
                has_pocket=False,
                pocket_position="",
                has_hoodie=False,
                pant_length=Customization.PantLength.FULL
                if product.product_type == Product.ProductType.PANT
                else "",
                neck_design="",
                notes="Auto-created for direct order without customization.",
            )

        unit = customization.unit_price_for_order()
        total = (unit * Decimal(qty)).quantize(Decimal("0.01"))

        return Order.objects.create(
            user=user,
            guest_email=guest_email,
            customization=customization,
            quantity=qty,
            unit_price=unit,
            total_price=total,
            shipping_address=validated_data["shipping_address"],
        )



class OrderListSerializer(serializers.ModelSerializer):
    customization_summary = serializers.SerializerMethodField()
    product = serializers.SerializerMethodField()
    review_eligible = serializers.SerializerMethodField()
    product_review = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "user",
            "status",
            "quantity",
            "unit_price",
            "total_price",
            "shipping_address",
            "placed_at",
            "delivered_at",
            "cancel_description",
            "customization",
            "customization_summary",
            "guest_email",
            "product",
            "review_eligible",
            "product_review",
        )
        read_only_fields = fields

    def get_customization_summary(self, obj):
        return str(obj.customization)

    def get_product(self, obj):
        p = obj.customization.product
        image_url = None
        if p.image:
            try:
                image_url = p.image.url
            except Exception:
                image_url = None
        return {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "product_type": p.product_type,
            "product_type_display": p.get_product_type_display(),
            "image": image_url,
            "base_price": str(p.base_price),
        }

    def get_review_eligible(self, obj):
        if obj.status != Order.Status.DELIVERED:
            return False
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if not user or not user.is_authenticated or obj.user_id is None:
            return False
        return obj.user_id == user.id

    def get_product_review(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if not user or not user.is_authenticated or obj.user_id != user.id:
            return None
        pid = obj.customization.product_id
        cache = self.context.get("product_ratings_by_product_id")
        if isinstance(cache, dict):
            r = cache.get(pid)
        else:
            r = ProductRating.objects.filter(user=user, product_id=pid).first()
        if not r:
            return None
        return {
            "stars": r.stars,
            "comment": r.comment,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }

class WishlistSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = Wishlist
        fields = ("id", "user", "product", "product_detail", "added_at")
        read_only_fields = ("id", "user", "added_at")

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user
        return super().create(validated_data)

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)
    customization_detail = CustomizationSerializer(source="customization", read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "cart", "product", "product_detail", "customization", "customization_detail", "quantity", "added_at")
        read_only_fields = ("id", "cart", "added_at")

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cart
        fields = ("id", "user", "session_key", "items", "created_at", "updated_at")
        read_only_fields = ("id", "user", "session_key", "created_at", "updated_at")
