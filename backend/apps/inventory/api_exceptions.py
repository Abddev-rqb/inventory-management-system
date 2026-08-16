from rest_framework.exceptions import APIException


class StructuredAPIException(APIException):
    """
    API exception that keeps structured response data separate
    from DRF's ErrorDetail conversion.
    """

    default_detail = "The request could not be completed."
    default_code = "api_error"

    def __init__(
        self,
        detail=None,
        code=None,
        response_data=None,
    ):
        self.response_data = response_data

        super().__init__(
            detail=detail,
            code=code,
        )


class InvalidWorkbookAPIError(StructuredAPIException):
    status_code = 400
    default_detail = "The workbook could not be processed."
    default_code = "invalid_workbook"


class ImportConfirmationAPIError(StructuredAPIException):
    status_code = 400
    default_detail = "Import confirmation failed validation."
    default_code = "import_validation_failed"


class ImportConflictAPIError(StructuredAPIException):
    status_code = 409
    default_detail = (
        "The import conflicts with the current database state."
    )
    default_code = "import_conflict"


class ExportLimitAPIError(StructuredAPIException):
    status_code = 413
    default_detail = (
        "The filtered export contains too many rows."
    )
    default_code = "export_limit_exceeded"
    
class OrderCreationError(Exception):
    """
    Base exception for order creation failures.
    """


class OrderInventoryError(OrderCreationError):
    """
    Raised when a laptop cannot satisfy
    the requested sale quantity.
    """


class OrderValidationError(OrderCreationError):
    """
    Raised when order input is invalid.
    """    