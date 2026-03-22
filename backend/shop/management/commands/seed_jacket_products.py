"""
Create/update jacket catalog items with images in media/products/.
Replace the PNG files with your own photos; keep the same filenames.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from shop.models import Order, Product

# (stable slug, display name, description, price, image filename)
JACKET_ITEMS = [
    (
        "beam-bloom-olive-bomber-jacket",
        "Beam & Bloom Olive Green Bomber Jacket",
        "Olive green bomber with ribbed collar and cuffs, gold zipper, embroidered logo, sleeve pocket.",
        "89.99",
        "jacket-olive-bomber-beam-bloom.png",
    ),
    (
        "mens-navy-hooded-puffer",
        "Men's Navy Blue Hooded Puffer Jacket",
        "Navy quilted puffer with hood, full-length zip, and side pockets.",
        "95.00",
        "jacket-navy-hooded-puffer.png",
    ),
    (
        "olive-suede-harrington",
        "Olive Suede Harrington Jacket",
        "Olive zip-up jacket with shirt collar, side zip pockets, tailored seam detail.",
        "110.00",
        "jacket-olive-suede-harrington.png",
    ),
    (
        "adidas-3stripes-khaki-hooded",
        "Adidas 3-Stripes Hooded Jacket - Khaki",
        "Khaki hooded track jacket with adidas logo and 3-Stripes on sleeves.",
        "99.00",
        "jacket-adidas-khaki-3stripes.png",
    ),
    (
        "north-face-cropped-puffer-light-blue",
        "The North Face Cropped Puffer Jacket - Light Blue",
        "Light blue cropped puffer with high collar, full zip, and zip pockets.",
        "129.00",
        "jacket-north-face-cropped-puffer.png",
    ),
    (
        "short-sleeve-textured-denim-jacket",
        "Short-Sleeve Textured Denim Jacket",
        "Cropped denim jacket with diamond texture, short sleeves, button front, and chest pockets.",
        "84.99",
        "jacket-short-sleeve-denim-textured.png",
    ),
    (
        "long-grey-puffer-parka",
        "Long Grey Puffer Parka",
        "Knee-length charcoal puffer with hood, horizontal quilting, and full zip.",
        "119.99",
        "jacket-long-grey-puffer-parka.png",
    ),
    (
        "hooded-denim-hybrid-jacket",
        "Hooded Denim Hybrid Jacket",
        "Light denim body with jersey hood and sleeves, button front, and chest pockets.",
        "92.00",
        "jacket-hooded-denim-hybrid.png",
    ),
]


def _remove_legacy_bomber_jacket():
    """Remove original seed_demo 'Bomber Jacket' (slug: bomber-jacket). Delete orders first due to PROTECT."""
    for product in Product.objects.filter(slug="bomber-jacket"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed jacket products with images; removes legacy 'Bomber Jacket' without photo."

    def handle(self, *args, **options):
        _remove_legacy_bomber_jacket()
        media_products = Path(settings.MEDIA_ROOT) / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        # Placeholder source: same folder as manage.py -> ../frontend/src/assets
        backend_dir = Path(settings.BASE_DIR)
        placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "casual_denim_jacket.png"
        if not placeholder.is_file():
            placeholder = backend_dir / "media" / "products" / "placeholder.png"

        created = 0
        updated = 0

        for slug, name, description, price, filename in JACKET_ITEMS:
            dest_path = media_products / filename

            if not dest_path.is_file():
                if placeholder.is_file():
                    shutil.copy2(placeholder, dest_path)
                    self.stdout.write(
                        self.style.WARNING(
                            f"Copied placeholder to {filename} — replace with your photo in media/products/"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f"Missing image for {filename} and no placeholder found.")
                    )
                    continue

            with open(dest_path, "rb") as fh:
                django_file = File(fh, name=f"products/{filename}")

                obj, was_created = Product.objects.update_or_create(
                    slug=slug,
                    defaults={
                        "name": name,
                        "product_type": Product.ProductType.JACKET,
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
                f"Jacket products: {created} created, {updated} updated. Images: {media_products}"
            )
        )
