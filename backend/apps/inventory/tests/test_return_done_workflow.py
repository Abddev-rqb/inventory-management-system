from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.inventory.models import (
    Order,
    Return,
)
from apps.inventory.services.order_dispatch_service import (
    OrderDispatchService,
)
from apps.inventory.services.pending_order_cancellation_service import (
    PendingOrderCancellationService,
)
from apps.inventory.services.return_done_service import (
    ReturnDoneService,
)


User = get_user_model()


class ReturnDoneWorkflowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="return-done-user",
            password="test-password",
        )

        self.return_record = Return.objects.create(
            customer_name="Return Customer",
            customer_address=(
                "12 Test Street, Chennai"
            ),
            company="Dell",
            display_type="non_touch",
            model_number="5420",
            processor="Intel Core i5",
            processor_generation="11th",
            ram_gb=8,
            storage_gb=256,
            storage_type="ssd",
            serial_number="RETURN-DONE-001",
            issue="Display issue",
            service_rack="Rack A",
            priority=Return.Priority.NORMAL,
            status=Return.Status.REPAIR_COMPLETED,
            created_by=self.user,
        )

    def test_done_creates_zero_value_pending_order(self):
        order, return_record = (
            ReturnDoneService.move_to_pending_order(
                return_id=self.return_record.id,
                employee=self.user,
            )
        )

        self.assertEqual(
            order.status,
            Order.Status.PENDING,
        )
        self.assertEqual(
            order.source_return_id,
            self.return_record.id,
        )
        self.assertEqual(
            order.total_amount,
            Decimal("0.00"),
        )
        self.assertEqual(order.total_items, 1)
        self.assertEqual(
            return_record.status,
            Return.Status.READY_FOR_DISPATCH,
        )

    def test_cancel_return_order_restores_active_return(self):
        order, _ = (
            ReturnDoneService.move_to_pending_order(
                return_id=self.return_record.id,
                employee=self.user,
            )
        )

        result = (
            PendingOrderCancellationService
            .cancel_pending_order(
                order_id=order.id,
            )
        )

        self.return_record.refresh_from_db()

        self.assertTrue(result["restored_return"])
        self.assertEqual(
            self.return_record.status,
            Return.Status.REPAIR_COMPLETED,
        )
        self.assertFalse(
            Order.objects.filter(pk=order.id).exists()
        )

    def test_dispatch_marks_source_return_dispatched(self):
        order, _ = (
            ReturnDoneService.move_to_pending_order(
                return_id=self.return_record.id,
                employee=self.user,
            )
        )

        OrderDispatchService.dispatch_order(
            order_id=order.id,
        )

        order.refresh_from_db()
        self.return_record.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.Status.DISPATCHED,
        )
        self.assertEqual(
            self.return_record.status,
            Return.Status.DISPATCHED,
        )
