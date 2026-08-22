from decimal import Decimal
from pathlib import Path

from django.contrib.auth import (
    get_user_model,
)
from rest_framework import serializers

from apps.inventory.models import (
    Laptop,
    Return,
    ReturnExpense,
)
from apps.inventory.roles import (
    ROLE_TECHNICIAN,
    get_user_role,
)


User = get_user_model()


class ReturnReadSerializer(
    serializers.ModelSerializer
):
    display_type_label = (
        serializers.CharField(
            source=(
                "get_display_type_display"
            ),
            read_only=True,
        )
    )

    storage_type_label = (
        serializers.CharField(
            source=(
                "get_storage_type_display"
            ),
            read_only=True,
        )
    )

    service_rack = (
        serializers.CharField(
            max_length=100,
            trim_whitespace=True,
        )
    )
    
    priority_label = (
        serializers.CharField(
            source=(
                "get_priority_display"
            ),
            read_only=True,
        )
    )

    status_label = (
        serializers.CharField(
            source=(
                "get_status_display"
            ),
            read_only=True,
        )
    )

    technician_name = (
        serializers.SerializerMethodField()
    )

    created_by_name = (
        serializers.SerializerMethodField()
    )

    stocked_in_by_name = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Return

        fields = (
            "id",

            "source_type",
            "source_laptop",
            "source_inventory_status",

            "customer_name",
            "customer_address",

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

            "issue",

            "service_rack",

            "technician",
            "technician_name",

            "priority",
            "priority_label",

            "status",
            "status_label",

            "repair_notes",

            "created_by",
            "created_by_name",

            "stocked_in_laptop",

            "stocked_in_by",
            "stocked_in_by_name",
            "stocked_in_at",

            "created_at",
            "updated_at",
        )

        read_only_fields = fields

    def get_technician_name(
        self,
        obj,
    ):
        return self._user_name(
            obj.technician
        )

    def get_created_by_name(
        self,
        obj,
    ):
        return self._user_name(
            obj.created_by
        )

    def get_stocked_in_by_name(
        self,
        obj,
    ):
        return self._user_name(
            obj.stocked_in_by
        )

    @staticmethod
    def _user_name(
        user,
    ):
        if user is None:
            return None

        full_name = (
            user
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or user.username
        )


class ReturnCreateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Return

        fields = (
            "customer_name",
            "customer_address",

            "company",
            "display_type",
            "model_number",
            "processor",
            "processor_generation",
            "ram_gb",
            "storage_gb",
            "storage_type",
            "serial_number",

            "issue",

            "service_rack",

            "technician",
        )

    def validate_customer_name(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Customer name",
        )

    def validate_customer_address(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Customer address",
        )

    def validate_company(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Company",
        )

    def validate_model_number(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Model number",
        )

    def validate_processor(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Processor",
        )

    def validate_serial_number(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Serial number",
        )

    def validate_issue(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Issue",
        )

    def validate_service_rack(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Service rack",
        )

    def validate_processor_generation(
        self,
        value,
    ):
        return str(
            value or ""
        ).strip()

    def validate_technician(
        self,
        user,
    ):
        return (
            validate_technician_user(
                user
            )
        )

    def create(
        self,
        validated_data,
    ):
        request = (
            self.context[
                "request"
            ]
        )

        return (
            Return.objects.create(
                created_by=(
                    request.user
                ),

                priority=(
                    Return
                    .Priority
                    .NORMAL
                ),

                status=(
                    Return
                    .Status
                    .RECEIVED
                ),

                **validated_data,
            )
        )

    @staticmethod
    def _clean_required_text(
        value,
        field_name,
    ):
        cleaned = str(
            value or ""
        ).strip()

        if not cleaned:
            raise (
                serializers.ValidationError(
                    (
                        f"{field_name} "
                        "cannot be empty."
                    )
                )
            )

        return cleaned


class ReturnUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Return

        fields = (
            "customer_name",
            "customer_address",

            "company",
            "display_type",
            "model_number",
            "processor",
            "processor_generation",
            "ram_gb",
            "storage_gb",
            "storage_type",
            "serial_number",

            "issue",

            "service_rack",

            "repair_notes",
        )

    def validate_customer_name(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Customer name",
        )

    def validate_customer_address(
        self,
        value,
    ):
        if (
            self.instance is not None
            and self.instance.source_type
            == Return.SourceType.INVENTORY_SERVICE
        ):
            return str(
                value or ""
            ).strip()

        return self._clean_required_text(
            value,
            "Customer address",
        )

    def validate_company(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Company",
        )

    def validate_model_number(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Model number",
        )

    def validate_processor(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Processor",
        )

    def validate_serial_number(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Serial number",
        )

    def validate_issue(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Issue",
        )

    def validate_service_rack(
        self,
        value,
    ):
        return self._clean_required_text(
            value,
            "Service rack",
        )

    def validate_processor_generation(
        self,
        value,
    ):
        return str(
            value or ""
        ).strip()

    @staticmethod
    def _clean_required_text(
        value,
        field_name,
    ):
        cleaned = str(
            value or ""
        ).strip()

        if not cleaned:
            raise (
                serializers.ValidationError(
                    (
                        f"{field_name} "
                        "cannot be empty."
                    )
                )
            )

        return cleaned


class ReturnPrioritySerializer(
    serializers.Serializer
):
    priority = (
        serializers.ChoiceField(
            choices=(
                Return
                .Priority
                .choices
            )
        )
    )


class ReturnTechnicianAssignmentSerializer(
    serializers.Serializer
):
    technician = (
        serializers.PrimaryKeyRelatedField(
            queryset=(
                User.objects.all()
            ),
            allow_null=True,
            required=True,
        )
    )

    def validate_technician(
        self,
        user,
    ):
        return (
            validate_technician_user(
                user
            )
        )

class ReturnStatusUpdateSerializer(
    serializers.Serializer
):
    status = (
        serializers.ChoiceField(
            choices=(
                Return
                .Status
                .choices
            )
        )
    )

    repair_notes = (
        serializers.CharField(
            required=False,
            allow_blank=True,
            trim_whitespace=True,
        )
    )

    def validate(
        self,
        attrs,
    ):
        return_record = (
            self.context[
                "return_record"
            ]
        )

        current_status = (
            return_record.status
        )

        new_status = (
            attrs[
                "status"
            ]
        )

        if (
            current_status
            == new_status
        ):
            return attrs

        if (
            return_record.source_type
            == Return.SourceType.INVENTORY_SERVICE
        ):
            inventory_service_transitions = {
                Return.Status.IN_SERVICE: {
                    Return.Status.REPAIR_COMPLETED,
                },
                Return.Status.REPAIR_COMPLETED: {
                    Return.Status.IN_SERVICE,
                },
            }

            allowed_statuses = (
                inventory_service_transitions.get(
                    current_status,
                    set(),
                )
            )

            if new_status not in allowed_statuses:
                raise serializers.ValidationError({
                    "status": (
                        "Inventory service laptops can "
                        "move only between In Service "
                        "and Repair Completed before Done."
                    )
                })

            return attrs

        allowed_transitions = {
            Return.Status.RECEIVED: {
                Return.Status.IN_SERVICE,
            },

            Return.Status.IN_SERVICE: {
                Return.Status.RECEIVED,
                Return.Status.REPAIR_COMPLETED,
                Return.Status.SWAP_REQUESTED,
            },

            Return.Status.REPAIR_COMPLETED: {
                Return.Status.IN_SERVICE,
            },

            Return.Status.SWAP_REQUESTED: {
                Return.Status.IN_SERVICE,
            },

            Return.Status.READY_FOR_DISPATCH: {
                Return.Status.REPAIR_COMPLETED,
            },

            Return.Status.STOCKED_IN: set(),

            Return.Status.DISPATCHED: set(),
        }

        allowed_statuses = (
            allowed_transitions.get(
                current_status,
                set(),
            )
        )

        if (
            new_status
            not in allowed_statuses
        ):
            raise (
                serializers.ValidationError(
                    {
                        "status": (
                            "Invalid return status "
                            "transition from "
                            f"{current_status} to "
                            f"{new_status}."
                        )
                    }
                )
            )

        return attrs
    

