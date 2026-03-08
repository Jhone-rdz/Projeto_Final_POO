from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date, time
from faker import Faker
import random

from usuarios.models import Usuario, Papel, UsuarioPapel
from restaurantes.models import Restaurante, RestauranteUsuario
from mesas.models import Mesa
from reservas.models import Reserva, ReservaMesa


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de teste usando Faker'

    # ------------------------------------------------------------------ #
    #  Configuração central – ajuste aqui para escalar a base             #
    # ------------------------------------------------------------------ #
    NUM_PROPRIETARIOS   = 6
    NUM_FUNCIONARIOS    = 18
    NUM_CLIENTES        = 80
    NUM_RESTAURANTES    = 6   # deve ser <= NUM_PROPRIETARIOS
    RESERVAS_POR_REST   = (40, 60)   # (min, max) por restaurante
    # ------------------------------------------------------------------ #

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fake = Faker('pt_BR')
        Faker.seed(42)
        random.seed(42)
        self.hoje = timezone.localdate()

    # ================================================================== #
    #  Ponto de entrada                                                   #
    # ================================================================== #

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🔄 Iniciando população do banco de dados...'))

        try:
            self.stdout.write('📋 Criando papéis...')
            self._criar_papeis()

            self.stdout.write('👥 Criando usuários...')
            admin, proprietarios, funcionarios, clientes = self._criar_usuarios()

            self.stdout.write('🏪 Criando restaurantes...')
            restaurantes = self._criar_restaurantes(proprietarios)

            self.stdout.write('👨‍💼 Vinculando funcionários aos restaurantes...')
            self._vincular_funcionarios(restaurantes, funcionarios)

            self.stdout.write('🪑 Criando mesas...')
            self._criar_mesas(restaurantes)

            self.stdout.write('📅 Criando reservas...')
            self._criar_reservas(restaurantes, clientes)

            self.stdout.write(self.style.SUCCESS('✅ População concluída com sucesso!'))
            self._mostrar_resumo(admin, proprietarios, funcionarios, clientes, restaurantes)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erro durante a população: {str(e)}'))
            raise

    # ================================================================== #
    #  Papéis                                                             #
    # ================================================================== #

    def _criar_papeis(self):
        papeis = [
            ('admin_sistema',    'Admin do Sistema'),
            ('admin_secundario', 'Admin Secundário - Proprietário'),
            ('funcionario',      'Funcionário de Restaurante'),
            ('cliente',          'Cliente'),
        ]
        for tipo, descricao in papeis:
            papel, created = Papel.objects.get_or_create(
                tipo=tipo,
                defaults={'descricao': descricao},
            )
            status = '✓' if created else '→'
            self.stdout.write(f'  {status} {descricao}')

    # ================================================================== #
    #  Usuários                                                           #
    # ================================================================== #

    def _criar_usuarios(self):
        # ---- Admin do sistema ---------------------------------------- #
        admin = self._upsert_usuario(
            email='admin@reserveaqui.com',
            username='admin_sistema',
            nome='Administrador do Sistema',
            senha='admin123',
            is_staff=True,
            is_superuser=True,
        )
        self._atribuir_papel(admin, 'admin_sistema')

        # ---- Proprietários ------------------------------------------- #
        proprietarios_fixos = [
            ('Carlos Silva',    'carlos@restaurante.com'),
            ('Maria Santos',    'maria@restaurante.com'),
            ('João Oliveira',   'joao@restaurante.com'),
            ('Ana Lima',        'ana@restaurante.com'),
            ('Roberto Costa',   'roberto@restaurante.com'),
            ('Fernanda Rocha',  'fernanda@restaurante.com'),
        ]
        proprietarios = []
        for nome, email in proprietarios_fixos[: self.NUM_PROPRIETARIOS]:
            u = self._upsert_usuario(
                email=email,
                username=email.split('@')[0],
                nome=nome,
                senha='Senha@123',
            )
            self._atribuir_papel(u, 'admin_secundario')
            proprietarios.append(u)

        # ---- Funcionários -------------------------------------------- #
        funcionarios = []
        for i in range(1, self.NUM_FUNCIONARIOS + 1):
            u = self._upsert_usuario(
                email=f'funcionario{i}@reserveaqui.com',
                username=f'func{i}',
                nome=self.fake.name(),
                senha='Func@123',
            )
            self._atribuir_papel(u, 'funcionario')
            funcionarios.append(u)

        # ---- Clientes ------------------------------------------------ #
        clientes = []
        for i in range(1, self.NUM_CLIENTES + 1):
            u = self._upsert_usuario(
                email=f'cliente{i}@email.com',
                username=f'cliente{i}',
                nome=self.fake.name(),
                senha='Cliente@123',
            )
            self._atribuir_papel(u, 'cliente')
            clientes.append(u)

        self.stdout.write(
            f'  ✓ Totais: 1 admin | {len(proprietarios)} proprietários | '
            f'{len(funcionarios)} funcionários | {len(clientes)} clientes'
        )
        return admin, proprietarios, funcionarios, clientes

    def _upsert_usuario(self, email, username, nome, senha,
                        is_staff=False, is_superuser=False):
        user, created = Usuario.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'nome': nome,
                'is_staff': is_staff,
                'is_superuser': is_superuser,
            },
        )
        if created:
            user.set_password(senha)
            user.save()
        return user

    def _atribuir_papel(self, usuario, tipo):
        papel = Papel.objects.get(tipo=tipo)
        UsuarioPapel.objects.get_or_create(usuario=usuario, papel=papel)

    # ================================================================== #
    #  Restaurantes                                                       #
    # ================================================================== #

    def _criar_restaurantes(self, proprietarios):
        dados = [
            {
                'nome': 'Pizzaria Italia',
                'descricao': 'Autêntica pizzaria italiana com receitas tradicionais',
                'endereco': 'Rua das Flores, 123',
                'cidade': 'São Paulo', 'estado': 'SP', 'cep': '01234-567',
                'telefone': '(11) 98765-4321',
                'email': 'contato@pizzaria-italia.com',
                'horario_funcionamento': 'Seg-Dom 11:00-23:00',
                'quantidade_mesas': 15,
            },
            {
                'nome': 'Churrascaria do Sul',
                'descricao': 'Churrascaria gaúcha com a melhor carne de Curitiba',
                'endereco': 'Avenida Principal, 456',
                'cidade': 'Curitiba', 'estado': 'PR', 'cep': '80010-000',
                'telefone': '(41) 99876-5432',
                'email': 'contato@churrascaria-sul.com',
                'horario_funcionamento': 'Seg-Dom 11:30-22:30',
                'quantidade_mesas': 20,
            },
            {
                'nome': 'Sushi Premium',
                'descricao': 'Melhor sushi da região com ingredientes selecionados',
                'endereco': 'Rua das Marés, 789',
                'cidade': 'Rio de Janeiro', 'estado': 'RJ', 'cep': '20000-000',
                'telefone': '(21) 98654-3210',
                'email': 'contato@sushi-premium.com',
                'horario_funcionamento': 'Seg-Sab 12:00-23:00',
                'quantidade_mesas': 12,
            },
            {
                'nome': 'Cantina Toscana',
                'descricao': 'Massas artesanais e vinhos italianos selecionados',
                'endereco': 'Rua Augusta, 900',
                'cidade': 'São Paulo', 'estado': 'SP', 'cep': '01305-100',
                'telefone': '(11) 97654-3210',
                'email': 'contato@cantina-toscana.com',
                'horario_funcionamento': 'Ter-Dom 12:00-23:00',
                'quantidade_mesas': 14,
            },
            {
                'nome': 'Bistrô Provençal',
                'descricao': 'Culinária francesa contemporânea no coração de BH',
                'endereco': 'Av. Afonso Pena, 1500',
                'cidade': 'Belo Horizonte', 'estado': 'MG', 'cep': '30130-921',
                'telefone': '(31) 98888-1234',
                'email': 'contato@bistro-provencal.com',
                'horario_funcionamento': 'Ter-Dom 12:00-22:30',
                'quantidade_mesas': 10,
            },
            {
                'nome': 'Taco & Cia',
                'descricao': 'Culinária mexicana autêntica e caipirinhas artesanais',
                'endereco': 'Rua da Consolação, 350',
                'cidade': 'São Paulo', 'estado': 'SP', 'cep': '01302-001',
                'telefone': '(11) 91234-5678',
                'email': 'contato@taco-cia.com',
                'horario_funcionamento': 'Seg-Dom 17:00-00:00',
                'quantidade_mesas': 16,
            },
        ]

        restaurantes = []
        for i, data in enumerate(dados[: self.NUM_RESTAURANTES]):
            data['proprietario'] = proprietarios[i % len(proprietarios)]
            rest, created = Restaurante.objects.get_or_create(
                email=data['email'],
                defaults=data,
            )
            status = '✓' if created else '→'
            self.stdout.write(f'  {status} {data["nome"]}')
            restaurantes.append(rest)

        return restaurantes

    # ================================================================== #
    #  Funcionários ↔ Restaurantes                                       #
    # ================================================================== #

    def _vincular_funcionarios(self, restaurantes, funcionarios):
        # Distribui 3 funcionários por restaurante (sem sobreposição forçada)
        pool = list(funcionarios)
        random.shuffle(pool)
        for idx, restaurante in enumerate(restaurantes):
            inicio = (idx * 3) % len(pool)
            selecionados = [pool[(inicio + j) % len(pool)] for j in range(3)]
            for func in selecionados:
                RestauranteUsuario.objects.get_or_create(
                    restaurante=restaurante,
                    usuario=func,
                    defaults={'papel': 'funcionario'},
                )
            nomes = ', '.join(f.nome.split()[0] for f in selecionados)
            self.stdout.write(f'  ✓ {restaurante.nome}: {nomes}')

    # ================================================================== #
    #  Mesas                                                              #
    # ================================================================== #

    def _criar_mesas(self, restaurantes):
        for restaurante in restaurantes:
            quantidade = restaurante.quantidade_mesas
            existentes = restaurante.mesas.count()
            criadas = 0
            for numero in range(existentes + 1, quantidade + 1):
                Mesa.objects.get_or_create(
                    restaurante=restaurante,
                    numero=numero,
                    defaults={
                        'status': 'disponivel',
                        'ativa': True,
                    },
                )
                criadas += 1
            self.stdout.write(
                f'  ✓ {restaurante.nome}: {quantidade} mesas ({criadas} novas)'
            )

    # ================================================================== #
    #  Reservas                                                           #
    # ================================================================== #

    # Data de referência dinâmica (dia da execução)

    # Janela: 30 dias para trás e 30 dias para frente
    DIAS_PASSADO  = 30
    DIAS_FUTURO   = 30

    # Distribuição de status por faixa de data
    #   passado  → concluida (80%) | cancelada (20%)
    #   hoje     → confirmada (60%) | pendente (30%) | cancelada (10%)
    #   futuro   → pendente (50%) | confirmada (45%) | cancelada (5%)

    def _status_para_data(self, data_reserva: date) -> str:
        delta = (data_reserva - self.hoje).days
        if delta < 0:        # passado
            return random.choices(
                ['concluida', 'cancelada'],
                weights=[80, 20],
            )[0]
        elif delta == 0:     # hoje
            return random.choices(
                ['confirmada', 'pendente', 'cancelada'],
                weights=[60, 30, 10],
            )[0]
        else:                # futuro
            return random.choices(
                ['pendente', 'confirmada', 'cancelada'],
                weights=[50, 45, 5],
            )[0]

    def _criar_reservas(self, restaurantes, clientes):
        # Mantem comportamento idempotente: limpa reservas anteriores dos restaurantes seedados.
        restaurante_ids = [rest.id for rest in restaurantes]
        reservas_existentes = Reserva.objects.filter(restaurante_id__in=restaurante_ids)
        qtd_removidas = reservas_existentes.count()
        if qtd_removidas:
            reservas_existentes.delete()
            self.stdout.write(f'  → Reservas antigas removidas: {qtd_removidas}')

        total = 0
        for restaurante in restaurantes:
            num = random.randint(*self.RESERVAS_POR_REST)
            for _ in range(num):
                cliente = random.choice(clientes)

                dias_offset = random.randint(-self.DIAS_PASSADO, self.DIAS_FUTURO)
                data_reserva = self.hoje + timedelta(days=dias_offset)

                # Horários realistas: 11:30-14:00 (almoço) ou 18:00-22:00 (jantar)
                turno = random.choices(['almoco', 'jantar'], weights=[35, 65])[0]
                if turno == 'almoco':
                    hora   = random.randint(11, 13)
                    minuto = random.choice([0, 30])
                    if hora == 11:
                        minuto = 30   # abre 11:30
                else:
                    hora   = random.randint(18, 21)
                    minuto = random.choice([0, 30])

                qtd_pessoas = random.choices(
                    [1, 2, 3, 4, 5, 6, 7, 8],
                    weights=[3, 25, 15, 25, 10, 12, 5, 5],
                )[0]

                status = self._status_para_data(data_reserva)
                horario_reserva = time(hora, minuto)

                # Observações realistas (40 % das reservas)
                obs = ''
                if random.random() < 0.40:
                    obs = random.choice([
                        'Aniversário do cliente, solicitar bolo surpresa.',
                        'Alergia a frutos do mar.',
                        'Precisamos de cadeirinha para bebê.',
                        'Mesa próxima à janela, se possível.',
                        'Vegetariano no grupo.',
                        'Comemorando noivado.',
                        'Intolerante a lactose.',
                        'Mesa reservada para reunião de negócios.',
                        'Solicitar cardápio em inglês.',
                        'Mesa no terraço, se disponível.',
                    ])

                reserva = Reserva(
                    restaurante=restaurante,
                    usuario=cliente,
                    data_reserva=data_reserva,
                    horario=horario_reserva,
                    quantidade_pessoas=qtd_pessoas,
                    nome_cliente=cliente.nome,
                    telefone_cliente=self.fake.phone_number(),
                    email_cliente=cliente.email,
                    status=status,
                    observacoes=obs,
                )
                # Usar skip_validation apenas para dados históricos/seedados, nunca para dados de usuário
                # já que os dados do seed são controlados e não precisam passar por validação de negócio
                reserva.save(skip_validation=True)

                # Associar mesas (só para reservas não canceladas)
                if status != 'cancelada':
                    mesas_necessarias = reserva.calcular_mesas_necessarias()
                    mesas_disponiveis = list(
                        restaurante.mesas.filter(ativa=True)
                        .exclude(
                            reservamesa__reserva__data_reserva=data_reserva,
                            reservamesa__reserva__horario=horario_reserva,
                            reservamesa__reserva__status__in=['pendente', 'confirmada'],
                        )
                        .order_by('numero')[:mesas_necessarias]
                    )

                    # Se nao houver mesas livres suficientes no horario, usa as primeiras ativas.
                    if len(mesas_disponiveis) < mesas_necessarias:
                        mesas_disponiveis = list(
                            restaurante.mesas.filter(ativa=True).order_by('numero')[:mesas_necessarias]
                        )

                    for mesa in mesas_disponiveis:
                        ReservaMesa.objects.get_or_create(reserva=reserva, mesa=mesa)

            self.stdout.write(f'  ✓ {num} reservas → {restaurante.nome}')
            total += num

        self.stdout.write(f'  ✓ Total de reservas criadas: {total}')

    # ================================================================== #
    #  Resumo final                                                       #
    # ================================================================== #

    def _mostrar_resumo(self, admin, proprietarios, funcionarios, clientes, restaurantes):
        sep = '=' * 62
        self.stdout.write(self.style.SUCCESS(f'\n{sep}'))
        self.stdout.write(self.style.SUCCESS('📊  RESUMO DA POPULAÇÃO'))
        self.stdout.write(self.style.SUCCESS(sep))

        self.stdout.write(f'\n👤  Admin do Sistema (1)')
        self.stdout.write(f'    {admin.email}  |  senha: admin123')

        self.stdout.write(f'\n👨‍💼  Proprietários ({len(proprietarios)})')
        for p in proprietarios:
            self.stdout.write(f'    {p.email}  |  senha: Senha@123')

        self.stdout.write(f'\n👨‍💻  Funcionários ({len(funcionarios)})')
        self.stdout.write(f'    funcionario1..{len(funcionarios)}@reserveaqui.com  |  senha: Func@123')

        self.stdout.write(f'\n👥  Clientes ({len(clientes)})')
        self.stdout.write(f'    cliente1..{len(clientes)}@email.com  |  senha: Cliente@123')

        self.stdout.write(f'\n🏪  Restaurantes ({len(restaurantes)})')
        for rest in restaurantes:
            mesas   = rest.mesas.count()
            reservas = rest.reservas.count()
            self.stdout.write(f'    {rest.nome:<25} {mesas:>2} mesas  |  {reservas:>3} reservas')

        total_reservas = sum(rest.reservas.count() for rest in restaurantes)
        self.stdout.write(f'\n📅  Total de Reservas : {total_reservas}')
        self.stdout.write(f'📆  Data de referência: {self.hoje.strftime("%d/%m/%Y")}')
        self.stdout.write(f'    Janela: -{self.DIAS_PASSADO} dias / +{self.DIAS_FUTURO} dias')
        self.stdout.write(self.style.SUCCESS(f'\n{sep}\n'))