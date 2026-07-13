from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterSerializer(serializers.ModelSerializer):

    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, att):
        if att['password'] != att['confirm_password']:
            raise serializers.ValidationError({'password': "Passwords dosen't match"})
        
        return att
    
    def create(self, valid_data):
        valid_data.pop('confirm_password')

        user = User.objects.create_user(**valid_data)

        return user
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, att):
        email = att.get('email')
        password = att.get('password')

        user = authenticate(email=email, password = password)

        if not user:
            raise serializers.ValidationError("User not found")
        
        refresh = RefreshToken.for_user(user)

        return {
            'user': {
                "id": user.id,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }