from django.contrib.auth.models import (
    Group,
    Permission,
)
from django.core.management.base import (
    BaseCommand,
)

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_INVENTORY_VIEWER,
    ROLE_SALES,
    ROLE_TECHNICIAN,
)


class Command(
    BaseCommand
):
    help = (
        "Create application roles "
        "and assign permissions."
    )

    def handle(
        self,
        *args,
        **options,
    ):
        admin_group = (
            self._get_group(
                ROLE_ADMIN
            )
        )

        viewer_group = (
            self._get_group(
                ROLE_INVENTORY_VIEWER
            )
        )

        sales_group = (
            self._get_group(
                ROLE_SALES
            )
        )

        technician_group = (
            self._get_group(
                ROLE_TECHNICIAN
            )
        )

        inventory_permissions = (
            Permission.objects.filter(
                content_type__app_label=(
                    "inventory"
                )
            )
        )

        admin_group.permissions.set(
            inventory_permissions
        )

        viewer_group.permissions.set(
            self._permissions(
                "view_order",
                "view_return",
            )
        )

        sales_group.permissions.set(
            self._permissions(
                "view_laptop",
                "add_laptop",
                "change_laptop",

                "view_order",
                "add_order",
                "change_order",

                "view_orderdeletionrequest",
                "add_orderdeletionrequest",

                "view_sales_report",

                "view_return",
                "add_return",
                "change_return",
                "stock_in_return",
                "export_return",
            )
        )

        technician_group.permissions.set(
            self._permissions(
                "view_return",
                "change_return",
                "export_return",
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Roles and permissions "
                    "configured successfully."
                )
            )
        )

    @staticmethod
    def _get_group(
        role_name,
    ):
        group, _ = (
            Group.objects.get_or_create(
                name=role_name
            )
        )

        return group

    @staticmethod
    def _permissions(
        *codenames,
    ):
        permissions = (
            Permission.objects.filter(
                content_type__app_label=(
                    "inventory"
                ),
                codename__in=(
                    codenames
                ),
            )
        )

        found = set(
            permissions.values_list(
                "codename",
                flat=True,
            )
        )

        missing = (
            set(codenames)
            - found
        )

        if missing:
            raise RuntimeError(
                (
                    "Missing permissions: "
                    f"{sorted(missing)}"
                )
            )

        return permissions