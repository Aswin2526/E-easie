from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0004_order_cancel_description"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="quantity",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
