import re
from decimal import Decimal, InvalidOperation
from zipfile import BadZipFile

import pandas as pd
from openpyxl.utils.exceptions import InvalidFileException

from apps.inventory.models import Laptop
from apps.inventory.serializers import LaptopSerializer


class ExcelImportError(Exception):
    """
    Raised when the workbook itself cannot be previewed.
    """


class RowNormalizationError(Exception):
    """
    Raised when one spreadsheet cell cannot be normalized.
    """

    def __init__(self, field_name, message):
        self.field_name = field_name
        self.message = message
        super().__init__(message)


class LaptopExcelImportPreviewService:
    MAX_ROWS = 5000

    COLUMN_MAP = {
        "company": "company",
        "displaytype": "display_type",
        "modelnumber": "model_number",
        "processor": "processor",
        "processorgeneration": "processor_generation",
        "ramgb": "ram_gb",
        "storagegb": "storage_gb",
        "storagetype": "storage_type",
        "serialnumber": "serial_number",
        "wholesaleprice": "wholesale_price",
        "retailprice": "retail_price",
        "qcstatus": "qc_status",
        "inventorystatus": "inventory_status",
        "comments": "comments",
        "quantity": "quantity",
        "warrantydays": "warranty_days",
        "area": "area",
    }

    EXPECTED_FIELDS = tuple(COLUMN_MAP.values())

    DISPLAY_TYPE_MAP = {
        "touch": Laptop.DisplayType.TOUCH,
        "touchscreen": Laptop.DisplayType.TOUCH,
        "non touch": Laptop.DisplayType.NON_TOUCH,
        "nontouch": Laptop.DisplayType.NON_TOUCH,
        "non touchscreen": Laptop.DisplayType.NON_TOUCH,
    }

    STORAGE_TYPE_MAP = {
        "ssd": Laptop.StorageType.SSD,
        "hdd": Laptop.StorageType.HDD,
    }

    QC_STATUS_MAP = {
        "done": Laptop.QCStatus.DONE,
        "completed": Laptop.QCStatus.DONE,
        "pending": Laptop.QCStatus.PENDING,
    }

    INVENTORY_STATUS_MAP = {
        "in stock": Laptop.InventoryStatus.IN_STOCK,
        "instock": Laptop.InventoryStatus.IN_STOCK,
        "stock": Laptop.InventoryStatus.IN_STOCK,
        "available": Laptop.InventoryStatus.IN_STOCK,
        "in stock g": Laptop.InventoryStatus.IN_STOCK_G,
        "in_stock_g": Laptop.InventoryStatus.IN_STOCK_G,
    }

    WARRANTY_MAP = {
        "no": 0,
        "none": 0,
        "no warranty": 0,
        "0": 0,
        "0 day": 0,
        "0 days": 0,
        "7": 7,
        "7 day": 7,
        "7 days": 7,
        "15": 15,
        "15 day": 15,
        "15 days": 15,
        "30": 30,
        "30 day": 30,
        "30 days": 30,
    }

    def preview(self, uploaded_file):
        dataframe = self._read_workbook(uploaded_file)

        original_columns = [
            str(column).strip()
            for column in dataframe.columns
        ]

        column_mapping, ignored_columns = (
            self._build_column_mapping(original_columns)
        )

        missing_fields = [
            field_name
            for field_name in self.EXPECTED_FIELDS
            if field_name not in column_mapping.values()
        ]

        if missing_fields:
            missing_headers = [
                self._field_to_header(field_name)
                for field_name in missing_fields
            ]

            raise ExcelImportError(
                "The spreadsheet is missing required columns: "
                + ", ".join(missing_headers)
                + "."
            )

        dataframe = dataframe.rename(
            columns=column_mapping,
        )

        dataframe = dataframe[
            list(self.EXPECTED_FIELDS)
        ]

        dataframe = dataframe.dropna(
            how="all",
        )

        total_rows = len(dataframe.index)

        if total_rows == 0:
            raise ExcelImportError(
                "The spreadsheet does not contain any laptop rows."
            )

        if total_rows > self.MAX_ROWS:
            raise ExcelImportError(
                "The spreadsheet contains more than "
                f"{self.MAX_ROWS} data rows."
            )

        valid_rows = []
        invalid_rows = []
        seen_serial_numbers = {}

        for row_offset, (_, row) in enumerate(
            dataframe.iterrows(),
            start=2,
        ):
            excel_row_number = row_offset

            normalized_data, normalization_errors = (
                self._normalize_row(row)
            )

            serial_number = normalized_data.get(
                "serial_number",
                "",
            )

            duplicate_error = self._check_file_duplicate(
                serial_number=serial_number,
                row_number=excel_row_number,
                seen_serial_numbers=seen_serial_numbers,
            )

            if duplicate_error:
                normalization_errors.setdefault(
                    "serial_number",
                    [],
                ).append(duplicate_error)

            if normalization_errors:
                invalid_rows.append(
                    {
                        "row_number": excel_row_number,
                        "serial_number": serial_number,
                        "errors": normalization_errors,
                    }
                )
                continue

            serializer = LaptopSerializer(
                data=normalized_data,
            )

            if not serializer.is_valid():
                invalid_rows.append(
                    {
                        "row_number": excel_row_number,
                        "serial_number": serial_number,
                        "errors": self._format_serializer_errors(
                            serializer.errors
                        ),
                    }
                )
                continue

            valid_rows.append(
                {
                    "row_number": excel_row_number,
                    "data": self._build_preview_data(
                        serializer.validated_data
                    ),
                }
            )

        return {
            "file_name": uploaded_file.name,
            "sheet_name": str(dataframe.attrs.get(
                "sheet_name",
                "Sheet1",
            )),
            "summary": {
                "total_rows": total_rows,
                "valid_rows": len(valid_rows),
                "invalid_rows": len(invalid_rows),
            },
            "ignored_columns": ignored_columns,
            "valid_data": valid_rows,
            "errors": invalid_rows,
        }

    def _read_workbook(self, uploaded_file):
        try:
            uploaded_file.seek(0)

            excel_file = pd.ExcelFile(
                uploaded_file,
                engine="openpyxl",
            )

            if not excel_file.sheet_names:
                raise ExcelImportError(
                    "The workbook does not contain any worksheets."
                )

            first_sheet_name = excel_file.sheet_names[0]

            dataframe = pd.read_excel(
                excel_file,
                sheet_name=first_sheet_name,
                dtype=object,
            )

            dataframe.attrs["sheet_name"] = first_sheet_name

            return dataframe

        except ExcelImportError:
            raise

        except (
            ValueError,
            TypeError,
            BadZipFile,
            InvalidFileException,
            OSError,
        ) as error:
            raise ExcelImportError(
                "The uploaded file could not be read as a valid "
                ".xlsx workbook."
            ) from error

    def _build_column_mapping(self, original_columns):
        column_mapping = {}
        ignored_columns = []
        mapped_fields = set()

        for original_column in original_columns:
            normalized_header = self._normalize_header(
                original_column
            )

            field_name = self.COLUMN_MAP.get(
                normalized_header
            )

            if field_name is None:
                ignored_columns.append(original_column)
                continue

            if field_name in mapped_fields:
                raise ExcelImportError(
                    "Multiple spreadsheet columns resolve to "
                    f"'{self._field_to_header(field_name)}'."
                )

            column_mapping[original_column] = field_name
            mapped_fields.add(field_name)

        return column_mapping, ignored_columns

    def _normalize_row(self, row):
        normalized_data = {}
        errors = {}

        field_normalizers = {
            "company": self._required_text,
            "display_type": self._normalize_display_type,
            "model_number": self._required_identifier,
            "processor": self._required_text,
            "processor_generation": self._optional_text,
            "ram_gb": self._positive_integer,
            "storage_gb": self._positive_integer,
            "storage_type": self._normalize_storage_type,
            "serial_number": self._required_identifier,
            "wholesale_price": self._non_negative_decimal,
            "retail_price": self._non_negative_decimal,
            "qc_status": self._normalize_qc_status,
            "inventory_status": (
                self._normalize_inventory_status
            ),
            "comments": self._optional_text,
            "quantity": self._positive_integer,
            "warranty_days": self._normalize_warranty,
            "area": self._required_text,
        }

        for field_name, normalizer in field_normalizers.items():
            try:
                normalized_data[field_name] = normalizer(
                    row[field_name],
                    field_name,
                )

            except RowNormalizationError as error:
                errors.setdefault(
                    error.field_name,
                    [],
                ).append(error.message)

        return normalized_data, errors

    def _check_file_duplicate(
        self,
        serial_number,
        row_number,
        seen_serial_numbers,
    ):
        if not serial_number:
            return None

        serial_key = serial_number.casefold()

        first_row_number = seen_serial_numbers.get(
            serial_key
        )

        if first_row_number is not None:
            return (
                "This serial number is duplicated in the "
                f"spreadsheet. It first appeared on row "
                f"{first_row_number}."
            )

        seen_serial_numbers[serial_key] = row_number
        return None

    @staticmethod
    def _normalize_header(value):
        return re.sub(
            r"[^a-z0-9]+",
            "",
            str(value).strip().lower(),
        )

    @staticmethod
    def _field_to_header(field_name):
        return field_name.replace(
            "_",
            " ",
        ).title()

    def _required_text(self, value, field_name):
        if self._is_missing(value):
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        cleaned_value = str(value).strip()

        if not cleaned_value:
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        return cleaned_value

    def _optional_text(self, value, field_name):
        if self._is_missing(value):
            return ""

        return str(value).strip()

    def _required_identifier(self, value, field_name):
        if self._is_missing(value):
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        if isinstance(value, float) and value.is_integer():
            return str(int(value))

        if isinstance(value, int):
            return str(value)

        cleaned_value = str(value).strip()

        if not cleaned_value:
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        return cleaned_value

    def _positive_integer(self, value, field_name):
        integer_value = self._to_integer(
            value=value,
            field_name=field_name,
        )

        if integer_value < 1:
            raise RowNormalizationError(
                field_name,
                "Value must be at least 1.",
            )

        if (
            field_name == "quantity"
            and integer_value != 1
        ):
            raise RowNormalizationError(
                field_name,
                (
                    "Each laptop must be one physical device "
                    "with one unique serial number. "
                    "Quantity must be 1."
                ),
            )

        return integer_value

    def _to_integer(self, value, field_name):
        if self._is_missing(value):
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        try:
            decimal_value = Decimal(
                str(value).strip()
            )

        except (
            InvalidOperation,
            ValueError,
            TypeError,
        ) as error:
            raise RowNormalizationError(
                field_name,
                "Enter a valid whole number.",
            ) from error

        if decimal_value != decimal_value.to_integral_value():
            raise RowNormalizationError(
                field_name,
                "Enter a whole number without decimals.",
            )

        return int(decimal_value)

    def _non_negative_decimal(self, value, field_name):
        if self._is_missing(value):
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        cleaned_value = str(value).strip().replace(
            ",",
            "",
        )

        try:
            decimal_value = Decimal(cleaned_value)

        except (
            InvalidOperation,
            ValueError,
            TypeError,
        ) as error:
            raise RowNormalizationError(
                field_name,
                "Enter a valid price.",
            ) from error

        if decimal_value < Decimal("0"):
            raise RowNormalizationError(
                field_name,
                "Price cannot be negative.",
            )

        return decimal_value

    def _normalize_display_type(self, value, field_name):
        return self._normalize_choice(
            value=value,
            field_name=field_name,
            choices=self.DISPLAY_TYPE_MAP,
            expected_values="Touch or Non-Touch",
        )

    def _normalize_storage_type(self, value, field_name):
        return self._normalize_choice(
            value=value,
            field_name=field_name,
            choices=self.STORAGE_TYPE_MAP,
            expected_values="SSD or HDD",
        )

    def _normalize_qc_status(self, value, field_name):
        return self._normalize_choice(
            value=value,
            field_name=field_name,
            choices=self.QC_STATUS_MAP,
            expected_values="Done or Pending",
        )

    def _normalize_inventory_status(
        self,
        value,
        field_name,
    ):
        return self._normalize_choice(
            value=value,
            field_name=field_name,
            choices=self.INVENTORY_STATUS_MAP,
            expected_values="In Stock or In Stock G",
        )

    def _normalize_warranty(self, value, field_name):
        if self._is_missing(value):
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        if isinstance(value, float) and value.is_integer():
            normalized_value = str(int(value))
        else:
            normalized_value = str(value).strip().lower()

        warranty_days = self.WARRANTY_MAP.get(
            normalized_value
        )

        if warranty_days is None:
            raise RowNormalizationError(
                field_name,
                "Warranty must be No, 0, 7, 15 or 30 days.",
            )

        return warranty_days

    def _normalize_choice(
        self,
        value,
        field_name,
        choices,
        expected_values,
    ):
        if self._is_missing(value):
            raise RowNormalizationError(
                field_name,
                "This field is required.",
            )

        normalized_value = self._normalize_choice_text(
            value
        )

        choice_value = choices.get(normalized_value)

        if choice_value is None:
            raise RowNormalizationError(
                field_name,
                f"Expected {expected_values}.",
            )

        return choice_value

    @staticmethod
    def _normalize_choice_text(value):
        cleaned_value = str(value).strip().lower()

        cleaned_value = re.sub(
            r"[_\-]+",
            " ",
            cleaned_value,
        )

        cleaned_value = re.sub(
            r"\s+",
            " ",
            cleaned_value,
        )

        return cleaned_value

    @staticmethod
    def _is_missing(value):
        if value is None:
            return True

        try:
            return bool(pd.isna(value))
        except (
            TypeError,
            ValueError,
        ):
            return False

    @staticmethod
    def _format_serializer_errors(serializer_errors):
        formatted_errors = {}

        for field_name, messages in serializer_errors.items():
            formatted_errors[field_name] = [
                str(message)
                for message in messages
            ]

        return formatted_errors

    @staticmethod
    def _build_preview_data(validated_data):
        preview_data = {
            "company": validated_data["company"],
            "display_type": validated_data["display_type"],
            "display_type_label": Laptop.DisplayType(
                validated_data["display_type"]
            ).label,
            "model_number": validated_data["model_number"],
            "processor": validated_data["processor"],
            "processor_generation": validated_data[
                "processor_generation"
            ],
            "ram_gb": validated_data["ram_gb"],
            "storage_gb": validated_data["storage_gb"],
            "storage_type": validated_data["storage_type"],
            "storage_type_label": Laptop.StorageType(
                validated_data["storage_type"]
            ).label,
            "serial_number": validated_data["serial_number"],
            "wholesale_price": format(
                validated_data["wholesale_price"],
                ".2f",
            ),
            "retail_price": format(
                validated_data["retail_price"],
                ".2f",
            ),
            "qc_status": validated_data["qc_status"],
            "qc_status_label": Laptop.QCStatus(
                validated_data["qc_status"]
            ).label,
            "inventory_status": validated_data[
                "inventory_status"
            ],
            "inventory_status_label": (
                Laptop.InventoryStatus(
                    validated_data["inventory_status"]
                ).label
            ),
            "comments": validated_data["comments"],
            "quantity": validated_data["quantity"],
            "warranty_days": validated_data[
                "warranty_days"
            ],
            "warranty_label": Laptop.WarrantyDays(
                validated_data["warranty_days"]
            ).label,
            "area": validated_data["area"],
        }

        return preview_data