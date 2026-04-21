# Optional catalog copy: material, care, fit guidance, and bullet highlights.

from django.db import migrations, models


TYPE_MATERIAL = {
    "tshirt": "Cotton-rich jersey knit — breathable, soft on skin, and easy to layer.",
    "hoodie": "Mid-weight fleece blend for warmth with ribbed cuffs and hem for shape retention.",
    "pant": "Woven stretch blend built for comfort through the day and clean drape.",
    "shirt": "Crisp cotton-blend shirting with a smooth hand-feel and structured collar.",
    "skirt": "Light woven fabric with neat seams and a comfortable silhouette.",
    "jacket": "Structured outer fabric suited for layering; reinforced seams at stress points.",
}

TYPE_CARE = {
    "tshirt": "Machine wash cold with like colours. Tumble dry low or line dry. Cool iron if needed; avoid bleach.",
    "hoodie": "Wash inside out in cold water. Tumble dry low; do not iron directly on prints if customised.",
    "pant": "Wash cold, gentle cycle. Reshape while damp; hang or flat dry to reduce creasing.",
    "shirt": "Machine wash warm; remove promptly. Warm iron; use a pressing cloth on darker panels.",
    "skirt": "Cold wash, gentle cycle. Line dry recommended to preserve shape and colour.",
    "jacket": "Spot clean when possible; otherwise cold gentle wash and air dry.",
}

TYPE_FIT = {
    "tshirt": "Regular retail fit unless you choose CUSTOM in the designer. Check the size chart in Customize for length and chest guidance.",
    "hoodie": "Relaxed silhouette with room for layering. Sleeve and body length scale by size (S–XL).",
    "pant": "True-to-size waist; inseam options follow the garment type you pick in Customize.",
    "shirt": "Tailored block with defined shoulders; size up if you prefer a looser office fit.",
    "skirt": "Designed to sit at natural waist unless noted in your saved design notes.",
    "jacket": "Layer-friendly cut; if you wear thick knits underneath, consider sizing up.",
}

TYPE_HIGHLIGHTS = {
    "tshirt": "Designed for our Customize studio (fabrics + colours)\nSoft hand-feel for everyday wear\nShips with tracked delivery after payment\nRatings unlock after a delivered order",
    "hoodie": "Cosy weight without bulk\nZip or pullover options where the catalog allows\nSave designs before checkout\n7-day returns on eligible unworn items",
    "pant": "Office-to-weekend versatility\nPair with tops from the same catalog family\nClear pricing with fabric/colour markups shown in Customize\neSewa checkout supported",
    "skirt": "Clean lines and balanced proportions\nColour segments editable in the designer\nQuality check before dispatch\nOrder tracking from your profile",
    "shirt": "Smart collar and cuff finishing\nPattern and pocket options in Customize\nGuest checkout available with email for tracking\nReview after delivery",
    "jacket": "Layer-ready construction\nDurable hardware where applicable\nWishlist + cart even when temporarily out of stock\nAdmin-updated live inventory",
}


def seed_product_details(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    for p in Product.objects.iterator():
        ptype = (p.product_type or "tshirt").strip().lower()
        updates = {}
        if not (p.material or "").strip():
            updates["material"] = TYPE_MATERIAL.get(ptype, TYPE_MATERIAL["tshirt"])
        if not (p.care_instructions or "").strip():
            updates["care_instructions"] = TYPE_CARE.get(ptype, TYPE_CARE["tshirt"])
        if not (p.fit_notes or "").strip():
            updates["fit_notes"] = TYPE_FIT.get(ptype, TYPE_FIT["tshirt"])
        if not (p.highlights or "").strip():
            updates["highlights"] = TYPE_HIGHLIGHTS.get(ptype, TYPE_HIGHLIGHTS["tshirt"])
        if updates:
            Product.objects.filter(pk=p.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0012_backfill_product_catalog_defaults"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="material",
            field=models.CharField(blank=True, default="", max_length=400),
        ),
        migrations.AddField(
            model_name="product",
            name="care_instructions",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="fit_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="highlights",
            field=models.TextField(blank=True, default="", help_text="One bullet per line."),
        ),
        migrations.RunPython(seed_product_details, migrations.RunPython.noop),
    ]
