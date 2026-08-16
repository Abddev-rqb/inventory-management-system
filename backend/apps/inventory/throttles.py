from rest_framework.throttling import UserRateThrottle


class LaptopImportRateThrottle(UserRateThrottle):
    scope = "laptop_import"


class LaptopExportRateThrottle(UserRateThrottle):
    scope = "laptop_export"