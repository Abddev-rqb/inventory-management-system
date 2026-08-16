from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.inventory.views import (
    LaptopViewSet,
    OrderDeletionRequestViewSet,
    OrderViewSet,
)
from apps.inventory.user_views import (
    ManagedUserViewSet,
)
from apps.inventory.return_views import (
    ReturnViewSet,
)

app_name = "inventory"

router = DefaultRouter()

router.register(
    "laptops",
    LaptopViewSet,
    basename="laptop",
)

router.register(
    "orders",
    OrderViewSet,
    basename="order",
)

router.register(
    "order-deletion-requests",
    OrderDeletionRequestViewSet,
    basename="order-deletion-request",
)

router.register(
    "users",
    ManagedUserViewSet,
    basename="managed-user",
)

router.register(
    "returns",
    ReturnViewSet,
    basename="return",
)

urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]