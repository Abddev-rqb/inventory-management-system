from datetime import (
    timedelta,
)
from decimal import Decimal
from io import BytesIO

from django.contrib.auth import (
    get_user_model,
)
from django.contrib.auth.models import (
    Permission,
)
from django.contrib.contenttypes.models import (
    ContentType,
)
from django.utils import timezone
from openpyxl import load_workbook
from rest_framework import status
from rest_framework.test import (
    APITestCase,
)

from apps.inventory.models import (
    Order,
    OrderItem,
)


User = get_user_model()


class OrderSalesAPITests(
    APITestCase
):
    def setUp(self):
        self.user = (
            User.objects.create_user(
                username="sales-viewer",
                password="test-password",
            )
        )

        content_type = (
            ContentType.objects
            .get_for_model(
                Order
            )
        )

        permissions = (
            Permission.objects.filter(
                content_type=(
                    content_type
                ),
                codename__in=[
                    "view_order",
                    "view_sales_report",
                ],
            )
        )

        self.user.user_permissions.add(
            *permissions
        )

        self.client.force_authenticate(
            user=self.user
        )

    def create_order(
        self,
        *,
        number,
        amount,
        total_items,
        price_mode,
        days_ago=0,
        status_value=(
            Order.Status.DISPATCHED
        ),
    ):
        dispatched_at = None

        if (
            status_value
            == Order.Status.DISPATCHED
        ):
            dispatched_at = (
                timezone.now()
                - timedelta(
                    days=days_ago
                )
            )

        order = Order.objects.create(
            order_number=number,
            employee=self.user,
            customer_name=(
                f"Customer {number}"
            ),
            customer_address="",
            price_mode=price_mode,
            status=status_value,
            via=Order.Via.CUSTOMER,
            total_items=total_items,
            total_amount=(
                Decimal(amount)
            ),
            dispatched_at=(
                dispatched_at
            ),
        )

        OrderItem.objects.create(
            order=order,
            laptop=None,
            item_name="Adapter",
            serial_number_snapshot="",
            description_snapshot=(
                "Adapter"
            ),
            quantity=total_items,
            unit_price=(
                Decimal(amount)
                / total_items
            ),
            line_total=(
                Decimal(amount)
            ),
            is_custom_item=True,
        )

        return order

    def test_sales_report_contains_only_dispatched_orders(
        self,
    ):
        dispatched = (
            self.create_order(
                number="SALES-001",
                amount="10000.00",
                total_items=2,
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
            )
        )

        self.create_order(
            number="SALES-002",
            amount="20000.00",
            total_items=1,
            price_mode=(
                Order.PriceMode.WHOLESALE
            ),
            status_value=(
                Order.Status.PENDING
            ),
        )

        response = self.client.get(
            "/api/v1/orders/sales/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = (
            response.data[
                "results"
            ]
        )

        returned_ids = {
            item["id"]
            for item in results
        }

        self.assertIn(
            dispatched.id,
            returned_ids,
        )

        self.assertEqual(
            len(returned_ids),
            1,
        )

    def test_sales_summary_is_correct(
        self,
    ):
        self.create_order(
            number="SALES-003",
            amount="22000.00",
            total_items=2,
            price_mode=(
                Order.PriceMode.RETAIL
            ),
        )

        self.create_order(
            number="SALES-004",
            amount="18000.00",
            total_items=1,
            price_mode=(
                Order.PriceMode.WHOLESALE
            ),
        )

        response = self.client.get(
            "/api/v1/orders/sales/"
        )

        summary = (
            response.data[
                "summary"
            ]
        )

        self.assertEqual(
            Decimal(
                summary[
                    "total_sales_amount"
                ]
            ),
            Decimal("40000.00"),
        )

        self.assertEqual(
            summary[
                "total_orders"
            ],
            2,
        )

        self.assertEqual(
            summary[
                "total_items"
            ],
            3,
        )

        self.assertEqual(
            Decimal(
                summary[
                    "retail_sales"
                ]
            ),
            Decimal("22000.00"),
        )

        self.assertEqual(
            Decimal(
                summary[
                    "wholesale_sales"
                ]
            ),
            Decimal("18000.00"),
        )

    def test_sales_report_filters_by_date(
        self,
    ):
        recent = (
            self.create_order(
                number="SALES-005",
                amount="10000.00",
                total_items=1,
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                days_ago=1,
            )
        )

        self.create_order(
            number="SALES-006",
            amount="9000.00",
            total_items=1,
            price_mode=(
                Order.PriceMode.RETAIL
            ),
            days_ago=20,
        )

        start_date = (
            timezone.localdate()
            - timedelta(days=5)
        )

        end_date = (
            timezone.localdate()
        )

        response = self.client.get(
            "/api/v1/orders/sales/",
            {
                "start_date": (
                    start_date.isoformat()
                ),
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        ids = {
            row["id"]
            for row
            in response.data[
                "results"
            ]
        }

        self.assertEqual(
            ids,
            {
                recent.id,
            },
        )

    def test_invalid_date_range_is_rejected(
        self,
    ):
        response = self.client.get(
            "/api/v1/orders/sales/",
            {
                "start_date":
                    "2026-08-10",

                "end_date":
                    "2026-08-01",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_sales_excel_export(
        self,
    ):
        self.create_order(
            number="SALES-007",
            amount="22000.00",
            total_items=1,
            price_mode=(
                Order.PriceMode.RETAIL
            ),
        )

        response = self.client.get(
            (
                "/api/v1/orders/"
                "sales/export/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            (
                "application/"
                "vnd.openxmlformats-"
                "officedocument."
                "spreadsheetml.sheet"
            ),
            response[
                "Content-Type"
            ],
        )

        content = b"".join(
            response.streaming_content
        )

        workbook = load_workbook(
            BytesIO(content)
        )

        worksheet = workbook[
            "Total Sales"
        ]

        self.assertEqual(
            worksheet["A1"].value,
            "Order Number",
        )

        self.assertEqual(
            worksheet["A2"].value,
            "SALES-007",
        )

    def test_user_without_view_permission_is_rejected(
        self,
    ):
        user = (
            User.objects.create_user(
                username="no-sales-access",
                password="test-password",
            )
        )

        self.client.force_authenticate(
            user=user
        )

        response = self.client.get(
            "/api/v1/orders/sales/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
