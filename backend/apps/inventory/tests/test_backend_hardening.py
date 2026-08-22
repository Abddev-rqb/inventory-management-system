from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.inventory.models import Laptop


class LaptopBackendHardeningTests(APITestCase):
    def setUp(self):
        self.list_url = reverse(
            "inventory:laptop-list"
        )

        self.User = get_user_model()

    def create_user_with_permissions(
        self,
        permission_codenames,
    ):
        user = self.User.objects.create_user(
            username=(
                "user-"
                + "-".join(permission_codenames)
            ),
            password="StrongTestPassword123!",
        )

        permissions = Permission.objects.filter(
            content_type__app_label="inventory",
            codename__in=permission_codenames,
        )

        user.user_permissions.set(
            permissions
        )

        token = Token.objects.create(
            user=user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Token {token.key}"
            )
        )

        return user

    def create_laptop(
        self,
        serial_number,
        company="Dell",
        ram_gb=8,
        retail_price="22500.00",
        inventory_status=(
            Laptop.InventoryStatus.IN_STOCK
        ),
        area="comp.A",
    ):
        return Laptop.objects.create(
            company=company,
            display_type=(
                Laptop.DisplayType.NON_TOUCH
            ),
            model_number="5420",
            processor="Intel Core i5",
            processor_generation="8th",
            ram_gb=ram_gb,
            storage_gb=256,
            storage_type=Laptop.StorageType.SSD,
            serial_number=serial_number,
            wholesale_price=Decimal("18500.00"),
            retail_price=Decimal(retail_price),
            qc_status=Laptop.QCStatus.DONE,
            inventory_status=inventory_status,
            comments="Laptop is okay",
            quantity=1,
            warranty_days=(
                Laptop.WarrantyDays.THIRTY_DAYS
            ),
            area=area,
        )

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        self.assertFalse(
            response.data["success"]
        )

        self.assertEqual(
            response.data["error"]["code"],
            "not_authenticated",
        )

    def test_authenticated_user_without_permission_is_rejected(
        self,
    ):
        user = self.User.objects.create_user(
            username="no-permission-user",
            password="StrongTestPassword123!",
        )

        token = Token.objects.create(
            user=user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Token {token.key}"
            )
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_view_permission_allows_listing(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_view_permission_does_not_allow_creation(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        response = self.client.post(
            self.list_url,
            data={},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_list_response_is_paginated(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        for number in range(30):
            self.create_laptop(
                serial_number=f"PAGE-{number:03d}"
            )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            30,
        )

        self.assertEqual(
            response.data["page_size"],
            25,
        )

        self.assertEqual(
            len(response.data["results"]),
            25,
        )

        self.assertEqual(
            response.data["total_pages"],
            2,
        )

    def test_page_size_cannot_exceed_maximum(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        for number in range(110):
            self.create_laptop(
                serial_number=f"MAX-{number:03d}"
            )

        response = self.client.get(
            self.list_url,
            data={
                "page_size": 1000,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            100,
        )

    def test_filter_by_inventory_status(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        self.create_laptop(
            serial_number="STOCK-001",
            inventory_status=(
                Laptop.InventoryStatus.IN_STOCK
            ),
        )

        self.create_laptop(
            serial_number="SERVICE-001",
            inventory_status=(
                Laptop.InventoryStatus.IN_SERVICE
            ),
        )

        response = self.client.get(
            self.list_url,
            data={
                "inventory_status": "in_service",
            },
        )

        self.assertEqual(
            response.data["count"],
            0,
        )

        self.assertEqual(
            response.data["results"],
            [],
        )

    def test_filter_by_minimum_ram(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        self.create_laptop(
            serial_number="RAM-8",
            ram_gb=8,
        )

        self.create_laptop(
            serial_number="RAM-16",
            ram_gb=16,
        )

        response = self.client.get(
            self.list_url,
            data={
                "minimum_ram_gb": 16,
            },
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["ram_gb"],
            16,
        )

    def test_searches_serial_number(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        self.create_laptop(
            serial_number="SEARCH-ABC-001"
        )

        self.create_laptop(
            serial_number="OTHER-001"
        )

        response = self.client.get(
            self.list_url,
            data={
                "search": "ABC",
            },
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0][
                "serial_number"
            ],
            "SEARCH-ABC-001",
        )

    def test_orders_by_retail_price(self):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        self.create_laptop(
            serial_number="PRICE-HIGH",
            retail_price="30000.00",
        )

        self.create_laptop(
            serial_number="PRICE-LOW",
            retail_price="20000.00",
        )

        response = self.client.get(
            self.list_url,
            data={
                "ordering": "retail_price",
            },
        )

        serial_numbers = [
            item["serial_number"]
            for item in response.data["results"]
        ]

        self.assertEqual(
            serial_numbers,
            [
                "PRICE-LOW",
                "PRICE-HIGH",
            ],
        )

    def test_invalid_filter_has_consistent_error_shape(
        self,
    ):
        self.create_user_with_permissions(
            ["view_laptop"]
        )

        response = self.client.get(
            self.list_url,
            data={
                "minimum_ram_gb": "not-a-number",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

        self.assertIn(
            "error",
            response.data,
        )

        self.assertIn(
            "details",
            response.data["error"],
        )
        
def test_searches_display_type(self):
    response = self.client.get(
        self.list_url,
        {
            "search": "non_touch",
        },
    )

    self.assertEqual(
        response.status_code,
        status.HTTP_200_OK,
    )

    serial_numbers = {
        laptop["serial_number"]
        for laptop in response.data["results"]
    }

    self.assertIn(
        self.laptop.serial_number,
        serial_numbers,
    )


def test_searches_processor_generation(self):
    response = self.client.get(
        self.list_url,
        {
            "search": (
                self.laptop.processor_generation
            ),
        },
    )

    self.assertEqual(
        response.status_code,
        status.HTTP_200_OK,
    )

    serial_numbers = {
        laptop["serial_number"]
        for laptop in response.data["results"]
    }

    self.assertIn(
        self.laptop.serial_number,
        serial_numbers,
    )


def test_searches_wholesale_price(self):
    response = self.client.get(
        self.list_url,
        {
            "search": str(
                self.laptop.wholesale_price
            ),
        },
    )

    self.assertEqual(
        response.status_code,
        status.HTTP_200_OK,
    )

    serial_numbers = {
        laptop["serial_number"]
        for laptop in response.data["results"]
    }

    self.assertIn(
        self.laptop.serial_number,
        serial_numbers,
    )


def test_searches_retail_price(self):
    response = self.client.get(
        self.list_url,
        {
            "search": str(
                self.laptop.retail_price
            ),
        },
    )

    self.assertEqual(
        response.status_code,
        status.HTTP_200_OK,
    )

    serial_numbers = {
        laptop["serial_number"]
        for laptop in response.data["results"]
    }

    self.assertIn(
        self.laptop.serial_number,
        serial_numbers,
    )