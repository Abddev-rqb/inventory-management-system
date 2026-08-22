from decimal import Decimal
from pathlib import Path

from django.contrib.auth import (
    get_user_model,
)
from rest_framework import serializers

from apps.inventory.api_exceptions import (
    OrderInventoryError,
    OrderValidationError,
)
from apps.inventory.models import (
    Laptop,
    Order,
    Return,
    OrderDeletionRequest,
    OrderItem,
)
from apps.inventory.roles import (
    ROLE_SALES,
    ROLE_TECHNICIAN,
    get_user_role,
)
from apps.inventory.services.order_creation_service import (
    OrderCreationService,
)


MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024


User = get_user_model()


class LaptopToServiceSerializer(
    serializers.Serializer
):
    issue = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    service_rack = serializers.CharField(
        max_length=100,
        allow_blank=False,
        trim_whitespace=True,
    )

    priority = serializers.ChoiceField(
        choices=Return.Priority.choices,
        default=Return.Priority.NORMAL,
    )

    technician = (
        serializers.PrimaryKeyRelatedField(
            queryset=User.objects.all(),
            required=False,
            allow_null=True,
        )
    )

    def validate_issue(self, value):
        cleaned = str(value or "").strip()
        if not cleaned:
            raise serializers.ValidationError(
                "Issue cannot be empty."
            )
        return cleaned

    def validate_service_rack(
        self,
        value,
    ):
        cleaned = str(value or "").strip()
        if not cleaned:
            raise serializers.ValidationError(
                "Service rack cannot be empty."
            )
        return cleaned

    def validate_technician(
        self,
        technician,
    ):
        if technician is None:
            return None

        if (
            not technician.is_active
            or get_user_role(
                technician
            ) != ROLE_TECHNICIAN
        ):
            raise serializers.ValidationError(
                (
                    "The selected user must be "
                    "an active Technician."
                )
            )

        return technician


class LaptopSerializer(
    serializers.ModelSerializer
):
    display_type_label = (
        serializers.CharField(
            source="get_display_type_display",
            read_only=True,
        )
    )

    storage_type_label = (
        serializers.CharField(
            source="get_storage_type_display",
            read_only=True,
        )
    )

    qc_status_label = (
        serializers.CharField(
            source="get_qc_status_display",
            read_only=True,
        )
    )

    inventory_status_label = (
        serializers.CharField(
            source="get_inventory_status_display",
            read_only=True,
        )
    )

    warranty_label = (
        serializers.CharField(
            source="get_warranty_days_display",
            read_only=True,
        )
    )

    class Meta:
        model = Laptop

        fields = (
            "id",
            "company",
            "display_type",
            "display_type_label",
            "model_number",
            "processor",
            "processor_generation",
            "ram_gb",
            "storage_gb",
            "storage_type",
            "storage_type_label",
            "serial_number",
            "wholesale_price",
            "retail_price",
            "qc_status",
            "qc_status_label",
            "inventory_status",
            "inventory_status_label",
            "comments",
            "quantity",
            "warranty_days",
            "warranty_label",
            "area",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "display_type_label",
            "storage_type_label",
            "qc_status_label",
            "inventory_status_label",
            "warranty_label",
            "created_at",
            "updated_at",
        )

    def validate_company(
        self,
        value,
    ):
        return self._clean_required_text(
            value=value,
            field_name="Company",
        )

    def validate_model_number(
        self,
        value,
    ):
        return self._clean_required_text(
            value=value,
            field_name="Model number",
        )

    def validate_processor(
        self,
        value,
    ):
        return self._clean_required_text(
            value=value,
            field_name="Processor",
        )

    def validate_serial_number(
        self,
        value,
    ):
        cleaned_value = (
            self._clean_required_text(
                value=value,
                field_name="Serial number",
            )
        )

        matching_laptops = (
            Laptop.objects.filter(
                serial_number__iexact=(
                    cleaned_value
                ),
            )
        )

        if self.instance is not None:
            matching_laptops = (
                matching_laptops.exclude(
                    pk=self.instance.pk,
                )
            )

        if matching_laptops.exists():
            raise serializers.ValidationError(
                (
                    "A laptop with this "
                    "serial number already exists."
                )
            )

        return cleaned_value

    def validate_area(
        self,
        value,
    ):
        return self._clean_required_text(
            value=value,
            field_name="Area",
        )

    def validate_inventory_status(
        self,
        value,
    ):
        if (
            value
            == Laptop.InventoryStatus.IN_SERVICE
        ):
            raise serializers.ValidationError(
                (
                    "In Service is controlled by "
                    "the To Service workflow and "
                    "cannot be selected manually."
                )
            )

        return value

    def validate_quantity(
        self,
        value,
    ):
        if value != 1:
            raise serializers.ValidationError(
                (
                    "Each laptop represents one "
                    "physical device. Quantity "
                    "must always be 1."
                )
            )

        return value

    def validate_processor_generation(
        self,
        value,
    ):
        if value is None:
            return ""

        return value.strip()

    def validate_comments(
        self,
        value,
    ):
        if value is None:
            return ""

        return value.strip()

    def validate(
        self,
        attributes,
    ):
        attributes = super().validate(
            attributes
        )

        request = self.context.get(
            "request"
        )

        instance = self.instance

        # ---------------------------------------------
        # Sales users can edit laptop information,
        # but prices are Admin-controlled.
        #
        # If a Sales user sends price fields during
        # PATCH/PUT, remove them from validated data.
        #
        # This means the existing database prices
        # remain completely unchanged.
        # ---------------------------------------------
        if (
            request is not None
            and instance is not None
            and get_user_role(
                request.user
            ) == ROLE_SALES
        ):
            attributes.pop(
                "wholesale_price",
                None,
            )

            attributes.pop(
                "retail_price",
                None,
            )

        wholesale_price = (
            attributes.get(
                "wholesale_price",
                getattr(
                    instance,
                    "wholesale_price",
                    None,
                ),
            )
        )

        retail_price = (
            attributes.get(
                "retail_price",
                getattr(
                    instance,
                    "retail_price",
                    None,
                ),
            )
        )

        if (
            wholesale_price is not None
            and retail_price is not None
            and retail_price
            < wholesale_price
        ):
            raise serializers.ValidationError(
                {
                    "retail_price": (
                        "Retail price cannot "
                        "be lower than "
                        "wholesale price."
                    )
                }
            )

        return attributes

    @staticmethod
    def _clean_required_text(
        value,
        field_name,
    ):
        cleaned_value = (
            value.strip()
        )

        if not cleaned_value:
            raise (
                serializers.ValidationError(
                    (
                        f"{field_name} "
                        "cannot be empty."
                    )
                )
            )

        return cleaned_value