class ReturnTechnicianSerializer(
    serializers.ModelSerializer
):
    name = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "name",
        )

        read_only_fields = fields

    def get_name(
        self,
        user,
    ):
        full_name = (
            user
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or user.username
        )


def validate_technician_user(
    user,
):
    if user is None:
        return None

    if (
        get_user_role(
            user
        )
        != ROLE_TECHNICIAN
    ):
        raise (
            serializers.ValidationError(
                (
                    "The selected user "
                    "must have the "
                    "Technician role."
                )
            )
        )

    if not user.is_active:
        raise (
            serializers.ValidationError(
                (
                    "The selected "
                    "technician is inactive."
                )
            )
        )

    return user


class ReturnStockInSerializer(
    serializers.Serializer
):
    company = (
        serializers.CharField(
            max_length=100,
            trim_whitespace=True,
        )
    )

    display_type = (
        serializers.ChoiceField(
            choices=(
                Laptop
                .DisplayType
                .choices
            )
        )
    )

    model_number = (
        serializers.CharField(
            max_length=100,
            trim_whitespace=True,
        )
    )

    processor = (
        serializers.CharField(
            max_length=100,
            trim_whitespace=True,
        )
    )

    processor_generation = (
        serializers.CharField(
            max_length=50,
            required=False,
            allow_blank=True,
            default="",
            trim_whitespace=True,
        )
    )

    ram_gb = (
        serializers.IntegerField(
            min_value=1,
        )
    )

    storage_gb = (
        serializers.IntegerField(
            min_value=1,
        )
    )

    storage_type = (
        serializers.ChoiceField(
            choices=(
                Laptop
                .StorageType
                .choices
            )
        )
    )

    serial_number = (
        serializers.CharField(
            max_length=100,
            trim_whitespace=True,
        )
    )

    wholesale_price = (
        serializers.DecimalField(
            max_digits=12,
            decimal_places=2,
            min_value=(
                Decimal("0.00")
            ),
        )
    )

    retail_price = (
        serializers.DecimalField(
            max_digits=12,
            decimal_places=2,
            min_value=(
                Decimal("0.00")
            ),
        )
    )

    qc_status = (
        serializers.ChoiceField(
            choices=(
                Laptop
                .QCStatus
                .choices
            )
        )
    )

    inventory_status = (
        serializers.ChoiceField(
            choices=[
                (
                    Laptop
                    .InventoryStatus
                    .IN_STOCK
                ),

                (
                    Laptop
                    .InventoryStatus
                    .IN_STOCK_G
                ),

                (
                    Laptop
                    .InventoryStatus
                    .IN_SERVICE
                ),
            ]
        )
    )

    warranty_days = (
        serializers.ChoiceField(
            choices=(
                Laptop
                .WarrantyDays
                .choices
            )
        )
    )

    area = (
        serializers.CharField(
            max_length=100,
            trim_whitespace=True,
        )
    )

    comments = (
        serializers.CharField(
            required=False,
            allow_blank=True,
            default="",
            trim_whitespace=True,
        )
    )

    def validate_serial_number(
        self,
        value,
    ):
        serial_number = (
            value.strip()
        )

        if not serial_number:
            raise (
                serializers.ValidationError(
                    (
                        "Serial number "
                        "cannot be empty."
                    )
                )
            )

        if (
            Laptop.objects
            .filter(
                serial_number__iexact=(
                    serial_number
                )
            )
            .exists()
        ):
            raise (
                serializers.ValidationError(
                    (
                        "A laptop with this "
                        "serial number already "
                        "exists in inventory."
                    )
                )
            )

        return serial_number

    def validate_company(
        self,
        value,
    ):
        return (
            self._required_text(
                value,
                "Company",
            )
        )

    def validate_model_number(
        self,
        value,
    ):
        return (
            self._required_text(
                value,
                "Model number",
            )
        )

    def validate_processor(
        self,
        value,
    ):
        return (
            self._required_text(
                value,
                "Processor",
            )
        )

    def validate_area(
        self,
        value,
    ):
        return (
            self._required_text(
                value,
                "Area",
            )
        )

    def validate(
        self,
        attrs,
    ):
        attrs = super().validate(
            attrs
        )

        wholesale_price = (
            attrs[
                "wholesale_price"
            ]
        )

        retail_price = (
            attrs[
                "retail_price"
            ]
        )

        if (
            retail_price
            < wholesale_price
        ):
            raise (
                serializers.ValidationError(
                    {
                        "retail_price": (
                            "Retail price "
                            "cannot be lower "
                            "than wholesale "
                            "price."
                        )
                    }
                )
            )

        return attrs

    @staticmethod
    def _required_text(
        value,
        field_name,
    ):
        cleaned = (
            str(
                value or ""
            )
            .strip()
        )

        if not cleaned:
            raise (
                serializers.ValidationError(
                    (
                        f"{field_name} "
                        "cannot be empty."
                    )
                )
            )

        return cleaned
    
