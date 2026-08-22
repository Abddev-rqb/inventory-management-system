from django.http import FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.response import Response
from apps.inventory.serializers import OrderReadSerializer

from django_filters.rest_framework import (
    DjangoFilterBackend,
)

from rest_framework import filters

from apps.inventory.api_exceptions import (
    ExportLimitAPIError,
    ImportConfirmationAPIError,
    ImportConflictAPIError,
    InvalidWorkbookAPIError,
)
from apps.inventory.filters import LaptopFilter
from apps.inventory.models import Laptop
from apps.inventory.permissions import (
    LaptopModelPermissions,
)
from apps.inventory.serializers import (
    LaptopImportConfirmSerializer,
    LaptopImportPreviewSerializer,
    LaptopSerializer,
    LaptopToServiceSerializer,
)
from apps.inventory.services.excel_export_service import (
    LaptopExcelExportService,
)
from apps.inventory.services.laptop_to_service_service import (
    LaptopToServiceError,
    LaptopToServiceService,
)
from apps.inventory.services.excel_import_service import (
    ExcelImportError,
    LaptopExcelImportPreviewService,
)
from apps.inventory.services.laptop_bulk_update_service import (
    LaptopBulkUpdateConfirmationService,
    LaptopBulkUpdateError,
    LaptopBulkUpdatePreviewService,
)
from apps.inventory.services.import_confirmation_service import (
    ImportConfirmationConflictError,
    ImportConfirmationValidationError,
    LaptopImportConfirmationService,
)
from apps.inventory.throttles import (
    LaptopExportRateThrottle,
    LaptopImportRateThrottle,
)
from apps.inventory.models import Order
from apps.inventory.permissions import OrderPermission
from apps.inventory.serializers import (
    OrderCreateSerializer,
    OrderReadSerializer,
)

from apps.inventory.api_exceptions import (
    OrderValidationError,
)
from apps.inventory.services.order_dispatch_service import (
    OrderDispatchService,
)
from apps.inventory.serializers import (
    OrderBulkDispatchSerializer,
    OrderCreateSerializer,
    OrderReadSerializer,
)
from apps.inventory.models import (
    Order,
    OrderDeletionRequest,
)
from apps.inventory.permissions import (
    OrderDeletionRequestPermission,
    OrderPermission,
)
from apps.inventory.serializers import (
    OrderBulkDispatchSerializer,
    OrderCreateSerializer,
    OrderDeletionRequestCreateSerializer,
    OrderDeletionRequestReadSerializer,
    OrderReadSerializer,
)
from apps.inventory.services.order_deletion_service import (
    OrderDeletionService,
)
from django.http import (
    FileResponse,
)
from apps.inventory.serializers import (
    OrderBulkDispatchSerializer,
    OrderCreateSerializer,
    OrderDeletionRequestCreateSerializer,
    OrderDeletionRequestReadSerializer,
    OrderReadSerializer,
    OrderPendingFilterSerializer,
    OrderSalesFilterSerializer,
    OrderSalesReadSerializer,
)
from apps.inventory.services.order_sales_export_service import (
    OrderSalesExcelExportService,
)

from apps.inventory.services.order_sales_service import (
    OrderSalesService,
)

from rest_framework.exceptions import (
    PermissionDenied,
)

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_SALES,
    user_has_role,
)

from apps.inventory.services.pending_order_cancellation_service import (
    PendingOrderCancellationService,
)

from apps.inventory.services.dispatched_order_export_service import (
    DispatchedOrderExcelExportService,
)

from datetime import (
    datetime,
    time,
    timedelta,
)

from django.utils import (
    timezone,
)

from django.db.models import (
    Q,
)

