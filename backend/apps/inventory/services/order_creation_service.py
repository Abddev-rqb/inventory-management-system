from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.db import transaction

from apps.inventory.api_exceptions import (
    OrderInventoryError,
    OrderValidationError,
)
from apps.inventory.models import (
    Laptop,
    Order,
    OrderItem,
)


class OrderCreationService:
    """
    Creates an order and reduces laptop
    inventory inside one database transaction.
    """

    @classmethod
    @transaction.atomic
    def create_order(
        cls,
        *,
        employee,
        customer_name,
        customer_address="",
        price_mode,
        via,
        via_other="",
        laptop_items,
        custom_items=None,
    ):
        custom_items = custom_items or []

        customer_name = str(
            customer_name or ""
        ).strip()

        customer_address = str(
            customer_address or ""
        ).strip()

        via_other = str(
            via_other or ""
        ).strip()

        if via != Order.Via.OTHER:
            via_other = ""

        cls._validate_order_header(
            employee=employee,
            customer_name=customer_name,
            price_mode=price_mode,
            via=via,
            via_other=via_other,
        )

        prepared_laptop_items = (
            cls._prepare_laptop_items(
                laptop_items=laptop_items,
                price_mode=price_mode,
            )
        )

        prepared_custom_items = (
            cls._prepare_custom_items(
                custom_items=custom_items,
            )
        )

        all_items = [
            *prepared_laptop_items,
            *prepared_custom_items,
        ]

        if not all_items:
            raise OrderValidationError(
                "At least one order item is required."
            )

        total_items = sum(
            item["quantity"]
            for item in all_items
        )

        total_amount = sum(
            (
                item["line_total"]
                for item in all_items
            ),
            Decimal("0.00"),
        )

        order = Order.objects.create(
            order_number=(
                cls._generate_order_number()
            ),
            employee=employee,
            customer_name=customer_name,
            customer_address=customer_address,
            price_mode=price_mode,
            status=Order.Status.PENDING,
            via=via,
            via_other=via_other,
            total_items=total_items,
            total_amount=total_amount,
        )

        order_items = []

        for item in prepared_laptop_items:
            laptop = item["laptop"]

            order_items.append(
                OrderItem(
                    order=order,
                    laptop=laptop,
                    item_name=item[
                        "item_name"
                    ],
                    serial_number_snapshot=(
                        laptop.serial_number
                    ),
                    description_snapshot=(
                        item[
                            "description_snapshot"
                        ]
                    ),
                    quantity=item[
                        "quantity"
                    ],
                    unit_price=item[
                        "unit_price"
                    ],
                    line_total=item[
                        "line_total"
                    ],
                    is_custom_item=False,

                    inventory_status_before_sale=(
                        laptop.inventory_status
                    ),
                )
            )

            laptop.inventory_status = (
                Laptop.InventoryStatus.SOLD
            )

            laptop.save(
                update_fields=[
                    "inventory_status",
                    "updated_at",
                ]
            )

        for item in prepared_custom_items:
            order_items.append(
                OrderItem(
                    order=order,
                    laptop=None,
                    item_name=item["item_name"],
                    serial_number_snapshot="",
                    description_snapshot=(
                        item["item_name"]
                    ),
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    line_total=item["line_total"],
                    is_custom_item=True,
                )
            )

        OrderItem.objects.bulk_create(
            order_items
        )

        return order

    @classmethod
    def _prepare_laptop_items(
        cls,
        *,
        laptop_items,
        price_mode,
    ):
        if not isinstance(
            laptop_items,
            list,
        ):
            raise OrderValidationError(
                "Laptop items must be a list."
            )

        prepared_items = []

        seen_laptop_ids = set()

        for item in laptop_items:
            if not isinstance(
                item,
                dict,
            ):
                raise OrderValidationError(
                    (
                        "Each laptop item must "
                        "be an object."
                    )
                )

            laptop_id = item.get(
                "laptop_id"
            )

            if (
                isinstance(laptop_id, bool)
                or not isinstance(
                    laptop_id,
                    int,
                )
                or laptop_id < 1
            ):
                raise OrderValidationError(
                    (
                        "Laptop ID must be a "
                        "positive integer."
                    )
                )

            quantity = (
                cls._validate_positive_integer(
                    item.get("quantity"),
                    field_name=(
                        "Laptop quantity"
                    ),
                )
            )
            
            if quantity != 1:
                raise OrderValidationError(
                    (
                        "A serialized laptop can only "
                        "be sold as one physical unit."
                    )
                )

            if (
                laptop_id
                in seen_laptop_ids
            ):
                raise OrderValidationError(
                    (
                        "The same laptop cannot "
                        "appear more than once "
                        "in one order."
                    )
                )

            seen_laptop_ids.add(
                laptop_id
            )

            try:
                laptop = (
                    Laptop.objects
                    .select_for_update()
                    .get(
                        pk=laptop_id,
                    )
                )
            except Laptop.DoesNotExist:
                raise OrderValidationError(
                    (
                        f"Laptop with ID "
                        f"{laptop_id} "
                        "does not exist."
                    )
                ) from None

            allowed_inventory_statuses = {
                (
                    Laptop.InventoryStatus
                    .IN_STOCK
                ),
                (
                    Laptop.InventoryStatus
                    .IN_STOCK_G
                ),
            }

            if (
                laptop.inventory_status
                not in allowed_inventory_statuses
            ):
                raise OrderInventoryError(
                    (
                        f"Laptop "
                        f"{laptop.serial_number} "
                        "is not available for sale."
                    )
                )

            if laptop.quantity != 1:
                raise OrderInventoryError(
                    (
                        f"Laptop "
                        f"{laptop.serial_number} "
                        "has invalid inventory quantity."
                    )
                )

            unit_price = (
                cls._get_laptop_price(
                    laptop=laptop,
                    price_mode=price_mode,
                )
            )

            line_total = (
                unit_price
                * quantity
            ).quantize(
                Decimal("0.01")
            )

            prepared_items.append(
                {
                    "laptop": laptop,
                    "item_name": (
                        cls._build_laptop_name(
                            laptop
                        )
                    ),
                    "description_snapshot": (
                        cls
                        ._build_laptop_description(
                            laptop
                        )
                    ),
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "line_total": line_total,
                }
            )

        return prepared_items

    @classmethod
    def _prepare_custom_items(
        cls,
        *,
        custom_items,
    ):
        if not isinstance(
            custom_items,
            list,
        ):
            raise OrderValidationError(
                "Custom items must be a list."
            )

        prepared_items = []

        for item in custom_items:
            if not isinstance(
                item,
                dict,
            ):
                raise OrderValidationError(
                    (
                        "Each custom item must "
                        "be an object."
                    )
                )

            item_name = str(
                item.get(
                    "item_name",
                    "",
                )
            ).strip()

            if not item_name:
                raise OrderValidationError(
                    (
                        "Custom item name "
                        "is required."
                    )
                )

            quantity = (
                cls._validate_positive_integer(
                    item.get("quantity"),
                    field_name=(
                        "Custom item quantity"
                    ),
                )
            )

            unit_price = (
                cls._parse_non_negative_money(
                    item.get(
                        "unit_price"
                    ),
                    field_name=(
                        "Custom item unit price"
                    ),
                )
            )

            line_total = (
                unit_price
                * quantity
            ).quantize(
                Decimal("0.01")
            )

            prepared_items.append(
                {
                    "item_name": item_name,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "line_total": line_total,
                }
            )

        return prepared_items

    @staticmethod
    def _validate_order_header(
        *,
        employee,
        customer_name,
        price_mode,
        via,
        via_other,
    ):
        if (
            employee is None
            or not getattr(
                employee,
                "is_authenticated",
                False,
            )
        ):
            raise OrderValidationError(
                (
                    "An authenticated employee "
                    "is required."
                )
            )

        if not customer_name:
            raise OrderValidationError(
                "Customer name is required."
            )

        valid_price_modes = {
            choice
            for choice, _
            in Order.PriceMode.choices
        }

        if (
            price_mode
            not in valid_price_modes
        ):
            raise OrderValidationError(
                "Invalid price mode."
            )

        valid_via_values = {
            choice
            for choice, _
            in Order.Via.choices
        }

        if via not in valid_via_values:
            raise OrderValidationError(
                "Invalid delivery method."
            )

        if (
            via == Order.Via.OTHER
            and not via_other
        ):
            raise OrderValidationError(
                (
                    "Via description is required "
                    "when Via is Other."
                )
            )

    @staticmethod
    def _get_laptop_price(
        *,
        laptop,
        price_mode,
    ):
        if (
            price_mode
            == Order.PriceMode.RETAIL
        ):
            price = (
                laptop.retail_price
            )

        elif (
            price_mode
            == Order.PriceMode.WHOLESALE
        ):
            price = (
                laptop.wholesale_price
            )

        else:
            raise OrderValidationError(
                "Invalid price mode."
            )

        if price is None:
            raise OrderValidationError(
                (
                    "The selected laptop does "
                    "not have a valid sale price."
                )
            )

        price = Decimal(
            str(price)
        )

        if (
            not price.is_finite()
            or price < Decimal("0.00")
        ):
            raise OrderValidationError(
                (
                    "The selected laptop has "
                    "an invalid sale price."
                )
            )

        return price.quantize(
            Decimal("0.01")
        )

    @staticmethod
    def _parse_non_negative_money(
        value,
        *,
        field_name,
    ):
        try:
            unit_price = Decimal(
                str(value)
            )
        except (
            InvalidOperation,
            TypeError,
            ValueError,
        ):
            raise OrderValidationError(
                (
                    f"{field_name} must "
                    "be a valid number."
                )
            ) from None

        if (
            not unit_price.is_finite()
            or unit_price
            < Decimal("0.00")
        ):
            raise OrderValidationError(
                (
                    f"{field_name} must "
                    "be zero or greater."
                )
            )

        return unit_price.quantize(
            Decimal("0.01")
        )

    @staticmethod
    def _validate_positive_integer(
        value,
        *,
        field_name,
    ):
        if (
            isinstance(value, bool)
            or not isinstance(
                value,
                int,
            )
        ):
            raise OrderValidationError(
                (
                    f"{field_name} must "
                    "be an integer."
                )
            )

        if value < 1:
            raise OrderValidationError(
                (
                    f"{field_name} must "
                    "be at least 1."
                )
            )

        return value

    @staticmethod
    def _build_laptop_name(
        laptop,
    ):
        parts = [
            laptop.model_number,
            laptop.processor,
            laptop.processor_generation,
            (
                f"{laptop.ram_gb}/"
                f"{laptop.storage_gb}"
            ),
        ]

        return " ".join(
            str(part).strip()
            for part in parts
            if str(part).strip()
        )

    @staticmethod
    def _build_laptop_description(
        laptop,
    ):
        return (
            f"{laptop.company} "
            f"{laptop.model_number} | "
            f"{laptop.processor} "
            f"{laptop.processor_generation} | "
            f"{laptop.ram_gb}GB RAM | "
            f"{laptop.storage_gb}GB "
            f"{laptop.storage_type.upper()} | "
            f"Serial: "
            f"{laptop.serial_number}"
        )

    @staticmethod
    def _generate_order_number():
        unique_part = (
            uuid4()
            .hex[:20]
            .upper()
        )

        return (
            f"ORD-{unique_part}"
        )