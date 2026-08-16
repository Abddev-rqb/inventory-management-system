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


class OrderHardeningTests(
    APITestCase
):
    def setUp(self):
        self.employee = (
            User.objects.create_user(
                username="hardening-user",
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

        order_permissions = (
            Permission.objects.filter(
                content_type=(
                    order_content_type
                ),
                codename__in=[
                    "add_order",
                    "view_order",
                    "change_order",
                ],
            )
        )

        deletion_permission = (
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
            *order_permissions
        )

        self.employee.user_permissions.add(
            deletion_permission
        )

        self.client.force_authenticate(
            user=self.employee
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
                    "HARDENING-001"
                ),
                wholesale_price=(
                    Decimal("18000.00")
                ),
                retail_price=(
                    Decimal("22000.00")
                ),
                qc_status="done",
                inventory_status=(
                    Laptop.InventoryStatus
                    .IN_STOCK
                ),
                comments="",
                quantity=1,
                warranty_days=30,
                area="Rack A",
            )
        )

    def create_laptop(
        self,
        serial_number,
    ):
        return Laptop.objects.create(
            company="Dell",
            display_type="non_touch",
            model_number="5420",
            processor="Intel Core i5",
            processor_generation="11th",
            ram_gb=8,
            storage_gb=256,
            storage_type="ssd",
            serial_number=serial_number,
            wholesale_price=Decimal("18000.00"),
            retail_price=Decimal("22000.00"),
            qc_status="done",
            inventory_status=(
                Laptop.InventoryStatus.IN_STOCK
            ),
            comments="",
            quantity=1,
            warranty_days=30,
            area="Rack A",
        )

    def payload(
        self,
        laptop=None,
    ):
        laptop = laptop or self.laptop
        return {
            "customer_name": (
                "Hardening Customer"
            ),
            "customer_address": "",
            "price_mode": "retail",
            "via": "customer",
            "via_other": "",
            "laptop_items": [
                {
                    "laptop_id": (
                        laptop.id
                    ),
                    "quantity": 1,
                }
            ],
            "custom_items": [],
        }

    def test_duplicate_laptop_ids_are_rejected(
        self,
    ):
        payload = self.payload()

        payload["laptop_items"] = [
            {
                "laptop_id":
                    self.laptop.id,

                "quantity": 1,
            },
            {
                "laptop_id":
                    self.laptop.id,

                "quantity": 1,
            },
        ]

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

        self.laptop.refresh_from_db()

        self.assertEqual(
            self.laptop.quantity,
            1,
        )

    def test_blank_customer_name_is_rejected(
        self,
    ):
        payload = self.payload()

        payload[
            "customer_name"
        ] = "    "

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

    def test_via_other_is_required_for_other(
        self,
    ):
        payload = self.payload()

        payload["via"] = "other"
        payload["via_other"] = ""

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_via_other_is_cleared_for_customer(
        self,
    ):
        payload = self.payload()

        payload["via"] = "customer"

        payload[
            "via_other"
        ] = "Should disappear"

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        order = Order.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            order.via_other,
            "",
        )

    def test_service_generated_order_numbers_are_unique(
        self,
    ):
        second_laptop = (
            self.create_laptop(
                "HARDENING-002"
            )
        )

        first_response = (
            self.client.post(
                "/api/v1/orders/",
                self.payload(),
                format="json",
            )
        )

        second_response = (
            self.client.post(
                "/api/v1/orders/",
                self.payload(
                    second_laptop
                ),
                format="json",
            )
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertNotEqual(
            first_response.data[
                "order_number"
            ],
            second_response.data[
                "order_number"
            ],
        )

        self.assertTrue(
            first_response.data[
                "order_number"
            ].startswith(
                "ORD-"
            )
        )

    def test_sold_laptop_cannot_be_sold(
        self,
    ):
        self.laptop.inventory_status = (
            Laptop.InventoryStatus.SOLD
        )

        self.laptop.save(
            update_fields=[
                "inventory_status",
            ]
        )

        response = self.client.post(
            "/api/v1/orders/",
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

    def test_service_laptop_cannot_be_sold(
        self,
    ):
        self.laptop.inventory_status = (
            Laptop.InventoryStatus
            .IN_SERVICE
        )

        self.laptop.save(
            update_fields=[
                "inventory_status",
            ]
        )

        response = self.client.post(
            "/api/v1/orders/",
            self.payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

    def test_failed_sale_does_not_reduce_stock(
        self,
    ):
        self.laptop.quantity = 1

        self.laptop.save(
            update_fields=[
                "quantity",
            ]
        )

        payload = self.payload()

        payload[
            "laptop_items"
        ][0][
            "quantity"
        ] = 2

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.laptop.refresh_from_db()

        self.assertEqual(
            self.laptop.quantity,
            1,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

    def test_client_cannot_override_employee(
        self,
    ):
        other_user = (
            User.objects.create_user(
                username="fake-employee",
                password="test-password",
            )
        )

        payload = self.payload()

        payload["employee"] = (
            other_user.id
        )

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        order = Order.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            order.employee,
            self.employee,
        )

    def test_non_admin_cannot_list_deletion_requests(
        self,
    ):
        response = self.client.get(
            (
                "/api/v1/"
                "order-deletion-requests/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        
    def test_deletion_request_requires_view_order_permission(
        self,
    ):
        from datetime import timedelta

        from django.utils import timezone

        employee = (
            User.objects.create_user(
                username=(
                    "deletion-only-user"
                ),
                password="test-password",
            )
        )

        deletion_content_type = (
            ContentType.objects
            .get_for_model(
                OrderDeletionRequest
            )
        )

        deletion_permission = (
            Permission.objects.get(
                content_type=(
                    deletion_content_type
                ),
                codename=(
                    "add_orderdeletionrequest"
                ),
            )
        )

        employee.user_permissions.add(
            deletion_permission
        )

        order = Order.objects.create(
            order_number=(
                "ORD-HARDEN-DELETE"
            ),
            employee=self.employee,
            customer_name=(
                "Hardening Customer"
            ),
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
                Decimal("1000.00")
            ),
            dispatched_at=(
                timezone.now()
                - timedelta(days=8)
            ),
        )

        self.client.force_authenticate(
            user=employee
        )

        response = self.client.post(
            (
                f"/api/v1/orders/"
                f"{order.id}/"
                "deletion-request/"
            ),
            {
                "reason": (
                    "Request without "
                    "view permission"
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertEqual(
            OrderDeletionRequest
            .objects
            .count(),
            0,
        )
