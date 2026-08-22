from datetime import (
    datetime,
    time,
    timedelta,
)
from decimal import Decimal

from django.db.models import (
    Count,
    Q,
    Sum,
)
from django.utils import timezone

from apps.inventory.models import (
    Order,
)

from apps.inventory.services.return_expense_service import (
    ReturnExpenseService,
)


class OrderSalesService:
    @classmethod
    def get_sales_queryset(
        cls,
        *,
        start_date=None,
        end_date=None,
        employee_id=None,
        search=None,
    ):
        queryset = (
            Order.objects
            .filter(
                status=(
                    Order.Status.DISPATCHED
                )
            )
            .filter(
                source_return__isnull=True
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
                    dispatched_at__gte=(
                        start_datetime
                    )
                )
            )

        if end_date:
            next_date = (
                end_date
                + timedelta(
                    days=1
                )
            )

            end_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        next_date,
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

        if employee_id:
            queryset = (
                queryset.filter(
                    employee_id=(
                        employee_id
                    )
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
                        order_number__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        customer_name__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        customer_address__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        employee__username__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        employee__first_name__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        employee__last_name__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        items__item_name__icontains=(
                            search_text
                        )
                    )
                    |
                    Q(
                        items__serial_number_snapshot__icontains=(
                            search_text
                        )
                    )
                )
                .distinct()
            )

        return queryset

    @classmethod
    def get_summary(
        cls,
        *,
        start_date=None,
        end_date=None,
        employee_id=None,
        search=None,
    ):
        queryset = (
            cls.get_sales_queryset(
                start_date=(
                    start_date
                ),
                end_date=(
                    end_date
                ),
                employee_id=(
                    employee_id
                ),
                search=(
                    search
                ),
            )
        )

        aggregates = (
            queryset.aggregate(
                total_sales_amount=(
                    Sum(
                        "total_amount"
                    )
                ),
                total_orders=(
                    Count(
                        "id",
                        distinct=True,
                    )
                ),
                total_items=(
                    Sum(
                        "total_items"
                    )
                ),
            )
        )

        retail_total = (
            queryset
            .filter(
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
            )
            .get(
                "total"
            )
            or Decimal(
                "0.00"
            )
        )

        wholesale_total = (
            queryset
            .filter(
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
            )
            .get(
                "total"
            )
            or Decimal(
                "0.00"
            )
        )

        total_expenses = (
            ReturnExpenseService
            .get_total(
                start_date=start_date,
                end_date=end_date,
            )
        )

        return {
            "total_sales_amount":
                (
                    aggregates.get(
                        "total_sales_amount"
                    )
                    or Decimal(
                        "0.00"
                    )
                ),

            "total_expenses":
                total_expenses,

            "total_orders":
                (
                    aggregates.get(
                        "total_orders"
                    )
                    or 0
                ),

            "total_items":
                (
                    aggregates.get(
                        "total_items"
                    )
                    or 0
                ),

            "retail_sales":
                retail_total,

            "wholesale_sales":
                wholesale_total,
        }