from rest_framework.permissions import (
    BasePermission,
)

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_SALES,
    user_has_role,
)


class CanManageUsers(
    BasePermission
):
    message = (
        "You do not have permission "
        "to manage users."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
            and user_has_role(
                request.user,
                ROLE_ADMIN,
                ROLE_SALES,
            )
        )