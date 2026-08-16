from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q


class Laptop(models.Model):
    class DisplayType(models.TextChoices):
        TOUCH = "touch", "Touch"
        NON_TOUCH = "non_touch", "Non-Touch"

    class StorageType(models.TextChoices):
        SSD = "ssd", "SSD"
        HDD = "hdd", "HDD"

    class QCStatus(models.TextChoices):
        DONE = "done", "Done"
        PENDING = "pending", "Pending"

    class InventoryStatus(
        models.TextChoices
    ):
        IN_STOCK = (
            "in_stock",
            "In Stock",
        )

        IN_STOCK_G = (
            "in_stock_g",
            "In Stock G",
        )

        IN_SERVICE = (
            "in_service",
            "In Service",
        )

        SOLD = (
            "sold",
            "Sold",
        )

    class WarrantyDays(
        models.IntegerChoices
    ):
        NO_WARRANTY = (
            0,
            "No Warranty",
        )

        SEVEN_DAYS = (
            7,
            "7 Days",
        )

        FIFTEEN_DAYS = (
            15,
            "15 Days",
        )

        THIRTY_DAYS = (
            30,
            "30 Days",
        )

    company = models.CharField(
        max_length=100,
    )

    display_type = models.CharField(
        max_length=20,
        choices=DisplayType.choices,
    )

    model_number = models.CharField(
        max_length=100,
    )

    processor = models.CharField(
        max_length=100,
    )

    processor_generation = (
        models.CharField(
            max_length=50,
            blank=True,
            default="",
        )
    )

    ram_gb = (
        models.PositiveIntegerField(
            validators=[
                MinValueValidator(1),
            ],
        )
    )

    storage_gb = (
        models.PositiveIntegerField(
            validators=[
                MinValueValidator(1),
            ],
        )
    )

    storage_type = models.CharField(
        max_length=10,
        choices=StorageType.choices,
    )

    serial_number = models.CharField(
        max_length=100,
        unique=True,
    )

    wholesale_price = (
        models.DecimalField(
            max_digits=12,
            decimal_places=2,
            validators=[
                MinValueValidator(
                    Decimal("0.00")
                ),
            ],
        )
    )

    retail_price = (
        models.DecimalField(
            max_digits=12,
            decimal_places=2,
            validators=[
                MinValueValidator(
                    Decimal("0.00")
                ),
            ],
        )
    )

    qc_status = models.CharField(
        max_length=20,
        choices=QCStatus.choices,
        default=QCStatus.PENDING,
    )

    inventory_status = (
        models.CharField(
            max_length=20,
            choices=(
                InventoryStatus.choices
            ),
            default=(
                InventoryStatus.IN_STOCK
            ),
        )
    )

    comments = models.TextField(
        blank=True,
        default="",
    )

    quantity = (
        models.PositiveIntegerField(
            default=1,
            validators=[
                MinValueValidator(1),
            ],
        )
    )

    warranty_days = (
        models.PositiveSmallIntegerField(
            choices=(
                WarrantyDays.choices
            ),
            default=(
                WarrantyDays.NO_WARRANTY
            ),
        )
    )

    area = models.CharField(
        max_length=100,
    )

    created_at = (
        models.DateTimeField(
            auto_now_add=True,
        )
    )

    updated_at = (
        models.DateTimeField(
            auto_now=True,
        )
    )

    class Meta:
        db_table = (
            "inventory_laptops"
        )

        ordering = [
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(
                    ram_gb__gte=1
                ),
                name=(
                    "laptop_ram_gte_1"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    storage_gb__gte=1
                ),
                name=(
                    "laptop_storage_gte_1"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    quantity=1
                ),
                name=(
                    "laptop_quantity_"
                    "exactly_1"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    wholesale_price__gte=0
                ),
                name=(
                    "laptop_wholesale_"
                    "price_gte_0"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    retail_price__gte=0
                ),
                name=(
                    "laptop_retail_"
                    "price_gte_0"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    retail_price__gte=(
                        F(
                            "wholesale_price"
                        )
                    )
                ),
                name=(
                    "laptop_retail_gte_"
                    "wholesale"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    warranty_days__in=[
                        0,
                        7,
                        15,
                        30,
                    ]
                ),
                name=(
                    "laptop_valid_"
                    "warranty_days"
                ),
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "company",
                ],
                name=(
                    "laptop_company_idx"
                ),
            ),

            models.Index(
                fields=[
                    "model_number",
                ],
                name=(
                    "laptop_model_idx"
                ),
            ),

            models.Index(
                fields=[
                    "qc_status",
                ],
                name=(
                    "laptop_qc_status_idx"
                ),
            ),

            models.Index(
                fields=[
                    "inventory_status",
                ],
                name=(
                    "laptop_inv_status_idx"
                ),
            ),

            models.Index(
                fields=[
                    "area",
                ],
                name=(
                    "laptop_area_idx"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.company} "
            f"{self.model_number} "
            f"({self.serial_number})"
        )


