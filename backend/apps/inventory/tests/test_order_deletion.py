from datetime import timedelta
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
    OrderDeletionRequest,
)


User = get_user_model()


class OrderDeletionAPITests(
    APITestCase
):
    def setUp(self):
        self.employee = (
            User.objects.create_user(
                username="employee",
                password="test-password",
            )
        )

        order_content_type = (
            ContentType.objects
            .get_for_model(
                Order
            )
        )

        deletion_content_type = (
            ContentType.objects
            .get_for_model(
                OrderDeletionRequest
            )
        )

        view_order_permission = (
            Permission.objects.get(
                content_type=(
                    order_content_type
                ),
                codename="view_order",
            )
        )

        request_deletion_permission = (
            Permission.objects.get(
                content_type=(
                    deletion_content_type
                ),
                codename=(
                    "add_orderdeletionrequest"
                ),
            )
        )

        self.employee.user_permissions.add(
            view_order_permission,
            request_deletion_permission,
        )

        self.admin = (
            User.objects.create_user(
                username="admin",
                password="test-password",
                is_staff=True,
            )
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
                serial_number=(
                    "DELETE-ORDER-001"
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

    def create_dispatched_order(
        self,
        *,
        days_ago=8,
    ):
        return Order.objects.create(
            order_number=(
                f"ORD-DELETE-"
                f"{Order.objects.count() + 1}"
            ),
            employee=self.employee,
            customer_name="Customer",
            customer_address="",
            price_mode=(
                Order.PriceMode.RETAIL
            ),
            status=(
                Order.Status.DISPATCHED
            ),
            via=Order.Via.CUSTOMER,
            total_items=1,
            total_amount=(
                Decimal("22000.00")
            ),
            dispatched_at=(
                timezone.now()
                - timedelta(
                    days=days_ago
                )
            ),
        )

    def test_non_admin_can_request_after_seven_days(
        self,
    ):
        order = (
            self.create_dispatched_order(
                days_ago=8
            )
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
                "deletion-request/"
            ),
            {
                "reason": (
                    "Old incorrect order."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            OrderDeletionRequest
            .objects
            .count(),
            1,
        )

    def test_request_before_seven_days_is_rejected(
        self,
    ):
        order = (
            self.create_dispatched_order(
                days_ago=6
            )
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
                "deletion-request/"
            ),
            {
                "reason": "Delete",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            OrderDeletionRequest
            .objects
            .count(),
            0,
        )

    def test_duplicate_pending_request_is_rejected(
        self,
    ):
        order = (
            self.create_dispatched_order()
        )

        OrderDeletionRequest.objects.create(
            order=order,
            requested_by=(
                self.employee
            ),
            reason="First request",
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
                "deletion-request/"
            ),
            {
                "reason": "Second request",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_admin_can_directly_delete_dispatched_order(
        self,
    ):
        order = (
            self.create_dispatched_order(
                days_ago=1
            )
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Order.objects.filter(
                pk=order.id
            ).exists()
        )

    def test_non_admin_cannot_directly_delete(
        self,
    ):
        order = (
            self.create_dispatched_order()
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.delete(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Order.objects.filter(
                pk=order.id
            ).exists()
        )

    def test_pending_order_cannot_be_deleted(
        self,
    ):
        order = (
            self.create_dispatched_order()
        )

        order.status = (
            Order.Status.PENDING
        )

        order.dispatched_at = None

        order.save(
            update_fields=[
                "status",
                "dispatched_at",
            ]
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_admin_can_approve_deletion_request(
        self,
    ):
        order = (
            self.create_dispatched_order()
        )

        deletion_request = (
            OrderDeletionRequest
            .objects
            .create(
                order=order,
                requested_by=(
                    self.employee
                ),
                reason="Incorrect order",
            )
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            (
                "/api/v1/"
                "order-deletion-requests/"
                f"{deletion_request.id}/"
                "approve/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Order.objects.filter(
                pk=order.id
            ).exists()
        )

    def test_admin_can_reject_deletion_request(
        self,
    ):
        order = (
            self.create_dispatched_order()
        )

        deletion_request = (
            OrderDeletionRequest
            .objects
            .create(
                order=order,
                requested_by=(
                    self.employee
                ),
                reason="Incorrect order",
            )
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            (
                "/api/v1/"
                "order-deletion-requests/"
                f"{deletion_request.id}/"
                "reject/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        deletion_request.refresh_from_db()

        self.assertEqual(
            deletion_request.status,
            (
                OrderDeletionRequest
                .Status
                .REJECTED
            ),
        )

        self.assertEqual(
            deletion_request.reviewed_by,
            self.admin,
        )

        self.assertIsNotNone(
            deletion_request.reviewed_at
        )

        self.assertTrue(
            Order.objects.filter(
                pk=order.id
            ).exists()
        )

    def test_non_admin_cannot_approve_request(
        self,
    ):
        order = (
            self.create_dispatched_order()
        )

        deletion_request = (
            OrderDeletionRequest
            .objects
            .create(
                order=order,
                requested_by=(
                    self.employee
                ),
                reason="Incorrect order",
            )
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            (
                "/api/v1/"
                "order-deletion-requests/"
                f"{deletion_request.id}/"
                "approve/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Order.objects.filter(
                pk=order.id
            ).exists()
        )
