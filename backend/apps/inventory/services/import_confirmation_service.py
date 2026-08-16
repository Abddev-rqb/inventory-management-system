from django.db import IntegrityError, transaction

from apps.inventory.models import Laptop
from apps.inventory.serializers import LaptopSerializer


class ImportConfirmationValidationError(Exception):
    """
    Raised when one or more requested rows are invalid.
    """

    def __init__(self, errors):
        self.errors = errors

        super().__init__(
            "One or more laptop rows failed validation."
        )


class ImportConfirmationConflictError(Exception):
    """
    Raised when the database rejects the final insert.
    """


class LaptopImportConfirmationService:
    BATCH_SIZE = 500

    def confirm(self, rows):
        validated_rows = self._validate_rows(rows)

        laptop_objects = [
            Laptop(**validated_row["data"])
            for validated_row in validated_rows
        ]

        try:
            with transaction.atomic():
                Laptop.objects.bulk_create(
                    laptop_objects,
                    batch_size=self.BATCH_SIZE,
                )

        except IntegrityError as error:
            raise ImportConfirmationConflictError(
                "The import could not be completed because the "
                "database detected conflicting or invalid data. "
                "No laptops were imported."
            ) from error

        return {
            "imported_rows": len(laptop_objects),
            "serial_numbers": [
                laptop.serial_number
                for laptop in laptop_objects
            ],
        }

    def _validate_rows(self, rows):
        validated_rows = []
        validation_errors = []
        seen_serial_numbers = {}

        for row_item in rows:
            row_number = row_item["row_number"]
            laptop_data = row_item["data"]

            serializer = LaptopSerializer(
                data=laptop_data,
            )

            if not serializer.is_valid():
                validation_errors.append(
                    {
                        "row_number": row_number,
                        "serial_number": self._extract_serial_number(
                            laptop_data
                        ),
                        "errors": self._format_serializer_errors(
                            serializer.errors
                        ),
                    }
                )
                continue

            validated_data = dict(
                serializer.validated_data
            )

            serial_number = validated_data[
                "serial_number"
            ]

            duplicate_error = self._check_request_duplicate(
                serial_number=serial_number,
                row_number=row_number,
                seen_serial_numbers=seen_serial_numbers,
            )

            if duplicate_error is not None:
                validation_errors.append(
                    {
                        "row_number": row_number,
                        "serial_number": serial_number,
                        "errors": {
                            "serial_number": [
                                duplicate_error,
                            ]
                        },
                    }
                )
                continue

            validated_rows.append(
                {
                    "row_number": row_number,
                    "data": validated_data,
                }
            )

        if validation_errors:
            raise ImportConfirmationValidationError(
                errors=validation_errors,
            )

        return validated_rows

    @staticmethod
    def _check_request_duplicate(
        serial_number,
        row_number,
        seen_serial_numbers,
    ):
        serial_key = serial_number.casefold()

        first_row_number = seen_serial_numbers.get(
            serial_key
        )

        if first_row_number is not None:
            return (
                "This serial number appears more than once in "
                "the confirmation request. It first appeared "
                f"on row {first_row_number}."
            )

        seen_serial_numbers[serial_key] = row_number

        return None

    @staticmethod
    def _extract_serial_number(laptop_data):
        value = laptop_data.get(
            "serial_number",
            "",
        )

        if value is None:
            return ""

        return str(value).strip()

    @staticmethod
    def _format_serializer_errors(serializer_errors):
        formatted_errors = {}

        for field_name, messages in serializer_errors.items():
            formatted_errors[field_name] = [
                str(message)
                for message in messages
            ]

        return formatted_errors