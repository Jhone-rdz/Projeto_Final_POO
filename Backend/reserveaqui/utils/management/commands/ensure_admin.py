from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from usuarios.models import Papel, UsuarioPapel

User = get_user_model()


class Command(BaseCommand):
    help = 'Garante que existe um usuário admin do sistema. Cria se não existir.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            default='admin@reserveaqui.com',
            help='Email do admin (padrão: admin@reserveaqui.com)',
        )
        parser.add_argument(
            '--password',
            default='admin123',
            help='Senha do admin (padrão: admin123)',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        # Verificar se admin já existe
        admin_exists = User.objects.filter(email=email, is_superuser=True).exists()

        if admin_exists:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Admin já existe: {email}'
                )
            )
            return

        # Criar papéis se não existirem
        papel_admin, _ = Papel.objects.get_or_create(
            tipo='admin_sistema',
            defaults={'descricao': 'Admin do Sistema'},
        )

        # Criar admin
            admin = User.objects.create_superuser(
            email=email,
            password=password,
                username=email.split('@')[0],
            nome='Administrador',
        )

        # Atribuir papel
        UsuarioPapel.objects.get_or_create(
            usuario=admin,
            papel=papel_admin,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Admin criado com sucesso!'
                f'\n   Email: {email}'
                f'\n   Senha: {password}'
            )
        )
