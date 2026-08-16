from io import BytesIO

from django.utils import timezone

from openpyxl import Workbook
from openpyxl.styles import Font


class DispatchedOrderExcelExportService:
    FILE_NAME = (
        "dispatched-orders.xlsx"
    )

    HEADERS = (
        "Order Number",
        "Employee",
        "Customer",
        "Customer Address",
        "Items",
        "Serial Numbers",
        "Total Items",
        "Total Amount",
        "Price Mode",
        "Via",
        "Created Date",
        "Dispatch Date",
    )

    @classmethod
    def build_workbook(
        cls,
        *,
        queryset,
    ):
        workbook = Workbook()

        worksheet = (
            workbook.active
        )

        worksheet.title = (
            "Dispatched Orders"
        )

        worksheet.freeze_panes = (
            "A2"
        )

        worksheet.append(
            list(
                cls.HEADERS
            )
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

                    order.customer_address,

                    cls._build_items_text(
                        order
                    ),
                    
                    cls._build_serial_numbers(
                        order
                    ),

                    order.total_items,

                    float(
                        order.total_amount
                    ),

                    (
                        order
                        .get_price_mode_display()
                    ),

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

        output.seek(
            0
        )

        return output

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

    @staticmethod
    def _build_items_text(
        order,
    ):
        parts = []

        for item in (
            order.items.all()
        ):
            quantity = (
                item.quantity
            )

            unit_label = (
                "pc"
                if quantity == 1
                else "pcs"
            )

            parts.append(
                (
                    f"{item.item_name} - "
                    f"{quantity} "
                    f"{unit_label}"
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
    def _excel_datetime(
        value,
    ):
        if (
            value is None
        ):
            return None

        if (
            timezone.is_aware(
                value
            )
        ):
            value = (
                timezone.localtime(
                    value
                )
            )

            value = (
                value.replace(
                    tzinfo=None
                )
            )

        return value

    @staticmethod
    def _set_column_widths(
        worksheet,
    ):
        widths = {
            "A": 28,
            "B": 22,
            "C": 24,
            "D": 36,
            "E": 60,
            "F": 32,
            "G": 14,
            "H": 18,
            "I": 18,
            "J": 22,
            "K": 22,
            "L": 22,
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
            row[7].number_format = (
                "#,##0.00"
            )

            if row[10].value:
                row[10].number_format = (
                    "yyyy-mm-dd hh:mm"
                )

            if row[11].value:
                row[11].number_format = (
                    "yyyy-mm-dd hh:mm"
                )
                
    @staticmethod
    def _build_serial_numbers(
        order,
    ):
        serial_numbers = [
            item.serial_number_snapshot
            for item
            in order.items.all()
            if (
                not item.is_custom_item
                and item.serial_number_snapshot
            )
        ]

        if not serial_numbers:
            return ""

        return ", ".join(
            serial_numbers
        )