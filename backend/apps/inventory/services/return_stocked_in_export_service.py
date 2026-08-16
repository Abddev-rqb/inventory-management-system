from io import BytesIO

from django.utils import (
    timezone,
)

from openpyxl import (
    Workbook,
)

from openpyxl.styles import (
    Font,
)


class ReturnStockedInExcelExportService:
    FILE_NAME = (
        "stocked-in-returns.xlsx"
    )

    HEADERS = (
        "Customer Name",
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
        "Warranty Days",
        "Area",
        "Stocked In By",
        "Stocked In Date",
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
            "Stocked In"
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

        for return_record in queryset:
            laptop = (
                return_record
                .stocked_in_laptop
            )

            if laptop is None:
                continue

            worksheet.append(
                [
                    return_record
                    .customer_name,

                    laptop.company,

                    laptop
                    .get_display_type_display(),

                    laptop.model_number,

                    laptop.processor,

                    laptop
                    .processor_generation,

                    laptop.ram_gb,

                    laptop.storage_gb,

                    laptop
                    .get_storage_type_display(),

                    laptop.serial_number,

                    laptop.wholesale_price,

                    laptop.retail_price,

                    laptop
                    .get_qc_status_display(),

                    laptop
                    .get_inventory_status_display(),

                    laptop.warranty_days,

                    laptop.area,

                    cls._user_name(
                        return_record
                        .stocked_in_by
                    ),

                    cls._excel_datetime(
                        return_record
                        .stocked_in_at
                    ),
                ]
            )

        worksheet.auto_filter.ref = (
            worksheet.dimensions
        )

        cls._set_widths(
            worksheet
        )

        for row in (
            worksheet.iter_rows(
                min_row=2
            )
        ):
            row[
                10
            ].number_format = (
                '#,##0.00'
            )

            row[
                11
            ].number_format = (
                '#,##0.00'
            )

            if row[17].value:
                row[
                    17
                ].number_format = (
                    "yyyy-mm-dd hh:mm"
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
    def _user_name(
        user,
    ):
        if user is None:
            return ""

        full_name = (
            user
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or user.username
        )

    @staticmethod
    def _excel_datetime(
        value,
    ):
        if value is None:
            return None

        if timezone.is_aware(
            value
        ):
            value = (
                timezone.localtime(
                    value
                )
                .replace(
                    tzinfo=None
                )
            )

        return value

    @staticmethod
    def _set_widths(
        worksheet,
    ):
        widths = {
            "A": 24,
            "B": 18,
            "C": 16,
            "D": 22,
            "E": 22,
            "F": 20,
            "G": 12,
            "H": 12,
            "I": 14,
            "J": 22,
            "K": 18,
            "L": 18,
            "M": 16,
            "N": 18,
            "O": 16,
            "P": 18,
            "Q": 22,
            "R": 22,
        }

        for (
            column,
            width,
        ) in widths.items():
            worksheet.column_dimensions[
                column
            ].width = width