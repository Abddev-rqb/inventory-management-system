from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.inventory.models import Laptop


class LaptopModelTests(TestCase):
    def setUp(self):
        self.valid_laptop_data = {
            "company": "Dell",
            "display_type": Laptop.DisplayType.NON_TOUCH,
            "model_number": "5420",
            "processor": "Intel Core i5",
            "processor_generation": "8th",
            "ram_gb": 8,
            "storage_gb": 256,
            "storage_type": Laptop.StorageType.SSD,
            "serial_number": "2551",
            "wholesale_price": Decimal("18500.00"),
            "retail_price": Decimal("22500.00"),
            "qc_status": Laptop.QCStatus.DONE,
            "inventory_status": Laptop.InventoryStatus.IN_STOCK,
            "comments": "This laptop is okay",
            "quantity": 1,
            "warranty_days": Laptop.WarrantyDays.THIRTY_DAYS,
            "area": "comp.A",
        }

    def test_create_valid_laptop(self):
        laptop = Laptop.objects.create(
            **self.valid_laptop_data,
        )

        self.assertEqual(laptop.company, "Dell")
        self.assertEqual(laptop.model_number, "5420")
        self.assertEqual(laptop.serial_number, "2551")
        self.assertEqual(
            laptop.wholesale_price,
            Decimal("18500.00"),
        )
        self.assertEqual(
            laptop.retail_price,
            Decimal("22500.00"),
        )
        self.assertEqual(
            laptop.inventory_status,
            Laptop.InventoryStatus.IN_STOCK,
        )
        self.assertEqual(
            laptop.area,
            "comp.A",
        )

    def test_laptop_string_representation(self):
        laptop = Laptop.objects.create(
            **self.valid_laptop_data,
        )

        self.assertEqual(
            str(laptop),
            "Dell 5420 (2551)",
        )

    def test_serial_number_must_be_unique(self):
        Laptop.objects.create(
            **self.valid_laptop_data,
        )

        duplicate_laptop = Laptop(
            **self.valid_laptop_data,
        )

        with self.assertRaises(ValidationError):
            duplicate_laptop.full_clean()

    def test_retail_price_cannot_be_below_wholesale_price(self):
        laptop = Laptop(
            **{
                **self.valid_laptop_data,
                "serial_number": "2552",
                "wholesale_price": Decimal("22500.00"),
                "retail_price": Decimal("18500.00"),
            }
        )

        with self.assertRaises(ValidationError):
            laptop.full_clean()

    def test_quantity_must_be_exactly_one(
        self,
    ):
        laptop = Laptop(
            **{
                **self.valid_laptop_data,
                "serial_number": "2553",
                "quantity": 0,
            }
        )

        with self.assertRaises(
            ValidationError
        ):
            laptop.full_clean()

    def test_invalid_warranty_is_rejected(self):
        laptop = Laptop(
            **{
                **self.valid_laptop_data,
                "serial_number": "2554",
                "warranty_days": 45,
            }
        )

        with self.assertRaises(ValidationError):
            laptop.full_clean()

    def test_invalid_inventory_status_is_rejected(self):
        laptop = Laptop(
            **{
                **self.valid_laptop_data,
                "serial_number": "2555",
                "inventory_status": "repairing_somewhere",
            }
        )

        with self.assertRaises(ValidationError):
            laptop.full_clean()

    def test_area_accepts_custom_compartment_name(self):
        laptop = Laptop.objects.create(
            **{
                **self.valid_laptop_data,
                "serial_number": "2556",
                "area": "warehouse-2-rack-8-compartment-15",
            }
        )

        self.assertEqual(
            laptop.area,
            "warehouse-2-rack-8-compartment-15",
        )