class LaptopImportPreviewSerializer(
    serializers.Serializer
):
    file = serializers.FileField(
        write_only=True,
    )

    def validate_file(
        self,
        uploaded_file,
    ):
        file_extension = Path(
            uploaded_file.name
        ).suffix.lower()

        if file_extension != ".xlsx":
            raise serializers.ValidationError(
                (
                    "Only .xlsx spreadsheet "
                    "files are supported."
                )
            )

        if uploaded_file.size == 0:
            raise serializers.ValidationError(
                (
                    "The uploaded spreadsheet "
                    "is empty."
                )
            )

        if (
            uploaded_file.size
            > MAX_IMPORT_FILE_SIZE
        ):
            raise serializers.ValidationError(
                (
                    "The spreadsheet must "
                    "not exceed 5 MB."
                )
            )

        return uploaded_file


class LaptopImportConfirmRowSerializer(
    serializers.Serializer
):
    row_number = (
        serializers.IntegerField(
            min_value=2,
        )
    )

    data = serializers.DictField(
        allow_empty=False,
    )


class LaptopImportConfirmSerializer(
    serializers.Serializer
):
    MAX_ROWS = 5000

    rows = (
        LaptopImportConfirmRowSerializer(
            many=True,
            allow_empty=False,
        )
    )

    def validate_rows(
        self,
        value,
    ):
        if (
            len(value)
            > self.MAX_ROWS
        ):
            raise serializers.ValidationError(
                (
                    f"A maximum of "
                    f"{self.MAX_ROWS} rows "
                    "can be confirmed in "
                    "one request."
                )
            )

        return value


class OrderItemReadSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = OrderItem

        fields = (
            "id",
            "laptop",
            "item_name",
            "serial_number_snapshot",
            "description_snapshot",
            "quantity",
            "unit_price",
            "line_total",
            "is_custom_item",
        )

        read_only_fields = fields


class OrderReadSerializer(
    serializers.ModelSerializer
):
    employee_name = (
        serializers.SerializerMethodField()
    )

    price_mode_label = (
        serializers.CharField(
            source="get_price_mode_display",
            read_only=True,
        )
    )

    status_label = (
        serializers.CharField(
            source="get_status_display",
            read_only=True,
        )
    )

    via_label = (
        serializers.CharField(
            source="get_via_display",
            read_only=True,
        )
    )

    items = OrderItemReadSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order

        fields = (
            "id",
            "order_number",
            "employee",
            "employee_name",
            "source_return",
            "customer_name",
            "customer_address",
            "price_mode",
            "price_mode_label",
            "status",
            "status_label",
            "via",
            "via_label",
            "via_other",
            "total_items",
            "total_amount",
            "created_at",
            "updated_at",
            "dispatched_at",
            "items",
        )

        read_only_fields = fields

    def get_serial_numbers(
        self,
        obj,
    ):
        return [
            item.serial_number_snapshot
            for item in obj.items.all()
            if item.serial_number_snapshot
        ]

    def get_serial_numbers(
        self,
        obj,
    ):
        return [
            item.serial_number_snapshot
            for item
            in obj.items.all()
            if (
                item.serial_number_snapshot
            )
        ]

    def get_employee_name(
        self,
        obj,
    ):
        full_name = (
            obj.employee
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or obj.employee.username
        )


