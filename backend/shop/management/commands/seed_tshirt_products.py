"""
Create/update t-shirt catalog items with images in media/products/.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from shop.models import Order, Product

# (stable slug, display name, description, price, image filename under media/products/)
TSHIRT_ITEMS = [
    (
        "classic-white-crew-neck-t-shirt",
        "Classic White Crew Neck T-Shirt",
        "Plain short-sleeve white tee with classic crew neck.",
        "24.99",
        "tshirt-white-crew-neck.png",
    ),
    (
        "black-long-sleeve-crew-neck-tee",
        "Black Long-Sleeve Crew Neck T-Shirt",
        "Slim-fit black long-sleeve tee with crew neck and curved hem.",
        "32.00",
        "tshirt-black-long-sleeve.png",
    ),
    (
        "yellow-polo-shirt",
        "Yellow Polo Shirt",
        "Short-sleeve polo with ribbed collar, button placket, and chest logo detail.",
        "36.50",
        "tshirt-yellow-polo.png",
    ),
    (
        "oversized-white-longline-long-sleeve-tee",
        "Oversized White Longline Long-Sleeve Tee",
        "Oversized long-sleeve white tee with dropped shoulders and side hem slits.",
        "34.00",
        "tshirt-oversized-white-longline.png",
    ),
    (
        "black-crop-crew-neck-tee",
        "Black Crop Crew Neck T-Shirt",
        "Slim short-sleeve black crop tee with crew neck.",
        "28.00",
        "tshirt-black-crop-crew.png",
    ),
    (
        "white-long-sleeve-crop-top",
        "White Long-Sleeve Crop Top",
        "White long-sleeve cropped top with crew neck and relaxed shoulders.",
        "31.00",
        "tshirt-white-long-sleeve-crop.png",
    ),
    (
        "white-relaxed-long-sleeve-tee",
        "White Relaxed Long-Sleeve T-Shirt",
        "Relaxed-fit white long-sleeve tee with crew neck.",
        "29.50",
        "tshirt-white-relaxed-long-sleeve.png",
    ),
    (
        "blue-sleeveless-ribbed-crop-top",
        "Blue Sleeveless Ribbed Crop Top",
        "Bright blue sleeveless ribbed crop top with crew neck.",
        "26.00",
        "tshirt-blue-sleeveless-crop.png",
    ),
]


def _remove_legacy_classic_tee():
    """Remove original seed_demo 'Classic Tee' (slug: classic-tee)."""
    for product in Product.objects.filter(slug="classic-tee"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed t-shirt products with photos; removes legacy 'Classic Tee' without a real image."

    def handle(self, *args, **options):
        _remove_legacy_classic_tee()

        media_products = Path(settings.MEDIA_ROOT) / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        backend_dir = Path(settings.BASE_DIR)
        placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "casual_denim_jacket.png"

        created = 0
        updated = 0

        for slug, name, description, price, filename in TSHIRT_ITEMS:
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
                        "product_type": Product.ProductType.TSHIRT,
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
                f"T-shirt products: {created} created, {updated} updated. Images: {media_products}"
            )
        )
