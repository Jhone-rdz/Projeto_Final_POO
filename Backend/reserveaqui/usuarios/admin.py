from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Papel, UsuarioPapel, PasswordResetToken


@admin.register(Papel)
class PapelAdmin(admin.ModelAdmin):
    list_display = ('get_tipo_display', 'descricao', 'data_criacao')
    search_fields = ('tipo', 'descricao')
    ordering = ('tipo',)
    
    def get_tipo_display(self, obj):
        return obj.get_tipo_display()
    get_tipo_display.short_description = 'Tipo de Papel'


class UsuarioPapelInline(admin.TabularInline):
    model = UsuarioPapel
    extra = 1
    fields = ('papel', 'data_atribuicao')
    readonly_fields = ('data_atribuicao',)


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('email', 'nome', 'is_active', 'get_papeis')
    list_filter = ('is_active', 'date_joined', 'papeis')
    search_fields = ('email', 'nome')
    ordering = ('-date_joined',)
    inlines = [UsuarioPapelInline]
    
    def get_papeis(self, obj):
        return ', '.join([p.get_tipo_display() for p in obj.papeis.all()])
    get_papeis.short_description = 'Papéis'

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('email', 'usuario', 'data_criacao', 'data_expiracao', 'utilizado', 'esta_valido')
    list_filter = ('utilizado', 'data_criacao', 'data_expiracao')
    search_fields = ('email', 'usuario__email', 'token')
    readonly_fields = ('token', 'data_criacao', 'data_expiracao')
    ordering = ('-data_criacao',)
    
    def esta_valido(self, obj):
        return obj.esta_valido()
    esta_valido.short_description = 'Token Válido'
    esta_valido.boolean = True