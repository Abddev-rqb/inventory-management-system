from datetime import (
    datetime,
    time,
)
from decimal import Decimal

from django.db.models import (
    Q,
    Sum,
)
from django.utils import timezone

from apps.inventory.models import (
    ReturnExpense,
)


class ReturnExpenseService:
    @classmethod
    def get_queryset(
        cls,
        *,
        search="",
        start_date=None,
        end_date=None,
    ):
        queryset = (
            ReturnExpense.objects
            .select_related(
                "return_record",
                "return_record__technician",
                "created_by",
            )
            .order_by(
                "-created_at",
                "-id",
            )
        )

        search_text = (
            str(
                search or ""
            )
            .strip()
        )

        if search_text:
            queryset = (
                queryset.filter(
                    Q(
                        item_name__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        return_record__customer_name__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        return_record__company__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        return_record__model_number__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        return_record__serial_number__icontains=(
                            search_text
                        )
                    )
                )
            )

        current_timezone = (
            timezone
            .get_current_timezone()
        )

        if start_date:
            start_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        start_date,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = (
                queryset.filter(
                    created_at__gte=(
                        start_datetime
                    )
                )
            )

        if end_date:
            end_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        end_date,
                        time.max,
                    ),
                    current_timezone,
                )
            )

            queryset = (
                queryset.filter(
                    created_at__lte=(
                        end_datetime
                    )
                )
            )

        return queryset

    @classmethod
    def get_total(
        cls,
        *,
        queryset=None,
        search="",
        start_date=None,
        end_date=None,
    ):
        if queryset is None:
            queryset = cls.get_queryset(
                search=search,
                start_date=start_date,
                end_date=end_date,
            )

        return (
            queryset.aggregate(
                total=Sum(
                    "total_amount"
                )
            )
            .get(
                "total"
            )
            or Decimal(
                "0.00"
            )
        )
