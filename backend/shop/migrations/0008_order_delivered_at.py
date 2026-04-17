from django.db import migrations, models
from django.db.models import F


def backfill_delivered_at(apps, schema_editor):
    Order = apps.get_model("shop", "Order")
    Order.objects.filter(status="delivered", delivered_at__isnull=True).update(delivered_at=F("placed_at"))


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0007_order_status_delivered"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="delivered_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Set when the order reaches delivered status; used for the 7-day return window.",
                null=True,
            ),
        ),
        migrations.RunPython(backfill_delivered_at, migrations.RunPython.noop),
    ]
