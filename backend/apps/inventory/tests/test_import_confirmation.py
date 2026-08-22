from decimal import Decimal
from unittest.mock import patch

from django.db import IntegrityError
from django.urls import reverse
from rest_framework import status
from apps.inventory.tests.base import (
    AuthenticatedInventoryAPITestCase,
)

from apps.inventory.models import Laptop


class LaptopImportConfirmationTests(
    AuthenticatedInventoryAPITestCase
):
    def setUp(self):
        self.authenticate_with_inventory_permissions()
        self.confirm_url = reverse(
            "inventory:laptop-import-confirm"
        )

        self.first_row = {
            "row_number": 2,
            "data": {
                "company": "Dell",
                "display_type": (
                    Laptop.DisplayType.NON_TOUCH
                ),
                "display_type_label": "Non-Touch",
                "model_number": "5420",
                "processor": "Intel Core i5",
                "processor_generation": "8th",
                "ram_gb": 8,
                "storage_gb": 256,
                "storage_type": Laptop.StorageType.SSD,
                "storage_type_label": "SSD",
                "serial_number": "CONFIRM-001",
                "wholesale_price": "18500.00",
                "retail_price": "22500.00",
                "qc_status": Laptop.QCStatus.DONE,
                "qc_status_label": "Done",
                "inventory_status": (
                    Laptop.InventoryStatus.IN_STOCK
                ),
                "inventory_status_label": "In Stock",
                "comments": "Laptop is okay",
                "quantity": 1,
                "warranty_days": (
                    Laptop.WarrantyDays.THIRTY_DAYS
                ),
                "warranty_label": "30 Days",
                "area": "comp.A-1",
            },
        }

        self.second_row = {
            "row_number": 3,
            "data": {
                **self.first_row["data"],
                "company": "HP",
                "model_number": "840 G6",
                "serial_number": "CONFIRM-002",
                "wholesale_price": "22000.00",
                "retail_price": "27000.00",
                "qc_status": Laptop.QCStatus.PENDING,
                "qc_status_label": "Pending",
                "inventory_status": (
                    Laptop.InventoryStatus.IN_STOCK_G
                ),
                "inventory_status_label": "In Stock G",
                "warranty_days": (
                    Laptop.WarrantyDays.FIFTEEN_DAYS
                ),
                "warranty_label": "15 Days",
                "area": "service-room-2",
            },
        }

    def create_existing_laptop(
        self,
        serial_number="EXISTING-001",
    ):
        return Laptop.objects.create(
            company="Dell",
            display_type=Laptop.DisplayType.NON_TOUCH,
            model_number="5420",
            processor="Intel Core i5",
            processor_generation="8th",
            ram_gb=8,
            storage_gb=256,
            storage_type=Laptop.StorageType.SSD,
            serial_number=serial_number,
            wholesale_price=Decimal("18500.00"),
            retail_price=Decimal("22500.00"),
            qc_status=Laptop.QCStatus.DONE,
            inventory_status=(
                Laptop.InventoryStatus.IN_STOCK
            ),
            comments="Existing laptop",
            quantity=1,
            warranty_days=(
                Laptop.WarrantyDays.THIRTY_DAYS
            ),
            area="comp.A-1",
        )

    def test_confirm_imports_all_valid_rows(self):
        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    self.first_row,
                    self.second_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Laptop.objects.count(),
            2,
        )

        self.assertEqual(
            response.data["summary"]["imported_rows"],
            2,
        )

        self.assertTrue(
            Laptop.objects.filter(
                serial_number="CONFIRM-001"
            ).exists()
        )

        self.assertTrue(
            Laptop.objects.filter(
                serial_number="CONFIRM-002"
            ).exists()
        )

    def test_empty_rows_list_is_rejected(self):
        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "rows",
            response.data["error"]["details"],
        )
        
        self.assertIn(
            "non_field_errors",
            response.data["error"]["details"]["rows"],
        )

    def test_missing_rows_field_is_rejected(self):
        response = self.client.post(
            self.confirm_url,
            data={},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "rows",
            response.data["error"]["details"],
        )

    def test_invalid_row_causes_zero_inserts(self):
        invalid_second_row = {
            **self.second_row,
            "data": {
                **self.second_row["data"],
                "wholesale_price": "30000.00",
                "retail_price": "27000.00",
            },
        }

        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    self.first_row,
                    invalid_second_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Laptop.objects.count(),
            0,
        )

        self.assertEqual(
            response.data["error"]["details"]["summary"][
                "imported_rows"
            ],
            0,
        )

        self.assertIn(
            "retail_price",
            response.data["error"]["details"][
                "errors"
            ][0]["errors"],
        )

    def test_existing_serial_causes_zero_inserts(self):
        self.create_existing_laptop(
            serial_number="EXISTING-001"
        )

        conflicting_second_row = {
            **self.second_row,
            "data": {
                **self.second_row["data"],
                "serial_number": "existing-001",
            },
        }

        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    self.first_row,
                    conflicting_second_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Laptop.objects.count(),
            1,
        )

        self.assertFalse(
            Laptop.objects.filter(
                serial_number="CONFIRM-001"
            ).exists()
        )

    def test_duplicate_serial_in_request_is_rejected(self):
        duplicate_second_row = {
            **self.second_row,
            "data": {
                **self.second_row["data"],
                "serial_number": "confirm-001",
            },
        }

        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    self.first_row,
                    duplicate_second_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Laptop.objects.count(),
            0,
        )

        serial_errors = response.data[
            "error"
        ]["details"]["errors"][0]["errors"][
            "serial_number"
        ]

        self.assertIn(
            "more than once",
            serial_errors[0],
        )

    def test_confirmation_revalidates_modified_data(self):
        modified_row = {
            **self.first_row,
            "data": {
                **self.first_row["data"],
                "inventory_status": "unknown_status",
            },
        }

        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    modified_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Laptop.objects.count(),
            0,
        )

        self.assertIn(
            "inventory_status",
            response.data["error"]["details"][
                "errors"
            ][0]["errors"],
        )

    def test_read_only_labels_are_not_stored_as_fields(self):
        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    self.first_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        laptop = Laptop.objects.get(
            serial_number="CONFIRM-001"
        )

        self.assertEqual(
            laptop.display_type,
            Laptop.DisplayType.NON_TOUCH,
        )

        self.assertFalse(
            hasattr(laptop, "display_type_label")
        )

    @patch(
        "django.db.models.query.QuerySet.bulk_create"
    )
    def test_database_error_rolls_back_import(
        self,
        mocked_bulk_create,
    ):
        def create_one_then_fail(
            objects,
            batch_size=None,
            **kwargs,
        ):
            first_object = objects[0]

            Laptop.objects.create(
                company=first_object.company,
                display_type=first_object.display_type,
                model_number=first_object.model_number,
                processor=first_object.processor,
                processor_generation=(
                    first_object.processor_generation
                ),
                ram_gb=first_object.ram_gb,
                storage_gb=first_object.storage_gb,
                storage_type=first_object.storage_type,
                serial_number=first_object.serial_number,
                wholesale_price=first_object.wholesale_price,
                retail_price=first_object.retail_price,
                qc_status=first_object.qc_status,
                inventory_status=(
                    first_object.inventory_status
                ),
                comments=first_object.comments,
                quantity=first_object.quantity,
                warranty_days=first_object.warranty_days,
                area=first_object.area,
            )

            raise IntegrityError(
                "Forced database failure"
            )

        mocked_bulk_create.side_effect = (
            create_one_then_fail
        )

        response = self.client.post(
            self.confirm_url,
            data={
                "rows": [
                    self.first_row,
                    self.second_row,
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_409_CONFLICT,
        )

        self.assertEqual(
            Laptop.objects.count(),
            0,
        )

        self.assertEqual(
            response.data["error"]["details"]["summary"][
                "imported_rows"
            ],
            0,
        )
        
        self.assertEqual(
            response.data["error"]["code"],
            "import_conflict",
        )