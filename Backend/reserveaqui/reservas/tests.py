from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import IntegrityError
from datetime import timedelta, date, time
from usuarios.models import Usuario
from restaurantes.models import Restaurante
from mesas.models import Mesa
from .models import Reserva, ReservaMesa


class ReservaModelTest(TestCase):
    """Testes para o modelo Reserva"""
    
    def setUp(self):
        """Criar dados para testes"""
        self.usuario = Usuario.objects.create_user(
            email='cliente@test.com',
            nome='Cliente Teste',
            username='cliente_test',
            password='SenhaForte123'
        )
        
        self.proprietario = Usuario.objects.create_user(
            email='proprietario@test.com',
            nome='Proprietário',
            username='prop_test',
            password='SenhaForte123'
        )
        
        self.restaurante = Restaurante.objects.create(
            nome='Restaurante Test',
            endereco='Rua Test, 123',
            cidade='Test City',
            estado='TC',
            cep='99999-999',
            email='test@restaurant.com',
            proprietario=self.proprietario,
            quantidade_mesas=20
        )
        
        # Data e horário futuros (3 horas a partir de agora)
        self.data_futura = (timezone.now() + timedelta(hours=3)).date()
        self.horario_futuro = (timezone.now() + timedelta(hours=3)).time()
    
    def test_criar_reserva_valida(self):
        """Teste de criação de reserva com dados válidos"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            usuario=self.usuario,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=4,
            nome_cliente='Cliente Teste',
            telefone_cliente='(85) 99999-9999',
            email_cliente='cliente@test.com'
        )
        
        self.assertEqual(reserva.restaurante, self.restaurante)
        self.assertEqual(reserva.usuario, self.usuario)
        self.assertEqual(reserva.quantidade_pessoas, 4)
        self.assertEqual(reserva.status, 'pendente')
        self.assertEqual(reserva.nome_cliente, 'Cliente Teste')
        self.assertIsNotNone(reserva.data_criacao)
    
    def test_reserva_sem_usuario_cadastrado(self):
        """Teste de criação de reserva sem usuário cadastrado"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            usuario=None,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=2,
            nome_cliente='Cliente Não Cadastrado',
            telefone_cliente='(85) 88888-8888'
        )
        
        self.assertIsNone(reserva.usuario)
        self.assertEqual(reserva.nome_cliente, 'Cliente Não Cadastrado')
    
    def test_reserva_str(self):
        """Teste da representação em string da reserva"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=4,
            nome_cliente='João Silva',
            telefone_cliente='(85) 99999-9999'
        )
        
        expected = f"João Silva - Restaurante Test ({self.data_futura} às {self.horario_futuro})"
        self.assertEqual(str(reserva), expected)
    
    def test_calcular_mesas_necessarias_4_pessoas(self):
        """Teste de cálculo de mesas para 4 pessoas"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=4,
            nome_cliente='Cliente',
            telefone_cliente='999999999'
        )
        
        self.assertEqual(reserva.calcular_mesas_necessarias(), 1)
    
    def test_calcular_mesas_necessarias_8_pessoas(self):
        """Teste de cálculo de mesas para 8 pessoas"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=8,
            nome_cliente='Cliente',
            telefone_cliente='999999999'
        )
        
        self.assertEqual(reserva.calcular_mesas_necessarias(), 2)
    
    def test_calcular_mesas_necessarias_5_pessoas(self):
        """Teste de cálculo de mesas para 5 pessoas (arredonda para cima)"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=5,
            nome_cliente='Cliente',
            telefone_cliente='999999999'
        )
        
        self.assertEqual(reserva.calcular_mesas_necessarias(), 2)
    
    def test_calcular_mesas_necessarias_1_pessoa(self):
        """Teste de cálculo de mesas para 1 pessoa"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=1,
            nome_cliente='Cliente',
            telefone_cliente='999999999'
        )
        
        self.assertEqual(reserva.calcular_mesas_necessarias(), 1)
    
    def test_validacao_antecedencia_minima(self):
        """Teste de validação de antecedência mínima de 2 horas"""
        # Tentar criar reserva com apenas 1 hora de antecedência
        data_proxima = (timezone.now() + timedelta(hours=1)).date()
        horario_proximo = (timezone.now() + timedelta(hours=1)).time()
        
        with self.assertRaises(ValidationError) as context:
            Reserva.objects.create(
                restaurante=self.restaurante,
                data_reserva=data_proxima,
                horario=horario_proximo,
                quantidade_pessoas=4,
                nome_cliente='Cliente',
                telefone_cliente='999999999'
            )
        
        self.assertIn('2 horas de antecedência', str(context.exception))
    
    def test_validacao_quantidade_pessoas_zero(self):
        """Teste de validação de quantidade de pessoas zero"""
        with self.assertRaises(ValidationError) as context:
            Reserva.objects.create(
                restaurante=self.restaurante,
                data_reserva=self.data_futura,
                horario=self.horario_futuro,
                quantidade_pessoas=0,
                nome_cliente='Cliente',
                telefone_cliente='999999999'
            )
        
        self.assertIn('maior que zero', str(context.exception))
    
    def test_status_choices(self):
        """Teste de todos os status disponíveis"""
        status_list = ['pendente', 'confirmada', 'cancelada', 'concluida']
        
        for idx, status in enumerate(status_list):
            # Criar uma nova data para cada reserva
            data = (timezone.now() + timedelta(hours=3 + idx)).date()
            horario = (timezone.now() + timedelta(hours=3 + idx)).time()
            
            reserva = Reserva.objects.create(
                restaurante=self.restaurante,
                data_reserva=data,
                horario=horario,
                quantidade_pessoas=4,
                nome_cliente=f'Cliente {idx}',
                telefone_cliente=f'99999999{idx}',
                status=status
            )
            
            self.assertEqual(reserva.status, status)
    
    def test_pode_cancelar_reserva_futura(self):
        """Teste que reserva futura pode ser cancelada"""
        # Reserva com 5 horas de antecedência (> 2 horas)
        data = (timezone.now() + timedelta(hours=5)).date()
        horario = (timezone.now() + timedelta(hours=5)).time()
        
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=data,
            horario=horario,
            quantidade_pessoas=4,
            nome_cliente='Cliente',
            telefone_cliente='999999999',
            status='confirmada'
        )
        
        self.assertTrue(reserva.pode_cancelar())
    
    def test_nao_pode_cancelar_reserva_proxima(self):
        """Teste que reserva próxima não pode ser cancelada"""
        # Reserva com 1 hora de antecedência (< 2 horas)
        # Criar a reserva sem validação para simular uma reserva que foi criada antes
        reserva = Reserva(
            restaurante=self.restaurante,
            data_reserva=(timezone.now() + timedelta(hours=1)).date(),
            horario=(timezone.now() + timedelta(hours=1)).time(),
            quantidade_pessoas=4,
            nome_cliente='Cliente',
            telefone_cliente='999999999',
            status='confirmada'
        )
        # Salvar sem validação
        reserva.save(skip_validation=True)
        
        # Como a reserva está próxima (< 2h), não pode cancelar
        self.assertFalse(reserva.pode_cancelar())
    
    def test_nao_pode_cancelar_reserva_cancelada(self):
        """Teste que reserva cancelada não pode ser cancelada novamente"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=4,
            nome_cliente='Cliente',
            telefone_cliente='999999999',
            status='cancelada'
        )
        
        self.assertFalse(reserva.pode_cancelar())
    
    def test_nao_pode_cancelar_reserva_concluida(self):
        """Teste que reserva concluída não pode ser cancelada"""
        reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=self.data_futura,
            horario=self.horario_futuro,
            quantidade_pessoas=4,
            nome_cliente='Cliente',
            telefone_cliente='999999999',
            status='concluida'
        )
        
        self.assertFalse(reserva.pode_cancelar())


