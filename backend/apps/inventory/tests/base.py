from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class AuthenticatedInventoryAPITestCase(APITestCase):
    def authenticate_with_inventory_permissions(
        self,
        permission_codenames=None,
    ):
        if permission_codenames is None:
            permission_codenames = [
                "view_laptop",
                "add_laptop",
                "change_laptop",
                "delete_laptop",
            ]

        User = get_user_model()

        self.user = User.objects.create_user(
            username="inventory-test-user",
            password="StrongTestPassword123!",
        )

        permissions = Permission.objects.filter(
            content_type__app_label="inventory",
            codename__in=permission_codenames,
        )

        self.user.user_permissions.set(permissions)

        self.token = Token.objects.create(
            user=self.user,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

        return self.user