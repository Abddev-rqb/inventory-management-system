import re
from decimal import Decimal, InvalidOperation
from zipfile import BadZipFile

import pandas as pd
from django.db import transaction
from openpyxl.utils.exceptions import InvalidFileException

from apps.inventory.models import Laptop
from apps.inventory.serializers import LaptopSerializer


class LaptopBulkUpdateError(Exception):
    pass


class LaptopBulkUpdatePreviewService:
    MAX_ROWS = 5000

    COLUMN_MAP = {
        "serialnumber": "serial_number",
        "company": "company",
        "displaytype": "display_type",
        "modelnumber": "model_number",
        "processor": "processor",
        "processorgeneration": "processor_generation",
        "ramgb": "ram_gb",
        "storagegb": "storage_gb",
        "storagetype": "storage_type",
        "wholesaleprice": "wholesale_price",
        "retailprice": "retail_price",
        "qcstatus": "qc_status",
        "inventorystatus": "inventory_status",
        "comments": "comments",
        "warrantydays": "warranty_days",
        "area": "area",
    }

    UPDATABLE_FIELDS = {
        "company",
        "display_type",
        "model_number",
        "processor",
        "processor_generation",
        "ram_gb",
        "storage_gb",
        "storage_type",
        "wholesale_price",
        "retail_price",
        "qc_status",
        "inventory_status",
        "comments",
        "warranty_days",
        "area",
    }

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
        original_columns = [str(column).strip() for column in dataframe.columns]

        column_mapping = {}
        ignored_columns = []
        mapped_fields = set()

        for original_column in original_columns:
            normalized_header = self._normalize_header(original_column)
            field_name = self.COLUMN_MAP.get(normalized_header)

            if field_name is None:
                ignored_columns.append(original_column)
                continue

            if field_name in mapped_fields:
                raise LaptopBulkUpdateError(
                    "Multiple spreadsheet columns resolve to "
                    f"'{self._field_to_header(field_name)}'."
                )

            column_mapping[original_column] = field_name
            mapped_fields.add(field_name)

        if "serial_number" not in mapped_fields:
            raise LaptopBulkUpdateError(
                "The spreadsheet must contain a Serial Number column."
            )

        if not (mapped_fields & self.UPDATABLE_FIELDS):
            raise LaptopBulkUpdateError(
                "The spreadsheet must contain at least one field to update."
            )

        dataframe = dataframe.rename(columns=column_mapping)
        useful_fields = [
            field_name
            for field_name in self.COLUMN_MAP.values()
            if field_name in mapped_fields
        ]
        dataframe = dataframe[useful_fields].dropna(how="all")

        total_rows = len(dataframe.index)
        if total_rows == 0:
            raise LaptopBulkUpdateError(
                "The spreadsheet does not contain any laptop rows."
            )
        if total_rows > self.MAX_ROWS:
            raise LaptopBulkUpdateError(
                f"The spreadsheet contains more than {self.MAX_ROWS} data rows."
            )

        valid_rows = []
        invalid_rows = []
        seen_serials = {}

        for row_number, (_, row) in enumerate(dataframe.iterrows(), start=2):
            serial_number = self._identifier(row.get("serial_number"))
            errors = {}

            if not serial_number:
                errors.setdefault("serial_number", []).append(
                    "Serial number is required."
                )
            else:
                key = serial_number.casefold()
                first_row = seen_serials.get(key)
                if first_row is not None:
                    errors.setdefault("serial_number", []).append(
                        "This serial number is duplicated in the spreadsheet. "
                        f"It first appeared on row {first_row}."
                    )
                else:
                    seen_serials[key] = row_number

            laptop = None
            if serial_number and not errors:
                laptop = Laptop.objects.filter(
                    serial_number__iexact=serial_number
                ).first()
                if laptop is None:
                    errors.setdefault("serial_number", []).append(
                        "No existing laptop matches this serial number."
                    )
                elif laptop.inventory_status == Laptop.InventoryStatus.IN_SERVICE:
                    errors.setdefault("inventory_status", []).append(
                        "Laptops currently in service cannot be bulk updated. "
                        "Complete the service workflow first."
                    )
                elif laptop.inventory_status == Laptop.InventoryStatus.SOLD:
                    errors.setdefault("inventory_status", []).append(
                        "Sold laptops cannot be bulk updated."
                    )

            updates = {}
            if laptop is not None and not errors:
                for field_name in self.UPDATABLE_FIELDS:
                    if field_name not in dataframe.columns:
                        continue
                    raw_value = row.get(field_name)
                    if self._is_missing(raw_value):
                        continue
                    try:
                        updates[field_name] = self._normalize_value(
                            field_name,
                            raw_value,
                        )
                    except LaptopBulkUpdateError as exc:
                        errors.setdefault(field_name, []).append(str(exc))

                if not updates and not errors:
                    errors.setdefault("row", []).append(
                        "This row does not contain any values to update."
                    )

            if laptop is not None and updates and not errors:
                serializer = LaptopSerializer(
                    laptop,
                    data=updates,
                    partial=True,
                )
                if not serializer.is_valid():
                    for field_name, messages in serializer.errors.items():
                        errors.setdefault(field_name, []).extend(
                            str(message) for message in messages
                        )

            if errors:
                invalid_rows.append(
                    {
                        "row_number": row_number,
                        "serial_number": serial_number,
                        "errors": errors,
                    }
                )
                continue

            changes = []
            for field_name, after_value in updates.items():
                before_value = getattr(laptop, field_name)
                if before_value == after_value:
                    continue
                changes.append(
                    {
                        "field": field_name,
                        "label": self._field_to_header(field_name),
                        "before": self._display_value(field_name, before_value),
                        "after": self._display_value(field_name, after_value),
                    }
                )

            if not changes:
                invalid_rows.append(
                    {
                        "row_number": row_number,
                        "serial_number": serial_number,
                        "errors": {
                            "row": ["No values would change for this laptop."]
                        },
                    }
                )
                continue

            valid_rows.append(
                {
                    "row_number": row_number,
                    "serial_number": serial_number,
                    "data": {
                        "serial_number": serial_number,
                        "updates": updates,
                    },
                    "changes": changes,
                }
            )

        return {
            "file_name": uploaded_file.name,
            "sheet_name": dataframe.attrs.get("sheet_name", "Sheet1"),
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
            excel_file = pd.ExcelFile(uploaded_file, engine="openpyxl")
            if not excel_file.sheet_names:
                raise LaptopBulkUpdateError(
                    "The workbook does not contain any worksheets."
                )
            sheet_name = excel_file.sheet_names[0]
            dataframe = pd.read_excel(
                excel_file,
                sheet_name=sheet_name,
                dtype=object,
            )
            dataframe.attrs["sheet_name"] = sheet_name
            return dataframe
        except LaptopBulkUpdateError:
            raise
        except (
            ValueError,
            TypeError,
            BadZipFile,
            InvalidFileException,
            OSError,
        ) as exc:
            raise LaptopBulkUpdateError(
                "The uploaded file could not be read as a valid .xlsx workbook."
            ) from exc

    def _normalize_value(self, field_name, value):
        if field_name in {"company", "model_number", "processor", "area"}:
            cleaned = str(value).strip()
            if not cleaned:
                raise LaptopBulkUpdateError("This field cannot be empty.")
            return cleaned

        if field_name in {"processor_generation", "comments"}:
            return str(value).strip()

        if field_name in {"ram_gb", "storage_gb"}:
            number = self._integer(value)
            if number < 1:
                raise LaptopBulkUpdateError("Value must be at least 1.")
            return number

        if field_name in {"wholesale_price", "retail_price"}:
            try:
                number = Decimal(str(value).strip().replace(",", ""))
            except (InvalidOperation, ValueError, TypeError) as exc:
                raise LaptopBulkUpdateError("Enter a valid price.") from exc
            if number < 0:
                raise LaptopBulkUpdateError("Price cannot be negative.")
            return number

        if field_name == "display_type":
            return self._choice(value, self.DISPLAY_TYPE_MAP, "Touch or Non-Touch")
        if field_name == "storage_type":
            return self._choice(value, self.STORAGE_TYPE_MAP, "SSD or HDD")
        if field_name == "qc_status":
            return self._choice(value, self.QC_STATUS_MAP, "Done or Pending")
        if field_name == "inventory_status":
            return self._choice(
                value,
                self.INVENTORY_STATUS_MAP,
                "In Stock or In Stock G. Use To Service for service laptops",
            )
        if field_name == "warranty_days":
            normalized = self._normalize_choice_text(value)
            if normalized.endswith(" days"):
                normalized = normalized[:-5].strip()
            elif normalized.endswith(" day"):
                normalized = normalized[:-4].strip()
            warranty = self.WARRANTY_MAP.get(normalized)
            if warranty is None:
                raise LaptopBulkUpdateError(
                    "Warranty must be No, 0, 7, 15 or 30 days."
                )
            return warranty

        raise LaptopBulkUpdateError("This field cannot be bulk updated.")

    @staticmethod
    def _integer(value):
        try:
            decimal_value = Decimal(str(value).strip())
        except (InvalidOperation, ValueError, TypeError) as exc:
            raise LaptopBulkUpdateError("Enter a valid whole number.") from exc
        if decimal_value != decimal_value.to_integral_value():
            raise LaptopBulkUpdateError("Enter a whole number without decimals.")
        return int(decimal_value)

    def _choice(self, value, mapping, expected):
        normalized = self._normalize_choice_text(value)
        result = mapping.get(normalized)
        if result is None:
            raise LaptopBulkUpdateError(f"Expected {expected}.")
        return result

    @staticmethod
    def _normalize_choice_text(value):
        cleaned = str(value).strip().lower()
        cleaned = re.sub(r"[_\-]+", " ", cleaned)
        return re.sub(r"\s+", " ", cleaned)

    @staticmethod
    def _normalize_header(value):
        return re.sub(r"[^a-z0-9]+", "", str(value).strip().lower())

    @staticmethod
    def _field_to_header(field_name):
        return field_name.replace("_", " ").title()

    @staticmethod
    def _identifier(value):
        if LaptopBulkUpdatePreviewService._is_missing(value):
            return ""
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        if isinstance(value, int):
            return str(value)
        return str(value).strip()

    @staticmethod
    def _is_missing(value):
        if value is None:
            return True
        try:
            return bool(pd.isna(value))
        except (TypeError, ValueError):
            return False

    @staticmethod
    def _display_value(field_name, value):
        if field_name == "display_type":
            return Laptop.DisplayType(value).label
        if field_name == "storage_type":
            return Laptop.StorageType(value).label
        if field_name == "qc_status":
            return Laptop.QCStatus(value).label
        if field_name == "inventory_status":
            return Laptop.InventoryStatus(value).label
        if field_name == "warranty_days":
            return Laptop.WarrantyDays(value).label
        if isinstance(value, Decimal):
            return format(value, ".2f")
        return str(value)


class LaptopBulkUpdateConfirmationService:
    @classmethod
    @transaction.atomic
    def confirm(cls, rows):
        if not isinstance(rows, list) or not rows:
            raise LaptopBulkUpdateError("At least one row is required.")

        updated_serials = []
        seen = set()

        for row in rows:
            row_number = row.get("row_number")
            data = row.get("data") or {}
            serial_number = str(data.get("serial_number") or "").strip()
            updates = data.get("updates") or {}

            if not serial_number:
                raise LaptopBulkUpdateError(
                    f"Row {row_number}: Serial number is required."
                )

            serial_key = serial_number.casefold()
            if serial_key in seen:
                raise LaptopBulkUpdateError(
                    f"Row {row_number}: Duplicate serial number in confirmation data."
                )
            seen.add(serial_key)

            try:
                laptop = Laptop.objects.select_for_update().get(
                    serial_number__iexact=serial_number
                )
            except Laptop.DoesNotExist:
                raise LaptopBulkUpdateError(
                    f"Row {row_number}: Laptop {serial_number} no longer exists."
                ) from None

            if laptop.inventory_status == Laptop.InventoryStatus.IN_SERVICE:
                raise LaptopBulkUpdateError(
                    f"Row {row_number}: Laptop {serial_number} is currently in service."
                )
            if laptop.inventory_status == Laptop.InventoryStatus.SOLD:
                raise LaptopBulkUpdateError(
                    f"Row {row_number}: Laptop {serial_number} has already been sold."
                )

            allowed_updates = {
                key: value
                for key, value in updates.items()
                if key in LaptopBulkUpdatePreviewService.UPDATABLE_FIELDS
            }
            if not allowed_updates:
                raise LaptopBulkUpdateError(
                    f"Row {row_number}: No valid update fields were provided."
                )

            serializer = LaptopSerializer(
                laptop,
                data=allowed_updates,
                partial=True,
            )
            if not serializer.is_valid():
                first_field, messages = next(iter(serializer.errors.items()))
                first_message = str(messages[0]) if messages else "Invalid value."
                raise LaptopBulkUpdateError(
                    f"Row {row_number} ({first_field}): {first_message}"
                )

            serializer.save()
            updated_serials.append(laptop.serial_number)

        return {
            "updated_rows": len(updated_serials),
            "serial_numbers": updated_serials,
        }
