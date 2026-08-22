from decimal import Decimal
from io import BytesIO

from django.urls import reverse
from openpyxl import load_workbook
from rest_framework import status
from apps.inventory.tests.base import (
    AuthenticatedInventoryAPITestCase,
)

from apps.inventory.models import Laptop


class LaptopExcelExportTests(
    AuthenticatedInventoryAPITestCase
):
    def setUp(self):
        self.authenticate_with_inventory_permissions()
        self.export_url = reverse(
            "inventory:laptop-export"
        )

    def create_laptop(
        self,
        serial_number="EXPORT-001",
        company="Dell",
        inventory_status=(
            Laptop.InventoryStatus.IN_STOCK
        ),
        comments="Laptop is okay",
    ):
        return Laptop.objects.create(
            company=company,
            display_type=(
                Laptop.DisplayType.NON_TOUCH
            ),
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
            inventory_status=inventory_status,
            comments=comments,
            quantity=1,
            warranty_days=(
                Laptop.WarrantyDays.THIRTY_DAYS
            ),
            area="comp.A-1",
        )

    @staticmethod
    def response_content(response):
        return b"".join(
            response.streaming_content
        )

    def workbook_from_response(self, response):
        file_content = self.response_content(
            response
        )

        return load_workbook(
            filename=BytesIO(file_content),
            data_only=False,
        )

    def test_export_returns_xlsx_download(self):
        self.create_laptop()

        response = self.client.get(
            self.export_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response["Content-Type"],
            (
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )

        self.assertIn(
            "attachment;",
            response["Content-Disposition"],
        )

        self.assertIn(
            ".xlsx",
            response["Content-Disposition"],
        )

        self.assertEqual(
            response["X-Exported-Rows"],
            "1",
        )

    def test_export_contains_expected_headers(self):
        self.create_laptop()

        response = self.client.get(
            self.export_url
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        headers = [
            cell.value
            for cell in worksheet[1]
        ]

        expected_headers = [
            "ID",
            "Company",
            "Display Type",
            "Model Number",
            "Processor",
            "Processor Generation",
            "RAM GB",
            "Storage GB",
            "Storage Type",
            "Serial Number",
            "Wholesale Price",
            "Retail Price",
            "QC Status",
            "Inventory Status",
            "Comments",
            "Quantity",
            "Warranty Days",
            "Area",
            "Created At",
            "Updated At",
        ]

        self.assertEqual(
            headers,
            expected_headers,
        )

        self.assertNotIn(
            "Actions",
            headers,
        )

    def test_export_contains_laptop_values(self):
        laptop = self.create_laptop()

        response = self.client.get(
            self.export_url
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        header_positions = {
            cell.value: cell.column
            for cell in worksheet[1]
        }

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions["ID"],
            ).value,
            laptop.id,
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions["Company"],
            ).value,
            "Dell",
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions[
                    "Display Type"
                ],
            ).value,
            "Non-Touch",
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions[
                    "Serial Number"
                ],
            ).value,
            "EXPORT-001",
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions[
                    "Wholesale Price"
                ],
            ).value,
            18500,
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions[
                    "Retail Price"
                ],
            ).value,
            22500,
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions[
                    "Inventory Status"
                ],
            ).value,
            "In Stock",
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions["Area"],
            ).value,
            "comp.A-1",
        )

    def test_export_contains_multiple_laptops(self):
        self.create_laptop(
            serial_number="EXPORT-001",
            company="Dell",
        )

        self.create_laptop(
            serial_number="EXPORT-002",
            company="HP",
            inventory_status=(
                Laptop.InventoryStatus.IN_SERVICE
            ),
        )

        response = self.client.get(
            self.export_url
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        self.assertEqual(
            worksheet.max_row,
            2,
        )

        self.assertEqual(
            response["X-Exported-Rows"],
            "1",
        )

    def test_empty_database_exports_header_only(self):
        response = self.client.get(
            self.export_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        self.assertEqual(
            worksheet.max_row,
            1,
        )

        self.assertEqual(
            worksheet.max_column,
            20,
        )

        self.assertEqual(
            response["X-Exported-Rows"],
            "0",
        )

    def test_export_freezes_header_and_adds_filter(self):
        self.create_laptop()

        response = self.client.get(
            self.export_url
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        self.assertEqual(
            worksheet.freeze_panes,
            "A2",
        )

        self.assertIsNotNone(
            worksheet.auto_filter.ref
        )

        self.assertEqual(
            worksheet.auto_filter.ref,
            worksheet.dimensions,
        )

    def test_prices_have_numeric_format(self):
        self.create_laptop()

        response = self.client.get(
            self.export_url
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        header_positions = {
            cell.value: cell.column
            for cell in worksheet[1]
        }

        wholesale_cell = worksheet.cell(
            row=2,
            column=header_positions[
                "Wholesale Price"
            ],
        )

        retail_cell = worksheet.cell(
            row=2,
            column=header_positions[
                "Retail Price"
            ],
        )

        self.assertEqual(
            wholesale_cell.number_format,
            "#,##0.00",
        )

        self.assertEqual(
            retail_cell.number_format,
            "#,##0.00",
        )

    def test_formula_like_text_is_escaped(self):
        self.create_laptop(
            comments=(
                '=HYPERLINK("https://example.com", "Open")'
            ),
        )

        response = self.client.get(
            self.export_url
        )

        workbook = self.workbook_from_response(
            response
        )

        worksheet = workbook["Laptops"]

        header_positions = {
            cell.value: cell.column
            for cell in worksheet[1]
        }

        exported_comment = worksheet.cell(
            row=2,
            column=header_positions["Comments"],
        ).value

        self.assertTrue(
            exported_comment.startswith("'=")
        )

        self.assertEqual(
            worksheet.cell(
                row=2,
                column=header_positions["Comments"],
            ).data_type,
            "s",
        )