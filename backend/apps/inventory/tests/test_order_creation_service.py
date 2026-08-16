from decimal import Decimal

from django.contrib.auth import (
    get_user_model,
)
from django.test import TestCase

from apps.inventory.api_exceptions import (
    OrderInventoryError,
    OrderValidationError,
)
from apps.inventory.models import (
    Laptop,
    Order,
    OrderItem,
)
from apps.inventory.services.order_creation_service import (
    OrderCreationService,
)


User = get_user_model()


class OrderCreationServiceTests(
    TestCase
):
    def setUp(self):
        self.employee = (
            User.objects.create_user(
                username="sales_employee",
                password="test-password",
            )
        )

        self.laptop = (
            Laptop.objects.create(
                company="Dell",
                display_type="non_touch",
                model_number="5420",
                processor="Intel Core i5",
                processor_generation="11th",
                ram_gb=8,
                storage_gb=256,
                storage_type="ssd",
                serial_number="ORDER-5420-001",
                wholesale_price=(
                    Decimal("18000.00")
                ),
                retail_price=(
                    Decimal("22000.00")
                ),
                qc_status="done",
                inventory_status="in_stock",
                comments="",
                quantity=1,
                warranty_days=30,
                area="Rack A",
            )
        )

    def create_laptop(
        self,
        serial_number,
        *,
        inventory_status=(
            Laptop.InventoryStatus.IN_STOCK
        ),
    ):
        return Laptop.objects.create(
            company="Dell",
            display_type="non_touch",
            model_number="5420",
            processor="Intel Core i5",
            processor_generation="11th",
            ram_gb=8,
            storage_gb=256,
            storage_type="ssd",
            serial_number=serial_number,
            wholesale_price=Decimal("18000.00"),
            retail_price=Decimal("22000.00"),
            qc_status="done",
            inventory_status=inventory_status,
            comments="",
            quantity=1,
            warranty_days=30,
            area="Rack A",
        )

    def test_retail_order_uses_retail_price(
        self,
    ):
        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer One",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )
        )

        self.assertEqual(
            order.total_items,
            1,
        )

        self.assertEqual(
            order.total_amount,
            Decimal("22000.00"),
        )

        item = (
            order.items.get()
        )

        self.assertEqual(
            item.unit_price,
            Decimal("22000.00"),
        )

        self.assertEqual(
            item.line_total,
            Decimal("22000.00"),
        )

    def test_wholesale_order_uses_wholesale_price(
        self,
    ):
        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Wholesale Customer",
                price_mode=(
                    Order.PriceMode.WHOLESALE
                ),
                via=Order.Via.ST_COURIER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )
        )

        item = order.items.get()

        self.assertEqual(
            item.unit_price,
            Decimal("18000.00"),
        )

        self.assertEqual(
            order.total_amount,
            Decimal("18000.00"),
        )

    def test_order_marks_laptop_sold_without_changing_quantity(
        self,
    ):
        OrderCreationService.create_order(
            employee=self.employee,
            customer_name="Customer",
            price_mode=(
                Order.PriceMode.RETAIL
            ),
            via=Order.Via.CUSTOMER,
            laptop_items=[
                {
                    "laptop_id": (
                        self.laptop.id
                    ),
                    "quantity": 1,
                }
            ],
        )

        self.laptop.refresh_from_db()

        self.assertEqual(
            self.laptop.quantity,
            1,
        )

        self.assertEqual(
            self.laptop.inventory_status,
            Laptop.InventoryStatus.SOLD,
        )

    def test_order_creates_pending_status(
        self,
    ):
        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )
        )

        self.assertEqual(
            order.status,
            Order.Status.PENDING,
        )

    def test_custom_item_is_added(
        self,
    ):
        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
                custom_items=[
                    {
                        "item_name": "Adapter",
                        "quantity": 2,
                        "unit_price": "500.00",
                    }
                ],
            )
        )

        self.assertEqual(
            order.total_items,
            3,
        )

        self.assertEqual(
            order.total_amount,
            Decimal("23000.00"),
        )

        custom_item = (
            order.items.get(
                is_custom_item=True,
            )
        )

        self.assertEqual(
            custom_item.item_name,
            "Adapter",
        )

        self.assertEqual(
            custom_item.line_total,
            Decimal("1000.00"),
        )

    def test_unavailable_inventory_rejects_order(
        self,
    ):
        self.laptop.inventory_status = (
            Laptop.InventoryStatus.SOLD
        )

        self.laptop.save(
            update_fields=[
                "inventory_status",
            ]
        )

        with self.assertRaises(
            OrderInventoryError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

    def test_in_service_laptop_cannot_be_sold(
        self,
    ):
        self.laptop.inventory_status = (
            Laptop.InventoryStatus.IN_SERVICE
        )

        self.laptop.save(
            update_fields=[
                "inventory_status",
            ]
        )

        with self.assertRaises(
            OrderInventoryError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )

    def test_in_stock_g_laptop_can_be_sold(
        self,
    ):
        self.laptop.inventory_status = (
            Laptop.InventoryStatus.IN_STOCK_G
        )

        self.laptop.save(
            update_fields=[
                "inventory_status",
            ]
        )

        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )
        )

        self.assertEqual(
            order.items.count(),
            1,
        )

    def test_duplicate_laptop_in_request_is_rejected(
        self,
    ):
        with self.assertRaises(
            OrderValidationError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    },
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    },
                ],
            )

    def test_custom_item_quantity_must_be_positive(
        self,
    ):
        with self.assertRaises(
            OrderValidationError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[],
                custom_items=[
                    {
                        "item_name": "Adapter",
                        "quantity": 0,
                        "unit_price": "500",
                    }
                ],
            )

    def test_other_via_requires_description(
        self,
    ):
        with self.assertRaises(
            OrderValidationError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.OTHER,
                via_other="",
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )

    def test_order_item_keeps_snapshot(
        self,
    ):
        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )
        )

        item = order.items.get()

        self.assertEqual(
            item.serial_number_snapshot,
            "ORDER-5420-001",
        )

        self.assertIn(
            "Dell",
            item.description_snapshot,
        )

        self.assertIn(
            "5420",
            item.description_snapshot,
        )

    def test_order_number_is_generated(
        self,
    ):
        order = (
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Customer",
                price_mode=(
                    Order.PriceMode.RETAIL
                ),
                via=Order.Via.CUSTOMER,
                laptop_items=[
                    {
                        "laptop_id": (
                            self.laptop.id
                        ),
                        "quantity": 1,
                    }
                ],
            )
        )

        self.assertTrue(
            order.order_number.startswith(
                "ORD-"
            )
        )
        
    
    def test_sold_laptop_cannot_be_sold_again(
        self,
    ):
        laptop = self.create_laptop(
            "DOUBLE-SALE-001",
            inventory_status=(
                Laptop.InventoryStatus.IN_STOCK
            ),
        )

        OrderCreationService.create_order(
            employee=self.employee,
            customer_name="First Customer",
            customer_address="Chennai",
            price_mode=Order.PriceMode.RETAIL,
            via=Order.Via.CUSTOMER,
            via_other="",
            laptop_items=[
                {
                    "laptop_id": laptop.id,
                    "quantity": 1,
                },
            ],
            custom_items=[],
        )

        laptop.refresh_from_db()

        self.assertEqual(
            laptop.inventory_status,
            Laptop.InventoryStatus.SOLD,
        )

        with self.assertRaises(
            OrderInventoryError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Second Customer",
                customer_address="Chennai",
                price_mode=Order.PriceMode.RETAIL,
                via=Order.Via.CUSTOMER,
                via_other="",
                laptop_items=[
                    {
                        "laptop_id": laptop.id,
                        "quantity": 1,
                    },
                ],
                custom_items=[],
            )
            
    def test_laptop_order_item_quantity_must_be_one(
        self,
    ):
        laptop = self.create_laptop(
            "ORDER-QTY-001",
        )

        with self.assertRaises(
            OrderValidationError
        ):
            OrderCreationService.create_order(
                employee=self.employee,
                customer_name="Test Customer",
                customer_address="Chennai",
                price_mode=Order.PriceMode.RETAIL,
                via=Order.Via.CUSTOMER,
                via_other="",
                laptop_items=[
                    {
                        "laptop_id": laptop.id,
                        "quantity": 2,
                    },
                ],
                custom_items=[],
            )

        laptop.refresh_from_db()

        self.assertEqual(
            laptop.quantity,
            1,
        )

        self.assertEqual(
            laptop.inventory_status,
            Laptop.InventoryStatus.IN_STOCK,
        )
