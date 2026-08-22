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

from apps.inventory.models import (
    Return,
)


class ReturnExcelExportService:
    FILE_NAME = (
        "returns.xlsx"
    )

    HEADERS = (
        "Customer Name",
        "Customer Address",
        "Company",
        "Display Type",
        "Model Number",
        "Processor",
        "Processor Generation",
        "RAM GB",
        "Storage GB",
        "Storage Type",
        "Serial Number",
        "Technician",
        "Issue",
        "Priority",
        "Status",
        "Service Rack",
        "Repair Notes",
        "Created By",
        "Received Date",
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
            "Return Import"
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
            worksheet.append(
                [
                    return_record
                    .customer_name,

                    return_record
                    .customer_address,

                    return_record
                    .company,

                    return_record
                    .get_display_type_display(),

                    return_record
                    .model_number,

                    return_record
                    .processor,

                    return_record
                    .processor_generation,

                    return_record
                    .ram_gb,

                    return_record
                    .storage_gb,

                    return_record
                    .get_storage_type_display(),

                    return_record
                    .serial_number,

                    cls._user_name(
                        return_record
                        .technician
                    ),

                    return_record
                    .issue,

                    return_record
                    .get_priority_display(),

                    return_record
                    .get_status_display(),

                    return_record
                    .service_rack,

                    return_record
                    .repair_notes,

                    cls._user_name(
                        return_record
                        .created_by
                    ),

                    cls._excel_datetime(
                        return_record
                        .created_at
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
            if row[18].value:
                row[
                    18
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
            "B": 40,
            "C": 18,
            "D": 16,
            "E": 22,
            "F": 22,
            "G": 20,
            "H": 12,
            "I": 12,
            "J": 14,
            "K": 22,
            "L": 22,
            "M": 45,
            "N": 14,
            "O": 22,
            "P": 18,
            "Q": 45,
            "R": 22,
            "S": 22,
        }

        for (
            column,
            width,
        ) in widths.items():
            worksheet.column_dimensions[
                column
            ].width = width