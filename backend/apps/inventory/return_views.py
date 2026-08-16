from django.db.models import (
    Q,
)
from django.contrib.auth import (
    get_user_model,
)
from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import (
    action,
)
from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)
from rest_framework.response import (
    Response,
)

from apps.inventory.models import (
    Return,
)
from apps.inventory.return_permissions import (
    ReturnPermission,
)
from apps.inventory.return_serializers import (
    ReturnCreateSerializer,
    ReturnFilterSerializer,
    ReturnImportConfirmSerializer,
    ReturnImportPreviewSerializer,
    ReturnPrioritySerializer,
    ReturnReadSerializer,
    ReturnStatusUpdateSerializer,
    ReturnStockedInFilterSerializer,
    ReturnStockedInReadSerializer,
    ReturnStockInSerializer,
    ReturnTechnicianAssignmentSerializer,
    ReturnTechnicianSerializer,
    ReturnUpdateSerializer,
)
from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_TECHNICIAN,
    get_user_role,
)

from apps.inventory.services.return_stock_in_service import (
    ReturnStockInError,
    ReturnStockInService,
)

from datetime import (
    datetime,
    time,
    timedelta,
)

from django.http import (
    FileResponse,
)
from django.utils import (
    timezone,
)

from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)

from apps.inventory.services.return_export_service import (
    ReturnExcelExportService,
)

from apps.inventory.services.return_import_confirmation_service import (
    ReturnImportConfirmationError,
    ReturnImportConfirmationService,
)

from apps.inventory.services.return_import_service import (
    ReturnExcelImportPreviewService,
    ReturnImportError,
)

from apps.inventory.services.return_stocked_in_export_service import (
    ReturnStockedInExcelExportService,
)


User = get_user_model()


class ReturnViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        ReturnPermission,
    ]

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "customer_name",
        "company",
        "model_number",
        "processor",
        "processor_generation",
        "serial_number",
        "issue",
        "service_rack",
        "technician__username",
        "technician__first_name",
        "technician__last_name",
    ]

    ordering_fields = [
        "id",
        "customer_name",
        "company",
        "model_number",
        "serial_number",
        "priority",
        "status",
        "service_rack",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
        "-id",
    ]

    def get_queryset(
        self,
    ):
        return (
            Return.objects
            .select_related(
                "technician",
                "created_by",
                "stocked_in_laptop",
                "stocked_in_by",
            )
            .all()
        )

    def get_serializer_class(
        self,
    ):
            
        if (
            self.action
            == "create"
        ):
            return (
                ReturnCreateSerializer
            )

        if self.action in {
            "update",
            "partial_update",
        }:
            return (
                ReturnUpdateSerializer
            )

        if (
            self.action
            == "assign_priority"
        ):
            return (
                ReturnPrioritySerializer
            )

        if (
            self.action
            == "assign_technician"
        ):
            return (
                ReturnTechnicianAssignmentSerializer
            )
            
        if (
            self.action
            == "update_status"
        ):
            return (
                ReturnStatusUpdateSerializer
            )
            
        if (
            self.action
            == "stock_in"
        ):
            return (
                ReturnStockInSerializer
            )

        if (
            self.action
            == "technicians"
        ):
            return (
                ReturnTechnicianSerializer
            )
        
        if (
            self.action
            == "import_preview"
        ):
            return (
                ReturnImportPreviewSerializer
            )
            
        if (
            self.action
            == "stocked_in"
        ):
            return (
                ReturnStockedInReadSerializer
            )


        if (
            self.action
            == "import_confirm"
        ):
            return (
                ReturnImportConfirmSerializer
            )

        return (
            ReturnReadSerializer
        )

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
            raise_exception=True
        )

        return_record = (
            serializer.save()
        )

        return Response(
            self._serialize_return(
                return_record,
                request,
            ),
            status=(
                status.HTTP_201_CREATED
            ),
        )

    def partial_update(
        self,
        request,
        *args,
        **kwargs,
    ):
        instance = (
            self.get_object()
        )

        serializer = (
            self.get_serializer(
                instance,
                data=request.data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        return_record = (
            serializer.save()
        )

        return Response(
            self._serialize_return(
                return_record,
                request,
            )
        )

    @action(
        detail=False,
        methods=[
            "get",
        ],
        url_path="technicians",
    )
    def technicians(
        self,
        request,
    ):
        technicians = (
            User.objects
            .filter(
                groups__name=(
                    ROLE_TECHNICIAN
                ),
                is_active=True,
            )
            .distinct()
            .order_by(
                "first_name",
                "last_name",
                "username",
            )
        )

        serializer = (
            ReturnTechnicianSerializer(
                technicians,
                many=True,
            )
        )

        return Response(
            serializer.data,
            status=(
                status.HTTP_200_OK
            ),
        )

    @action(
        detail=True,
        methods=[
            "patch",
        ],
        url_path="technician",
    )
    def assign_technician(
        self,
        request,
        pk=None,
    ):
        return_record = (
            self.get_object()
        )

        serializer = (
            ReturnTechnicianAssignmentSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        technician = (
            serializer
            .validated_data[
                "technician"
            ]
        )

        return_record.technician = (
            technician
        )

        return_record.save(
            update_fields=[
                "technician",
                "updated_at",
            ]
        )

        return Response(
            self._serialize_return(
                return_record,
                request,
            ),
            status=(
                status.HTTP_200_OK
            ),
        )

    @action(
        detail=True,
        methods=[
            "patch",
        ],
        url_path="priority",
    )
    def assign_priority(
        self,
        request,
        pk=None,
    ):
        if (
            get_user_role(
                request.user
            )
            != ROLE_ADMIN
        ):
            return Response(
                {
                    "detail": (
                        "Only Admin users "
                        "can assign return "
                        "priority."
                    )
                },
                status=(
                    status
                    .HTTP_403_FORBIDDEN
                ),
            )

        return_record = (
            self.get_object()
        )

        serializer = (
            ReturnPrioritySerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        return_record.priority = (
            serializer
            .validated_data[
                "priority"
            ]
        )

        return_record.save(
            update_fields=[
                "priority",
                "updated_at",
            ]
        )

        return Response(
            self._serialize_return(
                return_record,
                request,
            ),
            status=(
                status.HTTP_200_OK
            ),
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        if (
            get_user_role(
                request.user
            )
            != ROLE_ADMIN
        ):
            return Response(
                {
                    "detail": (
                        "Only Admin users "
                        "can delete return "
                        "records."
                    ),
                },
                status=(
                    status
                    .HTTP_403_FORBIDDEN
                ),
            )

        instance = (
            self.get_object()
        )

        return_id = (
            instance.pk
        )

        instance.delete()

        return Response(
            {
                "message": (
                    "Return deleted "
                    "successfully."
                ),

                "id":
                    return_id,
            },
            status=(
                status.HTTP_200_OK
            ),
        )

    @staticmethod
    def _serialize_return(
        return_record,
        request,
    ):
        serializer = (
            ReturnReadSerializer(
                return_record,
                context={
                    "request":
                        request,
                },
            )
        )

        return serializer.data
    
    @action(
        detail=True,
        methods=[
            "patch",
        ],
        url_path="status",
    )
    def update_status(
        self,
        request,
        pk=None,
    ):
        return_record = (
            self.get_object()
        )

        actor_role = (
            get_user_role(
                request.user
            )
        )

        if (
            actor_role
            == ROLE_TECHNICIAN
        ):
            if (
                return_record
                .technician_id
                != request.user.id
            ):
                return Response(
                    {
                        "detail": (
                            "Technicians can update "
                            "only returns assigned "
                            "to them."
                        )
                    },
                    status=(
                        status
                        .HTTP_403_FORBIDDEN
                    ),
                )

        serializer = (
            ReturnStatusUpdateSerializer(
                data=request.data,
                context={
                    "request":
                        request,

                    "return_record":
                        return_record,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        new_status = (
            serializer
            .validated_data[
                "status"
            ]
        )

        return_record.status = (
            new_status
        )

        update_fields = [
            "status",
            "updated_at",
        ]

        if (
            "repair_notes"
            in serializer
            .validated_data
        ):
            return_record.repair_notes = (
                serializer
                .validated_data[
                    "repair_notes"
                ]
            )

            update_fields.append(
                "repair_notes"
            )

        return_record.save(
            update_fields=(
                update_fields
            )
        )

        return Response(
            self._serialize_return(
                return_record,
                request,
            ),
            status=(
                status.HTTP_200_OK
            ),
        )
        
    @action(
        detail=True,
        methods=[
            "patch",
        ],
        url_path="stock-in",
    )
    def stock_in(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ReturnStockInSerializer(
                data=request.data,
                context={
                    "request":
                        request,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            (
                return_record,
                laptop,
            ) = (
                ReturnStockInService
                .stock_in(
                    return_id=pk,
                    user=request.user,
                    laptop_data=(
                        serializer
                        .validated_data
                    ),
                )
            )

        except ReturnStockInError as exc:
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
                    "Returned laptop "
                    "stocked in successfully."
                ),

                "return": (
                    self._serialize_return(
                        return_record,
                        request,
                    )
                ),

                "laptop": {
                    "id":
                        laptop.id,

                    "company":
                        laptop.company,

                    "model_number":
                        laptop.model_number,

                    "serial_number":
                        laptop.serial_number,

                    "inventory_status":
                        laptop.inventory_status,

                    "quantity":
                        laptop.quantity,

                    "wholesale_price":
                        laptop.wholesale_price,

                    "retail_price":
                        laptop.retail_price,
                },
            },
            status=(
                status.HTTP_200_OK
            ),
        )
    
    def get_filtered_returns(
        self,
        request,
    ):
        serializer = (
            ReturnFilterSerializer(
                data=(
                    request.query_params
                )
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        filters = (
            serializer
            .validated_data
        )

        queryset = (
            self.get_queryset()
        )

        status_value = (
            filters.get(
                "status"
            )
        )

        priority = (
            filters.get(
                "priority"
            )
        )

        service_rack = (
            filters.get(
                "service_rack"
            )
        )

        technician = (
            filters.get(
                "technician"
            )
        )

        start_date = (
            filters.get(
                "start_date"
            )
        )

        end_date = (
            filters.get(
                "end_date"
            )
        )

        if status_value:
            queryset = (
                queryset.filter(
                    status=status_value
                )
            )

        if priority:
            queryset = (
                queryset.filter(
                    priority=priority
                )
            )

        if service_rack:
            queryset = (
                queryset.filter(
                    service_rack=(
                        service_rack
                    )
                )
            )

        if technician:
            queryset = (
                queryset.filter(
                    technician_id=(
                        technician
                    )
                )
            )

        current_timezone = (
            timezone
            .get_current_timezone()
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

            queryset = (
                queryset.filter(
                    created_at__gte=(
                        start_datetime
                    )
                )
            )

        if end_date:
            next_date = (
                end_date
                + timedelta(
                    days=1
                )
            )

            end_datetime = (
                timezone.make_aware(
                    datetime.combine(
                        next_date,
                        time.min,
                    ),
                    current_timezone,
                )
            )

            queryset = (
                queryset.filter(
                    created_at__lt=(
                        end_datetime
                    )
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

        if search:
            from django.db.models import Q

            queryset = (
                queryset.filter(
                    Q(
                        customer_name__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        company__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        model_number__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        serial_number__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        issue__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        technician__username__icontains=(
                            search
                        )
                    )
                )
            )

        return queryset
    
    @action(
        detail=False,
        methods=[
            "post",
        ],
        url_path="import/preview",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
    )
    def import_preview(
        self,
        request,
    ):
        serializer = (
            ReturnImportPreviewSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        uploaded_file = (
            serializer
            .validated_data[
                "file"
            ]
        )

        try:
            result = (
                ReturnExcelImportPreviewService
                .preview(
                    uploaded_file
                )
            )

        except ReturnImportError as exc:
            return Response(
                {
                    "detail":
                        str(exc),

                    "file": [
                        str(exc)
                    ],
                },
                status=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            result,
            status=(
                status.HTTP_200_OK
            ),
        )
        
    @action(
        detail=False,
        methods=[
            "post",
        ],
        url_path="import/confirm",
        parser_classes=[
            JSONParser,
        ],
    )
    def import_confirm(
        self,
        request,
    ):
        serializer = (
            ReturnImportConfirmSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        rows = (
            serializer
            .validated_data[
                "rows"
            ]
        )

        try:
            result = (
                ReturnImportConfirmationService
                .confirm(
                    rows=rows,
                    created_by=(
                        request.user
                    ),
                )
            )

        except (
            ReturnImportConfirmationError
        ) as exc:
            return Response(
                {
                    "detail":
                        str(exc),

                    "summary": {
                        "requested_rows":
                            len(rows),

                        "imported_rows":
                            0,

                        "invalid_rows":
                            len(
                                exc.errors
                            ),
                    },

                    "errors":
                        exc.errors,
                },
                status=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            {
                "message": (
                    "Returns imported "
                    "successfully."
                ),

                "summary":
                    result,
            },
            status=(
                status.HTTP_201_CREATED
            ),
        )
        
    @action(
        detail=False,
        methods=[
            "get",
        ],
        url_path="export",
    )
    def export_returns(
        self,
        request,
    ):
        queryset = (
            self.get_filtered_returns(
                request
            )
            .order_by(
                "-created_at",
                "-id",
            )
        )

        workbook_file = (
            ReturnExcelExportService
            .build_workbook(
                queryset=queryset
            )
        )

        response = FileResponse(
            workbook_file,
            as_attachment=True,
            filename=(
                ReturnExcelExportService
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
    
    def get_stocked_in_queryset(
        self,
        *,
        start_date=None,
        end_date=None,
        search="",
    ):
        queryset = (
            Return.objects
            .filter(
                stocked_in_at__isnull=False,
                stocked_in_laptop__isnull=False,
            )
            .select_related(
                "stocked_in_laptop",
                "stocked_in_by",
                "technician",
                "created_by",
            )
            .order_by(
                "-stocked_in_at",
                "-id",
            )
        )

        current_timezone = (
            timezone
            .get_current_timezone()
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
                    stocked_in_at__gte=(
                        start_datetime
                    )
                )
            )

        if (
            end_date
            is not None
        ):
            next_day = (
                end_date
                + timedelta(
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
                    stocked_in_at__lt=(
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
                        customer_name__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        stocked_in_laptop__company__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        stocked_in_laptop__model_number__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        stocked_in_laptop__processor__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        stocked_in_laptop__serial_number__icontains=(
                            search
                        )
                    )
                    |
                    Q(
                        stocked_in_by__username__icontains=(
                            search
                        )
                    )
                )
            )

        return queryset
    
    @action(
    detail=False,
        methods=[
            "get",
        ],
        url_path="stocked-in",
    )
    def stocked_in(
        self,
        request,
    ):
        filter_serializer = (
            ReturnStockedInFilterSerializer(
                data=request.query_params
            )
        )

        filter_serializer.is_valid(
            raise_exception=True
        )

        filters = (
            filter_serializer
            .validated_data
        )

        queryset = (
            self.get_stocked_in_queryset(
                start_date=(
                    filters.get(
                        "start_date"
                    )
                ),
                end_date=(
                    filters.get(
                        "end_date"
                    )
                ),
                search=(
                    filters.get(
                        "search",
                        "",
                    )
                ),
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
                ReturnStockedInReadSerializer(
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
            ReturnStockedInReadSerializer(
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
        url_path="stocked-in/export",
    )
    def stocked_in_export(
        self,
        request,
    ):
        filter_serializer = (
            ReturnStockedInFilterSerializer(
                data=request.query_params
            )
        )

        filter_serializer.is_valid(
            raise_exception=True
        )

        filters = (
            filter_serializer
            .validated_data
        )

        queryset = (
            self.get_stocked_in_queryset(
                start_date=(
                    filters.get(
                        "start_date"
                    )
                ),
                end_date=(
                    filters.get(
                        "end_date"
                    )
                ),
                search=(
                    filters.get(
                        "search",
                        "",
                    )
                ),
            )
        )

        workbook_file = (
            ReturnStockedInExcelExportService
            .build_workbook(
                queryset=queryset
            )
        )

        response = FileResponse(
            workbook_file,
            as_attachment=True,
            filename=(
                ReturnStockedInExcelExportService
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
    
    def list(
        self,
        request,
        *args,
        **kwargs,
    ):
        queryset = (
            self.get_filtered_returns(
                request
            )
            .order_by(
                "-created_at",
                "-id",
            )
        )

        page = (
            self.paginate_queryset(
                queryset
            )
        )

        if page is not None:
            serializer = (
                ReturnReadSerializer(
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
            ReturnReadSerializer(
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