class ReservaMesaModelTest(TestCase):
    """Testes para o modelo ReservaMesa"""
    
    def setUp(self):
        """Criar dados para testes"""
        self.proprietario = Usuario.objects.create_user(
            email='proprietario@test.com',
            nome='Proprietário',
            username='prop_test',
            password='SenhaForte123'
        )
        
        self.restaurante = Restaurante.objects.create(
            nome='Restaurante Test',
            endereco='Rua Test, 123',
            cidade='Test City',
            estado='TC',
            cep='99999-999',
            email='test@restaurant.com',
            proprietario=self.proprietario,
            quantidade_mesas=0  # Não criar mesas automaticamente
        )
        
        self.mesa = Mesa.objects.create(
            restaurante=self.restaurante,
            numero=1,
            status='disponivel'
        )
        
        # Data e horário futuros
        data_futura = (timezone.now() + timedelta(hours=3)).date()
        horario_futuro = (timezone.now() + timedelta(hours=3)).time()
        
        self.reserva = Reserva.objects.create(
            restaurante=self.restaurante,
            data_reserva=data_futura,
            horario=horario_futuro,
            quantidade_pessoas=4,
            nome_cliente='Cliente Teste',
            telefone_cliente='999999999'
        )
    
    def test_criar_vinculo_reserva_mesa(self):
        """Teste de criação de vínculo entre reserva e mesa"""
        vinculo = ReservaMesa.objects.create(
            reserva=self.reserva,
            mesa=self.mesa
        )
        
        self.assertEqual(vinculo.reserva, self.reserva)
        self.assertEqual(vinculo.mesa, self.mesa)
        self.assertIsNotNone(vinculo.data_vinculacao)
    
    def test_reserva_mesa_str(self):
        """Teste da representação em string de ReservaMesa"""
        vinculo = ReservaMesa.objects.create(
            reserva=self.reserva,
            mesa=self.mesa
        )
        
        self.assertEqual(str(vinculo), f"Reserva {self.reserva.id} - Mesa 1")
    
    def test_unique_together_reserva_mesa(self):
        """Teste que a combinação reserva+mesa deve ser única"""
        ReservaMesa.objects.create(
            reserva=self.reserva,
            mesa=self.mesa
        )
        
        with self.assertRaises(IntegrityError):
            ReservaMesa.objects.create(
                reserva=self.reserva,
                mesa=self.mesa
            )
    
    def test_multiplas_mesas_mesma_reserva(self):
        """Teste que uma reserva pode ter múltiplas mesas"""
        mesa2 = Mesa.objects.create(
            restaurante=self.restaurante,
            numero=2,
            status='disponivel'
        )
        
        vinculo1 = ReservaMesa.objects.create(
            reserva=self.reserva,
            mesa=self.mesa
        )
        
        vinculo2 = ReservaMesa.objects.create(
            reserva=self.reserva,
            mesa=mesa2
        )
        
        self.assertEqual(self.reserva.mesas.count(), 2)
        self.assertIn(self.mesa, self.reserva.mesas.all())
        self.assertIn(mesa2, self.reserva.mesas.all())
