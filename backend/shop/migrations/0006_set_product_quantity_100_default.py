from django.db import migrations, models


def set_all_products_quantity_100(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    Product.objects.all().update(quantity=100)


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0005_product_quantity"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="quantity",
            field=models.PositiveIntegerField(default=100),
        ),
        migrations.RunPython(set_all_products_quantity_100, migrations.RunPython.noop),
    ]
