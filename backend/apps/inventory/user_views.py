from django.contrib.auth import (
    get_user_model,
)
from django.db.models.deletion import (
    ProtectedError,
)

from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import (
    action,
)
from rest_framework.response import (
    Response,
)

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_INVENTORY_VIEWER,
    ROLE_SALES,
    ROLE_TECHNICIAN,
    get_user_role,
)
from apps.inventory.user_permissions import (
    CanManageUsers,
)
from apps.inventory.user_serializers import (
    ManagedUserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)


User = get_user_model()


class ManagedUserViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        CanManageUsers,
    ]

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]


    def get_queryset(
        self,
    ):
        queryset = (
            User.objects
            .prefetch_related(
                "groups"
            )
            .order_by(
                "username"
            )
        )

        actor_role = (
            get_user_role(
                self.request.user
            )
        )

        # /*
        #  * Sales users must never receive
        #  * Admin accounts from this API.
        #  */
        if (
            actor_role
            == ROLE_SALES
        ):
            queryset = (
                queryset
                .exclude(
                    is_superuser=True
                )
                .exclude(
                    groups__name=(
                        ROLE_ADMIN
                    )
                )
            )

        return (
            queryset.distinct()
        )


    def get_serializer_class(
        self,
    ):
        if (
            self.action
            == "create"
        ):
            return (
                UserCreateSerializer
            )

        if (
            self.action
            in {
                "update",
                "partial_update",
            }
        ):
            return (
                UserUpdateSerializer
            )

        return (
            ManagedUserSerializer
        )


    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = (
            self.get_serializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = (
            serializer.save()
        )

        output = (
            ManagedUserSerializer(
                user,
                context={
                    "request":
                        request,
                },
            )
        )

        return Response(
            output.data,
            status=(
                status.HTTP_201_CREATED
            ),
        )


    def partial_update(
        self,
        request,
        *args,
        **kwargs,
    ):
        instance = (
            self.get_object()
        )

        serializer = (
            self.get_serializer(
                instance,
                data=request.data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = (
            serializer.save()
        )

        output = (
            ManagedUserSerializer(
                user,
                context={
                    "request":
                        request,
                },
            )
        )

        return Response(
            output.data
        )


    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        target_user = (
            self.get_object()
        )

        actor_user = (
            request.user
        )

        target_role = (
            get_user_role(
                target_user
            )
        )

        # /*
        #  * Users must not delete their own
        #  * currently authenticated account.
        #  */
        if (
            target_user.pk
            == actor_user.pk
        ):
            return Response(
                {
                    "detail": (
                        "You cannot delete "
                        "your own account."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        # /*
        #  * Admin accounts cannot be deleted
        #  * through this application user
        #  * management workflow.
        #  *
        #  * This also protects Admin accounts
        #  * from Sales users.
        #  */
        if (
            target_role
            == ROLE_ADMIN
            or target_user.is_superuser
        ):
            return Response(
                {
                    "detail": (
                        "Admin users cannot "
                        "be deleted from the "
                        "user management page."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        deleted_user_id = (
            target_user.pk
        )

        deleted_username = (
            target_user.get_username()
        )

        try:
            target_user.delete()

        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This user cannot be "
                        "deleted because the "
                        "account is referenced "
                        "by existing order "
                        "history. Deactivate "
                        "the user instead."
                    ),
                },
                status=(
                    status.HTTP_409_CONFLICT
                ),
            )

        return Response(
            {
                "message": (
                    "User deleted successfully."
                ),

                "id":
                    deleted_user_id,

                "username":
                    deleted_username,
            },
            status=(
                status.HTTP_200_OK
            ),
        )


    @action(
        detail=False,
        methods=[
            "get",
        ],
        url_path="roles",
    )
    def roles(
        self,
        request,
    ):
        actor_role = (
            get_user_role(
                request.user
            )
        )

        roles = [
            {
                "value":
                    ROLE_INVENTORY_VIEWER,

                "label":
                    "Inventory Viewer",
            },

            {
                "value":
                    ROLE_SALES,

                "label":
                    "Sales",
            },

            {
                "value":
                    ROLE_TECHNICIAN,

                "label":
                    "Technician",
            },
        ]

        if (
            actor_role
            == ROLE_ADMIN
        ):
            roles.insert(
                0,
                {
                    "value":
                        ROLE_ADMIN,

                    "label":
                        "Admin",
                },
            )

        return Response(
            roles
        )