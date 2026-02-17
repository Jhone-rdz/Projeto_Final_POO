from django.db import models
from django.contrib.auth.models import AbstractUser


class Papel(models.Model):
    """Define os papéis (roles) disponíveis no sistema"""
    
    TIPOS_PAPEL = [
        ('admin_sistema', 'Admin do Sistema'),
        ('admin_secundario', 'Admin Secundário'),
        ('funcionario', 'Funcionário'),
        ('cliente', 'Cliente'),
    ]
    
    tipo = models.CharField(
        max_length=20, 
        choices=TIPOS_PAPEL, 
        unique=True,
        verbose_name="Tipo de Papel"
    )
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Papel"
        verbose_name_plural = "Papéis"
        ordering = ['tipo']
    
    def __str__(self):
        return self.get_tipo_display()


class Usuario(AbstractUser):
    """Modelo customizado de usuário para o sistema"""
    
    nome = models.CharField(max_length=150, verbose_name="Nome")
    email = models.EmailField(unique=True, verbose_name="Email")
    papeis = models.ManyToManyField(Papel, through='UsuarioPapel', verbose_name="Papéis")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nome']
    
    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.nome} ({self.email})"
    
    def tem_papel(self, tipo_papel):
        """Verifica se usuário tem um papel específico"""
        return self.papeis.filter(tipo=tipo_papel).exists()


class UsuarioPapel(models.Model):
    """Modelo intermediário para rastrear papéis de usuários"""
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, verbose_name="Usuário")
    papel = models.ForeignKey(Papel, on_delete=models.CASCADE, verbose_name="Papel")
    data_atribuicao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Atribuição")
    
    class Meta:
        unique_together = ('usuario', 'papel')
        verbose_name = "Usuário-Papel"
        verbose_name_plural = "Usuários-Papéis"
        ordering = ['data_atribuicao']
    
    def __str__(self):
        return f"{self.usuario.nome} - {self.papel.get_tipo_display()}"
