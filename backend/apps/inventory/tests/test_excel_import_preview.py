from decimal import Decimal
from io import BytesIO

import pandas as pd
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from apps.inventory.tests.base import (
    AuthenticatedInventoryAPITestCase,
)

from apps.inventory.models import Laptop


class LaptopExcelImportPreviewTests(
    AuthenticatedInventoryAPITestCase
):
    def setUp(self):
        self.authenticate_with_inventory_permissions()
        self.preview_url = reverse(
            "inventory:laptop-import-preview"
        )

        self.valid_row = {
            "Company": "Dell",
            "Display Type": "Non-Touch",
            "Model Number": "5420",
            "Processor": "Intel Core i5",
            "Processor Generation": "8th",
            "RAM GB": 8,
            "Storage GB": 256,
            "Storage Type": "SSD",
            "Serial Number": "IMPORT-2551",
            "Wholesale Price": 18500,
            "Retail Price": 22500,
            "QC Status": "Done",
            "Inventory Status": "In Stock",
            "Comments": "Laptop is okay",
            "Quantity": 1,
            "Warranty Days": 30,
            "Area": "comp.A-1",
        }

    def build_excel_file(
        self,
        rows,
        file_name="laptops.xlsx",
    ):
        file_buffer = BytesIO()

        dataframe = pd.DataFrame(rows)

        dataframe.to_excel(
            file_buffer,
            index=False,
            engine="openpyxl",
        )

        file_buffer.seek(0)

        return SimpleUploadedFile(
            name=file_name,
            content=file_buffer.read(),
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )

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

    def test_preview_valid_spreadsheet(self):
        uploaded_file = self.build_excel_file(
            [self.valid_row]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["summary"]["total_rows"],
            1,
        )

        self.assertEqual(
            response.data["summary"]["valid_rows"],
            1,
        )

        self.assertEqual(
            response.data["summary"]["invalid_rows"],
            0,
        )

        preview_data = response.data[
            "valid_data"
        ][0]["data"]

        self.assertEqual(
            preview_data["serial_number"],
            "IMPORT-2551",
        )

        self.assertEqual(
            preview_data["display_type"],
            Laptop.DisplayType.NON_TOUCH,
        )

        self.assertEqual(
            preview_data["display_type_label"],
            "Non-Touch",
        )

        self.assertEqual(
            preview_data["wholesale_price"],
            "18500.00",
        )

    def test_preview_does_not_save_laptops(self):
        uploaded_file = self.build_excel_file(
            [self.valid_row]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            Laptop.objects.count(),
            0,
        )

    def test_missing_file_is_rejected(self):
        response = self.client.post(
            self.preview_url,
            data={},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "file",
            response.data["error"]["details"],
        )
        
    def test_non_xlsx_file_is_rejected(self):
        uploaded_file = SimpleUploadedFile(
            name="laptops.csv",
            content=b"Company,Serial Number\nDell,123",
            content_type="text/csv",
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "file",
            response.data["error"]["details"],
        )

    def test_fake_xlsx_file_is_rejected(self):
        uploaded_file = SimpleUploadedFile(
            name="laptops.xlsx",
            content=b"This is not a real Excel workbook",
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "file",
            response.data["error"]["details"],
        )

    def test_missing_required_column_is_rejected(self):
        row_without_area = {
            key: value
            for key, value in self.valid_row.items()
            if key != "Area"
        }

        uploaded_file = self.build_excel_file(
            [row_without_area]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        
        self.assertIn(
            "file",
            response.data["error"]["details"],
        )

        self.assertIn(
            "Area",
            str(
                response.data["error"]["details"]["file"][0]
            ),
        )

    def test_invalid_rows_are_returned_separately(self):
        invalid_row = {
            **self.valid_row,
            "Serial Number": "INVALID-RAM-001",
            "RAM GB": "eight",
        }

        uploaded_file = self.build_excel_file(
            [
                self.valid_row,
                invalid_row,
            ]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["summary"]["valid_rows"],
            1,
        )

        self.assertEqual(
            response.data["summary"]["invalid_rows"],
            1,
        )

        self.assertIn(
            "ram_gb",
            response.data["errors"][0]["errors"],
        )

    def test_duplicate_serial_in_file_is_rejected(self):
        duplicate_row = {
            **self.valid_row,
            "Company": "HP",
            "Serial Number": "import-2551",
        }

        uploaded_file = self.build_excel_file(
            [
                self.valid_row,
                duplicate_row,
            ]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["summary"]["valid_rows"],
            1,
        )

        self.assertEqual(
            response.data["summary"]["invalid_rows"],
            1,
        )

        serial_errors = response.data[
            "errors"
        ][0]["errors"]["serial_number"]

        self.assertIn(
            "duplicated in the spreadsheet",
            serial_errors[0],
        )

    def test_existing_database_serial_is_rejected(self):
        self.create_existing_laptop(
            serial_number="EXISTING-001"
        )

        import_row = {
            **self.valid_row,
            "Serial Number": "existing-001",
        }

        uploaded_file = self.build_excel_file(
            [import_row]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["summary"]["valid_rows"],
            0,
        )

        self.assertEqual(
            response.data["summary"]["invalid_rows"],
            1,
        )

        self.assertIn(
            "serial_number",
            response.data["errors"][0]["errors"],
        )

    def test_prices_are_validated(self):
        invalid_row = {
            **self.valid_row,
            "Serial Number": "PRICE-001",
            "Wholesale Price": 22500,
            "Retail Price": 18500,
        }

        uploaded_file = self.build_excel_file(
            [invalid_row]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["summary"]["invalid_rows"],
            1,
        )

        self.assertIn(
            "retail_price",
            response.data["errors"][0]["errors"],
        )

    def test_unsupported_choice_is_rejected(self):
        invalid_row = {
            **self.valid_row,
            "Serial Number": "DISPLAY-001",
            "Display Type": "Curved",
        }

        uploaded_file = self.build_excel_file(
            [invalid_row]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "display_type",
            response.data["errors"][0]["errors"],
        )

    def test_extra_columns_are_reported_and_ignored(self):
        row_with_extra_column = {
            **self.valid_row,
            "Supplier Name": "Example Supplier",
        }

        uploaded_file = self.build_excel_file(
            [row_with_extra_column]
        )

        response = self.client.post(
            self.preview_url,
            data={
                "file": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "Supplier Name",
            response.data["ignored_columns"],
        )

        self.assertEqual(
            response.data["summary"]["valid_rows"],
            1,
        )