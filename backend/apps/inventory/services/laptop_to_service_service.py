from django.db import transaction

from apps.inventory.models import (
    Laptop,
    Return,
)


class LaptopToServiceError(Exception):
    pass


class LaptopToServiceService:
    ALLOWED_SOURCE_STATUSES = {
        Laptop.InventoryStatus.IN_STOCK,
        Laptop.InventoryStatus.IN_STOCK_G,
    }

    @classmethod
    @transaction.atomic
    def move_to_service(
        cls,
        *,
        laptop_id,
        created_by,
        issue,
        service_rack,
        priority,
        technician=None,
    ):
        try:
            laptop = (
                Laptop.objects
                .select_for_update()
                .get(pk=laptop_id)
            )
        except Laptop.DoesNotExist:
            raise LaptopToServiceError(
                "Laptop does not exist."
            ) from None

        if (
            laptop.inventory_status
            not in cls.ALLOWED_SOURCE_STATUSES
        ):
            raise LaptopToServiceError(
                (
                    "Only laptops in In Stock or "
                    "In Stock G can be moved to service."
                )
            )

        if laptop.quantity != 1:
            raise LaptopToServiceError(
                (
                    "A serialized laptop must have "
                    "quantity exactly 1."
                )
            )

        active_service_exists = (
            Return.objects
            .filter(
                source_type=(
                    Return.SourceType
                    .INVENTORY_SERVICE
                ),
                source_laptop=laptop,
            )
            .exclude(
                status__in={
                    Return.Status.STOCKED_IN,
                    Return.Status.DISPATCHED,
                }
            )
            .exists()
        )

        if active_service_exists:
            raise LaptopToServiceError(
                (
                    "This laptop already has an active "
                    "service record."
                )
            )

        previous_status = laptop.inventory_status

        return_record = Return.objects.create(
            source_type=(
                Return.SourceType
                .INVENTORY_SERVICE
            ),
            source_laptop=laptop,
            source_inventory_status=(
                previous_status
            ),
            customer_name=(
                "Internal Inventory"
            ),
            customer_address="",
            company=laptop.company,
            display_type=laptop.display_type,
            model_number=laptop.model_number,
            processor=laptop.processor,
            processor_generation=(
                laptop.processor_generation
            ),
            ram_gb=laptop.ram_gb,
            storage_gb=laptop.storage_gb,
            storage_type=laptop.storage_type,
            serial_number=laptop.serial_number,
            issue=issue,
            service_rack=service_rack,
            technician=technician,
            priority=priority,
            status=Return.Status.IN_SERVICE,
            created_by=created_by,
        )

        laptop.inventory_status = (
            Laptop.InventoryStatus.IN_SERVICE
        )
        laptop.save(
            update_fields=[
                "inventory_status",
                "updated_at",
            ]
        )

        return laptop, return_record
