from rest_framework.permissions import (
    BasePermission,
)

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_INVENTORY_VIEWER,
    ROLE_SALES,
    ROLE_TECHNICIAN,
    get_user_role,
)


class ReturnPermission(
    BasePermission
):
    message = (
        "You do not have permission "
        "to perform this return action."
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

        role = get_user_role(
            user
        )

        if (
            role
            == ROLE_ADMIN
        ):
            return True

        action = getattr(
            view,
            "action",
            None,
        )

        if action in {
            "list",
            "retrieve",
        }:
            return role in {
                ROLE_INVENTORY_VIEWER,
                ROLE_SALES,
                ROLE_TECHNICIAN,
            }

        if (
            action
            == "create"
        ):
            return (
                role
                == ROLE_SALES
                and user.has_perm(
                    "inventory.add_return"
                )
            )

        if action in {
            "update",
            "partial_update",
        }:
            return (
                role
                == ROLE_SALES
                and user.has_perm(
                    "inventory.change_return"
                )
            )

        if (
            action
            == "assign_technician"
        ):
            return (
                role
                == ROLE_SALES
                and user.has_perm(
                    "inventory.change_return"
                )
            )

        if (
            action
            == "technicians"
        ):
            return (
                role
                == ROLE_SALES
            )

        if (
            action
            == "update_status"
        ):
            return (
                role
                in {
                    ROLE_SALES,
                    ROLE_TECHNICIAN,
                }
                and user.has_perm(
                    "inventory.change_return"
                )
            )
            
        if (
            action
            == "complete_repair"
        ):
            return (
                role == ROLE_SALES
                and user.has_perm(
                    "inventory.change_return"
                )
            )

        if (
            action
            == "add_expense"
        ):
            return role == ROLE_SALES

        if (
            action
            == "expenses"
        ):
            return role in {
                ROLE_INVENTORY_VIEWER,
                ROLE_SALES,
                ROLE_TECHNICIAN,
            }

        if (
            action
            == "stock_in"
        ):
            return (
                role
                == ROLE_SALES
                and user.has_perm(
                    "inventory.stock_in_return"
                )
            )

        if (
            action
            == "assign_priority"
        ):
            return (
                role
                == ROLE_SALES
            )

        if (
            action
            == "destroy"
        ):
            return False
        
        if action in {
            "import_preview",
            "import_confirm",
        }:
            return (
                role
                == ROLE_SALES
                and user.has_perm(
                    "inventory.add_return"
                )
            )
            
        if (
            action
            == "stocked_in"
        ):
            return role in {
                ROLE_INVENTORY_VIEWER,
                ROLE_SALES,
                ROLE_TECHNICIAN,
            }


        if (
            action
            == "stocked_in_export"
        ):
            return (
                role
                in {
                    ROLE_SALES,
                    ROLE_TECHNICIAN,
                }
                and user.has_perm(
                    "inventory.export_return"
                )
            )

        if (
            action
            == "export_returns"
        ):
            return (
                role
                in {
                    ROLE_SALES,
                    ROLE_TECHNICIAN,
                }
                and user.has_perm(
                    "inventory.export_return"
                )
            )

        return False
    