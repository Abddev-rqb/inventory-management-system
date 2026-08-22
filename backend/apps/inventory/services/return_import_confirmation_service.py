from django.contrib.auth import (
    get_user_model,
)
from django.db import transaction

from apps.inventory.models import (
    Return,
)
from apps.inventory.roles import (
    ROLE_TECHNICIAN,
    get_user_role,
)
from apps.inventory.services.return_import_service import (
    ReturnExcelImportPreviewService,
)


User = get_user_model()


class ReturnImportConfirmationError(
    Exception
):
    def __init__(
        self,
        message,
        *,
        errors=None,
    ):
        super().__init__(
            message
        )

        self.errors = (
            errors or []
        )


class ReturnImportConfirmationService:
    @classmethod
    @transaction.atomic
    def confirm(
        cls,
        *,
        rows,
        created_by,
    ):
        validation_errors = []

        prepared_rows = []

        seen_serials = set()

        # -------------------------------------------------
        # Revalidate every row before writing anything.
        #
        # This keeps confirmation atomic:
        # if even one row is invalid, nothing is imported.
        # -------------------------------------------------
        for row in rows:
            row_number = (
                row[
                    "row_number"
                ]
            )

            data = dict(
                row[
                    "data"
                ]
            )

            (
                cleaned_data,
                errors,
            ) = (
                ReturnExcelImportPreviewService
                .validate_row(
                    data,
                    seen_serials=(
                        seen_serials
                    ),
                )
            )

            if errors:
                validation_errors.append(
                    {
                        "row_number":
                            row_number,

                        "errors":
                            errors,
                    }
                )

                continue

            serial_key = (
                cleaned_data[
                    "serial_number"
                ]
                .strip()
                .lower()
            )

            seen_serials.add(
                serial_key
            )

            prepared_rows.append(
                (
                    row_number,
                    cleaned_data,
                )
            )

        if validation_errors:
            raise (
                ReturnImportConfirmationError(
                    (
                        "Return import "
                        "validation failed."
                    ),
                    errors=(
                        validation_errors
                    ),
                )
            )

        created_returns = []

        # -------------------------------------------------
        # All rows passed validation.
        # Create them inside the surrounding transaction.
        # -------------------------------------------------
        for (
            row_number,
            data,
        ) in prepared_rows:
            technician = None

            technician_username = (
                str(
                    data.get(
                        "technician",
                        "",
                    )
                    or ""
                )
                .strip()
            )

            # ---------------------------------------------
            # Technician is optional.
            #
            # When present, the import contract now carries
            # the technician USERNAME all the way from:
            #
            # Excel
            # -> preview
            # -> confirmation
            #
            # Therefore confirmation must resolve by
            # username, not by primary-key ID.
            # ---------------------------------------------
            if technician_username:
                try:
                    technician = (
                        User.objects.get(
                            username__iexact=(
                                technician_username
                            )
                        )
                    )

                except User.DoesNotExist:
                    raise (
                        ReturnImportConfirmationError(
                            (
                                "Technician no "
                                "longer exists."
                            ),
                            errors=[
                                {
                                    "row_number":
                                        row_number,

                                    "errors": [
                                        {
                                            "field":
                                                "technician",

                                            "message":
                                                (
                                                    "Technician "
                                                    "username "
                                                    "does not "
                                                    "exist."
                                                ),
                                        }
                                    ],
                                }
                            ],
                        )
                    ) from None

                except User.MultipleObjectsReturned:
                    raise (
                        ReturnImportConfirmationError(
                            (
                                "Technician username "
                                "is ambiguous."
                            ),
                            errors=[
                                {
                                    "row_number":
                                        row_number,

                                    "errors": [
                                        {
                                            "field":
                                                "technician",

                                            "message":
                                                (
                                                    "More than one "
                                                    "user matches "
                                                    "this technician "
                                                    "username."
                                                ),
                                        }
                                    ],
                                }
                            ],
                        )
                    ) from None

                if (
                    not technician.is_active
                ):
                    raise (
                        ReturnImportConfirmationError(
                            (
                                "Invalid technician."
                            ),
                            errors=[
                                {
                                    "row_number":
                                        row_number,

                                    "errors": [
                                        {
                                            "field":
                                                "technician",

                                            "message":
                                                (
                                                    "Technician "
                                                    "account is "
                                                    "inactive."
                                                ),
                                        }
                                    ],
                                }
                            ],
                        )
                    )

                if (
                    get_user_role(
                        technician
                    )
                    != ROLE_TECHNICIAN
                ):
                    raise (
                        ReturnImportConfirmationError(
                            (
                                "Invalid technician."
                            ),
                            errors=[
                                {
                                    "row_number":
                                        row_number,

                                    "errors": [
                                        {
                                            "field":
                                                "technician",

                                            "message":
                                                (
                                                    "Selected user "
                                                    "does not have "
                                                    "the Technician "
                                                    "role."
                                                ),
                                        }
                                    ],
                                }
                            ],
                        )
                    )

            return_record = (
                Return.objects.create(
                    customer_name=(
                        data[
                            "customer_name"
                        ]
                    ),

                    customer_address=(
                        data[
                            "customer_address"
                        ]
                    ),

                    company=(
                        data[
                            "company"
                        ]
                    ),

                    display_type=(
                        data[
                            "display_type"
                        ]
                    ),

                    model_number=(
                        data[
                            "model_number"
                        ]
                    ),

                    processor=(
                        data[
                            "processor"
                        ]
                    ),

                    processor_generation=(
                        data.get(
                            "processor_generation",
                            "",
                        )
                    ),

                    ram_gb=(
                        data[
                            "ram_gb"
                        ]
                    ),

                    storage_gb=(
                        data[
                            "storage_gb"
                        ]
                    ),

                    storage_type=(
                        data[
                            "storage_type"
                        ]
                    ),

                    serial_number=(
                        data[
                            "serial_number"
                        ]
                    ),

                    technician=(
                        technician
                    ),

                    issue=(
                        data[
                            "issue"
                        ]
                    ),

                    priority=(
                        data.get(
                            "priority",
                            Return
                            .Priority
                            .NORMAL,
                        )
                    ),

                    status=(
                        data.get(
                            "status",
                            Return
                            .Status
                            .RECEIVED,
                        )
                    ),

                    service_rack=(
                        data[
                            "service_rack"
                        ]
                    ),

                    created_by=(
                        created_by
                    ),
                )
            )

            created_returns.append(
                return_record
            )

        return {
            "requested_rows":
                len(rows),

            "imported_rows":
                len(
                    created_returns
                ),

            "return_ids": [
                return_record.id
                for return_record
                in created_returns
            ],
        }