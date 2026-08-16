from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.inventory.roles import get_user_role


class LoginRateThrottle(
    AnonRateThrottle
):
    scope = "login"


class InventoryAuthTokenView(
    ObtainAuthToken
):
    throttle_classes = [
        LoginRateThrottle,
    ]

    def post(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = (
            self.serializer_class(
                data=request.data,
                context={
                    "request": request,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        user = (
            serializer
            .validated_data[
                "user"
            ]
        )

        token, _ = (
            Token.objects
            .get_or_create(
                user=user,
            )
        )

        role = get_user_role(
            user
        )

        return Response(
            {
                "token":
                    token.key,

                "user": {
                    "id":
                        user.pk,

                    "username":
                        user.get_username(),

                    "first_name":
                        user.first_name,

                    "last_name":
                        user.last_name,

                    "email":
                        user.email,

                    "role":
                        role,

                    "is_active":
                        user.is_active,

                    "is_staff":
                        user.is_staff,

                    "is_superuser":
                        user.is_superuser,
                },

                "permissions":
                    sorted(
                        user
                        .get_all_permissions()
                    ),
            }
        )