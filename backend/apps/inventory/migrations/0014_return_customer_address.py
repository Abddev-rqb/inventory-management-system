from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0013_order_source_return"),
    ]

    operations = [
        migrations.AddField(
            model_name="return",
            name="customer_address",
            field=models.TextField(
                blank=True,
                default="",
            ),
        ),
    ]
