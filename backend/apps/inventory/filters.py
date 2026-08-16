import django_filters

from apps.inventory.models import Laptop


class LaptopFilter(django_filters.FilterSet):
    company = django_filters.CharFilter(
        field_name="company",
        lookup_expr="iexact",
    )

    company_contains = django_filters.CharFilter(
        field_name="company",
        lookup_expr="icontains",
    )

    area = django_filters.CharFilter(
        field_name="area",
        lookup_expr="iexact",
    )

    area_contains = django_filters.CharFilter(
        field_name="area",
        lookup_expr="icontains",
    )

    minimum_ram_gb = django_filters.NumberFilter(
        field_name="ram_gb",
        lookup_expr="gte",
    )

    maximum_ram_gb = django_filters.NumberFilter(
        field_name="ram_gb",
        lookup_expr="lte",
    )

    minimum_storage_gb = django_filters.NumberFilter(
        field_name="storage_gb",
        lookup_expr="gte",
    )

    maximum_storage_gb = django_filters.NumberFilter(
        field_name="storage_gb",
        lookup_expr="lte",
    )

    minimum_wholesale_price = (
        django_filters.NumberFilter(
            field_name="wholesale_price",
            lookup_expr="gte",
        )
    )

    maximum_wholesale_price = (
        django_filters.NumberFilter(
            field_name="wholesale_price",
            lookup_expr="lte",
        )
    )

    minimum_retail_price = django_filters.NumberFilter(
        field_name="retail_price",
        lookup_expr="gte",
    )

    maximum_retail_price = django_filters.NumberFilter(
        field_name="retail_price",
        lookup_expr="lte",
    )

    created_after = django_filters.IsoDateTimeFilter(
        field_name="created_at",
        lookup_expr="gte",
    )

    created_before = django_filters.IsoDateTimeFilter(
        field_name="created_at",
        lookup_expr="lte",
    )

    class Meta:
        model = Laptop

        fields = (
            "display_type",
            "storage_type",
            "qc_status",
            "inventory_status",
            "warranty_days",
        )