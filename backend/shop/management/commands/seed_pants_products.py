"""
Create/update pants catalog items with images in media/products/.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from shop.default_part_colors import default_fabric_for_seed, default_part_colors_for_seed
from shop.models import Order, Product

PANT_ITEMS = [
    (
        "classic-beige-tailored-trousers",
        "Classic Beige Tailored Trousers",
        "Light beige dress pants with center crease, straight leg, side pockets, and belt loops.",
        "45.00",
        "pant-beige-tailored-trousers.png",
    ),
    (
        "olive-chino-shorts",
        "Classic Olive Chino Shorts",
        "Slim olive chino shorts with belt loops, button fly, and side pockets.",
        "36.00",
        "pant-olive-chino-shorts.png",
    ),
    (
        "khaki-linen-shorts",
        "Khaki Linen Shorts",
        "Breathable khaki linen-blend shorts with button closure, side pockets, and cuffed hems.",
        "38.00",
        "pant-khaki-linen-shorts.png",
    ),
    (
        "charcoal-wide-leg-denim-jeans",
        "Charcoal Wide-Leg Denim Jeans",
        "Faded charcoal high-rise jeans with a wide straight leg, five-pocket styling, and contrast stitching.",
        "56.00",
        "pant-charcoal-wide-leg-denim.png",
    ),
    (
        "black-formal-trousers",
        "Black Formal Trousers",
        "Classic black dress pants with slash pockets, button closure, and a smooth woven finish.",
        "48.00",
        "pant-black-formal-trousers.png",
    ),
    (
        "dusty-pink-wide-leg-pants",
        "Dusty Pink Wide-Leg Pants",
        "Soft pink wide-leg pants with a smocked high waist, side pockets, and airy cropped length.",
        "44.00",
        "pant-dusty-pink-wide-leg.png",
    ),
]


def _remove_legacy_slim_chino():
    for product in Product.objects.filter(slug="slim-chino-pant"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


def _remove_slim_fit_cream_joggers():
    for product in Product.objects.filter(slug="slim-fit-cream-joggers"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


def _remove_black_high_waist_leggings():
    for product in Product.objects.filter(slug="black-high-waist-leggings"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed pant products with photos; removes legacy seed_demo 'Slim Chino Pant'."

    def handle(self, *args, **options):
        _remove_legacy_slim_chino()
        _remove_slim_fit_cream_joggers()
        _remove_black_high_waist_leggings()

        media_products = Path(settings.MEDIA_ROOT) / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        backend_dir = Path(settings.BASE_DIR)
        placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "classic_linen_shirt.png"
        if not placeholder.is_file():
            placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "casual_denim_jacket.png"

        created = 0
        updated = 0

        for slug, name, description, price, filename in PANT_ITEMS:
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
                        "product_type": Product.ProductType.PANT,
                        "description": description,
                        "base_price": Decimal(price),
                        "is_active": True,
                        "image": django_file,
                        "default_part_colors": default_part_colors_for_seed(
                            slug, Product.ProductType.PANT.value
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
                f"Pant products: {created} created, {updated} updated. Images: {media_products}"
            )
        )