class OrderLaptopItemCreateSerializer(
    serializers.Serializer
):
    laptop_id = (
        serializers.IntegerField(
            min_value=1,
        )
    )

    quantity = (
        serializers.IntegerField(
            min_value=1,
        )
    )


class OrderCustomItemCreateSerializer(
    serializers.Serializer
):
    item_name = (
        serializers.CharField(
            max_length=255,
            allow_blank=False,
            trim_whitespace=True,
        )
    )

    quantity = (
        serializers.IntegerField(
            min_value=1,
        )
    )

    unit_price = (
        serializers.DecimalField(
            max_digits=14,
            decimal_places=2,
            min_value=Decimal(
                "0.00"
            ),
        )
    )


class OrderCreateSerializer(
    serializers.Serializer
):
    customer_name = (
        serializers.CharField(
            max_length=150,
            allow_blank=False,
            trim_whitespace=True,
        )
    )

    customer_address = (
        serializers.CharField(
            required=False,
            allow_blank=True,
            default="",
            trim_whitespace=True,
        )
    )

    price_mode = (
        serializers.ChoiceField(
            choices=(
                Order.PriceMode.choices
            ),
        )
    )

    via = serializers.ChoiceField(
        choices=Order.Via.choices,
    )

    via_other = (
        serializers.CharField(
            required=False,
            allow_blank=True,
            default="",
            max_length=150,
            trim_whitespace=True,
        )
    )

    laptop_items = (
        OrderLaptopItemCreateSerializer(
            many=True,
            required=False,
            default=list,
        )
    )

    custom_items = (
        OrderCustomItemCreateSerializer(
            many=True,
            required=False,
            default=list,
        )
    )

    def validate(
        self,
        attrs,
    ):
        laptop_items = (
            attrs.get(
                "laptop_items",
                [],
            )
        )

        custom_items = (
            attrs.get(
                "custom_items",
                [],
            )
        )

        if (
            not laptop_items
            and not custom_items
        ):
            raise (
                serializers.ValidationError(
                    {
                        "items": (
                            "At least one laptop "
                            "or custom item "
                            "is required."
                        )
                    }
                )
            )

        laptop_ids = [
            item["laptop_id"]
            for item
            in laptop_items
        ]

        if (
            len(laptop_ids)
            != len(
                set(laptop_ids)
            )
        ):
            raise (
                serializers.ValidationError(
                    {
                        "laptop_items": (
                            "The same laptop "
                            "cannot be added "
                            "more than once."
                        )
                    }
                )
            )

        via = attrs.get(
            "via"
        )

        via_other = (
            attrs.get(
                "via_other",
                "",
            )
            .strip()
        )

        if (
            via
            == Order.Via.OTHER
            and not via_other
        ):
            raise (
                serializers.ValidationError(
                    {
                        "via_other": (
                            "This field is "
                            "required when "
                            "Via is Other."
                        )
                    }
                )
            )

        if (
            via
            != Order.Via.OTHER
        ):
            attrs[
                "via_other"
            ] = ""

        return attrs

    def create(
        self,
        validated_data,
    ):
        request = self.context[
            "request"
        ]

        try:
            return (
                OrderCreationService
                .create_order(
                    employee=(
                        request.user
                    ),
                    customer_name=(
                        validated_data[
                            "customer_name"
                        ]
                    ),
                    customer_address=(
                        validated_data.get(
                            "customer_address",
                            "",
                        )
                    ),
                    price_mode=(
                        validated_data[
                            "price_mode"
                        ]
                    ),
                    via=(
                        validated_data[
                            "via"
                        ]
                    ),
                    via_other=(
                        validated_data.get(
                            "via_other",
                            "",
                        )
                    ),
                    laptop_items=(
                        validated_data.get(
                            "laptop_items",
                            [],
                        )
                    ),
                    custom_items=(
                        validated_data.get(
                            "custom_items",
                            [],
                        )
                    ),
                )
            )

        except (
            OrderInventoryError
        ) as exc:
            raise (
                serializers.ValidationError(
                    {
                        "inventory": str(
                            exc
                        ),
                    }
                )
            ) from exc

        except (
            OrderValidationError
        ) as exc:
            raise (
                serializers.ValidationError(
                    {
                        "order": str(
                            exc
                        ),
                    }
                )
            ) from exc


class OrderBulkDispatchSerializer(
    serializers.Serializer
):
    order_ids = (
        serializers.ListField(
            child=(
                serializers.IntegerField(
                    min_value=1,
                )
            ),
            allow_empty=False,
        )
    )

    def validate_order_ids(
        self,
        value,
    ):
        unique_ids = list(
            dict.fromkeys(
                value
            )
        )

        return unique_ids


class OrderDeletionRequestCreateSerializer(
    serializers.Serializer
):
    reason = (
        serializers.CharField(
            allow_blank=False,
            trim_whitespace=True,
            max_length=2000,
        )
    )


class OrderDeletionRequestReadSerializer(
    serializers.ModelSerializer
):
    order_number = (
        serializers.CharField(
            source=(
                "order.order_number"
            ),
            read_only=True,
        )
    )

    customer_name = (
        serializers.CharField(
            source=(
                "order.customer_name"
            ),
            read_only=True,
        )
    )

    requested_by_name = (
        serializers.SerializerMethodField()
    )

    reviewed_by_name = (
        serializers.SerializerMethodField()
    )

    status_label = (
        serializers.CharField(
            source=(
                "get_status_display"
            ),
            read_only=True,
        )
    )

    class Meta:
        model = (
            OrderDeletionRequest
        )

        fields = (
            "id",
            "order",
            "order_number",
            "customer_name",
            "requested_by",
            "requested_by_name",
            "reason",
            "status",
            "status_label",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
        )

        read_only_fields = fields

    def get_requested_by_name(
        self,
        obj,
    ):
        full_name = (
            obj.requested_by
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or obj.requested_by
            .username
        )

    def get_reviewed_by_name(
        self,
        obj,
    ):
        if not obj.reviewed_by:
            return None

        full_name = (
            obj.reviewed_by
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or obj.reviewed_by
            .username
        )




class OrderPendingFilterSerializer(
    serializers.Serializer
):
    search = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    start_date = serializers.DateField(
        required=False,
    )

    end_date = serializers.DateField(
        required=False,
    )

    def validate(
        self,
        attrs,
    ):
        start_date = attrs.get(
            "start_date"
        )
        end_date = attrs.get(
            "end_date"
        )

        if (
            start_date
            and end_date
            and start_date > end_date
        ):
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be before "
                        "start date."
                    )
                }
            )

        return attrs


class OrderSalesFilterSerializer(
    serializers.Serializer
):
    start_date = (
        serializers.DateField(
            required=False,
        )
    )

    end_date = (
        serializers.DateField(
            required=False,
        )
    )

    employee_id = (
        serializers.IntegerField(
            required=False,
            min_value=1,
        )
    )

    search = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate(
        self,
        attrs,
    ):
        start_date = (
            attrs.get(
                "start_date"
            )
        )

        end_date = (
            attrs.get(
                "end_date"
            )
        )

        if (
            start_date
            and end_date
            and start_date
            > end_date
        ):
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot "
                        "be before "
                        "start date."
                    )
                }
            )

        return attrs


class OrderSalesReadSerializer(
    serializers.ModelSerializer
):
    price_mode_label = (
        serializers.CharField(
            source=(
                "get_price_mode_display"
            ),
            read_only=True,
        )
    )

    via_label = (
        serializers.SerializerMethodField()
    )

    items_text = (
        serializers.SerializerMethodField()
    )

    serial_numbers = (
        serializers.SerializerMethodField()
    )

    employee_name = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Order

        fields = (
            "id",
            "order_number",

            "employee",
            "employee_name",

            "customer_name",
            "customer_address",

            "items_text",
            "serial_numbers",

            "total_items",
            "total_amount",

            "price_mode",
            "price_mode_label",

            "via",
            "via_label",

            "created_at",
            "dispatched_at",
        )

        read_only_fields = fields

    def get_via_label(
        self,
        obj,
    ):
        if (
            obj.via
            == Order.Via.OTHER
            and obj.via_other
        ):
            return obj.via_other

        return (
            obj.get_via_display()
        )

    def get_items_text(
        self,
        obj,
    ):
        return [
            (
                f"{item.item_name} - "
                f"{item.quantity} pcs"
            )
            for item
            in obj.items.all()
        ]

    def get_serial_numbers(
        self,
        obj,
    ):
        return [
            item.serial_number_snapshot
            for item
            in obj.items.all()
            if (
                item.serial_number_snapshot
            )
        ]

    def get_employee_name(
        self,
        obj,
    ):
        if not obj.employee:
            return None

        full_name = (
            obj.employee
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or obj.employee.username
        )