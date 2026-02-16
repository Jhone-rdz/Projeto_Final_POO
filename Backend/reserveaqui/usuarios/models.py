from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    
    TIPOS_USUARIO = [
        ('cliente', 'Cliente'),
        ('administrador', 'Administrador'),
    ]
    
    nome = models.CharField(max_length=150, verbose_name="Nome")
    email = models.EmailField(unique=True, verbose_name="Email")
    tipo = models.CharField(max_length=20, choices=TIPOS_USUARIO, default='cliente', verbose_name="Tipo de Usuário")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nome']
    
    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"
