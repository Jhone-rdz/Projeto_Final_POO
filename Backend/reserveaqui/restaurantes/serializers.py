from rest_framework import serializers
from .models import Restaurante, RestauranteUsuario


class RestauranteSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Restaurante"""
    
    proprietario_nome = serializers.CharField(source='proprietario.nome', read_only=True)
    total_mesas = serializers.IntegerField(source='mesas.count', read_only=True)
    
    class Meta:
        model = Restaurante
        fields = [
            'id',
            'nome',
            'descricao',
            'endereco',
            'cidade',
            'estado',
            'cep',
            'telefone',
            'email',
            'proprietario',
            'proprietario_nome',
            'quantidade_mesas',
            'total_mesas',
            'ativo',
            'data_criacao',
            'data_atualizacao'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'proprietario_nome', 'total_mesas']
    
    def validate_email(self, value):
        """Valida que o email é único"""
        instance = self.instance
        if instance and Restaurante.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("Já existe um restaurante com este email.")
        elif not instance and Restaurante.objects.filter(email=value).exists():
            raise serializers.ValidationError("Já existe um restaurante com este email.")
        return value


class RestauranteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de restaurantes"""
    
    proprietario_nome = serializers.CharField(source='proprietario.nome', read_only=True)
    
    class Meta:
        model = Restaurante
        fields = [
            'id',
            'nome',
            'cidade',
            'estado',
            'telefone',
            'email',
            'proprietario_nome',
            'quantidade_mesas',
            'ativo'
        ]


class RestauranteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação e atualização de restaurante"""
    
    class Meta:
        model = Restaurante
        fields = [
            'nome',
            'descricao',
            'endereco',
            'cidade',
            'estado',
            'cep',
            'telefone',
            'email',
            'proprietario',
            'quantidade_mesas',
            'ativo'
        ]
    
    def validate_quantidade_mesas(self, value):
        """Valida que a quantidade de mesas é razoável"""
        if value < 0:
            raise serializers.ValidationError("A quantidade de mesas não pode ser negativa.")
        if value > 1000:
            raise serializers.ValidationError("A quantidade de mesas não pode exceder 1000.")
        return value
    
    def validate(self, data):
        """Validações adicionais"""
        # Verifica se o proprietário existe e está ativo
        if 'proprietario' in data:
            if not data['proprietario'].is_active:
                raise serializers.ValidationError(
                    {"proprietario": "O proprietário deve estar ativo no sistema."}
                )
        return data


class RestauranteUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para vínculos de usuários ao restaurante"""
    
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    restaurante_nome = serializers.CharField(source='restaurante.nome', read_only=True)
    
    class Meta:
        model = RestauranteUsuario
        fields = [
            'id',
            'restaurante',
            'restaurante_nome',
            'usuario',
            'usuario_nome',
            'usuario_email',
            'papel',
            'data_vinculacao'
        ]
        read_only_fields = ['id', 'data_vinculacao']
