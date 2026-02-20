from django.contrib import admin
from .models import Reserva, ReservaMesa


class ReservaMesaInline(admin.TabularInline):
    """Inline para exibir mesas vinculadas à reserva"""
    model = ReservaMesa
    extra = 1
    readonly_fields = ['data_vinculacao']


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    """Admin para o modelo Reserva"""
    
    list_display = [
        'id',
        'nome_cliente',
        'restaurante',
        'data_reserva',
        'horario',
        'quantidade_pessoas',
        'status',
        'data_criacao'
    ]
    
    list_filter = [
        'status',
        'data_reserva',
        'restaurante',
        'data_criacao'
    ]
    
    search_fields = [
        'nome_cliente',
        'telefone_cliente',
        'email_cliente',
        'restaurante__nome'
    ]
    
    readonly_fields = [
        'data_criacao',
        'data_atualizacao',
        'calcular_mesas_necessarias'
    ]
    
    fieldsets = (
        ('Informações da Reserva', {
            'fields': (
                'restaurante',
                'data_reserva',
                'horario',
                'quantidade_pessoas',
                'calcular_mesas_necessarias',
                'status'
            )
        }),
        ('Informações do Cliente', {
            'fields': (
                'usuario',
                'nome_cliente',
                'telefone_cliente',
                'email_cliente',
                'observacoes'
            )
        }),
        ('Controle', {
            'fields': (
                'data_criacao',
                'data_atualizacao'
            )
        })
    )
    
    inlines = [ReservaMesaInline]
    
    def calcular_mesas_necessarias(self, obj):
        """Exibe a quantidade de mesas necessárias"""
        if obj.quantidade_pessoas:
            return f"{obj.calcular_mesas_necessarias()} mesa(s)"
        return "-"
    calcular_mesas_necessarias.short_description = "Mesas Necessárias"


@admin.register(ReservaMesa)
class ReservaMesaAdmin(admin.ModelAdmin):
    """Admin para o modelo ReservaMesa"""
    
    list_display = [
        'id',
        'reserva',
        'mesa',
        'data_vinculacao'
    ]
    
    list_filter = [
        'data_vinculacao',
        'mesa__restaurante'
    ]
    
    search_fields = [
        'reserva__nome_cliente',
        'mesa__numero'
    ]
    
    readonly_fields = ['data_vinculacao']
