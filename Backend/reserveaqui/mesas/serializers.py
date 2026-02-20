from rest_framework import serializers
from .models import Mesa


class MesaSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Mesa"""
    
    restaurante_nome = serializers.CharField(source='restaurante.nome', read_only=True)
    capacidade = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Mesa
        fields = [
            'id',
            'restaurante',
            'restaurante_nome',
            'numero',
            'capacidade',
            'status',
            'ativa',
            'data_criacao',
            'data_atualizacao'
        ]
        read_only_fields = ['id', 'capacidade', 'data_criacao', 'data_atualizacao']
    
    def validate(self, data):
        """Validações do modelo"""
        # Verifica se já existe mesa com o mesmo número no restaurante
        if self.instance is None:  # Criação
            if Mesa.objects.filter(
                restaurante=data.get('restaurante'),
                numero=data.get('numero')
            ).exists():
                raise serializers.ValidationError(
                    "Já existe uma mesa com este número neste restaurante."
                )
        else:  # Atualização
            if Mesa.objects.exclude(pk=self.instance.pk).filter(
                restaurante=data.get('restaurante', self.instance.restaurante),
                numero=data.get('numero', self.instance.numero)
            ).exists():
                raise serializers.ValidationError(
                    "Já existe uma mesa com este número neste restaurante."
                )
        
        return data


class MesaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de mesas"""
    
    capacidade = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Mesa
        fields = [
            'id',
            'numero',
            'capacidade',
            'status',
            'ativa'
        ]
