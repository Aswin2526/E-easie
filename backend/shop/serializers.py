import re
from decimal import Decimal

from rest_framework import serializers

from .models import Customization, Order, Product

HEX_COLOR = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
PRESET_SIZES = {"S", "M", "L", "XL", "CUSTOM"}


class ProductSerializer(serializers.ModelSerializer):
    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)

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
            "image",
            "is_active",
            "created_at",
        )
        read_only_fields = fields


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

    class Meta:
        model = Order
        fields = (
            "id",
            "user",
            "guest_email",
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
        customization = attrs["customization"]
        product = customization.product
        if not product.is_active:
            raise serializers.ValidationError({"customization": "This product is not available for ordering."})

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
        customization = validated_data["customization"]
        qty = validated_data.get("quantity") or 1
        product = customization.product
        unit = product.base_price
        total = unit * qty if isinstance(unit, Decimal) else Decimal(str(unit)) * qty

        if request and request.user.is_authenticated:
            user = request.user
            guest_email = ""
        else:
            user = None
            guest_email = validated_data["guest_email"]

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

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "quantity",
            "unit_price",
            "total_price",
            "shipping_address",
            "placed_at",
            "customization",
            "customization_summary",
            "guest_email",
        )

    def get_customization_summary(self, obj):
        return str(obj.customization)
