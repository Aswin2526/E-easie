from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0003_product_rating"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="cancel_description",
            field=models.TextField(blank=True, default=""),
        ),
    ]
