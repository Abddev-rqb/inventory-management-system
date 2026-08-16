from datetime import (
    datetime,
    time,
    timedelta,
)
from decimal import Decimal

from django.db.models import (
    Count,
    Sum,
)
from django.utils import timezone

from apps.inventory.models import (
    Order,
)


class OrderSalesService:
    @classmethod
    def get_sales_queryset(
        cls,
        *,
        start_date=None,
        end_date=None,
        employee_id=None,
    ):
        queryset = (
            Order.objects
            .filter(
                status=(
                    Order.Status.DISPATCHED
                )
            )
            .select_related(
                "employee"
            )
            .prefetch_related(
                "items"
            )
            .order_by(
                "-dispatched_at",
                "-id",
            )
        )

        current_timezone = (
            timezone.get_current_timezone()
        )

        if (
            start_date
            is not None
        ):
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
                    dispatched_at__gte=(
                        start_datetime
                    )
                )
            )

        if (
            end_date
            is not None
        ):
            next_day = (
                end_date +
                timedelta(
                    days=1
                )
            )

            end_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        next_day,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = (
                queryset.filter(
                    dispatched_at__lt=(
                        end_datetime
                    )
                )
            )

        if (
            employee_id
            is not None
        ):
            queryset = (
                queryset.filter(
                    employee_id=(
                        employee_id
                    )
                )
            )

        return queryset


    @classmethod
    def get_summary(
        cls,
        *,
        queryset,
    ):
        totals = (
            queryset.aggregate(
                total_orders=(
                    Count(
                        "id"
                    )
                ),

                total_items=(
                    Sum(
                        "total_items"
                    )
                ),

                total_sales_amount=(
                    Sum(
                        "total_amount"
                    )
                ),
            )
        )

        retail_total = (
            queryset.filter(
                price_mode=(
                    Order.PriceMode.RETAIL
                )
            )
            .aggregate(
                total=(
                    Sum(
                        "total_amount"
                    )
                )
            )[
                "total"
            ]
            or Decimal(
                "0.00"
            )
        )

        wholesale_total = (
            queryset.filter(
                price_mode=(
                    Order.PriceMode.WHOLESALE
                )
            )
            .aggregate(
                total=(
                    Sum(
                        "total_amount"
                    )
                )
            )[
                "total"
            ]
            or Decimal(
                "0.00"
            )
        )

        return {
            "total_sales_amount": (
                totals[
                    "total_sales_amount"
                ]
                or Decimal(
                    "0.00"
                )
            ),

            "total_orders": (
                totals[
                    "total_orders"
                ]
                or 0
            ),

            "total_items": (
                totals[
                    "total_items"
                ]
                or 0
            ),

            "retail_sales":
                retail_total,

            "wholesale_sales":
                wholesale_total,
        }