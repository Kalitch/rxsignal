from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SavedSearch, DrugWatchlist

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "username", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "date_joined"]


class SavedSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedSearch
        fields = "__all__"
        read_only_fields = ["user", "last_run", "created_at"]


class DrugWatchlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugWatchlist
        fields = "__all__"
        read_only_fields = ["user", "created_at"]
