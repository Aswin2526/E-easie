"""
Create/update skirt catalog items with images in media/products/.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from shop.default_part_colors import default_fabric_for_seed, default_part_colors_for_seed
from shop.models import Order, Product

# Prices are Nepalese Rupees (NPR), typical mid-market retail in Nepal (whole rupees only).
# (stable slug, display name, description, base_price_npr, image filename under media/products/)
SKIRT_ITEMS = [
    (
        "grey-pleated-mini-skirt",
        "Grey Pleated Mini Skirt",
        "High-waisted heather grey mini with sharp box pleats and a structured woven drape.",
        "749",
        "skirt-grey-pleated-mini.png",
    ),
    (
        "pink-plaid-pleated-mini-skirt",
        "Pink Plaid Pleated Mini Skirt",
        "Vibrant pink plaid mini with knife pleats and an A-line tennis-skirt silhouette.",
        "799",
        "skirt-pink-plaid-pleated.png",
    ),
    (
        "white-tiered-maxi-skirt",
        "White Tiered Maxi Skirt",
        "Flowy high-waisted white maxi with three tiers and a gathered elastic waist.",
        "999",
        "skirt-white-tiered-maxi.png",
    ),
    (
        "brown-high-waist-pleated-maxi-skirt",
        "Brown High-Waist Pleated Maxi Skirt",
        "Warm brown maxi with a V-shaped yoke front and voluminous pleated A-line skirt.",
        "1049",
        "skirt-brown-high-waist-maxi.png",
    ),
    (
        "black-bodycon-mini-skirt",
        "Classic Black Bodycon Mini Skirt",
        "Sleek stretch mini with a body-hugging fit and clean elastic waist—an everyday essential.",
        "649",
        "skirt-black-bodycon-mini.png",
    ),
    (
        "black-ruched-side-slit-maxi-skirt",
        "Black Ruched Side-Slit Maxi Skirt",
        "High-waisted black maxi in soft stretch jersey with hip ruching and a thigh-high side slit.",
        "949",
        "skirt-black-ruched-slit-maxi.png",
    ),
    (
        "white-mini-side-slit-skirt",
        "White Mini Skirt with Side Slit",
        "Crisp white bodycon mini with a subtle side slit and smooth stretch fabric.",
        "699",
        "skirt-white-mini-side-slit.png",
    ),
]


def _remove_legacy_midi_skirt():
    for product in Product.objects.filter(slug="midi-skirt"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


def _remove_high_waist_denim_pencil_skirt():
    for product in Product.objects.filter(slug="high-waist-denim-pencil-skirt"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed skirt products with photos; removes legacy seed_demo 'Midi Skirt'."

    def handle(self, *args, **options):
        _remove_legacy_midi_skirt()
        _remove_high_waist_denim_pencil_skirt()

        media_products = Path(settings.MEDIA_ROOT) / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        backend_dir = Path(settings.BASE_DIR)
        placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "classic_linen_shirt.png"
        if not placeholder.is_file():
            placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "casual_denim_jacket.png"

        created = 0
        updated = 0

        for slug, name, description, price, filename in SKIRT_ITEMS:
            dest_path = media_products / filename

            if not dest_path.is_file():
                if placeholder.is_file():
                    shutil.copy2(placeholder, dest_path)
                    self.stdout.write(
                        self.style.WARNING(
                            f"Copied placeholder to {filename} — add your photo in media/products/"
                        )
                    )
                else:
                    self.stdout.write(self.style.ERROR(f"Missing {filename} and no placeholder."))
                    continue

            with open(dest_path, "rb") as fh:
                django_file = File(fh, name=f"products/{filename}")

                _obj, was_created = Product.objects.update_or_create(
                    slug=slug,
                    defaults={
                        "name": name,
                        "product_type": Product.ProductType.SKIRT,
                        "description": description,
                        "base_price": Decimal(price),
                        "is_active": True,
                        "image": django_file,
                        "default_part_colors": default_part_colors_for_seed(
                            slug, Product.ProductType.SKIRT.value
                        ),
                        "default_fabric": default_fabric_for_seed(slug),
                    },
                )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Skirt products: {created} created, {updated} updated. Images: {media_products}"
            )
        )