class LaptopViewSet(viewsets.ModelViewSet):
    """
    Provides secured CRUD, import and export operations
    for laptop inventory records.
    """

    MAX_SYNCHRONOUS_EXPORT_ROWS = 25000

    # Laptops currently in service are intentionally hidden
    # from the normal inventory list. They are managed from
    # Active Returns until service is completed.
    queryset = Laptop.objects.exclude(
        inventory_status=(
            Laptop.InventoryStatus.IN_SERVICE
        )
    )

    serializer_class = LaptopSerializer

    permission_classes = [
        LaptopModelPermissions,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = LaptopFilter

    search_fields = [
        "id",
        "company",
        "display_type",
        "model_number",
        "processor",
        "processor_generation",
        "ram_gb",
        "storage_gb",
        "storage_type",
        "serial_number",
        "wholesale_price",
        "retail_price",
        "area",
    ]

    ordering_fields = [
        "id",
        "company",
        "display_type",
        "model_number",
        "processor",
        "processor_generation",
        "ram_gb",
        "storage_gb",
        "storage_type",
        "serial_number",
        "wholesale_price",
        "retail_price",
        "qc_status",
        "inventory_status",
        "quantity",
        "area",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
        "-id",
    ]

    def get_queryset(self):
        # "In Service" is an internal workflow state, not a
        # normal inventory bucket. Once a laptop is moved to
        # service it disappears from Laptop Inventory and is
        # managed from Active Returns until Done restores it.
        queryset = Laptop.objects.exclude(
            inventory_status=(
                Laptop.InventoryStatus.IN_SERVICE
            )
        )

        created_from = (
            self.request.query_params.get(
                "created_from",
                "",
            )
            or ""
        ).strip()

        created_to = (
            self.request.query_params.get(
                "created_to",
                "",
            )
            or ""
        ).strip()

        created_from_date = None
        created_to_date = None

        if created_from:
            try:
                created_from_date = (
                    datetime.strptime(
                        created_from,
                        "%Y-%m-%d",
                    )
                    .date()
                )
            except ValueError:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    "created_from": (
                        "Use YYYY-MM-DD format."
                    )
                }) from None

        if created_to:
            try:
                created_to_date = (
                    datetime.strptime(
                        created_to,
                        "%Y-%m-%d",
                    )
                    .date()
                )
            except ValueError:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    "created_to": (
                        "Use YYYY-MM-DD format."
                    )
                }) from None

        if (
            created_from_date
            and created_to_date
            and created_from_date > created_to_date
        ):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                "created_to": (
                    "To date cannot be earlier "
                    "than From date."
                )
            })

        current_timezone = (
            timezone.get_current_timezone()
        )

        if created_from_date:
            start_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        created_from_date,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = queryset.filter(
                created_at__gte=(
                    start_datetime
                )
            )

        if created_to_date:
            # Use the start of the following day as an
            # exclusive boundary. This includes every record
            # created on the selected To date, regardless of
            # its time of day.
            end_exclusive_date = (
                created_to_date
                + timedelta(days=1)
            )

            end_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        end_exclusive_date,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = queryset.filter(
                created_at__lt=(
                    end_datetime
                )
            )

        return queryset

    @action(
        detail=True,
        methods=["patch"],
        url_path="to-service",
    )
    def to_service(
        self,
        request,
        pk=None,
    ):
        serializer = (
            LaptopToServiceSerializer(
                data=request.data
            )
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            laptop, return_record = (
                LaptopToServiceService
                .move_to_service(
                    laptop_id=pk,
                    created_by=request.user,
                    **serializer.validated_data,
                )
            )
        except LaptopToServiceError as exc:
            return Response(
                {"detail": str(exc)},
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            {
                "message": (
                    "Laptop moved to service "
                    "successfully."
                ),
                "laptop": (
                    LaptopSerializer(
                        laptop,
                        context={
                            "request": request
                        },
                    ).data
                ),
                "return_id": (
                    return_record.id
                ),
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="import/preview",
        url_name="import-preview",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
        throttle_classes=[
            LaptopImportRateThrottle,
        ],
    )
    def import_preview(self, request):
        upload_serializer = LaptopImportPreviewSerializer(
            data=request.data,
        )

        upload_serializer.is_valid(
            raise_exception=True,
        )

        uploaded_file = upload_serializer.validated_data[
            "file"
        ]

        service = LaptopExcelImportPreviewService()

        try:
            preview_result = service.preview(
                uploaded_file
            )

        except ExcelImportError as error:
            raise InvalidWorkbookAPIError(
                detail=(
                    "The uploaded workbook could not "
                    "be previewed."
                ),
                response_data={
                    "message": (
                        "The uploaded workbook could not "
                        "be previewed."
                    ),
                    "file": [
                        str(error),
                    ],
                },
            ) from error

        return Response(
            data=preview_result,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="import/confirm",
        url_name="import-confirm",
        parser_classes=[
            JSONParser,
        ],
        throttle_classes=[
            LaptopImportRateThrottle,
        ],
    )
    def import_confirm(self, request):
        request_serializer = LaptopImportConfirmSerializer(
            data=request.data,
        )

        request_serializer.is_valid(
            raise_exception=True,
        )

        rows = request_serializer.validated_data[
            "rows"
        ]

        service = LaptopImportConfirmationService()

        try:
            import_result = service.confirm(rows)

        except ImportConfirmationValidationError as error:
            raise ImportConfirmationAPIError(
                detail=(
                    "Import confirmation failed validation. "
                    "No laptops were imported."
                ),
                response_data={
                    "message": (
                        "Import confirmation failed validation. "
                        "No laptops were imported."
                    ),
                    "summary": {
                        "requested_rows": len(rows),
                        "imported_rows": 0,
                        "invalid_rows": len(error.errors),
                    },
                    "errors": error.errors,
                },
            ) from error

        except ImportConfirmationConflictError as error:
            raise ImportConflictAPIError(
                detail=str(error),
                response_data={
                    "message": str(error),
                    "summary": {
                        "requested_rows": len(rows),
                        "imported_rows": 0,
                    },
                },
            ) from error

        return Response(
            data={
                "message": (
                    "Laptop import completed successfully."
                ),
                "summary": {
                    "requested_rows": len(rows),
                    "imported_rows": import_result[
                        "imported_rows"
                    ],
                },
                "serial_numbers": import_result[
                    "serial_numbers"
                ],
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-update/preview",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
        throttle_classes=[
            LaptopImportRateThrottle,
        ],
    )
    def bulk_update_preview(
        self,
        request,
    ):
        if not (
            user_has_role(
                request.user,
                ROLE_ADMIN,
            )
            or user_has_role(
                request.user,
                ROLE_SALES,
            )
        ):
            raise PermissionDenied(
                (
                    "Only Admin or Sales users "
                    "can bulk update laptops."
                )
            )

        upload_serializer = LaptopImportPreviewSerializer(
            data=request.data,
        )
        upload_serializer.is_valid(
            raise_exception=True,
        )

        try:
            result = (
                LaptopBulkUpdatePreviewService()
                .preview(
                    upload_serializer
                    .validated_data["file"]
                )
            )
        except LaptopBulkUpdateError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            result,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-update/confirm",
        parser_classes=[JSONParser],
        throttle_classes=[
            LaptopImportRateThrottle,
        ],
    )
    def bulk_update_confirm(
        self,
        request,
    ):
        if not (
            user_has_role(
                request.user,
                ROLE_ADMIN,
            )
            or user_has_role(
                request.user,
                ROLE_SALES,
            )
        ):
            raise PermissionDenied(
                (
                    "Only Admin or Sales users "
                    "can bulk update laptops."
                )
            )

        request_serializer = LaptopImportConfirmSerializer(
            data=request.data,
        )
        request_serializer.is_valid(
            raise_exception=True,
        )

        try:
            result = (
                LaptopBulkUpdateConfirmationService
                .confirm(
                    request_serializer
                    .validated_data["rows"]
                )
            )
        except LaptopBulkUpdateError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": (
                    f"{result['updated_rows']} laptop"
                    f"{'s' if result['updated_rows'] != 1 else ''} "
                    "updated successfully."
                ),
                **result,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-delete",
        parser_classes=[JSONParser],
    )
    def bulk_delete(
        self,
        request,
    ):
        if not (
            user_has_role(
                request.user,
                ROLE_ADMIN,
            )
            or user_has_role(
                request.user,
                ROLE_SALES,
            )
        ):
            raise PermissionDenied(
                (
                    "Only Admin or Sales users "
                    "can bulk delete laptops."
                )
            )

        raw_ids = request.data.get(
            "laptop_ids",
            [],
        )
        if not isinstance(raw_ids, list) or not raw_ids:
            return Response(
                {
                    "detail": (
                        "Select at least one laptop to delete."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        normalized_ids = []
        seen_ids = set()
        for raw_id in raw_ids:
            try:
                laptop_id = int(raw_id)
            except (TypeError, ValueError):
                return Response(
                    {
                        "detail": (
                            "Every laptop ID must be an integer."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if laptop_id < 1:
                return Response(
                    {
                        "detail": (
                            "Every laptop ID must be greater than zero."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if laptop_id not in seen_ids:
                normalized_ids.append(laptop_id)
                seen_ids.add(laptop_id)

        from django.db import transaction

        with transaction.atomic():
            laptops = list(
                Laptop.objects
                .select_for_update()
                .filter(id__in=normalized_ids)
                .order_by("id")
            )

            found_ids = {laptop.id for laptop in laptops}
            missing_ids = [
                laptop_id
                for laptop_id in normalized_ids
                if laptop_id not in found_ids
            ]
            if missing_ids:
                return Response(
                    {
                        "detail": (
                            "Some selected laptops no longer exist: "
                            + ", ".join(str(value) for value in missing_ids)
                            + "."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            blocked = []
            for laptop in laptops:
                if laptop.inventory_status not in {
                    Laptop.InventoryStatus.IN_STOCK,
                    Laptop.InventoryStatus.IN_STOCK_G,
                }:
                    blocked.append(
                        f"{laptop.serial_number}: status is "
                        f"{laptop.get_inventory_status_display()}."
                    )
                    continue

                if laptop.order_items.exists():
                    blocked.append(
                        f"{laptop.serial_number}: sales history exists."
                    )
                    continue

                if laptop.inventory_service_returns.exists():
                    blocked.append(
                        f"{laptop.serial_number}: service history exists."
                    )

            if blocked:
                return Response(
                    {
                        "detail": (
                            "Bulk delete was cancelled. "
                            + " ".join(blocked)
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            deleted_ids = [laptop.id for laptop in laptops]
            deleted_serials = [
                laptop.serial_number
                for laptop in laptops
            ]

            Laptop.objects.filter(
                id__in=deleted_ids
            ).delete()

        return Response(
            {
                "message": (
                    f"{len(deleted_ids)} laptop"
                    f"{'s' if len(deleted_ids) != 1 else ''} "
                    "deleted successfully."
                ),
                "deleted_rows": len(deleted_ids),
                "deleted_ids": deleted_ids,
                "serial_numbers": deleted_serials,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="export",
        url_name="export",
        throttle_classes=[
            LaptopExportRateThrottle,
        ],
    )
    def export_laptops(self, request):
        queryset = self.filter_queryset(
            self.get_queryset()
        )

        export_row_count = queryset.count()

        if (
            export_row_count
            > self.MAX_SYNCHRONOUS_EXPORT_ROWS
        ):
            export_limit_message = (
                "The filtered export contains "
                f"{export_row_count} rows. The maximum "
                "synchronous export size is "
                f"{self.MAX_SYNCHRONOUS_EXPORT_ROWS} rows."
            )
            raise ExportLimitAPIError(
                detail=export_limit_message,
                response_data={
                    "message": export_limit_message,
                    "exported_rows": 0,
                    "matched_rows": export_row_count,
                    "maximum_rows": (
                        self.MAX_SYNCHRONOUS_EXPORT_ROWS
                    ),
                },
            )

        service = LaptopExcelExportService()

        export_result = service.export(
            queryset=queryset,
        )

        response = FileResponse(
            export_result["file"],
            as_attachment=True,
            filename=export_result["file_name"],
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )

        response["X-Exported-Rows"] = str(
            export_result["exported_rows"]
        )

        return response
    
    
class OrderViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        OrderPermission,
    ]

    http_method_names = [
        "get",
        "post",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        queryset = (
            Order.objects
            .select_related(
                "employee",
            )
            .prefetch_related(
                "items",
            )
            .order_by(
                "-created_at",
                "-id",
            )
        )

        if self.action in {
            "list",
            "retrieve",
        }:
            queryset = queryset.filter(
                status=(
                    Order.Status.PENDING
                ),
            )

            if self.action == "list":
                filter_serializer = (
                    OrderPendingFilterSerializer(
                        data=self.request.query_params,
                    )
                )

                filter_serializer.is_valid(
                    raise_exception=True,
                )

                filters = (
                    filter_serializer.validated_data
                )

                search = str(
                    filters.get(
                        "search",
                        "",
                    )
                    or ""
                ).strip()

                start_date = filters.get(
                    "start_date"
                )

                end_date = filters.get(
                    "end_date"
                )

                current_timezone = (
                    timezone.get_current_timezone()
                )

                if start_date:
                    start_datetime = (
                        timezone.make_aware(
                            datetime.combine(
                                start_date,
                                time.min,
                            ),
                            current_timezone,
                        )
                    )

                    queryset = queryset.filter(
                        created_at__gte=(
                            start_datetime
                        )
                    )

                if end_date:
                    end_datetime = (
                        timezone.make_aware(
                            datetime.combine(
                                end_date,
                                time.max,
                            ),
                            current_timezone,
                        )
                    )

                    queryset = queryset.filter(
                        created_at__lte=(
                            end_datetime
                        )
                    )

                if search:
                    queryset = queryset.filter(
                        Q(
                            order_number__icontains=search
                        )
                        | Q(
                            customer_name__icontains=search
                        )
                        | Q(
                            customer_address__icontains=search
                        )
                        | Q(
                            employee__username__icontains=search
                        )
                        | Q(
                            employee__first_name__icontains=search
                        )
                        | Q(
                            employee__last_name__icontains=search
                        )
                        | Q(
                            items__item_name__icontains=search
                        )
                        | Q(
                            items__serial_number_snapshot__icontains=search
                        )
                    ).distinct()

            return queryset

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return (
                OrderCreateSerializer
            )

        if (
            self.action
            == "bulk_dispatch"
        ):
            return (
                OrderBulkDispatchSerializer
            )

        if (
            self.action
            in {
                "sales_report",
                "sales_export",
            }
        ):
            return (
                OrderSalesReadSerializer
            )

        return OrderReadSerializer

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = (
            self.get_serializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        order = serializer.save()

        response_serializer = (
            OrderReadSerializer(
                order,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            response_serializer.data,
            status=(
                status.HTTP_201_CREATED
            ),
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="dispatch",
    )
    def dispatch_order(
        self,
        request,
        pk=None,
    ):
        try:
            order = (
                OrderDispatchService
                .dispatch_order(
                    order_id=pk,
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        serializer = (
            OrderReadSerializer(
                order,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=[
            "post",
        ],
        url_path="dispatch/bulk",
    )
    def bulk_dispatch(
        self,
        request,
    ):
        serializer = (
            OrderBulkDispatchSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            orders = (
                OrderDispatchService
                .dispatch_orders(
                    order_ids=(
                        serializer
                        .validated_data[
                            "order_ids"
                        ]
                    ),
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        output_serializer = (
            OrderReadSerializer(
                orders,
                many=True,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            {
                "dispatched_count":
                    len(orders),

                "orders":
                    output_serializer.data,
            },
            status=(
                status.HTTP_200_OK
            ),
        )
        

    @action(
        detail=True,
        methods=["post"],
        url_path="deletion-request",
    )
    def request_deletion(
        self,
        request,
        pk=None,
    ):
        serializer = (
            OrderDeletionRequestCreateSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            deletion_request = (
                OrderDeletionService
                .request_deletion(
                    order_id=pk,
                    requested_by=(
                        request.user
                    ),
                    reason=(
                        serializer
                        .validated_data[
                            "reason"
                        ]
                    ),
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        output_serializer = (
            OrderDeletionRequestReadSerializer(
                deletion_request,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            output_serializer.data,
            status=(
                status.HTTP_201_CREATED
            ),
        )
        
    @action(
        detail=True,
        methods=[
            "delete",
        ],
        url_path="cancel",
    )
    def cancel_pending_order(
        self,
        request,
        pk=None,
    ):
        if not user_has_role(
            request.user,
            ROLE_ADMIN,
            ROLE_SALES,
        ):
            raise PermissionDenied(
                (
                    "You do not have permission "
                    "to delete pending orders."
                )
            )

        try:
            result = (
                PendingOrderCancellationService
                .cancel_pending_order(
                    order_id=pk,
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail":
                        str(exc),
                },
                status=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            {
                "message": (
                    "Pending order deleted "
                    "successfully."
                ),
                **result,
            },
            status=status.HTTP_200_OK,
        )


    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        try:
            result = (
                OrderDeletionService
                .admin_delete_order(
                    order_id=kwargs.get(
                        "pk"
                    ),
                    deleted_by=request.user,
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            {
                "message": (
                    "Order deleted successfully."
                ),
                **result,
            },
            status=status.HTTP_200_OK,
        )
    @action(
        detail=False,
        methods=["get"],
        url_path="sales",
    )
    def sales_report(
        self,
        request,
    ):
        filter_serializer = (
            OrderSalesFilterSerializer(
                data=request.query_params,
            )
        )

        filter_serializer.is_valid(
            raise_exception=True,
        )

        start_date = (
            filter_serializer
            .validated_data
            .get(
                "start_date"
            )
        )

        end_date = (
            filter_serializer
            .validated_data
            .get(
                "end_date"
            )
        )
        
        employee_id = (
            filter_serializer
            .validated_data
            .get(
                "employee_id"
            )
        )

        search = (
            filter_serializer
            .validated_data
            .get(
                "search",
                "",
            )
        )

        queryset = (
            OrderSalesService
            .get_sales_queryset(
                start_date=start_date,
                end_date=end_date,
                employee_id=employee_id,
                search=search,
            )
        )

        summary = (
            OrderSalesService
            .get_summary(
                start_date=(
                    start_date
                ),
                end_date=(
                    end_date
                ),
                employee_id=(
                    employee_id
                ),
                search=(
                    search
                ),
            )
        )

        page = (
            self.paginate_queryset(
                queryset
            )
        )

        if page is not None:
            serializer = (
                OrderSalesReadSerializer(
                    page,
                    many=True,
                    context={
                        "request": request,
                    },
                )
            )

            paginated_response = (
                self.get_paginated_response(
                    serializer.data
                )
            )

            paginated_response.data[
                "summary"
            ] = summary

            return paginated_response

        serializer = (
            OrderSalesReadSerializer(
                queryset,
                many=True,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            {
                "summary": summary,
                "results": (
                    serializer.data
                ),
            },
            status=status.HTTP_200_OK,
        )
        
    @action(
        detail=False,
        methods=["get"],
        url_path="sales/export",
    )
    def sales_export(
        self,
        request,
    ):
        filter_serializer = (
            OrderSalesFilterSerializer(
                data=request.query_params,
            )
        )

        filter_serializer.is_valid(
            raise_exception=True,
        )

        start_date = (
            filter_serializer
            .validated_data
            .get(
                "start_date"
            )
        )

        end_date = (
            filter_serializer
            .validated_data
            .get(
                "end_date"
            )
        )
        
        employee_id = (
            filter_serializer
            .validated_data
            .get(
                "employee_id"
            )
        )

        search = (
            filter_serializer
            .validated_data
            .get(
                "search",
                "",
            )
        )

        queryset = (
            OrderSalesService
            .get_sales_queryset(
                start_date=start_date,
                end_date=end_date,
                employee_id=employee_id,
            )
        )

        workbook_file = (
            OrderSalesExcelExportService
            .build_workbook(
                queryset=queryset,
            )
        )

        response = FileResponse(
            workbook_file,
            as_attachment=True,
            filename=(
                OrderSalesExcelExportService
                .FILE_NAME
            ),
            content_type=(
                "application/"
                "vnd.openxmlformats-"
                "officedocument."
                "spreadsheetml.sheet"
            ),
        )

        return response
    
    @action(
        detail=False,
        methods=["get"],
        url_path="dispatched",
    )
    def get_dispatched_queryset(
        self,
        *,
        start_date=None,
        end_date=None,
        search="",
    ):
        queryset = (
            Order.objects
            .filter(
                status=(
                    Order.Status.DISPATCHED
                )
            )
            .select_related(
                "employee"
            )
            .prefetch_related(
                "items"
            )
            .order_by(
                "-dispatched_at",
                "-id",
            )
        )

        current_timezone = (
            timezone.get_current_timezone()
        )

        if (
            start_date
            is not None
        ):
            start_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        start_date,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = (
                queryset.filter(
                    dispatched_at__gte=(
                        start_datetime
                    )
                )
            )

        if (
            end_date
            is not None
        ):
            next_day = (
                end_date +
                timedelta(
                    days=1
                )
            )

            end_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        next_day,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = (
                queryset.filter(
                    dispatched_at__lt=(
                        end_datetime
                    )
                )
            )
            
        search = str(
            search or ""
        ).strip()

        if search:
            queryset = (
                queryset.filter(
                    Q(
                        order_number__icontains=search
                    )
                    |
                    Q(
                        employee__username__icontains=search
                    )
                    |
                    Q(
                        employee__first_name__icontains=search
                    )
                    |
                    Q(
                        employee__last_name__icontains=search
                    )
                    |
                    Q(
                        customer_name__icontains=search
                    )
                    |
                    Q(
                        customer_address__icontains=search
                    )
                    |
                    Q(
                        price_mode__icontains=search
                    )
                    |
                    Q(
                        via__icontains=search
                    )
                    |
                    Q(
                        via_other__icontains=search
                    )
                    |
                    Q(
                        items__item_name__icontains=search
                    )
                    |
                    Q(
                        items__serial_number_snapshot__icontains=search
                    )
                )
                .distinct()
            )

        return queryset

    @action(
        detail=False,
        methods=[
            "get",
        ],
        url_path="dispatched",
    )
    def dispatched_orders(
        self,
        request,
    ):
        filter_serializer = (
            OrderSalesFilterSerializer(
                data=request.query_params,
            )
        )

        filter_serializer.is_valid(
            raise_exception=True,
        )

        start_date = (
            filter_serializer
            .validated_data
            .get(
                "start_date"
            )
        )

        end_date = (
            filter_serializer
            .validated_data
            .get(
                "end_date"
            )
        )
        
        search = (
            request.query_params
            .get(
                "search",
                "",
            )
            .strip()
        )

        queryset = (
            self.get_dispatched_queryset(
                start_date=start_date,
                end_date=end_date,
                search=search,
            )
        )

        page = (
            self.paginate_queryset(
                queryset
            )
        )

        if (
            page is not None
        ):
            serializer = (
                OrderReadSerializer(
                    page,
                    many=True,
                    context={
                        "request":
                            request,
                    },
                )
            )

            return (
                self.get_paginated_response(
                    serializer.data
                )
            )

        serializer = (
            OrderReadSerializer(
                queryset,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )

        return Response(
            serializer.data,
            status=(
                status.HTTP_200_OK
            ),
        )


    @action(
        detail=False,
        methods=[
            "get",
        ],
        url_path=(
            "dispatched/export"
        ),
    )
    def dispatched_export(
        self,
        request,
    ):
        if not user_has_role(
            request.user,
            ROLE_ADMIN,
            ROLE_SALES,
        ):
            raise PermissionDenied(
                (
                    "You do not have "
                    "permission to export "
                    "dispatched orders."
                )
            )

        filter_serializer = (
            OrderSalesFilterSerializer(
                data=request.query_params,
            )
        )

        filter_serializer.is_valid(
            raise_exception=True,
        )

        start_date = (
            filter_serializer
            .validated_data
            .get(
                "start_date"
            )
        )

        end_date = (
            filter_serializer
            .validated_data
            .get(
                "end_date"
            )
        )
        
        search = (
            request.query_params
            .get(
                "search",
                "",
            )
            .strip()
        )

        queryset = (
            self.get_dispatched_queryset(
                start_date=start_date,
                end_date=end_date,
                search=search,
            )
        )

        workbook_file = (
            DispatchedOrderExcelExportService
            .build_workbook(
                queryset=queryset,
            )
        )

        response = FileResponse(
            workbook_file,
            as_attachment=True,
            filename=(
                DispatchedOrderExcelExportService
                .FILE_NAME
            ),
            content_type=(
                "application/"
                "vnd.openxmlformats-"
                "officedocument."
                "spreadsheetml.sheet"
            ),
        )

        response[
            "X-Exported-Rows"
        ] = str(
            queryset.count()
        )

        return response


class OrderDeletionRequestViewSet(
    viewsets.ReadOnlyModelViewSet
):
    permission_classes = [
        OrderDeletionRequestPermission,
    ]

    serializer_class = (
        OrderDeletionRequestReadSerializer
    )

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    def get_queryset(self):
        return (
            OrderDeletionRequest
            .objects
            .select_related(
                "order",
                "requested_by",
                "reviewed_by",
            )
            .order_by(
                "-created_at",
                "-id",
            )
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
    )
    def approve(
        self,
        request,
        pk=None,
    ):
        try:
            result = (
                OrderDeletionService
                .approve_request(
                    deletion_request_id=pk,
                    reviewed_by=(
                        request.user
                    ),
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            {
                "message": (
                    "Deletion request approved "
                    "and order deleted."
                ),
                **result,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject(
        self,
        request,
        pk=None,
    ):
        try:
            deletion_request = (
                OrderDeletionService
                .reject_request(
                    deletion_request_id=pk,
                    reviewed_by=(
                        request.user
                    ),
                )
            )

        except OrderValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        serializer = (
            self.get_serializer(
                deletion_request
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )