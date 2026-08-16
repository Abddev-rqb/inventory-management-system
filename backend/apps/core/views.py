from django.db import connection
from django.db.utils import OperationalError

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inventory.roles import get_user_role


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        database_status = self._check_database()

        response_data = {
            "status": (
                "healthy"
                if database_status == "connected"
                else "unhealthy"
            ),
            "service": "inventory-backend",
            "database": database_status,
        }

        response_status = (
            status.HTTP_200_OK
            if database_status == "connected"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(
            data=response_data,
            status=response_status,
        )

    @staticmethod
    def _check_database():
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            return "connected"

        except OperationalError:
            return "disconnected"


class CurrentUserView(APIView):
    def get(self, request):
        user = request.user

        permissions = sorted(
            user.get_all_permissions()
        )

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": get_user_role(
                    user
                ),
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "permissions": permissions,
            },
            status=status.HTTP_200_OK,
        )