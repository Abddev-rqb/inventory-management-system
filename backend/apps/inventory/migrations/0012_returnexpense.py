from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0011_alter_return_service_rack"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ReturnExpense",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("item_name", models.CharField(db_index=True, max_length=255)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12, validators=[MinValueValidator(Decimal("0.01"))])),
                ("quantity", models.PositiveIntegerField(validators=[MinValueValidator(1)])),
                ("total_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_return_expenses", to=settings.AUTH_USER_MODEL)),
                ("return_record", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="expenses", to="inventory.return")),
            ],
            options={"db_table": "inventory_return_expenses", "ordering": ("-created_at", "-id")},
        ),
        migrations.AddIndex(
            model_name="returnexpense",
            index=models.Index(fields=["return_record", "created_at"], name="ret_exp_return_date_idx"),
        ),
    ]