class Order(models.Model):
    class PriceMode(
        models.TextChoices
    ):
        RETAIL = (
            "retail",
            "Retail",
        )

        WHOLESALE = (
            "wholesale",
            "Wholesale",
        )

    class Status(
        models.TextChoices
    ):
        PENDING = (
            "pending",
            "Pending",
        )

        DISPATCHED = (
            "dispatched",
            "Dispatched",
        )

    class Via(
        models.TextChoices
    ):
        A1_COURIER = (
            "a1_courier",
            "A1 Courier",
        )

        ST_COURIER = (
            "st_courier",
            "ST Courier",
        )

        CUSTOMER = (
            "customer",
            "Customer",
        )

        OTHER = (
            "other",
            "Other",
        )

    order_number = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
    )

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name=(
            "inventory_orders"
        ),
    )

    customer_name = (
        models.CharField(
            max_length=150,
        )
    )

    customer_address = (
        models.TextField(
            blank=True,
            default="",
        )
    )

    price_mode = models.CharField(
        max_length=20,
        choices=PriceMode.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    via = models.CharField(
        max_length=30,
        choices=Via.choices,
    )

    via_other = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    total_items = (
        models.PositiveIntegerField(
            default=0,
        )
    )

    total_amount = (
        models.DecimalField(
            max_digits=14,
            decimal_places=2,
            default=0,
        )
    )

    created_at = (
        models.DateTimeField(
            auto_now_add=True,
            db_index=True,
        )
    )

    updated_at = (
        models.DateTimeField(
            auto_now=True,
        )
    )

    dispatched_at = (
        models.DateTimeField(
            null=True,
            blank=True,
        )
    )

    class Meta:
        ordering = (
            "-created_at",
            "-id",
        )

        permissions = [
            (
                "view_sales_report",
                (
                    "Can view total "
                    "sales report"
                ),
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "status",
                    "created_at",
                ],
                name=(
                    "order_status_"
                    "created_idx"
                ),
            ),

            models.Index(
                fields=[
                    "price_mode",
                    "created_at",
                ],
                name=(
                    "order_price_"
                    "created_idx"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.order_number} - "
            f"{self.customer_name}"
        )


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    laptop = models.ForeignKey(
        "Laptop",
        on_delete=models.PROTECT,
        related_name="order_items",
        null=True,
        blank=True,
    )

    item_name = models.CharField(
        max_length=255,
    )

    serial_number_snapshot = (
        models.CharField(
            max_length=150,
            blank=True,
            default="",
        )
    )

    description_snapshot = (
        models.CharField(
            max_length=500,
            blank=True,
            default="",
        )
    )

    quantity = (
        models.PositiveIntegerField()
    )

    unit_price = (
        models.DecimalField(
            max_digits=14,
            decimal_places=2,
        )
    )

    line_total = (
        models.DecimalField(
            max_digits=14,
            decimal_places=2,
        )
    )

    is_custom_item = (
        models.BooleanField(
            default=False,
        )
    )

    inventory_status_before_sale = (
        models.CharField(
            max_length=20,
            blank=True,
            default="",
        )
    )

    created_at = (
        models.DateTimeField(
            auto_now_add=True,
        )
    )

    class Meta:
        ordering = (
            "id",
        )

        constraints = [
            models.CheckConstraint(
                condition=Q(
                    quantity__gt=0
                ),
                name=(
                    "order_item_"
                    "quantity_gt_zero"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    unit_price__gte=0
                ),
                name=(
                    "order_item_"
                    "unit_price_gte_0"
                ),
            ),

            models.CheckConstraint(
                condition=Q(
                    line_total__gte=0
                ),
                name=(
                    "order_item_"
                    "line_total_gte_0"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.order.order_number} "
            f"- {self.item_name} "
            f"x {self.quantity}"
        )


class OrderDeletionRequest(
    models.Model
):
    class Status(
        models.TextChoices
    ):
        PENDING = (
            "pending",
            "Pending",
        )

        APPROVED = (
            "approved",
            "Approved",
        )

        REJECTED = (
            "rejected",
            "Rejected",
        )

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name=(
            "deletion_requests"
        ),
    )

    requested_by = (
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.PROTECT,
            related_name=(
                "requested_order_"
                "deletions"
            ),
        )
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    reviewed_by = (
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.PROTECT,
            related_name=(
                "reviewed_order_"
                "deletions"
            ),
            null=True,
            blank=True,
        )
    )

    reviewed_at = (
        models.DateTimeField(
            null=True,
            blank=True,
        )
    )

    created_at = (
        models.DateTimeField(
            auto_now_add=True,
            db_index=True,
        )
    )

    class Meta:
        ordering = (
            "-created_at",
            "-id",
        )

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "order",
                ],
                condition=Q(
                    status="pending"
                ),
                name=(
                    "one_pending_"
                    "deletion_per_order"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.order.order_number} "
            f"- "
            f"{self.get_status_display()}"
        )

