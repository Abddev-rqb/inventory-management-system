from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from apps.inventory.tests.base import (
    AuthenticatedInventoryAPITestCase,
)
from apps.inventory.models import Laptop
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

from django.db import IntegrityError, transaction


class LaptopAPITests(
    AuthenticatedInventoryAPITestCase
):
    def setUp(self):
        super().setUp()
        self.authenticate_with_inventory_permissions()
        self.list_url = reverse(
            "inventory:laptop-list"
        )

        self.valid_payload = {
            "company": "Dell",
            "display_type": Laptop.DisplayType.NON_TOUCH,
            "model_number": "5420",
            "processor": "Intel Core i5",
            "processor_generation": "8th",
            "ram_gb": 8,
            "storage_gb": 256,
            "storage_type": Laptop.StorageType.SSD,
            "serial_number": "API-2551",
            "wholesale_price": "18500.00",
            "retail_price": "22500.00",
            "qc_status": Laptop.QCStatus.DONE,
            "inventory_status": (
                Laptop.InventoryStatus.IN_STOCK
            ),
            "comments": "This laptop is okay",
            "quantity": 1,
            "warranty_days": (
                Laptop.WarrantyDays.THIRTY_DAYS
            ),
            "area": "warehouse-1-rack-2-compartment-14",
        }

    def create_laptop(self, **overrides):
        payload = {
            **self.valid_payload,
            **overrides,
        }

        return Laptop.objects.create(
            company=payload["company"],
            display_type=payload["display_type"],
            model_number=payload["model_number"],
            processor=payload["processor"],
            processor_generation=(
                payload["processor_generation"]
            ),
            ram_gb=payload["ram_gb"],
            storage_gb=payload["storage_gb"],
            storage_type=payload["storage_type"],
            serial_number=payload["serial_number"],
            wholesale_price=Decimal(
                str(payload["wholesale_price"])
            ),
            retail_price=Decimal(
                str(payload["retail_price"])
            ),
            qc_status=payload["qc_status"],
            inventory_status=payload["inventory_status"],
            comments=payload["comments"],
            quantity=payload["quantity"],
            warranty_days=payload["warranty_days"],
            area=payload["area"],
        )

    def test_list_laptops(self):
        self.create_laptop()

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

        self.assertEqual(
            response.data["results"][0]["serial_number"],
            "API-2551",
        )

    def test_create_valid_laptop(self):
        response = self.client.post(
            self.list_url,
            data=self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Laptop.objects.count(),
            1,
        )

        laptop = Laptop.objects.get()

        self.assertEqual(
            laptop.serial_number,
            "API-2551",
        )

        self.assertEqual(
            laptop.wholesale_price,
            Decimal("18500.00"),
        )

        self.assertEqual(
            laptop.inventory_status,
            Laptop.InventoryStatus.IN_STOCK,
        )

    def test_create_response_contains_display_labels(self):
        response = self.client.post(
            self.list_url,
            data=self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        
        self.assertEqual(
            response.data["display_type"],
            "non_touch",
        )

        self.assertEqual(
            response.data["display_type_label"],
            "Non-Touch",
        )
        
        self.assertEqual(
            response.data["qc_status"],
            "done",
        )
        
        self.assertEqual(
            response.data["qc_status_label"],
            "Done",
        )

        self.assertEqual(
            response.data["storage_type_label"],
            "SSD",
        )

        self.assertEqual(
            response.data["inventory_status"],
            "in_stock",
        )

        self.assertEqual(
            response.data["inventory_status_label"],
            "In Stock",
        )

        self.assertEqual(
            response.data["warranty_label"],
            "30 Days",
        )

    def test_retrieve_laptop(self):
        laptop = self.create_laptop()

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.get(
            detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            laptop.pk,
        )

    def test_patch_laptop_inventory_status(self):
        laptop = self.create_laptop()

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.patch(
            detail_url,
            data={
                "inventory_status": (
                    Laptop.InventoryStatus.IN_SERVICE
                ),
                "area": "service-room-table-3",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

        self.assertEqual(
            response.data["error"]["code"],
            "validation_error",
        )

        self.assertIn(
            "inventory_status",
            response.data["error"]["details"],
        )

        self.assertIn(
            (
                "In Service is controlled by the "
                "To Service workflow and cannot "
                "be selected manually."
            ),
            str(
                response.data["error"]["details"][
                    "inventory_status"
                ]
            ),
        )

    def test_delete_laptop(self):
        laptop = self.create_laptop()

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.delete(
            detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Laptop.objects.filter(
                pk=laptop.pk,
            ).exists()
        )

    def test_duplicate_serial_number_is_rejected(self):
        self.create_laptop(
            serial_number="DL-A001",
        )

        duplicate_payload = {
            **self.valid_payload,
            "serial_number": "dl-a001",
        }

        response = self.client.post(
            self.list_url,
            data=duplicate_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "serial_number",
            response.data["error"]["details"],
        )

    def test_retail_price_below_wholesale_is_rejected(self):
        invalid_payload = {
            **self.valid_payload,
            "serial_number": "PRICE-INVALID-001",
            "wholesale_price": "22500.00",
            "retail_price": "18500.00",
        }

        response = self.client.post(
            self.list_url,
            data=invalid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "retail_price",
            response.data["error"]["details"],
        )

    def test_invalid_inventory_status_is_rejected(self):
        invalid_payload = {
            **self.valid_payload,
            "inventory_status": "repairing_somewhere",
        }

        response = self.client.post(
            self.list_url,
            data=invalid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "inventory_status",
            response.data["error"]["details"],
        )

    def test_whitespace_is_removed_from_text_fields(self):
        payload = {
            **self.valid_payload,
            "serial_number": "  SPACE-001  ",
            "company": "  Dell  ",
            "area": "  comp.A-14  ",
        }

        response = self.client.post(
            self.list_url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        laptop = Laptop.objects.get(
            serial_number="SPACE-001",
        )

        self.assertEqual(
            laptop.company,
            "Dell",
        )

        self.assertEqual(
            laptop.area,
            "comp.A-14",
        )

    def test_empty_area_is_rejected(self):
        invalid_payload = {
            **self.valid_payload,
            "area": "     ",
        }

        response = self.client.post(
            self.list_url,
            data=invalid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "area",
            response.data["error"]["details"],
        )

    def test_unknown_laptop_returns_not_found(self):
        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": 999999,
            },
        )

        response = self.client.get(
            detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        
    def test_authenticated_user_can_retrieve_laptop(self):
        laptop = Laptop.objects.create(
            company="Dell",
            display_type="non_touch",
            model_number="5420",
            processor="Intel Core i5",
            processor_generation="8th",
            ram_gb=8,
            storage_gb=256,
            storage_type="ssd",
            serial_number="AUTH-RETRIEVE-001",
            wholesale_price="18500.00",
            retail_price="22500.00",
            qc_status="done",
            inventory_status="in_stock",
            comments="Laptop is okay",
            quantity=1,
            warranty_days=30,
            area="comp.A-1",
        )

        response = self.client.get(
            f"{self.list_url}{laptop.id}/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            laptop.id,
        )


    def test_retrieve_unknown_laptop_returns_404(self):
        response = self.client.get(
            f"{self.list_url}999999/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        
    def test_user_with_change_permission_can_update_laptop(
        self,
    ):
        laptop = self.create_laptop(
            serial_number="CHANGE-PERMISSION-001",
        )

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.patch(
            detail_url,
            {
                "area": "Rack B",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        laptop.refresh_from_db()

        self.assertEqual(
            laptop.area,
            "Rack B",
        )


    def test_update_unknown_laptop_returns_404(
        self,
    ):
        response = self.client.patch(
            f"{self.list_url}999999/",
            {
                "area": "Rack B",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        
    def test_user_without_change_permission_cannot_update_laptop(
        self,
    ):
        laptop = self.create_laptop(
            serial_number="VIEW-ONLY-UPDATE-001",
        )

        user_model = get_user_model()

        viewer_user = user_model.objects.create_user(
            username="viewer-user",
            password="StrongTestPassword123!",
        )

        view_permission = Permission.objects.get(
            codename="view_laptop",
        )

        viewer_user.user_permissions.add(
            view_permission,
        )

        self.client.force_authenticate(
            user=viewer_user,
        )

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.patch(
            detail_url,
            {
                "area": "Unauthorized Rack",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        laptop.refresh_from_db()

        self.assertNotEqual(
            laptop.area,
            "Unauthorized Rack",
        )
        
    def test_user_with_delete_permission_can_delete_laptop(
        self,
    ):
        laptop = self.create_laptop(
            serial_number="DELETE-PERMISSION-001",
        )

        laptop_id = laptop.id

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.delete(
            detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Laptop.objects.filter(
                id=laptop_id,
            ).exists(),
        )
        
    def test_user_without_delete_permission_cannot_delete_laptop(
        self,
    ):
        laptop = self.create_laptop(
            serial_number="VIEW-ONLY-DELETE-001",
        )

        user_model = get_user_model()

        viewer_user = user_model.objects.create_user(
            username="delete-viewer-user",
            password="StrongTestPassword123!",
        )

        view_permission = Permission.objects.get(
            content_type__app_label="inventory",
            codename="view_laptop",
        )

        viewer_user.user_permissions.add(
            view_permission,
        )

        self.client.force_authenticate(
            user=viewer_user,
        )

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.delete(
            detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Laptop.objects.filter(
                pk=laptop.pk,
            ).exists(),
        )
        
    def test_delete_unknown_laptop_returns_404(
        self,
    ):
        response = self.client.delete(
            f"{self.list_url}999999/",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        
    def test_authenticated_user_can_create_in_stock_g_laptop(self):
        payload = {
            "company": "Dell",
            "display_type": "non_touch",
            "model_number": "5420-G",
            "processor": "Intel Core i5",
            "processor_generation": "11th",
            "ram_gb": 8,
            "storage_gb": 256,
            "storage_type": "ssd",
            "serial_number": "STATUS-G-0001",
            "wholesale_price": "18000.00",
            "retail_price": "22000.00",
            "qc_status": "pending",
            "inventory_status": "in_stock_g",
            "comments": "",
            "quantity": 1,
            "warranty_days": 30,
            "area": "Rack G",
        }

        response = self.client.post(
            "/api/v1/laptops/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["inventory_status"],
            "in_stock_g",
        )

        self.assertEqual(
            response.data["inventory_status_label"],
            "In Stock G",
        )
        
    def test_create_rejects_invalid_inventory_status(self):
        payload = {
            "company": "Dell",
            "display_type": "non_touch",
            "model_number": "5420-INVALID-STATUS",
            "processor": "Intel Core i5",
            "processor_generation": "11th",
            "ram_gb": 8,
            "storage_gb": 256,
            "storage_type": "ssd",
            "serial_number": "INVALID-STATUS-0001",
            "wholesale_price": "18000.00",
            "retail_price": "22000.00",
            "qc_status": "pending",
            "inventory_status": "warehouse",
            "comments": "",
            "quantity": 1,
            "warranty_days": 30,
            "area": "Rack A",
        }

        response = self.client.post(
            "/api/v1/laptops/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"],
        )

        self.assertEqual(
            response.data["error"]["code"],
            "validation_error",
        )

        self.assertIn(
            "inventory_status",
            response.data["error"]["details"],
        )

        self.assertEqual(
            response.data["error"]["details"][
                "inventory_status"
            ][0].code,
            "invalid_choice",
        )
    def test_create_laptop_rejects_quantity_greater_than_one(
        self,
    ):
        payload = {
            **self.valid_payload,
            "serial_number": "QTY-GT-ONE-001",
            "quantity": 2,
        }

        response = self.client.post(
            self.list_url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "quantity",
            response.data["error"]["details"],
        )

        self.assertFalse(
            Laptop.objects.filter(
                serial_number="QTY-GT-ONE-001",
            ).exists()
        )


    def test_create_laptop_rejects_zero_quantity(
        self,
    ):
        payload = {
            **self.valid_payload,
            "serial_number": "QTY-ZERO-001",
            "quantity": 0,
        }

        response = self.client.post(
            self.list_url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "quantity",
            response.data["error"]["details"],
        )


    def test_update_laptop_rejects_quantity_greater_than_one(
        self,
    ):
        laptop = self.create_laptop(
            serial_number="QTY-PATCH-001",
        )

        detail_url = reverse(
            "inventory:laptop-detail",
            kwargs={
                "pk": laptop.pk,
            },
        )

        response = self.client.patch(
            detail_url,
            data={
                "quantity": 2,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        laptop.refresh_from_db()

        self.assertEqual(
            laptop.quantity,
            1,
        )
        
    def test_database_rejects_quantity_other_than_one(
        self,
    ):
        with self.assertRaises(
            IntegrityError
        ):
            with transaction.atomic():
                self.create_laptop(
                    serial_number="DB-QTY-INVALID-001",
                    quantity=2,
                )