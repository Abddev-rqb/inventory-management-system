from django.contrib.auth import (
    get_user_model,
)
from django.contrib.auth.models import (
    Group,
)

from django.test import TestCase

from apps.inventory.models import (
    Return,
)

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_INVENTORY_VIEWER,
    ROLE_SALES,
    ROLE_TECHNICIAN,
    assign_role,
)

from apps.inventory.return_serializers import (
    ReturnStatusUpdateSerializer,
)


User = get_user_model()


class ReturnWorkflowTests(
    TestCase
):
    def setUp(
        self,
    ):
        for role in (
            ROLE_ADMIN,
            ROLE_SALES,
            ROLE_TECHNICIAN,
            ROLE_INVENTORY_VIEWER,
        ):
            Group.objects.get_or_create(
                name=role
            )

        self.admin = (
            User.objects.create_user(
                username="return-admin",
                password="test-password",
            )
        )

        assign_role(
            self.admin,
            ROLE_ADMIN,
        )

        self.sales = (
            User.objects.create_user(
                username="return-sales",
                password="test-password",
            )
        )

        assign_role(
            self.sales,
            ROLE_SALES,
        )

        self.technician = (
            User.objects.create_user(
                username="return-tech",
                password="test-password",
            )
        )

        assign_role(
            self.technician,
            ROLE_TECHNICIAN,
        )

        self.return_record = (
            Return.objects.create(
                customer_name="Test Customer",
                company="Dell",
                display_type="non_touch",
                model_number="5420",
                processor="Intel Core i5",
                processor_generation="11th",
                ram_gb=8,
                storage_gb=256,
                storage_type="ssd",
                serial_number="RETURN-TEST-001",
                issue="Display issue",
                service_rack="Rack 14 Shelf B",
                technician=self.technician,
                created_by=self.sales,
            )
        )


    def test_service_rack_accepts_free_text(
        self,
    ):
        self.assertEqual(
            self.return_record.service_rack,
            "Rack 14 Shelf B",
        )


    def test_default_priority_is_normal(
        self,
    ):
        self.assertEqual(
            self.return_record.priority,
            Return.Priority.NORMAL,
        )


    def test_default_status_is_received(
        self,
    ):
        self.assertEqual(
            self.return_record.status,
            Return.Status.RECEIVED,
        )


    def test_received_can_move_to_in_service(
        self,
    ):
        serializer = (
            ReturnStatusUpdateSerializer(
                data={
                    "status":
                        Return.Status.IN_SERVICE,
                },
                context={
                    "return_record":
                        self.return_record,
                },
            )
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )


    def test_in_service_can_revert_to_received(
        self,
    ):
        self.return_record.status = (
            Return.Status.IN_SERVICE
        )

        serializer = (
            ReturnStatusUpdateSerializer(
                data={
                    "status":
                        Return.Status.RECEIVED,
                },
                context={
                    "return_record":
                        self.return_record,
                },
            )
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )


    def test_repair_completed_can_revert(
        self,
    ):
        self.return_record.status = (
            Return.Status.REPAIR_COMPLETED
        )

        serializer = (
            ReturnStatusUpdateSerializer(
                data={
                    "status":
                        Return.Status.IN_SERVICE,
                },
                context={
                    "return_record":
                        self.return_record,
                },
            )
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )


    def test_ready_for_dispatch_can_revert(
        self,
    ):
        self.return_record.status = (
            Return.Status.READY_FOR_DISPATCH
        )

        serializer = (
            ReturnStatusUpdateSerializer(
                data={
                    "status":
                        Return.Status.REPAIR_COMPLETED,
                },
                context={
                    "return_record":
                        self.return_record,
                },
            )
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )


    def test_stocked_in_is_terminal(
        self,
    ):
        self.return_record.status = (
            Return.Status.STOCKED_IN
        )

        serializer = (
            ReturnStatusUpdateSerializer(
                data={
                    "status":
                        Return.Status.IN_SERVICE,
                },
                context={
                    "return_record":
                        self.return_record,
                },
            )
        )

        self.assertFalse(
            serializer.is_valid()
        )


    def test_dispatched_is_terminal(
        self,
    ):
        self.return_record.status = (
            Return.Status.DISPATCHED
        )

        serializer = (
            ReturnStatusUpdateSerializer(
                data={
                    "status":
                        Return.Status.IN_SERVICE,
                },
                context={
                    "return_record":
                        self.return_record,
                },
            )
        )

        self.assertFalse(
            serializer.is_valid()
        )