class Return(models.Model):
    class Priority(
        models.TextChoices
    ):
        LOW = (
            "low",
            "Low",
        )

        NORMAL = (
            "normal",
            "Normal",
        )

        HIGH = (
            "high",
            "High",
        )

        URGENT = (
            "urgent",
            "Urgent",
        )

    class Status(
        models.TextChoices
    ):
        RECEIVED = (
            "received",
            "Received",
        )

        IN_SERVICE = (
            "in_service",
            "In Service",
        )

        REPAIR_COMPLETED = (
            "repair_completed",
            "Repair Completed",
        )

        SWAP_REQUESTED = (
            "swap_requested",
            "Swap Requested",
        )

        READY_FOR_DISPATCH = (
            "ready_for_dispatch",
            "Ready For Dispatch",
        )

        STOCKED_IN = (
            "stocked_in",
            "Stocked In",
        )

        DISPATCHED = (
            "dispatched",
            "Dispatched",
        )

    customer_name = (
        models.CharField(
            max_length=150,
            db_index=True,
        )
    )

    company = models.CharField(
        max_length=100,
        db_index=True,
    )

    display_type = (
        models.CharField(
            max_length=20,
            choices=(
                Laptop.DisplayType.choices
            ),
        )
    )

    model_number = (
        models.CharField(
            max_length=100,
            db_index=True,
        )
    )

    processor = models.CharField(
        max_length=100,
    )

    processor_generation = (
        models.CharField(
            max_length=50,
            blank=True,
            default="",
        )
    )

    ram_gb = (
        models.PositiveIntegerField(
            validators=[
                MinValueValidator(1),
            ],
        )
    )

    storage_gb = (
        models.PositiveIntegerField(
            validators=[
                MinValueValidator(1),
            ],
        )
    )

    storage_type = (
        models.CharField(
            max_length=10,
            choices=(
                Laptop.StorageType.choices
            ),
        )
    )

    serial_number = (
        models.CharField(
            max_length=100,
            db_index=True,
        )
    )

    issue = models.TextField()

    service_rack = models.CharField(
        max_length=100,
        db_index=True,
    )

    technician = (
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.PROTECT,
            related_name=(
                "assigned_returns"
            ),
            null=True,
            blank=True,
        )
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
        db_index=True,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.RECEIVED,
        db_index=True,
    )

    repair_notes = (
        models.TextField(
            blank=True,
            default="",
        )
    )

    created_by = (
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.PROTECT,
            related_name=(
                "created_returns"
            ),
        )
    )

    stocked_in_laptop = (
        models.ForeignKey(
            Laptop,
            on_delete=models.PROTECT,
            related_name=(
                "source_returns"
            ),
            null=True,
            blank=True,
        )
    )

    stocked_in_by = (
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.PROTECT,
            related_name=(
                "stocked_in_returns"
            ),
            null=True,
            blank=True,
        )
    )

    stocked_in_at = (
        models.DateTimeField(
            null=True,
            blank=True,
            db_index=True,
        )
    )

    created_at = (
        models.DateTimeField(
            auto_now_add=True,
            db_index=True,
        )
    )

    updated_at = (
        models.DateTimeField(
            auto_now=True,
        )
    )

    class Meta:
        db_table = (
            "inventory_returns"
        )

        ordering = (
            "-created_at",
            "-id",
        )

        permissions = [
            (
                "assign_return_priority",
                (
                    "Can assign return "
                    "priority"
                ),
            ),

            (
                "stock_in_return",
                (
                    "Can stock in "
                    "returned laptop"
                ),
            ),

            (
                "export_return",
                (
                    "Can export return "
                    "records"
                ),
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "status",
                    "created_at",
                ],
                name=(
                    "return_status_"
                    "created_idx"
                ),
            ),

            models.Index(
                fields=[
                    "priority",
                    "created_at",
                ],
                name=(
                    "return_priority_"
                    "created_idx"
                ),
            ),

            models.Index(
                fields=[
                    "technician",
                    "status",
                ],
                name=(
                    "return_tech_"
                    "status_idx"
                ),
            ),

            models.Index(
                fields=[
                    "service_rack",
                ],
                name=(
                    "return_rack_idx"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.customer_name} - "
            f"{self.company} "
            f"{self.model_number} "
            f"({self.serial_number})"
        )