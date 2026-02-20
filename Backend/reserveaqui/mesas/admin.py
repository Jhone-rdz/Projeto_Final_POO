from django.contrib import admin
from .models import Mesa


@admin.register(Mesa)
class MesaAdmin(admin.ModelAdmin):
    list_display = ('numero', 'restaurante', 'get_capacidade', 'status', 'ativa', 'data_criacao')
    list_filter = ('status', 'ativa', 'restaurante', 'data_criacao')
    search_fields = ('numero', 'restaurante__nome')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('restaurante', 'numero')
        }),
        ('Status', {
            'fields': ('status', 'ativa')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    def get_capacidade(self, obj):
        """Exibe capacidade fixa de 4 pessoas"""
        return obj.capacidade
    get_capacidade.short_description = 'Capacidade'
