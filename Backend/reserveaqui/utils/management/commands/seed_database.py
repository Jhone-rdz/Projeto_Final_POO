from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, time
from faker import Faker
import random

from usuarios.models import Usuario, Papel, UsuarioPapel
from restaurantes.models import Restaurante, RestauranteUsuario
from mesas.models import Mesa
from reservas.models import Reserva, ReservaMesa


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de teste usando Faker'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fake = Faker('pt_BR')
        Faker.seed(42)
        random.seed(42)

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🔄 Iniciando população do banco de dados...'))

        try:
            # 1. Criar/validar Papéis
            self.stdout.write('📋 Criando papéis...')
            self._criar_papeis()

            # 2. Criar usuários
            self.stdout.write('👥 Criando usuários...')
            admin_sistema, proprietarios, funcionarios, clientes = self._criar_usuarios()

            # 3. Criar restaurantes
            self.stdout.write('🏪 Criando restaurantes...')
            restaurantes = self._criar_restaurantes(proprietarios)

            # 4. Adicionar funcionários aos restaurantes
            self.stdout.write('👨‍💼 Vinculando funcionários aos restaurantes...')
            self._vincular_funcionarios(restaurantes, funcionarios)

            # 5. Mesas (serão criadas automaticamente pelo modelo)
            self.stdout.write('🪑 Criando mesas...')
            self._criar_mesas(restaurantes)

            # 6. Reservas
            self.stdout.write('📅 Criando reservas...')
            self._criar_reservas(restaurantes, clientes)

            self.stdout.write(self.style.SUCCESS('✅ População do banco de dados concluída com sucesso!'))
            self._mostrar_resumo(admin_sistema, proprietarios, funcionarios, clientes, restaurantes)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erro durante a população: {str(e)}'))
            raise

    def _criar_papeis(self):
        """Cria os papéis do sistema"""
        papeis_list = [
            ('admin_sistema', 'Admin do Sistema'),
            ('admin_secundario', 'Admin Secundário - Proprietário'),
            ('funcionario', 'Funcionário de Restaurante'),
            ('cliente', 'Cliente'),
        ]

        for tipo, descricao in papeis_list:
            papel, created = Papel.objects.get_or_create(
                tipo=tipo,
                defaults={'descricao': descricao}
            )
            if created:
                self.stdout.write(f'  ✓ Papel criado: {descricao}')
            else:
                self.stdout.write(f'  → Papel já existe: {descricao}')

    def _criar_usuarios(self):
        """Cria usuários de diferentes tipos"""
        usuarios = {
            'admin': None,
            'proprietarios': [],
            'funcionarios': [],
            'clientes': []
        }

        # 1. Admin do Sistema (1)
        admin, created = Usuario.objects.get_or_create(
            email='admin@reserveaqui.com',
            defaults={
                'username': 'admin_sistema',
                'nome': 'Administrador do Sistema',
                'is_staff': True,
                'is_superuser': True,
                'password': 'admin123'
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write('  ✓ Admin criado: admin@reserveaqui.com / admin123')
        else:
            self.stdout.write('  → Admin já existe')

        papel_admin = Papel.objects.get(tipo='admin_sistema')
        UsuarioPapel.objects.get_or_create(usuario=admin, papel=papel_admin)
        usuarios['admin'] = admin

        # 2. Proprietários (3)
        proprietarios_data = [
            {'nome': 'Carlos Silva', 'email': 'carlos@restaurante.com'},
            {'nome': 'Maria Santos', 'email': 'maria@restaurante.com'},
            {'nome': 'João Oliveira', 'email': 'joao@restaurante.com'},
        ]

        papel_admin_sec = Papel.objects.get(tipo='admin_secundario')

        for data in proprietarios_data:
            user, created = Usuario.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['email'].split('@')[0],
                    'nome': data['nome'],
                }
            )
            if created:
                user.set_password('Senha@123')
                user.save()
                self.stdout.write(f'  ✓ Proprietário criado: {data["email"]} / Senha@123')
            else:
                self.stdout.write(f'  → Proprietário já existe: {data["email"]}')

            UsuarioPapel.objects.get_or_create(usuario=user, papel=papel_admin_sec)
            usuarios['proprietarios'].append(user)

        # 3. Funcionários (6)
        papel_funcionario = Papel.objects.get(tipo='funcionario')
        for i in range(6):
            nome = self.fake.name()
            email = f'funcionario{i+1}@reserveaqui.com'
            user, created = Usuario.objects.get_or_create(
                email=email,
                defaults={
                    'username': f'func{i+1}',
                    'nome': nome,
                }
            )
            if created:
                user.set_password('Func@123')
                user.save()
                self.stdout.write(f'  ✓ Funcionário criado: {email} / Func@123')
            else:
                self.stdout.write(f'  → Funcionário já existe: {email}')

            UsuarioPapel.objects.get_or_create(usuario=user, papel=papel_funcionario)
            usuarios['funcionarios'].append(user)

        # 4. Clientes (10)
        papel_cliente = Papel.objects.get(tipo='cliente')
        for i in range(10):
            nome = self.fake.name()
            email = f'cliente{i+1}@email.com'
            user, created = Usuario.objects.get_or_create(
                email=email,
                defaults={
                    'username': f'cliente{i+1}',
                    'nome': nome,
                }
            )
            if created:
                user.set_password('Cliente@123')
                user.save()
                self.stdout.write(f'  ✓ Cliente criado: {email} / Cliente@123')
            else:
                self.stdout.write(f'  → Cliente já existe: {email}')

            UsuarioPapel.objects.get_or_create(usuario=user, papel=papel_cliente)
            usuarios['clientes'].append(user)

        return usuarios['admin'], usuarios['proprietarios'], usuarios['funcionarios'], usuarios['clientes']

    def _criar_restaurantes(self, proprietarios):
        """Cria restaurantes para cada proprietário"""
        restaurantes_data = [
            {
                'nome': 'Pizzaria Italia',
                'descricao': 'Autêntica pizzaria italiana com receitas tradicionais',
                'endereco': 'Rua das Flores, 123',
                'cidade': 'São Paulo',
                'estado': 'SP',
                'cep': '01234-567',
                'telefone': '(11) 98765-4321',
                'email': 'contato@pizzaria-italia.com',
                'horario_funcionamento': 'Seg-Dom 11:00-23:00',
                'quantidade_mesas': 12,
            },
            {
                'nome': 'Churrascaria do Sul',
                'descricao': 'Churrascaria com melhor carne de Curitiba',
                'endereco': 'Avenida Principal, 456',
                'cidade': 'Curitiba',
                'estado': 'PR',
                'cep': '80010-000',
                'telefone': '(41) 99876-5432',
                'email': 'contato@churrascaria-sul.com',
                'horario_funcionamento': 'Seg-Dom 11:30-22:30',
                'quantidade_mesas': 15,
            },
            {
                'nome': 'Sushi Premium',
                'descricao': 'Melhor sushi da região com ingredientes importados',
                'endereco': 'Rua das Mares, 789',
                'cidade': 'Rio de Janeiro',
                'estado': 'RJ',
                'cep': '20000-000',
                'telefone': '(21) 98654-3210',
                'email': 'contato@sushi-premium.com',
                'horario_funcionamento': 'Seg-Sab 12:00-23:00',
                'quantidade_mesas': 10,
            },
        ]

        restaurantes = []
        for i, data in enumerate(restaurantes_data):
            proprietario = proprietarios[i % len(proprietarios)]
            data['proprietario'] = proprietario

            rest, created = Restaurante.objects.get_or_create(
                email=data['email'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  ✓ Restaurante criado: {data["nome"]}')
            else:
                self.stdout.write(f'  → Restaurante já existe: {data["nome"]}')

            restaurantes.append(rest)

        return restaurantes

    def _vincular_funcionarios(self, restaurantes, funcionarios):
        """Vincula funcionários aos restaurantes"""
        for restaurante in restaurantes:
            # Cada restaurante recebe 2 funcionários
            funcs_selecionados = random.sample(funcionarios, min(2, len(funcionarios)))
            for func in funcs_selecionados:
                RestauranteUsuario.objects.get_or_create(
                    restaurante=restaurante,
                    usuario=func,
                    defaults={'papel': 'funcionario'}
                )
                self.stdout.write(f'  ✓ {func.nome} vinculado a {restaurante.nome}')

    def _criar_mesas(self, restaurantes):
        """Cria mesas para cada restaurante"""
        for restaurante in restaurantes:
            # Pega a quantidade de mesas do restaurante
            quantidade = restaurante.quantidade_mesas

            # Verifica quantas já existem
            mesas_existentes = restaurante.mesas.count()

            # Cria apenas as que faltam
            for numero in range(mesas_existentes + 1, quantidade + 1):
                Mesa.objects.get_or_create(
                    restaurante=restaurante,
                    numero=numero,
                    defaults={
                        'status': 'disponivel',
                        'ativa': True
                    }
                )

            self.stdout.write(f'  ✓ {quantidade} mesas criadas em {restaurante.nome}')

    def _criar_reservas(self, restaurantes, clientes):
        """Cria reservas de teste"""
        statuses = ['pendente', 'confirmada', 'concluida']

        for restaurante in restaurantes:
            # 8-12 reservas por restaurante
            num_reservas = random.randint(8, 12)

            for _ in range(num_reservas):
                cliente = random.choice(clientes)
                status = random.choice(statuses)

                # Data entre -7 dias e +14 dias
                dias_offset = random.randint(-7, 14)
                data_reserva = timezone.now().date() + timedelta(days=dias_offset)

                # Horário entre 11:30 e 22:00
                hora = random.randint(11, 21)
                minuto = random.choice([0, 30])

                quantidade_pessoas = random.randint(2, 8)

                reserva = Reserva(
                    restaurante=restaurante,
                    usuario=cliente,
                    data_reserva=data_reserva,
                    horario=time(hora, minuto),
                    quantidade_pessoas=quantidade_pessoas,
                    nome_cliente=cliente.nome,
                    telefone_cliente=self.fake.phone_number(),
                    email_cliente=cliente.email,
                    status=status,
                    observacoes=self.fake.sentence() if random.random() > 0.5 else ''
                )
                # Pula validação para população de teste
                reserva.save(skip_validation=True)

                # Associar mesas à reserva
                mesas_necessarias = reserva.calcular_mesas_necessarias()
                mesas_disponiveis = restaurante.mesas.filter(ativa=True)[:mesas_necessarias]

                for mesa in mesas_disponiveis:
                    ReservaMesa.objects.create(
                        reserva=reserva,
                        mesa=mesa
                    )

            self.stdout.write(f'  ✓ {num_reservas} reservas criadas em {restaurante.nome}')

    def _mostrar_resumo(self, admin, proprietarios, funcionarios, clientes, restaurantes):
        """Mostra um resumo do que foi criado"""
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('📊 RESUMO DA POPULAÇÃO'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'👤 Admin do Sistema: 1 usuário')
        self.stdout.write(f'   Email: admin@reserveaqui.com | Senha: admin123')
        self.stdout.write(f'\n👨‍💼 Proprietários: {len(proprietarios)} usuários')
        for prop in proprietarios:
            self.stdout.write(f'   Email: {prop.email} | Senha: Senha@123')
        self.stdout.write(f'\n👨‍💻 Funcionários: {len(funcionarios)} usuários')
        self.stdout.write(f'   Padrão: funcionarioX@reserveaqui.com | Senha: Func@123')
        self.stdout.write(f'\n👥 Clientes: {len(clientes)} usuários')
        self.stdout.write(f'   Padrão: clienteX@email.com | Senha: Cliente@123')
        self.stdout.write(f'\n🏪 Restaurantes: {len(restaurantes)} criados')
        for rest in restaurantes:
            mesas = rest.mesas.count()
            reservas = rest.reservas.count()
            self.stdout.write(f'   - {rest.nome}: {mesas} mesas, {reservas} reservas')
        total_reservas = sum(rest.reservas.count() for rest in restaurantes)
        self.stdout.write(f'\n📅 Total de Reservas: {total_reservas}')
        self.stdout.write('='*60 + '\n')
