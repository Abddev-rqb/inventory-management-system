from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        (
            "inventory",
            "0014_return_customer_address",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="return",
            name="source_type",
            field=models.CharField(
                choices=[
                    (
                        "customer_return",
                        "Customer Return",
                    ),
                    (
                        "inventory_service",
                        "Inventory Service",
                    ),
                ],
                db_index=True,
                default="customer_return",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="return",
            name="source_laptop",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=(
                    django.db.models.deletion.PROTECT
                ),
                related_name=(
                    "inventory_service_returns"
                ),
                to="inventory.laptop",
            ),
        ),
        migrations.AddField(
            model_name="return",
            name="source_inventory_status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("in_stock", "In Stock"),
                    ("in_stock_g", "In Stock G"),
                    ("in_service", "In Service"),
                    ("sold", "Sold"),
                ],
                default="",
                max_length=20,
            ),
        ),
    ]
