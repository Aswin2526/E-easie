"""
Create/update dress/casual shirt catalog items with images in media/products/.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from shop.models import Order, Product

SHIRT_ITEMS = [
    (
        "white-oxford-dress-shirt",
        "White Oxford Dress Shirt",
        "Crisp white long-sleeve button-down with spread collar and tailored fit.",
        "54.00",
        "shirt-white-oxford-dress.png",
    ),
    (
        "black-ribbed-short-sleeve-shirt",
        "Black Ribbed Short-Sleeve Shirt",
        "Black short-sleeve button-down with vertical rib texture and chest pocket.",
        "48.00",
        "shirt-black-ribbed-short-sleeve.png",
    ),
    (
        "sky-blue-check-long-sleeve-shirt",
        "Sky Blue Check Long-Sleeve Shirt",
        "Pale blue and cream check long-sleeve shirt with relaxed casual fit.",
        "52.00",
        "shirt-sky-blue-check.png",
    ),
    (
        "white-short-sleeve-pocket-shirt",
        "White Short-Sleeve Pocket Shirt",
        "White short-sleeve button-down with chest pocket and clean hem.",
        "42.00",
        "shirt-white-short-sleeve-pocket.png",
    ),
    (
        "elegant-white-vneck-blouse",
        "Elegant White V-Neck Blouse",
        "Sophisticated white long-sleeve blouse with a deep V-neck and wide lapels; smooth drape for office or formal wear.",
        "58.00",
        "shirt-elegant-white-vneck.png",
    ),
    (
        "textured-blue-gauze-button-down",
        "Textured Blue Gauze Button-Down",
        "Relaxed long-sleeve shirt in deep blue crinkled gauze with pointed collar and dark button placket.",
        "50.00",
        "shirt-textured-blue-gauze.png",
    ),
    (
        "pastel-colorblock-button-down-shirt",
        "Pastel Color-Block Button-Down Shirt",
        "Long-sleeve color-block shirt with cream body, pink collar and pocket, and light blue sleeves; lightweight woven feel.",
        "54.00",
        "shirt-pastel-colorblock.png",
    ),
    (
        "oversized-lavender-longline-shirt",
        "Oversized Lavender Longline Shirt",
        "Soft lavender longline button-up with chest pocket, roll-tab sleeves, and curved high-low hem for relaxed layering.",
        "52.00",
        "shirt-oversized-lavender.png",
    ),
]


def _remove_legacy_formal_shirt():
    for product in Product.objects.filter(slug="formal-shirt"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed shirt products with photos; removes legacy seed_demo 'Formal Shirt'."

    def handle(self, *args, **options):
        _remove_legacy_formal_shirt()

        media_products = Path(settings.MEDIA_ROOT) / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        backend_dir = Path(settings.BASE_DIR)
        placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "classic_linen_shirt.png"
        if not placeholder.is_file():
            placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "casual_denim_jacket.png"

        created = 0
        updated = 0

        for slug, name, description, price, filename in SHIRT_ITEMS:
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
                        "product_type": Product.ProductType.SHIRT,
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
                f"Shirt products: {created} created, {updated} updated. Images: {media_products}"
            )
        )
