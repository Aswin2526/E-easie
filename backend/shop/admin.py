from django.contrib import admin

from .models import Customization, Order, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "product_type", "base_price", "is_active", "created_at")
    list_filter = ("product_type", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Customization)
class CustomizationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "product", "user", "fabric", "size", "updated_at")
    list_filter = ("fabric", "product__product_type")
    search_fields = ("title", "notes")
    raw_id_fields = ("user", "product")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "guest_email", "status", "total_price", "placed_at")
    list_filter = ("status",)
    raw_id_fields = ("user", "customization")
