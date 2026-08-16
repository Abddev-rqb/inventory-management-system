from django.db import transaction

from apps.inventory.api_exceptions import (
    OrderValidationError,
)
from apps.inventory.models import (
    Laptop,
    Order,
)


class PendingOrderCancellationService:
    """
    Deletes a pending order and restores
    serialized laptops back to inventory.

    Dispatched orders are deliberately not
    handled by this service.
    """

    RESTORABLE_STATUSES = {
        Laptop.InventoryStatus.IN_STOCK,
        Laptop.InventoryStatus.IN_STOCK_G,
    }

    @classmethod
    @transaction.atomic
    def cancel_pending_order(
        cls,
        *,
        order_id,
    ):
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(
                    pk=order_id,
                )
            )

        except Order.DoesNotExist:
            raise OrderValidationError(
                "Pending order does not exist."
            ) from None

        if (
            order.status
            != Order.Status.PENDING
        ):
            raise OrderValidationError(
                (
                    "Only pending orders can "
                    "be deleted from the "
                    "Pending Orders page."
                )
            )

        order_number = (
            order.order_number
        )

        order_items = list(
            order.items
            .select_related(
                "laptop"
            )
            .all()
        )

        laptop_items = [
            item
            for item in order_items
            if (
                not item.is_custom_item
                and item.laptop_id
                is not None
            )
        ]

        laptop_ids = [
            item.laptop_id
            for item in laptop_items
        ]

        locked_laptops = {
            laptop.id:
                laptop
            for laptop
            in (
                Laptop.objects
                .select_for_update()
                .filter(
                    id__in=laptop_ids,
                )
            )
        }

        restored_laptops = 0

        for item in laptop_items:
            laptop = (
                locked_laptops.get(
                    item.laptop_id
                )
            )

            if laptop is None:
                continue

            previous_status = (
                item
                .inventory_status_before_sale
            )

            if (
                previous_status
                not in
                cls.RESTORABLE_STATUSES
            ):
                # Old orders created before
                # this field existed cannot
                # tell us whether the laptop
                # was in_stock or in_stock_g.
                #
                # Safest available fallback is
                # normal in_stock.
                previous_status = (
                    Laptop
                    .InventoryStatus
                    .IN_STOCK
                )

            laptop.inventory_status = (
                previous_status
            )

            laptop.save(
                update_fields=[
                    "inventory_status",
                    "updated_at",
                ]
            )

            restored_laptops += 1

        # OrderItem rows are removed
        # automatically because their FK
        # uses on_delete=CASCADE.
        order.delete()

        return {
            "order_number":
                order_number,

            "restored_laptops":
                restored_laptops,
        }