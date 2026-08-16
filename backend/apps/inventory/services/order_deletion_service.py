from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.inventory.api_exceptions import (
    OrderValidationError,
)
from apps.inventory.models import (
    Order,
    OrderDeletionRequest,
)


class OrderDeletionService:
    REQUEST_AFTER_DAYS = 7

    @classmethod
    @transaction.atomic
    def request_deletion(
        cls,
        *,
        order_id,
        requested_by,
        reason,
    ):
        if (
            not requested_by
            or not requested_by.is_authenticated
        ):
            raise OrderValidationError(
                "An authenticated user is required."
            )

        if (
            requested_by.is_staff
            or requested_by.is_superuser
        ):
            raise OrderValidationError(
                (
                    "Administrators can delete "
                    "dispatched orders directly."
                )
            )

        cleaned_reason = str(
            reason or ""
        ).strip()

        if not cleaned_reason:
            raise OrderValidationError(
                "Deletion reason is required."
            )

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

        cls._validate_dispatched_order(
            order
        )

        eligible_at = (
            order.dispatched_at
            + timedelta(
                days=(
                    cls.REQUEST_AFTER_DAYS
                )
            )
        )

        if timezone.now() < eligible_at:
            raise OrderValidationError(
                (
                    "Deletion can only be requested "
                    "after 7 days from dispatch."
                )
            )

        existing_request = (
            OrderDeletionRequest.objects
            .filter(
                order=order,
                status=(
                    OrderDeletionRequest
                    .Status
                    .PENDING
                ),
            )
            .first()
        )

        if existing_request:
            raise OrderValidationError(
                (
                    "A pending deletion request "
                    "already exists for this order."
                )
            )

        return (
            OrderDeletionRequest
            .objects
            .create(
                order=order,
                requested_by=(
                    requested_by
                ),
                reason=cleaned_reason,
                status=(
                    OrderDeletionRequest
                    .Status
                    .PENDING
                ),
            )
        )

    @classmethod
    @transaction.atomic
    def approve_request(
        cls,
        *,
        deletion_request_id,
        reviewed_by,
    ):
        cls._validate_admin(
            reviewed_by
        )

        try:
            deletion_request = (
                OrderDeletionRequest
                .objects
                .select_for_update()
                .select_related(
                    "order",
                    "requested_by",
                )
                .get(
                    pk=(
                        deletion_request_id
                    )
                )
            )
        except (
            OrderDeletionRequest
            .DoesNotExist
        ):
            raise OrderValidationError(
                (
                    "Deletion request "
                    "does not exist."
                )
            ) from None

        if (
            deletion_request.status
            != (
                OrderDeletionRequest
                .Status
                .PENDING
            )
        ):
            raise OrderValidationError(
                (
                    "Only pending deletion "
                    "requests can be approved."
                )
            )

        order = (
            Order.objects
            .select_for_update()
            .get(
                pk=(
                    deletion_request
                    .order_id
                )
            )
        )

        cls._validate_dispatched_order(
            order
        )

        result = {
            "deletion_request_id": (
                deletion_request.id
            ),
            "order_id": order.id,
            "order_number": (
                order.order_number
            ),
        }

        deletion_request.status = (
            OrderDeletionRequest
            .Status
            .APPROVED
        )

        deletion_request.reviewed_by = (
            reviewed_by
        )

        deletion_request.reviewed_at = (
            timezone.now()
        )

        deletion_request.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
            ]
        )

        order.delete()

        return result

    @classmethod
    @transaction.atomic
    def reject_request(
        cls,
        *,
        deletion_request_id,
        reviewed_by,
    ):
        cls._validate_admin(
            reviewed_by
        )

        try:
            deletion_request = (
                OrderDeletionRequest
                .objects
                .select_for_update()
                .select_related(
                    "order",
                    "requested_by",
                )
                .get(
                    pk=(
                        deletion_request_id
                    )
                )
            )
        except (
            OrderDeletionRequest
            .DoesNotExist
        ):
            raise OrderValidationError(
                (
                    "Deletion request "
                    "does not exist."
                )
            ) from None

        if (
            deletion_request.status
            != (
                OrderDeletionRequest
                .Status
                .PENDING
            )
        ):
            raise OrderValidationError(
                (
                    "Only pending deletion "
                    "requests can be rejected."
                )
            )

        deletion_request.status = (
            OrderDeletionRequest
            .Status
            .REJECTED
        )

        deletion_request.reviewed_by = (
            reviewed_by
        )

        deletion_request.reviewed_at = (
            timezone.now()
        )

        deletion_request.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
            ]
        )

        return deletion_request

    @classmethod
    @transaction.atomic
    def admin_delete_order(
        cls,
        *,
        order_id,
        deleted_by,
    ):
        cls._validate_admin(
            deleted_by
        )

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

        cls._validate_dispatched_order(
            order
        )

        result = {
            "order_id": order.id,
            "order_number": (
                order.order_number
            ),
        }

        order.delete()

        return result

    @staticmethod
    def _validate_dispatched_order(
        order,
    ):
        if (
            order.status
            != Order.Status.DISPATCHED
        ):
            raise OrderValidationError(
                (
                    "Only dispatched orders "
                    "can be deleted."
                )
            )

        if not order.dispatched_at:
            raise OrderValidationError(
                (
                    "The dispatched order does "
                    "not have a dispatch time."
                )
            )

    @staticmethod
    def _validate_admin(
        user,
    ):
        if (
            not user
            or not user.is_authenticated
        ):
            raise OrderValidationError(
                "An authenticated admin is required."
            )

        if not (
            user.is_staff
            or user.is_superuser
        ):
            raise OrderValidationError(
                (
                    "Administrator permission "
                    "is required."
                )
            )
