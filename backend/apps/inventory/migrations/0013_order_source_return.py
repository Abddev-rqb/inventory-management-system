from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0012_returnexpense"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="source_return",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="fulfillment_order",
                to="inventory.return",
            ),
        ),
    ]
