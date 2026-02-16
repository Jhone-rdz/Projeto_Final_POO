from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Usuario"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ('id', 'email', 'nome', 'tipo', 'password', 'password_confirm', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def validate(self, data):
        """Validar se as senhas batem"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'As senhas não correspondem.'})
        return data

    def create(self, validated_data):
        """Criar novo usuário com a senha"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        usuario = Usuario.objects.create_user(**validated_data, password=password)
        return usuario


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuário com email e senha"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        """Autenticar o usuário"""
        email = data.get('email')
        password = data.get('password')

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({'email': 'Usuário não encontrado.'})

        if not usuario.check_password(password):
            raise serializers.ValidationError({'password': 'Senha incorreta.'})

        data['usuario'] = usuario
        return data