RETURN_IMPORT_MAX_FILE_SIZE = (
    5 * 1024 * 1024
)


class ReturnImportPreviewSerializer(
    serializers.Serializer
):
    file = serializers.FileField(
        write_only=True,
    )

    def validate_file(
        self,
        uploaded_file,
    ):
        extension = (
            Path(
                uploaded_file.name
            )
            .suffix
            .lower()
        )

        if extension != ".xlsx":
            raise (
                serializers.ValidationError(
                    (
                        "Only .xlsx "
                        "spreadsheet files "
                        "are supported."
                    )
                )
            )

        if uploaded_file.size == 0:
            raise (
                serializers.ValidationError(
                    (
                        "The uploaded "
                        "spreadsheet is empty."
                    )
                )
            )

        if (
            uploaded_file.size
            > RETURN_IMPORT_MAX_FILE_SIZE
        ):
            raise (
                serializers.ValidationError(
                    (
                        "The spreadsheet "
                        "must not exceed 5 MB."
                    )
                )
            )

        return uploaded_file


class ReturnImportConfirmRowSerializer(
    serializers.Serializer
):
    row_number = (
        serializers.IntegerField(
            min_value=2,
        )
    )

    data = (
        serializers.DictField(
            allow_empty=False,
        )
    )


class ReturnImportConfirmSerializer(
    serializers.Serializer
):
    MAX_ROWS = 5000

    rows = (
        ReturnImportConfirmRowSerializer(
            many=True,
            allow_empty=False,
        )
    )

    def validate_rows(
        self,
        rows,
    ):
        if (
            len(rows)
            > self.MAX_ROWS
        ):
            raise (
                serializers.ValidationError(
                    (
                        "A maximum of "
                        f"{self.MAX_ROWS} "
                        "rows can be imported "
                        "at one time."
                    )
                )
            )

        return rows


class ReturnFilterSerializer(
    serializers.Serializer
):
    status = (
        serializers.ChoiceField(
            choices=(
                Return.Status.choices
            ),
            required=False,
        )
    )

    priority = (
        serializers.ChoiceField(
            choices=(
                Return.Priority.choices
            ),
            required=False,
        )
    )

    service_rack = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    technician = (
        serializers.IntegerField(
            min_value=1,
            required=False,
        )
    )

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
            raise (
                serializers.ValidationError(
                    {
                        "end_date": (
                            "End date cannot "
                            "be before "
                            "start date."
                        )
                    }
                )
            )

        return attrs
    
