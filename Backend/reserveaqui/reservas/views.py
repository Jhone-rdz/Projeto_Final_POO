from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Reserva, ReservaMesa, Notificacao
from .serializers import (
    ReservaSerializer,
    ReservaListSerializer,
    ReservaCreateUpdateSerializer,
    NotificacaoSerializer
)
from .permissions import IsOwnerOrAdminForReservas
from .reports import RelatorioHelper, RelatorioOcupacaoSerializer, HorarioMovimentadoSerializer, EstatisticasSerieSerializer


class ReservaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de reservas.
    
    Implementa funcionalidades para:
    - Criar, editar e cancelar reservas
    - Validação de conflito de mesas
    - Confirmação de reserva
    - Listagem de reservas do usuário
    """
    
    queryset = Reserva.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrAdminForReservas]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['restaurante', 'status', 'data_reserva']
    search_fields = ['nome_cliente', 'telefone_cliente', 'email_cliente']
    ordering_fields = ['data_reserva', 'horario', 'data_criacao']
    ordering = ['-data_reserva', '-horario']
    
    def get_serializer_class(self):
        """Retorna o serializer apropriado para cada ação"""
        if self.action == 'list':
            return ReservaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ReservaCreateUpdateSerializer
        return ReservaSerializer
    
    def get_queryset(self):
        """
        Filtrar reservas por usuário e papel.
        - Admin_sistema: vê todas as reservas
        - Admin_secundario (proprietário): vê reservas do seu restaurante
        - Funcionário: vê reservas do restaurante onde trabalha
        - Cliente: vê apenas suas próprias reservas
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # Admin_sistema vê tudo
        is_admin_sistema = user.usuariopapel_set.filter(
            papel__tipo='admin_sistema'
        ).exists()
        
        if is_admin_sistema:
            return queryset
        
        # Admin_secundario (proprietário): vê reservas de seu restaurante
        is_admin_secundario = user.usuariopapel_set.filter(
            papel__tipo='admin_secundario'
        ).exists()
        
        if is_admin_secundario:
            from restaurantes.models import Restaurante
            seu_restaurante = Restaurante.objects.filter(proprietario=user).first()
            if seu_restaurante:
                return queryset.filter(restaurante=seu_restaurante)
            return queryset.none()
        
        # Funcionário: vê reservas do restaurante onde trabalha
        is_funcionario = user.usuariopapel_set.filter(
            papel__tipo='funcionario'
        ).exists()
        
        if is_funcionario:
            from restaurantes.models import RestauranteUsuario
            restaurantes_ids = RestauranteUsuario.objects.filter(
                usuario=user,
                papel='funcionario'
            ).values_list('restaurante_id', flat=True)
            
            if restaurantes_ids:
                return queryset.filter(restaurante_id__in=restaurantes_ids)
            return queryset.none()
        
        # Cliente: vê apenas suas próprias reservas
        return queryset.filter(usuario=user)
    
    def create(self, request, *args, **kwargs):
        """
        Criar nova reserva com alocação automática de mesas.
        Valida conflitos e disponibilidade.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Retornar com serializer completo
        output_serializer = ReservaSerializer(serializer.instance)
        headers = self.get_success_headers(output_serializer.data)
        
        return Response(
            {
                'message': 'Reserva criada com sucesso! Aguardando confirmação do restaurante.',
                'reserva': output_serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Editar reserva com validações"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Retornar com serializer completo
        output_serializer = ReservaSerializer(serializer.instance)
        
        return Response({
            'message': 'Reserva atualizada com sucesso!',
            'reserva': output_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """
        Apenas admin_sistema pode deletar reserva.
        Clientes devem usar cancelar/ action ao invés de DELETE.
        """
        # Apenas admin_sistema
        is_admin_sistema = request.user.usuariopapel_set.filter(
            papel__tipo='admin_sistema'
        ).exists()
        
        if not is_admin_sistema:
            return Response(
                {'error': 'Clientes devem usar o endpoint cancelar/ para cancelar reservas. '
                          'Apenas administradores podem deletar.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reserva = self.get_object()
        reserva.delete()
        
        return Response(
            {'message': 'Reserva deletada permanentemente pelo administrador.'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirmar(self, request, pk=None):
        """
        Confirmar reserva.
        Permitido para: admin_sistema, admin_secundario, funcionario
        Cria automaticamente uma notificação para o cliente.
        """
        reserva = self.get_object()
        user = request.user
        
        # 🔒 Validar permissão
        is_admin_sistema = user.usuariopapel_set.filter(
            papel__tipo='admin_sistema'
        ).exists()
        
        if not is_admin_sistema:
            # Admin_secundario: deve ser proprietário
            if user != reserva.restaurante.proprietario:
                # Funcionário: deve trabalhar naquele restaurante
                is_funcionario = user.usuariopapel_set.filter(
                    papel__tipo='funcionario'
                ).exists()
                
                if is_funcionario:
                    from restaurantes.models import RestauranteUsuario
                    trabalha_aqui = RestauranteUsuario.objects.filter(
                        usuario=user,
                        restaurante=reserva.restaurante,
                        papel='funcionario'
                    ).exists()
                    
                    if not trabalha_aqui:
                        return Response(
                            {'error': 'Você não trabalha neste restaurante.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                else:
                    return Response(
                        {'error': 'Apenas administradores e funcionários podem confirmar reservas.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Validar status atual
        if reserva.status == 'confirmada':
            return Response(
                {'error': 'Esta reserva já está confirmada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if reserva.status == 'cancelada':
            return Response(
                {'error': 'Não é possível confirmar uma reserva cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if reserva.status == 'concluida':
            return Response(
                {'error': 'Esta reserva já foi concluída.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Confirmar reserva
        reserva.status = 'confirmada'
        reserva.save(skip_validation=True)
        
        # Criar notificação de confirmação para o cliente
        if reserva.usuario:
            Notificacao.objects.create(
                usuario=reserva.usuario,
                reserva=reserva,
                tipo='confirmacao',
                titulo=f'Reserva Confirmada - {reserva.restaurante.nome}',
                mensagem=f'Sua reserva para {reserva.quantidade_pessoas} pessoas em {reserva.restaurante.nome} '
                         f'foi confirmada para {reserva.data_reserva} às {reserva.horario}. '
                         f'Mesas: {", ".join([str(m.numero) for m in reserva.mesas.all()])}'
            )
        
        serializer = ReservaSerializer(reserva)
        return Response({
            'message': 'Reserva confirmada com sucesso! Cliente será notificado.',
            'reserva': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancelar(self, request, pk=None):
        """
        Cancelar reserva.
        Libera as mesas alocadas.
        Permitido para: dono da reserva, admin_sistema, admin_secundario, funcionario
        """
        reserva = self.get_object()
        user = request.user
        
        # Validar permissão: dono OU admin OU funcionário do restaurante
        is_dono = reserva.usuario == user
        is_admin_sistema = user.usuariopapel_set.filter(
            papel__tipo='admin_sistema'
        ).exists()
        
        if not (is_dono or is_admin_sistema):
            # Admin_secundario: deve ser proprietário
            if user != reserva.restaurante.proprietario:
                # Funcionário: deve trabalhar naquele restaurante
                is_funcionario = user.usuariopapel_set.filter(
                    papel__tipo='funcionario'
                ).exists()
                
                if is_funcionario:
                    from restaurantes.models import RestauranteUsuario
                    trabalha_aqui = RestauranteUsuario.objects.filter(
                        usuario=user,
                        restaurante=reserva.restaurante,
                        papel='funcionario'
                    ).exists()
                    
                    if not trabalha_aqui:
                        return Response(
                            {'error': 'Você não trabalha neste restaurante.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                else:
                    return Response(
                        {'error': 'Você não tem permissão para cancelar esta reserva.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Verificar se pode cancelar
        if reserva.status == 'cancelada':
            return Response(
                {'error': 'Esta reserva já está cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if reserva.status == 'concluida':
            return Response(
                {'error': 'Não é possível cancelar uma reserva já concluída.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se pode cancelar
        # Proprietários/admins podem cancelar qualquer reserva
        # Clientes só podem cancelar com 30 minutos de antecedência
        is_proprietario = user == reserva.restaurante.proprietario or user.usuariopapel_set.filter(
            papel__tipo__in=['admin_sistema', 'admin_secundario']
        ).exists()
        
        if not is_proprietario:
            # Cliente: verificar restrições de tempo
            if not reserva.pode_cancelar():
                return Response(
                    {'error': 'Não é possível cancelar reservas com menos de 30 minutos de antecedência.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # RN03: Liberar mesas automaticamente
        ReservaMesa.objects.filter(reserva=reserva).delete()
        
        # Atualizar status
        reserva.status = 'cancelada'
        reserva.save(skip_validation=True)
        
        serializer = ReservaSerializer(reserva)
        return Response({
            'message': 'Reserva cancelada com sucesso! As mesas foram liberadas.',
            'reserva': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def concluir(self, request, pk=None):
        """
        Marca a reserva como concluída.
        Permitido para: admin_sistema, admin_secundario, funcionario
        """
        reserva = self.get_object()
        user = request.user
        
        # 🔒 Validar permissão
        is_admin_sistema = user.usuariopapel_set.filter(
            papel__tipo='admin_sistema'
        ).exists()
        
        if not is_admin_sistema:
            # Admin_secundario: deve ser proprietário
            if user != reserva.restaurante.proprietario:
                # Funcionário: deve trabalhar naquele restaurante
                is_funcionario = user.usuariopapel_set.filter(
                    papel__tipo='funcionario'
                ).exists()
                
                if is_funcionario:
                    from restaurantes.models import RestauranteUsuario
                    trabalha_aqui = RestauranteUsuario.objects.filter(
                        usuario=user,
                        restaurante=reserva.restaurante,
                        papel='funcionario'
                    ).exists()
                    
                    if not trabalha_aqui:
                        return Response(
                            {'error': 'Você não trabalha neste restaurante.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                else:
                    return Response(
                        {'error': 'Apenas administradores e funcionários podem concluir reservas.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Validar status
        if reserva.status != 'confirmada':
            return Response(
                {'error': 'Apenas reservas confirmadas podem ser concluídas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Concluir reserva
        reserva.status = 'concluida'
        reserva.save(skip_validation=True)
        
        serializer = ReservaSerializer(reserva)
        return Response({
            'message': 'Reserva concluída com sucesso!',
            'reserva': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def minhas_reservas(self, request):
        """
        RF12: Listar reservas do usuário autenticado.
        Endpoint conveniente para o usuário.
        """
        queryset = self.get_queryset().filter(usuario=request.user)
        
        # Aplicar filtros
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ReservaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ReservaListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def hoje(self, request):
        """
        Listar reservas de hoje para um restaurante específico.
        Filtrada por query param 'restaurante'.
        
        Permitido para:
        - Admin_sistema: vê todas as reservas de hoje de qualquer restaurante
        - Admin_secundario: vê apenas reservas do seu restaurante
        - Funcionário: vê apenas reservas do restaurante onde trabalha
        - Cliente: não tem acesso
        """
        restaurante_id = request.query_params.get('restaurante')
        
        if not restaurante_id:
            return Response(
                {'error': 'Query param "restaurante" é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from restaurantes.models import Restaurante, RestauranteUsuario
        
        try:
            restaurante = Restaurante.objects.get(id=restaurante_id)
        except Restaurante.DoesNotExist:
            return Response(
                {'error': 'Restaurante não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        
        # Verificar permissão
        is_admin_sistema = user.usuariopapel_set.filter(
            papel__tipo='admin_sistema'
        ).exists()
        
        if not is_admin_sistema:
            # Admin_secundario: deve ser proprietário
            if user != restaurante.proprietario:
                # Funcionário: deve trabalhar naquele restaurante
                is_funcionario = user.usuariopapel_set.filter(
                    papel__tipo='funcionario'
                ).exists()
                
                if is_funcionario:
                    trabalha_aqui = RestauranteUsuario.objects.filter(
                        usuario=user,
                        restaurante=restaurante,
                        papel='funcionario'
                    ).exists()
                    
                    if not trabalha_aqui:
                        return Response(
                            {'error': 'Você não tem acesso a este restaurante'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                else:
                    return Response(
                        {'error': 'Você não tem permissão'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Filtrar reservas de hoje
        hoje = timezone.now().date()
        queryset = Reserva.objects.filter(
            restaurante=restaurante,
            data_reserva=hoje
        ).order_by('horario')
        
        serializer = ReservaListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """
        Estatísticas básicas de reservas.
        Apenas para admins.
        """
        # Verificar se é admin
        is_admin = request.user.usuariopapel_set.filter(
            papel__tipo__in=['admin_sistema', 'admin_secundario']
        ).exists()
        
        if not is_admin:
            return Response(
                {'error': 'Apenas administradores podem visualizar estatísticas.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        stats = {
            'total_reservas': queryset.count(),
            'pendentes': queryset.filter(status='pendente').count(),
            'confirmadas': queryset.filter(status='confirmada').count(),
            'canceladas': queryset.filter(status='cancelada').count(),
            'concluidas': queryset.filter(status='concluida').count(),
            'hoje': queryset.filter(data_reserva=timezone.now().date()).count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def ocupacao(self, request):
        """
        RF13: Relatório de ocupação de mesas.
        Apenas para admins.
        
        Query params:
        - restaurante_id: filtrar por restaurante
        - data_inicio: data de início (YYYY-MM-DD)
        - data_fim: data de fim (YYYY-MM-DD)
        """
        # Verificar se é admin
        is_admin = request.user.usuariopapel_set.filter(
            papel__tipo__in=['admin_sistema', 'admin_secundario']
        ).exists()
        
        if not is_admin:
            return Response(
                {'error': 'Apenas administradores podem visualizar relatórios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Extrair parâmetros
        restaurante_id = request.query_params.get('restaurante_id')
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        
        # Converter strings para dates
        data_inicio = None
        data_fim = None
        
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Gerar relatório
        relatorio = RelatorioHelper.gerar_relatorio_ocupacao(
            restaurante_id=restaurante_id,
            data_inicio=data_inicio,
            data_fim=data_fim
        )
        
        serializer = RelatorioOcupacaoSerializer(relatorio, many=True)
        
        return Response({
            'periodo_inicio': data_inicio or 'hoje',
            'periodo_fim': data_fim or 'hoje',
            'total_registros': len(relatorio),
            'dados': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def horarios_movimentados(self, request):
        """
        RF13: Relatório de horários mais movimentados.
        Apenas para admins.
        
        Query params:
        - restaurante_id: filtrar por restaurante
        - data_inicio: data de início (YYYY-MM-DD), padrão: últimos 30 dias
        - data_fim: data de fim (YYYY-MM-DD), padrão: hoje
        - top: quantidade de horários a retornar (padrão: 10)
        """
        # Verificar se é admin
        is_admin = request.user.usuariopapel_set.filter(
            papel__tipo__in=['admin_sistema', 'admin_secundario']
        ).exists()
        
        if not is_admin:
            return Response(
                {'error': 'Apenas administradores podem visualizar relatórios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Extrair parâmetros
        restaurante_id = request.query_params.get('restaurante_id')
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        top = int(request.query_params.get('top', 10))
        
        # Converter strings para dates
        data_inicio = None
        data_fim = None
        
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Gerar relatório
        relatorio = RelatorioHelper.gerar_relatorio_horarios_movimentados(
            restaurante_id=restaurante_id,
            data_inicio=data_inicio,
            data_fim=data_fim,
            top=top
        )
        
        serializer = HorarioMovimentadoSerializer(relatorio, many=True)
        
        return Response({
            'periodo_inicio': data_inicio or 'últimos 30 dias',
            'periodo_fim': data_fim or 'hoje',
            'total_registros': len(relatorio),
            'dados': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def estatisticas_periodo(self, request):
        """
        RF13: Estatísticas por período (dia, semana, mês).
        Apenas para admins.
        
        Query params:
        - restaurante_id: filtrar por restaurante
        - data_inicio: data de início (YYYY-MM-DD), padrão: últimos 30 dias
        - data_fim: data de fim (YYYY-MM-DD), padrão: hoje
        - tipo_periodo: 'dia', 'semana' ou 'mes' (padrão: 'dia')
        """
        # Verificar se é admin
        is_admin = request.user.usuariopapel_set.filter(
            papel__tipo__in=['admin_sistema', 'admin_secundario']
        ).exists()
        
        if not is_admin:
            return Response(
                {'error': 'Apenas administradores podem visualizar relatórios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Extrair parâmetros
        restaurante_id = request.query_params.get('restaurante_id')
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        tipo_periodo = request.query_params.get('tipo_periodo', 'dia')
        
        # Validar tipo_periodo
        if tipo_periodo not in ['dia', 'semana', 'mes']:
            return Response(
                {'error': "tipo_periodo deve ser 'dia', 'semana' ou 'mes'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Converter strings para dates
        data_inicio = None
        data_fim = None
        
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Gerar relatório
        relatorio = RelatorioHelper.gerar_relatorio_estatisticas_periodo(
            restaurante_id=restaurante_id,
            data_inicio=data_inicio,
            data_fim=data_fim,
            tipo_periodo=tipo_periodo
        )
        
        serializer = EstatisticasSerieSerializer(relatorio, many=True)
        
        return Response({
            'periodo_inicio': data_inicio or 'últimos 30 dias',
            'periodo_fim': data_fim or 'hoje',
            'tipo_periodo': tipo_periodo,
            'total_registros': len(relatorio),
            'dados': serializer.data
        })

class NotificacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para gerenciar notificações do usuário.
    RF07: Informar ao cliente a confirmação da reserva.
    """
    
    serializer_class = NotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tipo', 'lido']
    ordering_fields = ['data_criacao', 'data_leitura']
    ordering = ['-data_criacao']
    
    def get_queryset(self):
        """Retornar apenas notificações do usuário autenticado"""
        return Notificacao.objects.filter(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marcar_como_lida(self, request, pk=None):
        """Marca uma notificação como lida"""
        notificacao = self.get_object()
        notificacao.marcar_como_lida()
        serializer = self.get_serializer(notificacao)
        return Response({
            'message': 'Notificação marcada como lida.',
            'notificacao': serializer.data
        })

    @action(detail=True, methods=['post'])
    def marcar_lida(self, request, pk=None):
        """Alias de compatibilidade para frontend: /notificacoes/{id}/marcar_lida/"""
        return self.marcar_como_lida(request, pk)
    
    @action(detail=False, methods=['post'])
    def marcar_todas_como_lidas(self, request):
        """Marca todas as notificações não lidas como lidas"""
        notificacoes = self.get_queryset().filter(lido=False)
        count = notificacoes.count()
        
        for notificacao in notificacoes:
            notificacao.marcar_como_lida()
        
        return Response({
            'message': f'{count} notificação(ões) marcada(s) como lida(s).',
            'quantidade': count
        })

    @action(detail=False, methods=['post'])
    def marcar_todas_lidas(self, request):
        """Alias de compatibilidade para frontend: /notificacoes/marcar_todas_lidas/"""
        return self.marcar_todas_como_lidas(request)

    @action(detail=False, methods=['get'])
    def contar_nao_lidas(self, request):
        """Retorna contagem de notificações não lidas para badge no frontend."""
        count = self.get_queryset().filter(lido=False).count()
        return Response({'count': count})
    
    @action(detail=False, methods=['get'])
    def nao_lidas(self, request):
        """Retorna apenas notificações não lidas"""
        queryset = self.get_queryset().filter(lido=False)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'total': queryset.count(),
            'notificacoes': serializer.data
        })