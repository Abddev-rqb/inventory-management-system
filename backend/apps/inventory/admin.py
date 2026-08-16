from django.contrib import admin

from apps.inventory.models import Laptop


@admin.register(Laptop)
class LaptopAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "company",
        "display_type",
        "model_number",
        "processor",
        "processor_generation",
        "ram_gb",
        "storage_gb",
        "storage_type",
        "serial_number",
        "wholesale_price",
        "retail_price",
        "qc_status",
        "inventory_status",
        "quantity",
        "area",
    ]

    list_filter = [
        "display_type",
        "storage_type",
        "qc_status",
        "inventory_status",
        "warranty_days",
    ]

    search_fields = [
        "company",
        "model_number",
        "processor",
        "processor_generation",
        "serial_number",
        "area",
    ]

    ordering = [
        "-created_at",
    ]

    list_per_page = 25

    @admin.display(
        description="QC status label",
        ordering="qc_status",
    )
    def qc_status_label(self, obj):
        return obj.get_qc_status_display()

    @admin.display(
        description="Inventory status label",
        ordering="inventory_status",
    )
    def inventory_status_label(self, obj):
        return obj.get_inventory_status_display()

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Laptop Identity",
            {
                "fields": (
                    "company",
                    "model_number",
                    "serial_number",
                ),
            },
        ),
        (
            "Hardware Specification",
            {
                "fields": (
                    "display_type",
                    "processor",
                    "processor_generation",
                    "ram_gb",
                    "storage_gb",
                    "storage_type",
                ),
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "wholesale_price",
                    "retail_price",
                ),
            },
        ),
        (
            "Inventory Status",
            {
                "fields": (
                    "inventory_status",
                    "qc_status",
                    "quantity",
                    "warranty_days",
                    "area",
                    "comments",
                ),
            },
        ),
        (
            "Audit Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    list_per_page = 25

    @admin.display(
        description="Storage",
        ordering="storage_gb",
    )
    def storage_summary(self, obj):
        return f"{obj.storage_gb} GB {obj.get_storage_type_display()}"