class ReturnStockedInFilterSerializer(
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

    search = (
        serializers.CharField(
            required=False,
            allow_blank=True,
            trim_whitespace=True,
        )
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
            raise (
                serializers.ValidationError(
                    {
                        "end_date": (
                            "End date cannot "
                            "be before "
                            "start date."
                        )
                    }
                )
            )

        return attrs


class ReturnStockedInReadSerializer(
    serializers.ModelSerializer
):
    stocked_in_by_name = (
        serializers.SerializerMethodField()
    )

    laptop = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Return

        fields = (
            "id",
            "customer_name",
            "customer_address",
            "serial_number",
            "stocked_in_at",
            "stocked_in_by",
            "stocked_in_by_name",
            "stocked_in_laptop",
            "laptop",
        )

        read_only_fields = fields

    def get_stocked_in_by_name(
        self,
        obj,
    ):
        user = (
            obj.stocked_in_by
        )

        if user is None:
            return None

        full_name = (
            user
            .get_full_name()
            .strip()
        )

        return (
            full_name
            or user.username
        )

    def get_laptop(
        self,
        obj,
    ):
        laptop = (
            obj.stocked_in_laptop
        )

        if laptop is None:
            return None

        return {
            "id":
                laptop.id,

            "company":
                laptop.company,

            "display_type":
                laptop.display_type,

            "display_type_label":
                laptop
                .get_display_type_display(),

            "model_number":
                laptop.model_number,

            "processor":
                laptop.processor,

            "processor_generation":
                laptop
                .processor_generation,

            "ram_gb":
                laptop.ram_gb,

            "storage_gb":
                laptop.storage_gb,

            "storage_type":
                laptop.storage_type,

            "storage_type_label":
                laptop
                .get_storage_type_display(),

            "serial_number":
                laptop.serial_number,

            "wholesale_price":
                laptop.wholesale_price,

            "retail_price":
                laptop.retail_price,

            "qc_status":
                laptop.qc_status,

            "inventory_status":
                laptop.inventory_status,

            "warranty_days":
                laptop.warranty_days,

            "area":
                laptop.area,
        }

class ReturnExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnExpense
        fields = (
            "item_name",
            "unit_price",
            "quantity",
        )

    def validate_item_name(self, value):
        cleaned = str(value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Item name cannot be empty.")
        return cleaned

    def create(self, validated_data):
        request = self.context["request"]
        return_record = self.context["return_record"]
        return ReturnExpense.objects.create(
            return_record=return_record,
            created_by=request.user,
            **validated_data,
        )


class ReturnExpenseReadSerializer(serializers.ModelSerializer):
    return_id = serializers.IntegerField(source="return_record_id", read_only=True)
    customer_name = serializers.CharField(source="return_record.customer_name", read_only=True)
    company = serializers.CharField(source="return_record.company", read_only=True)
    model_number = serializers.CharField(source="return_record.model_number", read_only=True)
    serial_number = serializers.CharField(source="return_record.serial_number", read_only=True)
    technician_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReturnExpense
        fields = (
            "id",
            "return_id",
            "customer_name",
            "company",
            "model_number",
            "serial_number",
            "technician_name",
            "item_name",
            "unit_price",
            "quantity",
            "total_amount",
            "created_by",
            "created_by_name",
            "created_at",
        )
        read_only_fields = fields

    def get_technician_name(self, obj):
        user = obj.return_record.technician
        if not user:
            return None
        return user.get_full_name().strip() or user.username

    def get_created_by_name(self, obj):
        user = obj.created_by
        return user.get_full_name().strip() or user.username


class ReturnExpenseFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return attrs

