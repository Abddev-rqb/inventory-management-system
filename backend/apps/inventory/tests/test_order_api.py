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
)


User = get_user_model()


class OrderAPITests(
    APITestCase
):
    def setUp(self):
        self.user = (
            User.objects.create_user(
                username="order_employee",
                password="test-password",
            )
        )

        order_content_type = (
            ContentType.objects
            .get_for_model(
                Order
            )
        )

        add_order_permission = (
            Permission.objects.get(
                codename="add_order",
                content_type=(
                    order_content_type
                ),
            )
        )

        view_order_permission = (
            Permission.objects.get(
                codename="view_order",
                content_type=(
                    order_content_type
                ),
            )
        )

        self.user.user_permissions.add(
            add_order_permission,
            view_order_permission,
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
                serial_number="ORDER-API-001",
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

    def valid_payload(self):
        return {
            "customer_name": (
                "Customer One"
            ),
            "customer_address": (
                "Chennai"
            ),
            "price_mode": "retail",
            "via": "customer",
            "via_other": "",
            "laptop_items": [
                {
                    "laptop_id": (
                        self.laptop.id
                    ),
                    "quantity": 1,
                }
            ],
            "custom_items": [],
        }

    def test_create_pending_order(
        self,
    ):
        response = self.client.post(
            "/api/v1/orders/",
            self.valid_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["status"],
            "pending",
        )

        self.assertEqual(
            response.data[
                "status_label"
            ],
            "Pending",
        )

        self.assertEqual(
            response.data[
                "total_items"
            ],
            1,
        )

        self.assertEqual(
            Decimal(
                response.data[
                    "total_amount"
                ]
            ),
            Decimal("22000.00"),
        )

        self.assertEqual(
            len(
                response.data[
                    "items"
                ]
            ),
            1,
        )

    def test_create_order_marks_laptop_sold(
        self,
    ):
        response = self.client.post(
            "/api/v1/orders/",
            self.valid_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.laptop.refresh_from_db()

        self.assertEqual(
            self.laptop.quantity,
            1,
        )

        self.assertEqual(
            self.laptop.inventory_status,
            Laptop.InventoryStatus.SOLD,
        )

    def test_list_pending_orders(
        self,
    ):
        self.client.post(
            "/api/v1/orders/",
            self.valid_payload(),
            format="json",
        )

        response = self.client.get(
            "/api/v1/orders/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        data = response.data

        results = (
            data.get(
                "results",
                data,
            )
            if isinstance(
                data,
                dict,
            )
            else data
        )

        self.assertEqual(
            len(results),
            1,
        )

        self.assertEqual(
            results[0][
                "customer_name"
            ],
            "Customer One",
        )

    def test_retrieve_pending_order(
        self,
    ):
        create_response = (
            self.client.post(
                "/api/v1/orders/",
                self.valid_payload(),
                format="json",
            )
        )

        order_id = (
            create_response.data[
                "id"
            ]
        )

        response = self.client.get(
            (
                f"/api/v1/orders/"
                f"{order_id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            order_id,
        )

        self.assertEqual(
            response.data[
                "employee"
            ],
            self.user.id,
        )

    def test_create_custom_item_with_laptop(
        self,
    ):
        payload = (
            self.valid_payload()
        )

        payload[
            "custom_items"
        ] = [
            {
                "item_name": (
                    "Adapter"
                ),
                "quantity": 1,
                "unit_price": (
                    "500.00"
                ),
            }
        ]

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data[
                "total_items"
            ],
            2,
        )

        self.assertEqual(
            Decimal(
                response.data[
                    "total_amount"
                ]
            ),
            Decimal("22500.00"),
        )

    def test_create_requires_items(
        self,
    ):
        payload = (
            self.valid_payload()
        )

        payload[
            "laptop_items"
        ] = []

        payload[
            "custom_items"
        ] = []

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "items",
            response.data[
                "error"
            ][
                "details"
            ],
        )

    def test_unavailable_laptop_returns_400(
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
            self.valid_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "inventory",
            response.data[
                "error"
            ][
                "details"
            ],
        )

        self.laptop.refresh_from_db()

        self.assertEqual(
            self.laptop.quantity,
            1,
        )

    def test_employee_is_taken_from_authenticated_user(
        self,
    ):
        payload = (
            self.valid_payload()
        )

        payload[
            "employee"
        ] = 999999

        response = self.client.post(
            "/api/v1/orders/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        order = (
            Order.objects.get(
                pk=response.data["id"]
            )
        )

        self.assertEqual(
            order.employee,
            self.user,
        )

    def test_user_without_add_permission_cannot_create(
        self,
    ):
        other_user = (
            User.objects.create_user(
                username="viewer",
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
                codename="view_order",
                content_type=(
                    content_type
                ),
            )
        )

        other_user.user_permissions.add(
            view_permission
        )

        self.client.force_authenticate(
            user=other_user
        )

        response = self.client.post(
            "/api/v1/orders/",
            self.valid_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_list_orders(
        self,
    ):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.get(
            "/api/v1/orders/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
