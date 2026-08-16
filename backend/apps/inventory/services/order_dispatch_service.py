from django.db import transaction
from django.utils import timezone

from apps.inventory.api_exceptions import (
    OrderValidationError,
)
from apps.inventory.models import Order


class OrderDispatchService:
    @classmethod
    @transaction.atomic
    def dispatch_order(
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
                (
                    f"Order with ID "
                    f"{order_id} "
                    "does not exist."
                )
            ) from None

        if (
            order.status
            != Order.Status.PENDING
        ):
            raise OrderValidationError(
                (
                    f"Order "
                    f"{order.order_number} "
                    "is not pending."
                )
            )

        order.status = (
            Order.Status.DISPATCHED
        )

        order.dispatched_at = (
            timezone.now()
        )

        order.save(
            update_fields=[
                "status",
                "dispatched_at",
                "updated_at",
            ]
        )

        return order

    @classmethod
    @transaction.atomic
    def dispatch_orders(
        cls,
        *,
        order_ids,
    ):
        if not isinstance(
            order_ids,
            list,
        ):
            raise OrderValidationError(
                "Order IDs must be a list."
            )

        normalized_ids = []

        seen_ids = set()

        for order_id in order_ids:
            try:
                normalized_id = int(
                    order_id
                )
            except (
                TypeError,
                ValueError,
            ):
                raise OrderValidationError(
                    "Every order ID must be an integer."
                ) from None

            if normalized_id < 1:
                raise OrderValidationError(
                    "Every order ID must be greater than zero."
                )

            if (
                normalized_id
                in seen_ids
            ):
                continue

            seen_ids.add(
                normalized_id
            )

            normalized_ids.append(
                normalized_id
            )

        if not normalized_ids:
            raise OrderValidationError(
                "At least one order must be selected."
            )

        orders = list(
            Order.objects
            .select_for_update()
            .filter(
                id__in=normalized_ids,
            )
            .order_by("id")
        )

        found_ids = {
            order.id
            for order in orders
        }

        missing_ids = [
            order_id
            for order_id
            in normalized_ids
            if order_id
            not in found_ids
        ]

        if missing_ids:
            missing_text = ", ".join(
                str(order_id)
                for order_id
                in missing_ids
            )

            raise OrderValidationError(
                (
                    "The following order IDs "
                    f"do not exist: "
                    f"{missing_text}."
                )
            )

        non_pending_orders = [
            order
            for order in orders
            if (
                order.status
                != Order.Status.PENDING
            )
        ]

        if non_pending_orders:
            order_numbers = ", ".join(
                order.order_number
                for order
                in non_pending_orders
            )

            raise OrderValidationError(
                (
                    "Only pending orders can "
                    "be dispatched. "
                    "Invalid orders: "
                    f"{order_numbers}."
                )
            )

        dispatched_at = (
            timezone.now()
        )

        for order in orders:
            order.status = (
                Order.Status.DISPATCHED
            )

            order.dispatched_at = (
                dispatched_at
            )

            order.updated_at = (
                dispatched_at
            )

        Order.objects.bulk_update(
            orders,
            fields=[
                "status",
                "dispatched_at",
                "updated_at",
            ],
        )

        return orders
