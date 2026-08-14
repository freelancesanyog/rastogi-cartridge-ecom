from rest_framework import serializers

from apps.catalog.serializers import CategorySerializer, ProductListSerializer
from apps.compatibility.models import CompatibilityMapping, DeviceBrand, DeviceModel


class DeviceBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceBrand
        fields = ("id", "name", "slug")


class DeviceModelSerializer(serializers.ModelSerializer):
    brand = DeviceBrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = DeviceModel
        fields = ("id", "brand", "category", "model_name", "model_number", "slug")


class CompatibilityMappingSerializer(serializers.ModelSerializer):
    device_model = DeviceModelSerializer(read_only=True)
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = CompatibilityMapping
        fields = ("id", "device_model", "product", "note")
