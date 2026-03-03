from django.core.mail import send_mail
from django.conf import settings


def enviar_senha_generica(usuario, senha_generica, tipo_usuario='usuário'):
    """
    Envia email com senha genérica para novo usuário.
    
    Args:
        usuario: Instância do modelo Usuario
        senha_generica: Senha gerada automaticamente
        tipo_usuario: Tipo de usuário (admin_secundario, funcionario, etc)
    
    Returns:
        bool: True se email foi enviado com sucesso, False caso contrário
    """
    assunto = f'Bem-vindo ao ReserveAqui - Sua conta foi criada'
    
    mensagem = f"""
Olá {usuario.nome},

Sua conta no sistema ReserveAqui foi criada com sucesso!

Tipo de acesso: {tipo_usuario}
Email: {usuario.email}
Senha temporária: {senha_generica}

IMPORTANTE: Por segurança, você será solicitado a alterar sua senha no primeiro acesso.

Para acessar o sistema, faça login em: {settings.FRONTEND_URL}/login

Atenciosamente,
Equipe ReserveAqui
"""
    
    try:
        send_mail(
            assunto,
            mensagem,
            settings.DEFAULT_FROM_EMAIL,
            [usuario.email],
            fail_silently=False,
        )
        print(f"\n[EMAIL] Email enviado com sucesso para {usuario.email}")
        return True
    except ConnectionRefusedError as e:
        print(f"\n[ERRO EMAIL] Conexão recusada ao tentar enviar email")
        print(f"  - Verifique se o EMAIL_BACKEND está configurado corretamente")
        print(f"  - Para desenvolvimento, use: EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend'")
        print(f"  - Detalhes do erro: {str(e)}")
        return False
    except Exception as e:
        print(f"\n[ERRO EMAIL] Erro ao enviar email: {str(e)}")
        print(f"  - Tipo de erro: {type(e).__name__}")
        return False
