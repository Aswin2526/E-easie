"""
Create/update hoodie catalog items with images in media/products/.
"""

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from shop.models import Order, Product

# Prices are NPR, kept between Rs. 1,500 and Rs. 3,000 for this category.
HOODIE_ITEMS = [
    (
        "heather-grey-oversized-pullover-hoodie",
        "Grey Pullover Hoodie",
        "Relaxed heather grey hoodie with kangaroo pocket, ribbed cuffs and hem, and dropped shoulders.",
        "1999",
        "hoodie-heather-grey-oversized.png",
    ),
    (
        "light-grey-full-zip-hoodie",
        "Light Grey Zip Hoodie",
        "Cool-toned grey zip hoodie with split patch pockets, drawstring hood, and ribbed trims.",
        "2699",
        "hoodie-light-grey-full-zip.png",
    ),
    (
        "black-pullover-hoodie",
        "Black Hoodie",
        "Matte black fleece pullover with drawstring hood, ribbed cuffs, and clean minimal lines.",
        "1799",
        "hoodie-black-pullover.png",
    ),
    (
        "mint-quarter-zip-hoodie",
        "Mint Quarter-Zip",
        "Pale mint quarter-zip hoodie with kangaroo pocket, raglan sleeves, and soft fleece feel.",
        "2399",
        "hoodie-mint-quarter-zip.png",
    ),
    (
        "taupe-cropped-zip-hoodie",
        "Taupe Cropped Zip",
        "Greige cropped full-zip hoodie with drawstring hood, split front pockets, ribbed hem, and sleeve piping.",
        "3000",
        "hoodie-taupe-cropped-zip.png",
    ),
    (
        "rose-oversized-graphic-hoodie",
        "Pink Graphic Hoodie",
        "Soft pink oversized pullover with front graphic, kangaroo pocket, contrast drawstrings, and striped rib hem.",
        "1500",
        "hoodie-rose-oversized-graphic.png",
    ),
    (
        "off-white-oversized-zip-hoodie",
        "Cream Zip Hoodie",
        "Cream oversized zip hoodie with dropped shoulders, roomy hood, and ribbed cuffs and hem.",
        "2899",
        "hoodie-off-white-oversized-zip.png",
    ),
    (
        "training-dept-sleeveless-hoodie-black",
        "Training Dept. Sleeveless Hoodie — Black",
        "Premium black muscle hoodie with TRAINING DEPT. chest branding. Sleeveless cut for range of motion, "
        "kangaroo pocket, drawstring hood, and ribbed hem — built for gym and athletic wear.",
        "2199",
        "hoodie-training-dept-sleeveless-black.png",
    ),
]


def _remove_legacy_street_hoodie():
    for product in Product.objects.filter(slug="street-hoodie"):
        for cust in product.customizations.all():
            Order.objects.filter(customization=cust).delete()
        product.delete()


class Command(BaseCommand):
    help = "Seed hoodie products with photos; removes legacy seed_demo 'Street Hoodie'."

    def handle(self, *args, **options):
        _remove_legacy_street_hoodie()

        media_products = Path(settings.MEDIA_ROOT) / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        backend_dir = Path(settings.BASE_DIR)
        placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "classic_linen_shirt.png"
        if not placeholder.is_file():
            placeholder = backend_dir.parent / "frontend" / "src" / "assets" / "casual_denim_jacket.png"

        created = 0
        updated = 0

        assets_dir = backend_dir.parent / "frontend" / "src" / "assets"

        for slug, name, description, price, filename in HOODIE_ITEMS:
            dest_path = media_products / filename

            if not dest_path.is_file():
                source_asset = assets_dir / filename
                if source_asset.is_file():
                    shutil.copy2(source_asset, dest_path)
                elif placeholder.is_file():
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
                        "product_type": Product.ProductType.HOODIE,
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
                f"Hoodie products: {created} created, {updated} updated. Images: {media_products}"
            )
        )
