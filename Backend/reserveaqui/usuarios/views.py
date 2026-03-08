from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import Usuario, PasswordResetToken
from .serializers import (
    UsuarioSerializer, LoginSerializer, TrocarSenhaSerializer,
    SolicitarRecuperacaoSenhaSerializer, RedefinirSenhaSerializer,
    CadastroPublicoSerializer
)


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para cadastro e gerenciamento de usuários"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def cadastro(self, request):
        """Endpoint para cadastro público - cria apenas usuários do tipo cliente"""
        serializer = CadastroPublicoSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response(
                {'mensagem': 'Usuário cadastrado com sucesso!', 'usuario': UsuarioSerializer(usuario).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Endpoint para retornar dados do usuário autenticado"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Endpoint para login e geração de tokens JWT"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.validated_data['usuario']
            refresh = RefreshToken.for_user(usuario)
            
            return Response({
                'mensagem': 'Login realizado com sucesso!',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'usuario': {
                    'id': usuario.id,
                    'email': usuario.email,
                    'nome': usuario.nome,
                    'papeis': [{'tipo': p.tipo, 'descricao': p.get_tipo_display()} for p in usuario.papeis.all()],
                    'precisa_trocar_senha': usuario.precisa_trocar_senha
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def trocar_senha(self, request):
        """Endpoint para trocar senha do usuário autenticado"""
        serializer = TrocarSenhaSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            usuario = request.user
            nova_senha = serializer.validated_data['nova_senha']
            usuario.set_password(nova_senha)
            
            # Remover flag de precisa trocar senha
            if usuario.precisa_trocar_senha:
                usuario.precisa_trocar_senha = False
            
            usuario.save()
            
            return Response({
                'mensagem': 'Senha alterada com sucesso!'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def solicitar_recuperacao(self, request):
        """
        Endpoint para solicitar recuperação de senha.
        Gera um token e envia por email.
        """
        serializer = SolicitarRecuperacaoSenhaSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                usuario = Usuario.objects.get(email=email)
            except Usuario.DoesNotExist:
                # Não revelar se o email existe ou não (por segurança)
                return Response({
                    'mensagem': 'Se o email está cadastrado, um link de recuperação será enviado.'
                }, status=status.HTTP_200_OK)
            
            # Gerar token de recuperação
            reset_token = PasswordResetToken.gerar_token_recuperacao(usuario)
            
            # Construir link de recuperação
            reset_link = f"{settings.FRONTEND_URL}/redefinir-senha?token={reset_token.token}&email={email}" if hasattr(settings, 'FRONTEND_URL') else f"Token: {reset_token.token}"
            
            # Tentar enviar email
            try:
                plain_text = f"""Olá, {usuario.nome}!

Recebemos uma solicitação de recuperação de senha para sua conta ReserveAqui.

Para redefinir sua senha, acesse o link abaixo:
{reset_link}

⚠ Este link é válido por 24 horas e pode ser usado apenas uma vez.

Se você não solicitou esta recuperação, ignore este email — sua conta continua segura.

Atenciosamente,
Equipe ReserveAqui"""

                html_content = f"""<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Recuperação de Senha — ReserveAqui</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ece6;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ece6;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- HEADER -->
        <tr>
          <td style="background-color:#1a1a1a;border-bottom:2.5px solid #C9922A;padding:24px 40px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:10px;">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="36" height="36" rx="8" fill="#2e2a24"/>
                  <rect x="7" y="10" width="22" height="19" rx="3" stroke="#C9922A" stroke-width="1.8" fill="none"/>
                  <line x1="7" y1="15" x2="29" y2="15" stroke="#C9922A" stroke-width="1.5"/>
                  <line x1="13" y1="7" x2="13" y2="13" stroke="#C9922A" stroke-width="2" stroke-linecap="round"/>
                  <line x1="23" y1="7" x2="23" y2="13" stroke="#C9922A" stroke-width="2" stroke-linecap="round"/>
                  <polyline points="13,23 16.5,26.5 23,20" stroke="#C9922A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
              <td>
                <span style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#C9922A;letter-spacing:-0.3px;">Reserveaqui</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2e2a24 100%);padding:40px 40px 36px;text-align:center;border-bottom:1px solid rgba(201,146,42,0.18);">
            <div style="width:64px;height:64px;background:linear-gradient(135deg,#C9922A,#e8b04a);border-radius:50%;margin:0 auto 20px;font-size:28px;line-height:64px;text-align:center;">&#128272;</div>
            <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#ffffff;margin:0 0 10px;letter-spacing:-0.3px;">Recuperação de Senha</h1>
            <p style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:14px;color:#b0a898;margin:0;line-height:1.6;">
              Recebemos uma solicitação para redefinir<br/>a senha da sua conta ReserveAqui.
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 32px;background-color:#ffffff;">

            <p style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 16px;">Olá, {usuario.nome}!</p>

            <p style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;color:#555555;line-height:1.7;margin:0 0 28px;">
              Recebemos uma solicitação de recuperação de senha associada a este endereço de email.
              Se foi você quem solicitou, clique no botão abaixo para criar uma nova senha.
            </p>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" style="padding-bottom:28px;">
                <a href="{reset_link}" style="display:inline-block;background-color:#C9922A;color:#ffffff;text-decoration:none;font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:15px 40px;border-radius:10px;">
                  Redefinir minha senha
                </a>
              </td></tr>
            </table>

            <!-- Warning -->
            <div style="background-color:#fff9ee;border-left:3px solid #C9922A;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
              <p style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:13px;color:#7a6030;line-height:1.6;margin:0;">
                &#9200; <strong>Atenção:</strong> Este link é válido por <strong>24 horas</strong> e pode ser utilizado apenas uma vez.
                Após esse prazo, você precisará solicitar uma nova recuperação.
              </p>
            </div>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #ede8e2;margin:0 0 24px;"/>

            <!-- Fallback URL -->
            <p style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:13px;color:#888888;margin:0 0 10px;">
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
            </p>
            <div style="background-color:#faf8f5;border:1px solid #e5ddd5;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
              <p style="font-family:'Courier New',monospace;font-size:11px;color:#C9922A;word-break:break-all;margin:0;line-height:1.5;">{reset_link}</p>
            </div>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #ede8e2;margin:0 0 20px;"/>

            <!-- Security note -->
            <p style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:13px;color:#aaaaaa;line-height:1.6;margin:0;">
              &#128274; Se você <strong>não</strong> solicitou esta recuperação de senha, ignore este email com segurança — sua conta continua protegida e nenhuma alteração foi feita.
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;text-align:center;">
            <p style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:#C9922A;margin:0 0 12px;">Reserveaqui</p>
            <hr style="border:none;border-top:1px solid #333333;margin:0 0 14px;"/>
            <p style="font-family:-apple-system,'Segoe UI',sans-serif;font-size:12px;color:#665f57;line-height:1.7;margin:0;">
              © 2026 ReservaFácil. Todos os direitos reservados.<br/>
              Este email foi enviado para {usuario.email} pois uma solicitação de recuperação foi feita para esta conta.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

                email_msg = EmailMultiAlternatives(
                    subject='Recuperação de Senha — ReserveAqui',
                    body=plain_text,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[usuario.email],
                )
                email_msg.attach_alternative(html_content, 'text/html')
                email_msg.send(fail_silently=False)
                email_enviado = True
            except Exception as e:
                # Em desenvolvimento, apenas registrar que o email não foi enviado
                print(f"Erro ao enviar email: {e}")
                email_enviado = False
            
            return Response({
                'mensagem': 'Se o email está cadastrado, um link de recuperação será enviado.',
                'debug_token': reset_token.token if not email_enviado else None,  # Apenas para testes
                'email_enviado': email_enviado
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def redefinir_senha(self, request):
        """
        Endpoint para redefinir senha usando token de recuperação.
        Valida o token antes de permitir a redefinição.
        """
        serializer = RedefinirSenhaSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            nova_senha = serializer.validated_data['nova_senha']
            
            usuario = reset_token.usuario
            usuario.set_password(nova_senha)
            usuario.save()
            
            # Marcar token como utilizado
            reset_token.utilizado = True
            reset_token.save()
            
            return Response({
                'mensagem': 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)