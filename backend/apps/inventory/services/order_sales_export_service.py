from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font

from apps.inventory.services.order_sales_service import (
    OrderSalesService,
)
from django.utils import timezone

class OrderSalesExcelExportService:
    FILE_NAME = "total-sales.xlsx"

    HEADERS = (
        "Order Number",
        "Employee",
        "Customer",
        "Items",
        "Total Items",
        "Total Amount",
        "Price Mode",
        "Via",
        "Sale Date",
        "Dispatch Date",
    )

    @classmethod
    def build_workbook(
        cls,
        *,
        queryset,
    ):
        workbook = Workbook()

        worksheet = workbook.active
        worksheet.title = (
            "Total Sales"
        )

        worksheet.freeze_panes = "A2"

        worksheet.append(
            list(cls.HEADERS)
        )

        for cell in worksheet[1]:
            cell.font = Font(
                bold=True
            )

        for order in queryset:
            worksheet.append(
                [
                    order.order_number,
                    cls._get_employee_name(
                        order
                    ),
                    order.customer_name,
                    cls._build_items_text(
                        order
                    ),
                    order.total_items,
                    float(
                        order.total_amount
                    ),
                    order.get_price_mode_display(),
                    cls._get_via_label(
                        order
                    ),
                    cls._excel_datetime(
                        order.created_at
                    ),
                    cls._excel_datetime(
                        order.dispatched_at
                    ),
                ]
            )

        worksheet.auto_filter.ref = (
            worksheet.dimensions
        )

        cls._set_column_widths(
            worksheet
        )

        cls._set_number_formats(
            worksheet
        )

        output = BytesIO()

        workbook.save(
            output
        )

        output.seek(0)

        return output

    @staticmethod
    def _build_items_text(
        order,
    ):
        parts = []

        for item in order.items.all():
            parts.append(
                (
                    f"{item.item_name} - "
                    f"{item.quantity} pcs"
                )
            )

        return ", ".join(
            parts
        )

    @staticmethod
    def _get_via_label(
        order,
    ):
        if (
            order.via
            == order.Via.OTHER
            and order.via_other
        ):
            return (
                order.via_other
            )

        return (
            order.get_via_display()
        )

    @staticmethod
    def _set_column_widths(
        worksheet,
    ):
        widths = {
            "A": 20,
            "B": 24,
            "C": 60,
            "D": 14,
            "E": 18,
            "F": 18,
            "G": 22,
            "H": 22,
            "I": 22,
        }

        for (
            column,
            width,
        ) in widths.items():
            worksheet.column_dimensions[
                column
            ].width = width

    @staticmethod
    def _set_number_formats(
        worksheet,
    ):
        for row in worksheet.iter_rows(
            min_row=2
        ):
            row[5].number_format = (
                '#,##0.00'
            )

            if row[8].value:
                row[8].number_format = (
                    "yyyy-mm-dd hh:mm"
                )

            if row[9].value:
                row[9].number_format = (
                    "yyyy-mm-dd hh:mm"
                )
                
    @staticmethod
    def _excel_datetime(value):
        if value is None:
            return None

        if timezone.is_aware(value):
            value = timezone.localtime(value)
            value = value.replace(tzinfo=None)

        return value
    
    @staticmethod
    def _get_employee_name(
        order,
    ):
        full_name = (
            order.employee
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or order.employee.username
        )
