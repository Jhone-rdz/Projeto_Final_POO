from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('email', 'nome', 'tipo', 'is_active')
    list_filter = ('tipo', 'is_active', 'date_joined')
    search_fields = ('email', 'nome')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informações do Sistema', {'fields': ('tipo',)}),
    )
