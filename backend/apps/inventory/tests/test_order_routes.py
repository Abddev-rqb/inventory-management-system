from django.test import (
    SimpleTestCase,
)
from django.urls import (
    resolve,
)


class OrderRouteTests(
    SimpleTestCase
):
    def test_order_list_route(
        self,
    ):
        match = resolve(
            "/api/v1/orders/"
        )

        self.assertEqual(
            match.func.actions[
                "get"
            ],
            "list",
        )

        self.assertEqual(
            match.func.actions[
                "post"
            ],
            "create",
        )

    def test_dispatch_route(
        self,
    ):
        match = resolve(
            (
                "/api/v1/orders/"
                "1/dispatch/"
            )
        )

        self.assertEqual(
            match.func.actions[
                "post"
            ],
            "dispatch_order",
        )

    def test_bulk_dispatch_route(
        self,
    ):
        match = resolve(
            (
                "/api/v1/orders/"
                "dispatch/bulk/"
            )
        )

        self.assertEqual(
            match.func.actions[
                "post"
            ],
            "bulk_dispatch",
        )

    def test_sales_route(
        self,
    ):
        match = resolve(
            "/api/v1/orders/sales/"
        )

        self.assertEqual(
            match.func.actions[
                "get"
            ],
            "sales_report",
        )

    def test_sales_export_route(
        self,
    ):
        match = resolve(
            (
                "/api/v1/orders/"
                "sales/export/"
            )
        )

        self.assertEqual(
            match.func.actions[
                "get"
            ],
            "sales_export",
        )

    def test_deletion_approve_route(
        self,
    ):
        match = resolve(
            (
                "/api/v1/"
                "order-deletion-requests/"
                "1/approve/"
            )
        )

        self.assertEqual(
            match.func.actions[
                "post"
            ],
            "approve",
        )

    def test_deletion_reject_route(
        self,
    ):
        match = resolve(
            (
                "/api/v1/"
                "order-deletion-requests/"
                "1/reject/"
            )
        )

        self.assertEqual(
            match.func.actions[
                "post"
            ],
            "reject",
        )