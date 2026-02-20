from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from usuarios.models import Usuario


class Restaurante(models.Model):
    """Modelo que representa um restaurante no sistema"""
    
    nome = models.CharField(max_length=150, verbose_name="Nome do Restaurante")
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    endereco = models.CharField(max_length=255, verbose_name="Endereço")
    cidade = models.CharField(max_length=100, verbose_name="Cidade")
    estado = models.CharField(max_length=2, verbose_name="Estado")
    cep = models.CharField(max_length=10, verbose_name="CEP")
    telefone = models.CharField(max_length=20, blank=True, verbose_name="Telefone")
    email = models.EmailField(unique=True, verbose_name="Email")
    
    # Proprietário/Gerente Principal
    proprietario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='restaurantes_propriedade',
        verbose_name="Proprietário"
    )
    
    # Quantidade de mesas disponíveis no restaurante
    quantidade_mesas = models.PositiveIntegerField(
        default=10,
        verbose_name="Quantidade de Mesas",
        help_text="Número total de mesas (cada mesa comporta 4 pessoas)"
    )
    
    # Status do restaurante
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    
    class Meta:
        verbose_name = "Restaurante"
        verbose_name_plural = "Restaurantes"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.cidade})"
    
    def criar_mesas(self):
        """Cria as mesas automaticamente para o restaurante"""
        from mesas.models import Mesa
        
        # Verifica quantas mesas já existem
        mesas_existentes = self.mesas.count()
        
        # Cria apenas as mesas que faltam
        for i in range(mesas_existentes + 1, self.quantidade_mesas + 1):
            Mesa.objects.create(
                restaurante=self,
                numero=i,
                status='disponivel',
                ativa=True
            )


class RestauranteUsuario(models.Model):
    """Modelo intermediário para vincular usuários a restaurantes com papéis específicos"""
    
    restaurante = models.ForeignKey(
        Restaurante,
        on_delete=models.CASCADE,
        related_name='usuarios',
        verbose_name="Restaurante"
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='restaurantes',
        verbose_name="Usuário"
    )
    # Para definir papéis específicos do usuário neste restaurante
    # (ex: admin_secundario, funcionario)
    papel = models.CharField(
        max_length=20,
        default='funcionario',
        choices=[
            ('admin_secundario', 'Admin Secundário'),
            ('funcionario', 'Funcionário'),
            ('cliente', 'Cliente'),
        ],
        verbose_name="Papel no Restaurante"
    )
    data_vinculacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Vinculação")
    
    class Meta:
        unique_together = ('restaurante', 'usuario')
        verbose_name = "Restaurante-Usuário"
        verbose_name_plural = "Restaurante-Usuários"
        ordering = ['data_vinculacao']
    
    def __str__(self):
        return f"{self.usuario.nome} - {self.restaurante.nome} ({self.get_papel_display()})"


@receiver(post_save, sender=Restaurante)
def criar_mesas_restaurante(sender, instance, created, **kwargs):
    """Signal para criar mesas automaticamente quando um restaurante é criado ou atualizado"""
    # Evitar recursão infinita
    if not hasattr(instance, '_creating_mesas'):
        instance._creating_mesas = True
        instance.criar_mesas()
        delattr(instance, '_creating_mesas')
