
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import VendorRegistrationRequest


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs

    def create(self, validated_data):
        name = validated_data["name"].strip()
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]

        base = email.split("@")[0].replace(" ", "") or "user"
        username = base
        i = 1
        while User.objects.filter(username__iexact=username).exists():
            i += 1
            username = f"{base}{i}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=name,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ForgotPasswordVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class ForgotPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs


class VendorRegistrationRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorRegistrationRequest
        fields = ("name", "email", "company_name", "details")


class VendorRegistrationRequestAdminUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            VendorRegistrationRequest.Status.APPROVED,
            VendorRegistrationRequest.Status.DECLINED,
        ]
    )
    admin_note = serializers.CharField(required=False, allow_blank=True, max_length=2000)
