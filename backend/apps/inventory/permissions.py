from rest_framework.permissions import (
    BasePermission,
    DjangoModelPermissions,
)

from apps.inventory.roles import (
    ROLE_INVENTORY_VIEWER,
    get_user_role,
)


class LaptopModelPermissions(
    DjangoModelPermissions
):
    authenticated_users_only = True

    perms_map = {
        "GET": [
            "%(app_label)s.view_%(model_name)s",
        ],

        "OPTIONS": [
            "%(app_label)s.view_%(model_name)s",
        ],

        "HEAD": [
            "%(app_label)s.view_%(model_name)s",
        ],

        "POST": [
            "%(app_label)s.add_%(model_name)s",
        ],

        "PUT": [
            "%(app_label)s.change_%(model_name)s",
        ],

        "PATCH": [
            "%(app_label)s.change_%(model_name)s",
        ],

        "DELETE": [
            "%(app_label)s.delete_%(model_name)s",
        ],
    }


class OrderPermission(
    BasePermission
):
    message = (
        "You do not have permission "
        "to perform this order action."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user

        if (
            not user
            or not user.is_authenticated
        ):
            return False

        # Admin users can perform all
        # OrderViewSet operations.
        if (
            user.is_superuser
            or user.is_staff
        ):
            return True

        action = getattr(
            view,
            "action",
            None,
        )
        
        user_role = (
            get_user_role(
                user
            )
        )

        # ---------------------------------
        # Create sale / pending order
        # ---------------------------------
        if (
            action
            == "create"
        ):
            return user.has_perm(
                "inventory.add_order"
            )

        # ---------------------------------
        # Dispatch pending orders
        # ---------------------------------
        if (
            action
            in {
                "dispatch_order",
                "bulk_dispatch",
            }
        ):
            return user.has_perm(
                "inventory.change_order"
            )

        # ---------------------------------
        # Delete / cancel pending order
        #
        # Sales users already receive
        # change_order permission.
        #
        # The actual view also checks that
        # only Admin or Sales roles can use
        # this action.
        # ---------------------------------
        if (
            action
            == "cancel_pending_order"
        ):
            return user.has_perm(
                "inventory.change_order"
            )

        # ---------------------------------
        # Request deletion of dispatched
        # order
        # ---------------------------------
        if (
            action
            == "request_deletion"
        ):
            return (
                user.has_perm(
                    "inventory.view_order"
                )
                and
                user.has_perm(
                    (
                        "inventory."
                        "add_orderdeletionrequest"
                    )
                )
            )

        # ---------------------------------
        # Direct DELETE /orders/<id>/
        #
        # Non-admin users must never use
        # this endpoint directly.
        # ---------------------------------
        if (
            action
            == "destroy"
        ):
            return False

        # ---------------------------------
        # Total Sales
        # ---------------------------------
        if (
            action
            in {
                "sales_report",
                "sales_export",
            }
        ):
            return user.has_perm(
                "inventory.view_sales_report"
            )
            
        if (
            action
            == "dispatched_export"
        ):
            return user.has_perm(
                "inventory.view_sales_report"
            )

        # Inventory Viewer can read Pending
        # Orders, but cannot access the
        # Dispatched Orders endpoint.
        if (
            action
            == "dispatched_orders"
        ):
            if (
                user_role
                == ROLE_INVENTORY_VIEWER
            ):
                return False

            return user.has_perm(
                "inventory.view_order"
            )


        # OrderViewSet list/retrieve represents
        # pending orders in the current design.
        if (
            action
            in {
                "list",
                "retrieve",
            }
        ):
            return user.has_perm(
                "inventory.view_order"
            )


class OrderDeletionRequestPermission(
    BasePermission
):
    message = (
        "Administrator permission "
        "is required to manage "
        "order deletion requests."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user

        if (
            not user
            or not user.is_authenticated
        ):
            return False

        return bool(
            user.is_staff
            or user.is_superuser
        )