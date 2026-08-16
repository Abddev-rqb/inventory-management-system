from django.test import TestCase

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class InventoryAuthenticationTests(APITestCase):
    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="frontend-user",
            email="frontend@example.com",
            password="StrongPassword123!",
        )

        self.login_url = reverse(
            "api-token-login"
        )

    def test_valid_credentials_return_token(self):
        response = self.client.post(
            self.login_url,
            data={
                "username": "frontend-user",
                "password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "token",
            response.data,
        )

        self.assertEqual(
            response.data["user"]["username"],
            "frontend-user",
        )

        self.assertIn(
            "permissions",
            response.data,
        )

    def test_invalid_credentials_are_rejected(self):
        response = self.client.post(
            self.login_url,
            data={
                "username": "frontend-user",
                "password": "WrongPassword",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

        self.assertIn(
            "error",
            response.data,
        )

    def test_missing_credentials_are_rejected(self):
        response = self.client.post(
            self.login_url,
            data={},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )