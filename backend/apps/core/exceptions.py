from rest_framework.exceptions import (
    ErrorDetail,
    ValidationError,
)
from rest_framework.views import exception_handler


STATUS_MESSAGES = {
    400: "The request contains invalid data.",
    401: (
        "Authentication credentials were not provided "
        "or are invalid."
    ),
    403: (
        "You do not have permission to perform this action."
    ),
    404: "The requested resource was not found.",
    405: "The requested HTTP method is not allowed.",
    406: "The requested response format is not available.",
    409: (
        "The request conflicts with the current "
        "database state."
    ),
    413: (
        "The request or generated result exceeds "
        "the allowed limit."
    ),
    415: "The request content type is not supported.",
    429: "The request rate limit has been exceeded.",
}


def api_exception_handler(exception, context):
    response = exception_handler(
        exception,
        context,
    )

    if response is None:
        return None

    structured_data = getattr(
        exception,
        "response_data",
        None,
    )

    if structured_data is not None:
        original_data = structured_data
    else:
        original_data = response.data

    error_code = _extract_error_code(
        exception=exception,
        original_data=response.data,
    )

    message = STATUS_MESSAGES.get(
        response.status_code,
        "The request could not be completed.",
    )

    if isinstance(original_data, dict):
        custom_message = original_data.get("message")

        if custom_message is not None:
            message = str(custom_message)

    response.data = {
        "success": False,
        "error": {
            "status_code": response.status_code,
            "code": error_code,
            "message": message,
            "details": original_data,
        },
    }

    return response


def _extract_error_code(exception, original_data):
    if hasattr(exception, "get_codes"):
        codes = exception.get_codes()

        if isinstance(codes, str):
            return codes

        if isinstance(codes, dict):
            first_code = _first_error_code(codes)

            if first_code:
                return first_code

    if isinstance(exception, ValidationError):
        return "validation_error"

    first_code = _first_error_code(original_data)

    return first_code or "api_error"


def _first_error_code(value):
    if isinstance(value, ErrorDetail):
        return value.code

    if isinstance(value, dict):
        for nested_value in value.values():
            result = _first_error_code(
                nested_value
            )

            if result:
                return result

    if isinstance(value, list):
        for nested_value in value:
            result = _first_error_code(
                nested_value
            )

            if result:
                return result

    return None