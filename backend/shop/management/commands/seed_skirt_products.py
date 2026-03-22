"""
Create/update skirt catalog items with images in media/products/.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from shop.models import Order, Product

SKIRT_ITEMS = [
    (
        "grey-pleated-mini-skirt",
        "Grey Pleated Mini Skirt",
        "High-waisted heather grey mini with sharp box pleats and a structured woven drape.",
        "44.00",
        "skirt-grey-pleated-mini.png",
    ),
    (
        "pink-plaid-pleated-mini-skirt",
        "Pink Plaid Pleated Mini Skirt",
        "Vibrant pink plaid mini with knife pleats and an A-line tennis-skirt silhouette.",
        "42.00",
        "skirt-pink-plaid-pleated.png",
    ),
    (
        "white-tiered-maxi-skirt",
        "White Tiered Maxi Skirt",
        "Flowy high-waisted white maxi with three tiers and a gathered elastic waist.",
        "48.00",
        "skirt-white-tiered-maxi.png",
    ),
    (
        "brown-high-waist-pleated-maxi-skirt",
        "Brown High-Waist Pleated Maxi Skirt",
        "Warm brown maxi with a V-shaped yoke front and voluminous pleated A-line skirt.",
        "52.00",
        "skirt-brown-high-waist-maxi.png",
    ),
    (
        "black-bodycon-mini-skirt",
        "Classic Black Bodycon Mini Skirt",
        "Sleek stretch mini with a body-hugging fit and clean elastic waist—an everyday essential.",
        "38.00",
        "skirt-black-bodycon-mini.png",
    ),
    (
        "black-ruched-side-slit-maxi-skirt",
        "Black Ruched Side-Slit Maxi Skirt",
        "High-waisted black maxi in soft stretch jersey with hip ruching and a thigh-high side slit.",
        "46.00",
        "skirt-black-ruched-slit-maxi.png",
    ),
    (
        "white-mini-side-slit-skirt",
        "White Mini Skirt with Side Slit",
        "Crisp white bodycon mini with a subtle side slit and smooth stretch fabric.",
        "40.00",
        "skirt-white-mini-side-slit.png",
    ),
    (
        "high-waist-denim-pencil-skirt",
        "High-Waist Denim Pencil Skirt",
        "Medium-wash denim midi with five-pocket styling, zip fly, and a front-side hem slit.",
        "54.00",
        "skirt-high-waist-denim-pencil.png",
    ),
]


def _remove_legacy_midi_skirt():
    for product in Product.objects.filter(slug="midi-skirt"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed skirt products with photos; removes legacy seed_demo 'Midi Skirt'."

    def handle(self, *args, **options):
        _remove_legacy_midi_skirt()

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
