# Frontend ReserveAqui

Frontend em React + Typescript e Tailwind Css.

## 📋 Páginas

Toda pagina autenticada terá um icone de notificações ao lado do icone do usuario no header lado direito, ao clicar no icone de notificação abrirá tipo um poupup com as notificações que será apenas para o cliente. clicar no icone do usuario aparece um menu com os links com nome de perfil e Sair.

# Telas Cliente
Login - tela de login do cliente, ele utilizará o email e a senha para fazer o login, e terá os botões no fim de Entrar e Cadastrar, e o recuperar senha.

Cadastro - tela de cadastro com os dados que o cliente precisa para cadastrar, provavelmente nome, email e senha e feedback de cadastro concluido com sucesso.

recuperação de senha - terá um imput pedindo o email e um botão de enviar email de recuperação.

confirmação da recuperação de senha - terá uma mensagem informando que o email foi enviado para o cliente com sucesso e ele entrar pelo link do email.

redefinir senha pela recuperação - tela enviada pelo link do email que terá input para colocar nova senha e confirmar ela, e feedback de sucesso de alteração de senha.

Inicio - Terá um header basico com logo do sistema, Menu basico e botoes do entrar e cadastrar. além disso terá um hero com uma imagem de fundo, e um titulo e um texto, tambem terá logo abaixo um grid de restaurantes com cards interativos: contendo imagem, nome do restaurante, localização, botao para ir para a pagina do restaurante. footer minimalista com informações do sistema.

Restaurante - Terá um header basico com logo do sistema, Menu basico e botoes do entrar e cadastrar, abaixo um hero com uma imagem do restaurante e as informações do mesmo, abaixo disso tudo terá uma seção Mostrando a quantidade de mesas disponiveis no restaurante e um botão se a pessoa quiser fazer a reserva e alem de um footer.

Reserva - está tela terá informações do usuario que estiver logado e se não tiver pedirá para fazer o cadastro ou login, além de as informações para fazer a reserva tipo quantidade de pessoas, data e horario e mostrando a quantidade de mesas colocadas automaticamente. sempre verificando se tem mesas disponiveis. feedback de sucesso ou erro da reserva. 

Perfil - perfil terá as informações do cliente, alem disso terá as reservas do cliente e formas de editar ou cancelar a reserva tendo cada um seu modal para editar ou confirmar o cancelamento e feedback de confirmação alem do status da reserva. botao de editar as informações do cliente com expansão inline com informações nome, email. um botão de mudar senha que abrirá um modal que fechará ao salvar ou cancelar.

# Funcionario 
Inicio - Ao fazer o Login Terá uma tela aonde poderá visualizar todas as mesas do restaurante que está atribuido, podendo alterar o status da mesa para ocupada ou disponivel. poderá visualizar uma lista de Reservas do Restaurante ao qual Está atribuido, alem disso podendo Confirmar e Cancelar as reservas.


# Proprietario 
Inicio - Ao fazer o Login terá uma Tela aonde poderá visualizar todas as mesas do restaurante, podendo adicionar, remover as mesas e podendo alterar o status entre ocupado e disponivel. poderá visualizar todas as reservas do restaurante, podendo confirma-las ou cancela-las.

Perfil do restaurante - alem disso terá uma parte com as informações do restaurante aonde poderá edita-la, tambem poderá está criando funcionarios para o restaurante e tambem editando e os removendo. tambem listará todos na mesma parte. alem de colocar algo para visualizar os relatorios de taxa de ocupação e pico de horarios e numero de reservas por dia/mês.


# Admin do Sistema
Inicio - terá uma parte para adicionar, editar e remover restaurantes. listará todos os restaurantes do sistema, visualização de relatorios gerais.


# Tratamento de erros
Autenticação
 Email vazio ou inválido (validação em tempo real)
 Senha vazia (validação em tempo real)
 Confirmação de senha não bate
 Mostrar/ocultar senha (UX)
 Desabilitar botão enquanto carrega
 Token expirado → redirecionar para /login
 Erro 401 → limpar localStorage, logout automático
 Mostrar toast: "Sessão expirada, faça login novamente"
 Retry automático em caso de timeout
📝 Cadastro
 Nome vazio ou com caracteres inválidos
 Email vazio, inválido ou duplicado (feedback do backend)
 Senha fraca (mostrar regras: mín 8 caracteres, 1 maiúscula, 1 número)
 Confirmar senha não bate com senha
 Campos obrigatórios com borda vermelha
 Spinner mientras se envia
 Toast de sucesso: "Cadastro realizado com sucesso!"
 Toast de erro com mensagem específica (ex: "Email já cadastrado")
 Redirecionar para login após sucesso
🔐 Recuperação de Senha
 Email vazio (validação em tempo real)
 Email inválido (formato)
 Mostrar confirmação: "Email enviado com sucesso"
 Mostrar toast: "Verifique seu email"
 Spinner durante envio
 Erro 404 → Toast: "Email não encontrado no sistema"
 Link de recuperação expirado → mensagem clara
 Nova senha não atende critérios → mostrar regras
 Confirmação de senha não bate → feedback visual
🏠 Home/Listar Restaurantes
 Spinner enquanto carrega restaurantes
 Sem internet → "Verifique sua conexão"
 Nenhum restaurante encontrado → "Nenhum restaurante disponível"
 Erro ao carregar imagens → fallback (ícone de imagem quebrada)
 Timeout → botão "Tentar novamente"
 Dados corrompidos → fallback para valores padrão
 Paginação com validação
