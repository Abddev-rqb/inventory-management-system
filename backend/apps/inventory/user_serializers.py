from django.contrib.auth import (
    get_user_model,
)
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.db import transaction
from rest_framework import serializers

from apps.inventory.roles import (
    ROLE_ADMIN,
    ROLE_CHOICES,
    ROLE_INVENTORY_VIEWER,
    ROLE_SALES,
    ROLE_TECHNICIAN,
    assign_role,
    get_user_role,
)


User = get_user_model()


class ManagedUserSerializer(
    serializers.ModelSerializer
):
    role = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "is_active",
        ]

        read_only_fields = [
            "id",
            "role",
        ]

    def get_role(
        self,
        obj,
    ):
        return get_user_role(
            obj
        )


class UserCreateSerializer(
    serializers.ModelSerializer
):
    password = (
        serializers.CharField(
            write_only=True,
            trim_whitespace=False,
        )
    )

    role = (
        serializers.ChoiceField(
            choices=[
                ROLE_ADMIN,
                ROLE_INVENTORY_VIEWER,
                ROLE_SALES,
                ROLE_TECHNICIAN,
            ],
            write_only=True,
        )
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "role",
            "is_active",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_password(
        self,
        value,
    ):
        validate_password(
            value
        )

        return value

    def validate_role(
        self,
        value,
    ):
        request = (
            self.context[
                "request"
            ]
        )

        actor_role = (
            get_user_role(
                request.user
            )
        )

        if (
            actor_role
            == ROLE_SALES
            and value
            == ROLE_ADMIN
        ):
            raise (
                serializers.ValidationError(
                    (
                        "Sales users cannot "
                        "assign the Admin role."
                    )
                )
            )

        return value

    @transaction.atomic
    def create(
        self,
        validated_data,
    ):
        role = (
            validated_data.pop(
                "role"
            )
        )

        password = (
            validated_data.pop(
                "password"
            )
        )

        user = User(
            **validated_data
        )

        user.set_password(
            password
        )

        user.save()

        assign_role(
            user,
            role,
        )

        return user


class UserUpdateSerializer(
    serializers.ModelSerializer
):
    role = (
        serializers.ChoiceField(
            choices=ROLE_CHOICES,
            required=False,
        )
    )

    password = (
        serializers.CharField(
            write_only=True,
            required=False,
            allow_blank=False,
            trim_whitespace=False,
        )
    )

    class Meta:
        model = User

        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "role",
            "is_active",
        ]

    def validate(
        self,
        attrs,
    ):
        request = (
            self.context[
                "request"
            ]
        )

        actor_role = (
            get_user_role(
                request.user
            )
        )

        target_role = (
            get_user_role(
                self.instance
            )
        )

        requested_role = (
            attrs.get(
                "role",
                target_role,
            )
        )

        if (
            actor_role
            == ROLE_SALES
        ):
            if (
                target_role
                == ROLE_ADMIN
            ):
                raise (
                    serializers.ValidationError(
                        {
                            "role": (
                                "Sales users "
                                "cannot modify "
                                "Admin users."
                            )
                        }
                    )
                )

            if (
                requested_role
                == ROLE_ADMIN
            ):
                raise (
                    serializers.ValidationError(
                        {
                            "role": (
                                "Sales users "
                                "cannot assign "
                                "the Admin role."
                            )
                        }
                    )
                )

        return attrs

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        role = (
            validated_data.pop(
                "role",
                None,
            )
        )

        password = (
            validated_data.pop(
                "password",
                None,
            )
        )

        for (
            field,
            value,
        ) in (
            validated_data.items()
        ):
            setattr(
                instance,
                field,
                value,
            )

        if password:
            validate_password(
                password,
                user=instance,
            )

            instance.set_password(
                password
            )

        instance.save()

        if role:
            assign_role(
                instance,
                role,
            )

        return instance