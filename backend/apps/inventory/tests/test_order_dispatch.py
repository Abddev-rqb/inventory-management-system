from decimal import Decimal

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
from rest_framework import status
from rest_framework.test import (
    APITestCase,
)

from apps.inventory.models import (
    Laptop,
    Order,
)


User = get_user_model()


class OrderDispatchAPITests(
    APITestCase
):
    def setUp(self):
        self.user = (
            User.objects.create_user(
                username="dispatcher",
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
                content_type=content_type,
                codename__in=[
                    "add_order",
                    "view_order",
                    "change_order",
                ],
            )
        )

        self.user.user_permissions.add(
            *permissions
        )

        self.client.force_authenticate(
            user=self.user
        )

        self.laptop = (
            Laptop.objects.create(
                company="Dell",
                display_type="non_touch",
                model_number="5420",
                processor="Intel Core i5",
                processor_generation="11th",
                ram_gb=8,
                storage_gb=256,
                storage_type="ssd",
                serial_number="DISPATCH-001",
                wholesale_price=(
                    Decimal("18000.00")
                ),
                retail_price=(
                    Decimal("22000.00")
                ),
                qc_status="done",
                inventory_status="in_stock",
                comments="",
                quantity=1,
                warranty_days=30,
                area="Rack A",
            )
        )

    def create_order(
        self,
        suffix,
    ):
        laptop = (
            Laptop.objects.create(
                company="Dell",
                display_type="non_touch",
                model_number="5420",
                processor="Intel Core i5",
                processor_generation="11th",
                ram_gb=8,
                storage_gb=256,
                storage_type="ssd",
                serial_number=(
                    f"DISPATCH-{suffix}"
                ),
                wholesale_price=(
                    Decimal("18000.00")
                ),
                retail_price=(
                    Decimal("22000.00")
                ),
                qc_status="done",
                inventory_status="in_stock",
                comments="",
                quantity=1,
                warranty_days=30,
                area="Rack A",
            )
        )

        response = self.client.post(
            "/api/v1/orders/",
            {
                "customer_name": (
                    f"Customer {suffix}"
                ),
                "customer_address": "",
                "price_mode": "retail",
                "via": "customer",
                "laptop_items": [
                    {
                        "laptop_id": (
                            laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
                "custom_items": [],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        return Order.objects.get(
            pk=response.data["id"]
        )

    def test_dispatch_pending_order(
        self,
    ):
        order = self.create_order(
            "ONE"
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/dispatch/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.Status.DISPATCHED,
        )

        self.assertIsNotNone(
            order.dispatched_at,
        )

    def test_dispatch_response_contains_dispatched_status(
        self,
    ):
        order = self.create_order(
            "TWO"
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/dispatch/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.data["status"],
            "dispatched",
        )

        self.assertEqual(
            response.data[
                "status_label"
            ],
            "Dispatched",
        )

    def test_already_dispatched_order_is_rejected(
        self,
    ):
        order = self.create_order(
            "THREE"
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
            ]
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/dispatch/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.Status.DISPATCHED,
        )

    def test_bulk_dispatch_orders(
        self,
    ):
        first_order = (
            self.create_order(
                "FOUR"
            )
        )

        second_order = (
            self.create_order(
                "FIVE"
            )
        )

        response = self.client.post(
            (
                "/api/v1/orders/"
                "dispatch/bulk/"
            ),
            {
                "order_ids": [
                    first_order.id,
                    second_order.id,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data[
                "dispatched_count"
            ],
            2,
        )

        first_order.refresh_from_db()
        second_order.refresh_from_db()

        self.assertEqual(
            first_order.status,
            Order.Status.DISPATCHED,
        )

        self.assertEqual(
            second_order.status,
            Order.Status.DISPATCHED,
        )

        self.assertIsNotNone(
            first_order.dispatched_at,
        )

        self.assertIsNotNone(
            second_order.dispatched_at,
        )

    def test_bulk_dispatch_is_atomic(
        self,
    ):
        first_order = (
            self.create_order(
                "SIX"
            )
        )

        second_order = (
            self.create_order(
                "SEVEN"
            )
        )

        second_order.status = (
            Order.Status.DISPATCHED
        )

        second_order.dispatched_at = (
            timezone.now()
        )

        second_order.save(
            update_fields=[
                "status",
                "dispatched_at",
            ]
        )

        response = self.client.post(
            (
                "/api/v1/orders/"
                "dispatch/bulk/"
            ),
            {
                "order_ids": [
                    first_order.id,
                    second_order.id,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        first_order.refresh_from_db()

        self.assertEqual(
            first_order.status,
            Order.Status.PENDING,
        )

    def test_bulk_dispatch_requires_order_ids(
        self,
    ):
        response = self.client.post(
            (
                "/api/v1/orders/"
                "dispatch/bulk/"
            ),
            {
                "order_ids": [],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_dispatched_order_disappears_from_pending_list(
        self,
    ):
        order = self.create_order(
            "EIGHT"
        )

        self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/dispatch/"
            ),
            {},
            format="json",
        )

        response = self.client.get(
            "/api/v1/orders/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = (
            response.data.get(
                "results",
                [],
            )
        )

        returned_ids = {
            item["id"]
            for item
            in results
        }

        self.assertNotIn(
            order.id,
            returned_ids,
        )

    def test_user_without_change_permission_cannot_dispatch(
        self,
    ):
        order = self.create_order(
            "NINE"
        )

        viewer = (
            User.objects.create_user(
                username="order_viewer",
                password="test-password",
            )
        )

        content_type = (
            ContentType.objects
            .get_for_model(
                Order
            )
        )

        view_permission = (
            Permission.objects.get(
                content_type=content_type,
                codename="view_order",
            )
        )

        viewer.user_permissions.add(
            view_permission
        )

        self.client.force_authenticate(
            user=viewer
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/dispatch/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.Status.PENDING,
        )
