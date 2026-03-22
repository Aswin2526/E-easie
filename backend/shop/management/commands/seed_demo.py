from django.core.management.base import BaseCommand
from django.utils.text import slugify

from shop.models import Product


class Command(BaseCommand):
    help = "Insert sample E-Easie products (idempotent by slug)."

    def handle(self, *args, **options):
        samples = []
        created = 0
        for name, ptype, price in samples:
            slug = slugify(name)
            obj, was_created = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "product_type": ptype,
                    "description": f"Sample {name} for customization preview.",
                    "base_price": price,
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Done. Created {created} new product(s)."))
