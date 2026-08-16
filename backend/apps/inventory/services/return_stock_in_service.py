from django.db import (
    IntegrityError,
    transaction,
)
from django.utils import timezone

from apps.inventory.models import (
    Laptop,
    Return,
)


class ReturnStockInError(
    Exception
):
    pass


class ReturnStockInService:
    @classmethod
    @transaction.atomic
    def stock_in(
        cls,
        *,
        return_id,
        user,
        laptop_data,
    ):
        try:
            return_record = (
                Return.objects
                .select_for_update()
                .select_related(
                    "stocked_in_laptop"
                )
                .get(
                    pk=return_id
                )
            )
        except Return.DoesNotExist:
            raise ReturnStockInError(
                "Return record does not exist."
            ) from None

        if (
            return_record.status
            != Return.Status.SWAP_REQUESTED
        ):
            raise ReturnStockInError(
                (
                    "Only a return with "
                    "Swap Requested status "
                    "can be stocked in."
                )
            )

        if (
            return_record
            .stocked_in_laptop_id
            is not None
        ):
            raise ReturnStockInError(
                (
                    "This returned laptop "
                    "has already been "
                    "stocked in."
                )
            )

        serial_number = (
            str(
                laptop_data[
                    "serial_number"
                ]
            )
            .strip()
        )

        existing_laptop = (
            Laptop.objects
            .filter(
                serial_number__iexact=(
                    serial_number
                )
            )
            .exists()
        )

        if existing_laptop:
            raise ReturnStockInError(
                (
                    "A laptop with this "
                    "serial number already "
                    "exists in inventory."
                )
            )

        inventory_status = (
            laptop_data[
                "inventory_status"
            ]
        )

        allowed_inventory_statuses = {
            Laptop
            .InventoryStatus
            .IN_STOCK,

            Laptop
            .InventoryStatus
            .IN_STOCK_G,

            Laptop
            .InventoryStatus
            .IN_SERVICE,
        }

        if (
            inventory_status
            not in allowed_inventory_statuses
        ):
            raise ReturnStockInError(
                (
                    "A returned laptop "
                    "cannot be stocked in "
                    "with Sold status."
                )
            )

        try:
            laptop = (
                Laptop.objects.create(
                    company=(
                        laptop_data[
                            "company"
                        ]
                    ),

                    display_type=(
                        laptop_data[
                            "display_type"
                        ]
                    ),

                    model_number=(
                        laptop_data[
                            "model_number"
                        ]
                    ),

                    processor=(
                        laptop_data[
                            "processor"
                        ]
                    ),

                    processor_generation=(
                        laptop_data.get(
                            (
                                "processor_"
                                "generation"
                            ),
                            "",
                        )
                    ),

                    ram_gb=(
                        laptop_data[
                            "ram_gb"
                        ]
                    ),

                    storage_gb=(
                        laptop_data[
                            "storage_gb"
                        ]
                    ),

                    storage_type=(
                        laptop_data[
                            "storage_type"
                        ]
                    ),

                    serial_number=(
                        serial_number
                    ),

                    wholesale_price=(
                        laptop_data[
                            "wholesale_price"
                        ]
                    ),

                    retail_price=(
                        laptop_data[
                            "retail_price"
                        ]
                    ),

                    qc_status=(
                        laptop_data[
                            "qc_status"
                        ]
                    ),

                    inventory_status=(
                        inventory_status
                    ),

                    comments=(
                        laptop_data.get(
                            "comments",
                            "",
                        )
                    ),

                    quantity=1,

                    warranty_days=(
                        laptop_data[
                            "warranty_days"
                        ]
                    ),

                    area=(
                        laptop_data[
                            "area"
                        ]
                    ),
                )
            )

        except IntegrityError as exc:
            raise ReturnStockInError(
                (
                    "The returned laptop "
                    "could not be stocked in. "
                    "Check that the serial "
                    "number is unique."
                )
            ) from exc

        return_record.status = (
            Return.Status.STOCKED_IN
        )

        return_record.stocked_in_laptop = (
            laptop
        )

        return_record.stocked_in_by = (
            user
        )

        return_record.stocked_in_at = (
            timezone.now()
        )

        return_record.save(
            update_fields=[
                "status",
                "stocked_in_laptop",
                "stocked_in_by",
                "stocked_in_at",
                "updated_at",
            ]
        )

        return (
            return_record,
            laptop,
        )