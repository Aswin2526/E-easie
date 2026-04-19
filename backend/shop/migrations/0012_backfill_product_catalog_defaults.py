# Backfill catalog defaults for all products (fabric + part colors) so customize/pricing match originals.

from django.db import migrations


def backfill_catalog_defaults(apps, schema_editor):
    from shop.default_part_colors import default_fabric_for_seed, default_part_colors_for_seed

    Product = apps.get_model("shop", "Product")
    for p in Product.objects.iterator():
        fab = default_fabric_for_seed(p.slug or "")
        inferred = default_part_colors_for_seed(p.slug or "", p.product_type or "")
        db_colors = p.default_part_colors if isinstance(p.default_part_colors, dict) else {}
        merged_colors = {**inferred, **db_colors}
        updates = {}
        if (p.default_fabric or "").strip().lower() != fab.lower():
            updates["default_fabric"] = fab
        if merged_colors != db_colors:
            updates["default_part_colors"] = merged_colors
        if updates:
            Product.objects.filter(pk=p.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0011_product_default_fabric"),
    ]

    operations = [
        migrations.RunPython(backfill_catalog_defaults, migrations.RunPython.noop),
    ]
