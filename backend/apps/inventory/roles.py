from django.contrib.auth.models import (
    Group,
)


ROLE_ADMIN = "admin"

ROLE_INVENTORY_VIEWER = (
    "inventory_viewer"
)

ROLE_SALES = "sales"

ROLE_TECHNICIAN = "technician"


ROLE_CHOICES = (
    (
        ROLE_ADMIN,
        "Admin",
    ),
    (
        ROLE_INVENTORY_VIEWER,
        "Inventory Viewer",
    ),
    (
        ROLE_SALES,
        "Sales",
    ),
    (
        ROLE_TECHNICIAN,
        "Technician",
    ),
)


def get_user_role(
    user,
):
    if (
        not user
        or not user.is_authenticated
    ):
        return None

    if user.is_superuser:
        return ROLE_ADMIN

    role_names = set(
        user.groups.values_list(
            "name",
            flat=True,
        )
    )

    for role, _ in ROLE_CHOICES:
        if role in role_names:
            return role

    if user.is_staff:
        return ROLE_ADMIN

    return None


def user_has_role(
    user,
    *roles,
):
    return (
        get_user_role(
            user
        )
        in roles
    )


def assign_role(
    user,
    role,
):
    valid_roles = {
        value
        for value, _
        in ROLE_CHOICES
    }

    if role not in valid_roles:
        raise ValueError(
            (
                f"Unsupported role: "
                f"{role}"
            )
        )

    role_groups = (
        Group.objects.filter(
            name__in=(
                valid_roles
            )
        )
    )

    user.groups.remove(
        *role_groups
    )

    group, _ = (
        Group.objects.get_or_create(
            name=role
        )
    )

    user.groups.add(
        group
    )

    user.is_staff = (
        role == ROLE_ADMIN
    )

    user.save(
        update_fields=[
            "is_staff",
        ]
    )

    return user