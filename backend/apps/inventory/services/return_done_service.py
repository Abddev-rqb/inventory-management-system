from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.utils import timezone

from apps.inventory.api_exceptions import (
    OrderValidationError,
)
from apps.inventory.models import (
    Laptop,
    Order,
    OrderItem,
    Return,
)


class ReturnDoneService:
    """
    Moves a repaired return into the existing
    Pending Orders fulfillment workflow.

    This is not a second sale. The generated order
    has zero value and is linked to its source Return.
    """

    @classmethod
    @transaction.atomic
    def move_to_pending_order(
        cls,
        *,
        return_id,
        employee,
    ):
        try:
            return_record = (
                Return.objects
                .select_for_update()
                .get(pk=return_id)
            )
        except Return.DoesNotExist:
            raise OrderValidationError(
                "Return record does not exist."
            ) from None

        if (
            return_record.status
            != Return.Status.REPAIR_COMPLETED
        ):
            raise OrderValidationError(
                (
                    "Done is available only when "
                    "the return status is Repair Completed."
                )
            )

        if (
            return_record.source_type
            == Return.SourceType.INVENTORY_SERVICE
        ):
            return cls._complete_inventory_service(
                return_record=return_record,
                employee=employee,
            )

        customer_address = (
            return_record.customer_address
            or ""
        ).strip()

        if not customer_address:
            raise OrderValidationError(
                (
                    "Customer address is required before "
                    "moving this return to Pending Orders. "
                    "Edit the return and add the address first."
                )
            )

        if Order.objects.filter(
            source_return=return_record,
        ).exists():
            raise OrderValidationError(
                (
                    "This return already has a pending "
                    "or dispatched fulfillment order."
                )
            )

        order = Order.objects.create(
            order_number=cls._generate_order_number(),
            employee=employee,
            source_return=return_record,
            customer_name=return_record.customer_name,
            customer_address=customer_address,
            price_mode=Order.PriceMode.RETAIL,
            status=Order.Status.PENDING,
            via=Order.Via.CUSTOMER,
            via_other="",
            total_items=1,
            total_amount=Decimal("0.00"),
        )

        item_name = cls._build_item_name(
            return_record
        )

        OrderItem.objects.create(
            order=order,
            laptop=None,
            item_name=item_name,
            serial_number_snapshot=(
                return_record.serial_number
            ),
            description_snapshot=(
                cls._build_description(
                    return_record
                )
            ),
            quantity=1,
            unit_price=Decimal("0.00"),
            line_total=Decimal("0.00"),
            is_custom_item=False,
            inventory_status_before_sale="",
        )

        return_record.status = (
            Return.Status.READY_FOR_DISPATCH
        )
        return_record.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return order, return_record

    @classmethod
    def _complete_inventory_service(
        cls,
        *,
        return_record,
        employee,
    ):
        if not return_record.source_laptop_id:
            raise OrderValidationError(
                (
                    "Inventory service record is not "
                    "linked to its source laptop."
                )
            )

        try:
            laptop = (
                Laptop.objects
                .select_for_update()
                .get(
                    pk=(
                        return_record
                        .source_laptop_id
                    )
                )
            )
        except Laptop.DoesNotExist:
            raise OrderValidationError(
                "Source laptop no longer exists."
            ) from None

        if (
            laptop.inventory_status
            != Laptop.InventoryStatus.IN_SERVICE
        ):
            raise OrderValidationError(
                (
                    "Source laptop is not currently "
                    "marked In Service."
                )
            )

        restore_status = (
            return_record
            .source_inventory_status
        )

        if restore_status not in {
            Laptop.InventoryStatus.IN_STOCK,
            Laptop.InventoryStatus.IN_STOCK_G,
        }:
            restore_status = (
                Laptop.InventoryStatus.IN_STOCK
            )

        laptop.inventory_status = (
            restore_status
        )
        laptop.save(
            update_fields=[
                "inventory_status",
                "updated_at",
            ]
        )

        completed_at = timezone.now()

        return_record.status = (
            Return.Status.STOCKED_IN
        )
        return_record.stocked_in_laptop = (
            laptop
        )
        return_record.stocked_in_by = (
            employee
        )
        return_record.stocked_in_at = (
            completed_at
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

        return None, return_record

    @staticmethod
    def _build_item_name(return_record):
        parts = [
            return_record.company,
            return_record.model_number,
        ]
        return " ".join(
            str(part).strip()
            for part in parts
            if str(part).strip()
        )

    @staticmethod
    def _build_description(return_record):
        return (
            f"Return fulfillment | "
            f"{return_record.company} "
            f"{return_record.model_number} | "
            f"{return_record.processor} "
            f"{return_record.processor_generation} | "
            f"{return_record.ram_gb}GB RAM | "
            f"{return_record.storage_gb}GB "
            f"{return_record.storage_type.upper()} | "
            f"Serial: {return_record.serial_number}"
        )

    @staticmethod
    def _generate_order_number():
        return (
            "ORD-RET-"
            + uuid4().hex[:16].upper()
        )