🍽️ Página do Restaurante
 ID inválido na URL → redirecionar para home
 Restaurante não encontrado → "Restaurante não existe"
 Spinner enquanto carrega detalhes
 Erro ao carregar mesas → "Erro ao carregar informações das mesas"
 Sem internet → mensagem clara
 Timeout → retry automático
 Imagem quebrada → fallback
📅 Criar Reserva
 Usuário não autenticado → redirecionar para login (com mensagem)
 Data vazia ou inválida (validação em tempo real)
 Data no passado → "Selecione uma data futura"
 Horário vazio (validação em tempo real)
 Quantidade de pessoas vazio ou zero
 Quantidade de pessoas > capacidade máxima → aviso antes de enviar
 Mostrar disponibilidade de mesas em tempo real
 Mesa não selecionada → "Selecione uma mesa"
 Spinner durante envio da reserva
 Nenhuma mesa disponível → "Nenhuma mesa disponível para este horário"
 Erro 409 (mesa já reservada) → "Mesa já está reservada, tente outro horário"
 Erro 400 (dados inválidos) → "Verifique os dados da reserva"
 Sucesso → Toast: "Reserva realizada com sucesso!" + redirecionar para perfil
 Timeout → "Demorando... tente novamente"
 Erro 500 → "Erro ao processar reserva, tente novamente"
📋 Listar Reservas (Perfil)
 Usuário não autenticado → redirecionar para login
 Spinner enquanto carrega
 Nenhuma reserva encontrada → "Você ainda não tem reservas"
 Erro ao carregar → "Erro ao carregar reservas"
 Status da reserva com cores: confirmada (verde), cancelada (vermelho), atendida (cinza)
 Data/hora no passado → mostrar visualmente diferente
 Sem internet → botão "Tentar novamente"
✏️ Editar Reserva
 Abrir modal de edição
 Validar novo horário (não passado)
 Data/hora já reservada → "Este horário não está disponível"
 Pessoas > capacidade da nova mesa → aviso
 Nenhum campo alterado → desabilitar botão "Salvar"
 Spinner durante envio
 Sucesso → Toast: "Reserva atualizada com sucesso!" + fechar modal
 Erro 409 → "Horário não disponível"
 Erro 403 (não é dono) → "Você não pode editar esta reserva"
 Erro 404 (reserva não existe) → "Reserva não encontrada"
 Timeout → "Demorando... tente novamente"
❌ Cancelar Reserva
 Abrir modal de confirmação
 "Tem certeza que deseja cancelar?"
 Spinner durante cancelamento
 Sucesso → Toast: "Reserva cancelada com sucesso!" + atualizar lista
 Erro 403 (já foi atendida) → "Esta reserva já foi atendida"
 Erro 404 → "Reserva não encontrada"
 Timeout → "Demorando... tente novamente"
 Erro 500 → "Erro ao cancelar, tente novamente"
👤 Perfil/Editar Dados
 Abrir expansão inline
 Nome vazio → validação em tempo real
 Email vazio ou inválido → validação em tempo real
 Email duplicado (feedback do backend) → Toast de erro
 Nenhum campo alterado → desabilitar botão "Salvar"
 Spinner durante envio
 Sucesso → Toast: "Dados atualizados com sucesso!" + fechar expansão
 Erro 409 (email duplicado) → "Email já está em uso"
 Botão "Cancelar" → fecharmesma sem salvar
 Timeout → "Demorando... tente novamente"
🔑 Trocar Senha (Modal)
 Senha atual vazia (validação em tempo real)
 Nova senha vazia (validação em tempo real)
 Confirmação vazia (validação em tempo real)
 Confirmação não bate → feedback visual
 Senha fraca → mostrar regras
 Nova senha = senha atual → "Digite uma senha diferente"
 Spinner durante envio
 Erro 401 (senha atual incorreta) → "Senha atual incorreta"
 Sucesso → Toast: "Senha alterada com sucesso!" + fechar modal
 Botão "Cancelar" → fechar modal sem salvar
 Timeout → "Demorando... tente novamente"
 Token expirado → redirecionar para login
🔔 Notificações
 Spinner ao carregar notificações
 Nenhuma notificação → "Você não tem notificações"
 Erro ao carregar → "Erro ao carregar notificações"
 Mostrar badge com número de não lidas
 Ao clicar em notificação → marcar como lida
 Erro 404 (notificação não existe) → remover da lista
🌐 Conexão e Rede (Global)
 Detectar falta de internet → mostrar banner
 Timeout (> 30s) → mostrar "Demorando..." + botão retry
 Erro de CORS → console.error (não mostrar ao usuário)
 Server 500 → "Erro no servidor, tente novamente"
 Server 503 → "Servidor indisponível, tente mais tarde"
 Requisição abortada → fechar spinner
 Retry automático para timeout
 Network interceptor para logs
🎨 UX Geral
 Desabilitar botão "Enviar" enquanto carrega
 Spinner em todas as ações assíncronas
 Toast para sucesso/erro (top-right)
 Modal para confirmações críticas
 Loading skeleton para estruturas de dados
 Mensagens amigáveis (nada técnico)
 Sugestão de ação: "Tente novamente" ou "Entre em contato com suporte"
 Fechar toast ao clicar