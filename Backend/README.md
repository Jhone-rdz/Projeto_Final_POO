# Backend - ReserveAqui API

## Credenciais Padrão (Após População de Dados)

Após executar `python manage.py seed_database`, use estas credenciais para testar:

**ADMIN DE SISTEMA:**
```
Email: admin@reserveaqui.com
Senha: admin123
Permissões: Acesso total, gerenciar usuários, restaurantes, relatórios
```

**PROPRIETÁRIOS (3):**
```
Email: carlos@restaurante.com     | Senha: Senha@123
Email: maria@restaurante.com      | Senha: Senha@123
Email: joao@restaurante.com       | Senha: Senha@123
Permissões: Gerenciar seu restaurante, mesas, reservas, equipe
```

**FUNCIONÁRIOS (6):**
```
Email: funcionarioX@reserveaqui.com  | Senha: Func@123
(onde X = 1 a 6)
Permissões: Gerenciar mesas e reservas do restaurante
```

**CLIENTES (10):**
```
Email: clienteX@email.com  | Senha: Cliente@123
(onde X = 1 a 10)
Permissões: Criar e gerenciar próprias reservas
```

---

## Sobre o Projeto

API REST para gerenciamento de reservas de mesas em restaurantes, desenvolvida em **Django 6.0.2** com **Django REST Framework** e **JWT Authentication**.

## Requisitos

- Python 3.13+
- Django 6.0.2
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.5.0
- django-filter 24.3
- python-decouple 3.8
- django-cors-headers 4.3.1
- drf-spectacular 0.27.0

## Quick Start (Setup Rápido)

```bash
# 1. Navegue até o backend
cd Backend/reserveaqui

# 2. Crie ambiente virtual (Linux/Mac)
python3 -m venv venv
source venv/bin/activate

# (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Instale dependências
pip install -r ../requirements.txt

# 4. Aplique migrações
python manage.py migrate

# 5. Popule o banco com dados de teste (IMPORTANTE!)
python manage.py seed_database

# 6. Inicie o servidor
python manage.py runserver

# Acesse: http://127.0.0.1:8000/
```

---

## Setup Inicial - Passo a Passo

### 1. Ambiente Virtual

```powershell
# Navegue até o diretório do backend
cd Backend/reserveaqui

# Crie o ambiente virtual
python -m venv venv

# Ative (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# (Linux/Mac via bash/zsh)
source venv/bin/activate
```

### 2. Instalar Dependências

```powershell
pip install -r ../requirements.txt
```

### 3. Migrações do Banco de Dados

```powershell
python manage.py migrate
```

Isso criará o banco SQLite com toda a estrutura de tabelas necessária.

### 4. **População de Dados**

```powershell
python manage.py seed_database
```

**IMPORTANTE**: Este comando é essencial! Ele popula o banco com:
- Usuários (Admin, Proprietários, Funcionários, Clientes)
- Papéis (Roles do sistema)
- Restaurantes de exemplo
- Mesas para cada restaurante
- Reservas de teste

Sem este comando, o banco ficará vazio e a aplicação não funcionará corretamente.

### 5. Executar Servidor

```powershell
python manage.py runserver
```

Acesse: `http://127.0.0.1:8000/`

---

## População de Dados (Seed Database)

### O que é?

O comando `seed_database` cria automaticamente dados de teste realistas no seu banco de dados, permitindo desenvolver e testar a aplicação sem precisar inserir dados manualmente.

### O que é criado?

```
Papéis (Roles)
   - admin_sistema
   - admin_secundario (Proprietário)
   - funcionario
   - cliente

Usuários (21 total)
   - 1 Admin do Sistema
   - 3 Proprietários
   - 6 Funcionários
   - 10 Clientes

Restaurantes (3 total)
   - Pizzaria Italia (São Paulo) - 12 mesas
   - Churrascaria do Sul (Curitiba) - 15 mesas
   - Sushi Premium (Rio de Janeiro) - 10 mesas

Mesas (37 total)
   - Distribuídas automaticamente entre restaurantes

Reservas (32 total)
   - Distribuídas entre restaurantes e clientes
   - Datas variadas (passado, presente, futuro)
```

### Como usar?

```bash
# Após rodar as migrações, execute:
python manage.py seed_database
```

### Saída esperada

```
Iniciando população do banco de dados...
Criando papéis...
Criando usuários...
Criando restaurantes...
Vinculando funcionários aos restaurantes...
Criando mesas...
Criando reservas...
População do banco de dados concluída com sucesso!

RESUMO DA POPULAÇÃO
============================================================
Admin do Sistema: 1 usuário
   Email: admin@reserveaqui.com | Senha: admin123

Proprietários: 3 usuários
   Email: carlos@restaurante.com | Senha: Senha@123
   Email: maria@restaurante.com | Senha: Senha@123
   Email: joao@restaurante.com | Senha: Senha@123

Funcionários: 6 usuários
   Padrão: funcionarioX@reserveaqui.com | Senha: Func@123

Clientes: 10 usuários
   Padrão: clienteX@email.com | Senha: Cliente@123

Restaurantes: 3 criados
   - Pizzaria Italia: 12 mesas, X reservas
   - Churrascaria do Sul: 15 mesas, X reservas
   - Sushi Premium: 10 mesas, X reservas

Total de Reservas: 32
============================================================
```

### Importante

- Sempre rode `python manage.py seed_database` **APÓS** as migrações
- O comando é **idempotente**: pode ser executado múltiplas vezes sem duplicar dados
- Se quiser resetar deixando dados em branco:
  ```bash
  rm db.sqlite3
  python manage.py migrate
  python manage.py seed_database
  ```

### Resetar Banco (Remover tudo)

```bash
# Linux/Mac
rm db.sqlite3

# Windows
del db.sqlite3

# Depois recriar
python manage.py migrate
python manage.py seed_database
```

---

## Autenticação JWT

Todos os endpoints protegidos requerem um token JWT no header:

```
Authorization: Bearer <seu_access_token>
```

### Fluxo:

1. **Login**: `POST /api/usuarios/login/`
   - Retorna: `access` (1h) e `refresh` (7d) tokens

2. **Usar Access Token**: Incluir em todas as requisições
   ```
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

3. **Renovar Token**: `POST /api/token/refresh/`
   - Envia `refresh` token, recebe novo `access` token

---

## Endpoints Principais

### **Usuarios** - Autenticação e Gestão de Usuários

| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/usuarios/cadastro/` | POST | Registrar novo usuário | OPTIONAL |
| `/api/usuarios/login/` | POST | Login com JWT | OPTIONAL |
| `/api/usuarios/me/` | GET | Dados do usuário logado | REQUIRED |
| `/api/usuarios/trocar_senha/` | POST | Mudar senha | REQUIRED |
| `/api/usuarios/solicitar_recuperacao/` | POST | Recuperar senha (envia email) | OPTIONAL |
| `/api/usuarios/redefinir_senha/` | POST | Redefinir com token | OPTIONAL |

**Validação de Senha**: Mínimo 8 caracteres, 1 letra maiúscula, 1 número

---

### **Restaurantes** - CRUD de Restaurantes

| Endpoint | Método | Descrição | Permissão |
|----------|--------|-----------|-----------|
| `/api/restaurantes/` | GET | Listar restaurantes | Autenticado |
| `/api/restaurantes/` | POST | Criar restaurante | Admin |
| `/api/restaurantes/{id}/` | GET | Detalhes | Autenticado |
| `/api/restaurantes/{id}/` | PUT/PATCH | Editar | Proprietário/Admin |
| `/api/restaurantes/{id}/` | DELETE | Deletar | Admin |
| `/api/restaurantes/{id}/mesas/` | GET | Mesas do restaurante | Autenticado |
| `/api/restaurantes/{id}/equipe/` | GET | Equipe | Autenticado |
| `/api/restaurantes/{id}/adicionar_usuario/` | POST | Adicionar usuário | Proprietário/Admin |

**Filtros**: `?search=<nome>`, `?ativo=true/false`, `?ordering=nome`

---

### **Mesas** - Gestão de Mesas

| Endpoint | Método | Descrição | Permissão |
|----------|--------|-----------|-----------|
| `/api/mesas/` | GET | Listar mesas | Autenticado |
| `/api/mesas/` | POST | Criar mesa | Admin |
| `/api/mesas/{id}/` | GET | Detalhes | Autenticado |
| `/api/mesas/{id}/` | PUT/PATCH | Editar | Admin |
| `/api/mesas/{id}/` | DELETE | Deletar | Admin |
| `/api/mesas/disponibilidade/` | GET | Verificar disponibilidade | Autenticado |
| `/api/mesas/{id}/alternar_status/` | POST | Mudar status | Funcionário/Admin |
| `/api/mesas/{id}/alternar_ativa/` | POST | Ativar/Desativar | Admin |

**Disponibilidade**: Query params `?data=YYYY-MM-DD`, `?horario=HH:MM`, `?pessoas=N`

---

### **Reservas** - Reservas de Mesas

| Endpoint | Método | Descrição | Permissão |
|----------|--------|-----------|-----------|
| `/api/reservas/` | GET | Listar reservas | Admin |
| `/api/reservas/` | POST | Criar reserva | Autenticado |
| `/api/reservas/{id}/` | GET | Detalhes | Dono/Admin |
| `/api/reservas/{id}/` | PUT/PATCH | Editar | Dono/Admin |
| `/api/reservas/{id}/` | DELETE | Cancelar | Dono/Admin |
| `/api/reservas/{id}/confirmar/` | POST | Confirmar reserva | Admin |
| `/api/reservas/{id}/cancelar/` | POST | Cancelar reserva | Dono/Admin |
| `/api/reservas/minhas_reservas/` | GET | Minhas reservas | Autenticado |
| `/api/reservas/ocupacao/` | GET | Relatório de ocupação | Admin |
| `/api/reservas/horarios_movimentados/` | GET | Horários mais movimentados | Admin |
| `/api/reservas/estatisticas_periodo/` | GET | Estatísticas por período | Admin |

**Regras de Negócio**:
- Mínimo 2 horas de antecedência
- Mesas alocadas automaticamente (ceil(pessoas/4))
- Validação de conflitos (±1h)
- Capacidade respeitada por mesa

---

### **Notificações** - Sistema de Notificações

| Endpoint | Método | Descrição | Permissão |
|----------|--------|-----------|-----------|
| `/api/notificacoes/` | GET | Listar notificações | Autenticado |
| `/api/notificacoes/{id}/` | GET | Detalhes | Dono |
| `/api/notificacoes/{id}/marcar_como_lida/` | POST | Marcar como lida | Dono |
| `/api/notificacoes/marcar_todas_como_lidas/` | POST | Marcar todas como lidas | Autenticado |
| `/api/notificacoes/nao_lidas/` | GET | Contar não lidas | Autenticado |

**Tipos de Notificações**: confirmacao, cancelamento, lembranca, atualizacao

---

### **Relatórios** - Dados e Análises

| Endpoint | Método | Descrição | Permissão |
|----------|--------|-----------|-----------|
| `/api/reservas/ocupacao/` | GET | Taxa de ocupação por data | Admin |
| `/api/reservas/horarios_movimentados/` | GET | 10 horários mais reservados | Admin |
| `/api/reservas/estatisticas_periodo/` | GET | Estatísticas (dia/semana/mês) | Admin |

**Query Params**:
- `?data_inicio=YYYY-MM-DD`
- `?data_fim=YYYY-MM-DD`
- `?restaurante_id=<id>`
- `?tipo_periodo=day/week/month` (para estatísticas)

---

## CORS - Frontend Integration

API configurada para aceitar requisições do frontend React em `localhost:3000`:

```javascript
// Frontend (React/TypeScript)
const response = await fetch('http://localhost:8000/api/usuarios/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Para enviar cookies (se necessário)
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'SenhaForte123'
  })
});
```

**Domínios Permitidos**: `localhost:3000`, `localhost:8000`

---

## Documentação Interativa (Swagger)

### Acessar Documentação

#### **Swagger UI** (Recomendado)
- URL: `http://127.0.0.1:8000/api/docs/swagger/`
- Teste endpoints diretamente na interface
- Suporte para autenticação JWT

#### **ReDoc**
- URL: `http://127.0.0.1:8000/api/docs/redoc/`
- Documentação em formato de referência

#### **OpenAPI Schema**
- URL: `http://127.0.0.1:8000/api/schema/`
- Especificação OpenAPI 3.0 em JSON

### Como Usar Swagger

1. Acesse `http://127.0.0.1:8000/api/docs/swagger/`
2. Clique em **"Authorize"**
3. Cole seu JWT token: `Bearer <seu_access_token>`
4. Teste os endpoints diretamente

---

## Testes

```powershell
# Todos os testes
python manage.py test

# Por app
python manage.py test usuarios
python manage.py test restaurantes
python manage.py test mesas
python manage.py test reservas
```

### Testar com Dados Populados

```bash
# Popule os dados
python manage.py seed_database

# Acesse o Admin Panel
http://127.0.0.1:8000/admin/

# Use qualquer credencial de teste para testar a API
# Exemplo: admin@reserveaqui.com / admin123
```

---

## Troubleshooting

### Problema: "No module named 'utils.management.commands'"

**Solução:** Certifique-se de que a pasta `utils/management/commands/` existe:
```bash
Backend/reserveaqui/
├── utils/
│   ├── __init__.py
│   ├── management/
│   │   ├── __init__.py
│   │   └── commands/
│   │       ├── __init__.py
│   │       └── seed_database.py
```

### Problema: "Database is locked"

**Solução:** Feche todos os terminais rodando o servidor Django e tente novamente:
```bash
# Mate o processo
# Windows: Ctrl+C no terminal
# Linux/Mac: Ctrl+C ou kill -9 <pid>

# Depois tente novamente
python manage.py seed_database
```

### Problema: Dados não aparecem após seed_database

**Solução:** Verifique se as migrações foram aplicadas:
```bash
python manage.py migrate --check
python manage.py migrate  # Se houver pendentes
python manage.py seed_database
```

### Problema: "ModuleNotFoundError: No module named 'faker'"

**Solução:**
```bash
pip install faker
pip install -r ../requirements.txt
```

---

## Estrutura do Projeto

```
Backend/
├── reserveaqui/
│   ├── manage.py
│   ├── reserveaqui/              # Configurações principais
│   │   ├── settings.py           
│   │   ├── urls.py               
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── usuarios/                 
│   │   ├── models.py             
│   │   ├── views.py              
│   │   ├── serializers.py        
│   │   ├── permissions.py        
│   │   └── tests.py              
│   │
│   ├── restaurantes/             
│   │   ├── models.py             
│   │   ├── views.py              
│   │   ├── serializers.py        
│   │   ├── permissions.py        
│   │   └── tests.py              
│   │
│   ├── mesas/                    
│   │   ├── models.py             
│   │   ├── views.py              
│   │   ├── serializers.py        
│   │   └── tests.py             
│   │
│   └── reservas/                 
│       ├── models.py             
│       ├── views.py              
│       ├── serializers.py        
│       ├── admin.py             
│       ├── reports.py            
│       └── tests.py              
│
└── requirements.txt              # Dependências Python
```

---

---

## Papéis e Permissões

| Papel | Permissões |
|-------|-----------|
| **admin_sistema** | Acesso total a todos recursos |
| **admin_secundario** | Gerenciar restaurantes e equipe |
| **funcionario** | Gerenciar mesas e reservas do restaurante |
| **cliente** | Criar e visualizar próprias reservas |

---

## Admin Panel

Acesse: `http://127.0.0.1:8000/admin/`

Gerenciar:
- Usuários e Papéis
- Restaurantes e Equipes
- Mesas e Status
- Reservas e Notificações
- Tokens de Recuperação de Senha

---

## Workflow de Desenvolvimento

### Inicialização do Projeto (Primeira vez)

```bash
# 1. Clone o repositório
git clone <repo-url>
cd Backend/reserveaqui

# 2. Crie e ative venv
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
.\venv\Scripts\Activate.ps1  # Windows

# 3. Instale dependências
pip install -r ../requirements.txt

# 4. Aplique migrações
python manage.py migrate

# 5. **IMPORTANTE**: Popule dados de teste
python manage.py seed_database

# 6. Execute servidor
python manage.py runserver

# 7. Acesse
# API: http://127.0.0.1:8000/
# Admin: http://127.0.0.1:8000/admin/
# Swagger: http://127.0.0.1:8000/api/docs/swagger/
```

### Desenvolvimento Diário

```bash
# Ativar venv
source venv/bin/activate  # Linux/Mac

# Iniciar servidor
python manage.py runserver

# Em outro terminal, fazer seu desenvolvimento
# (editar codigo, modelos, etc)

# Se alterar modelos, criar migração:
python manage.py makemigrations
python manage.py migrate

# Se precisar resetar dados:
rm db.sqlite3
python manage.py migrate
python manage.py seed_database
```

### Criar Nova Funcionalidade (Exemplo: Novo app)

```bash
# 1. Criar app
python manage.py startapp minha_feature

# 2. Adicionar ao INSTALLED_APPS em settings.py

# 3. Criar modelos em models.py

# 4. Criar migrações
python manage.py makemigrations

# 5. Aplicar migrações
python manage.py migrate

# 6. Criar serializers, views, urls

# 7. Registrar em admin.py (se necessário)

# 8. Testar
python manage.py test minha_feature
```

### Restaurar Dados de Teste

Sempre que quiser um banco limpo com dados padrão:

```bash
# Opção 1: Remover e recriar (Linux/Mac)
rm db.sqlite3
python manage.py migrate
python manage.py seed_database

# Opção 2: Remover e recriar (Windows)
del db.sqlite3
python manage.py migrate
python manage.py seed_database

# Opção 3: Apenas repopular (sem remover)
python manage.py seed_database
# (idempotent - não cria duplicatas)
```

---

## Checklist de Inicialização

Use este checklist para garantir que está tudo configurado corretamente:

- [ ] Venv ativado
- [ ] Dependências instaladas (`pip install -r ../requirements.txt`)
- [ ] Migrações aplicadas (`python manage.py migrate`)
- [ ] Banco populado (`python manage.py seed_database`)
- [ ] Servidor rodando (`python manage.py runserver`)
- [ ] Admin acessível em `http://127.0.0.1:8000/admin/`
- [ ] Swagger acessível em `http://127.0.0.1:8000/api/docs/swagger/`
- [ ] Consegue fazer login com `admin@reserveaqui.com / admin123`
- [ ] Consegue criar uma reserva de teste como cliente
- [ ] Frontend também está rodando em paralelo (verificar CORS)

---

# Tratamento de Erros
Login
 Email não fornecido → 400 Bad Request ("Email obrigatório")
 Senha não fornecida → 400 Bad Request ("Senha obrigatória")
 Email não encontrado no banco → 401 Unauthorized ("Credenciais inválidas")
 Senha incorreta → 401 Unauthorized ("Credenciais inválidas")
 Usuário inativo/bloqueado → 403 Forbidden ("Usuário inativo")
 Erro ao buscar usuário no banco → 500 Internal Server Error + log
 Gerar JWT corretamente
 Refresh token (se implementar)
📝 Cadastro
 Nome não fornecido → 400 Bad Request ("Nome obrigatório")
 Email não fornecido → 400 Bad Request ("Email obrigatório")
 Email inválido (regex) → 400 Bad Request ("Email inválido")
 Senha não fornecida → 400 Bad Request ("Senha obrigatória")
 Senha fraca → 400 Bad Request ("Senha deve ter mín 8 caracteres...")
 Email já existe → 409 Conflict ("Email já cadastrado")
 Nome com caracteres inválidos → 400 Bad Request
 Erro ao hash da senha → 500 Internal Server Error + log
 Erro ao salvar no banco → 500 Internal Server Error + log
 Erro ao enviar email de confirmação → log (não bloqueia cadastro)
 Retornar usuario criado (sem senha)
 Recuperação de Senha
 Email não fornecido → 400 Bad Request
 Email não encontrado → 404 Not Found ("Email não encontrado")
 Erro ao gerar token de reset → 500 Internal Server Error + log
 Erro ao enviar email → 500 Internal Server Error + log
 Token de reset expirado → 400 Bad Request ("Link expirado")
 Token de reset inválido → 400 Bad Request ("Link inválido")
 Nova senha não fornecida → 400 Bad Request
 Nova senha fraca → 400 Bad Request
 Erro ao atualizar senha no banco → 500 Internal Server Error + log
 Trocar Senha (Logado)
 Usuário não autenticado → 401 Unauthorized
 Token inválido/expirado → 401 Unauthorized
 Senha atual não fornecida → 400 Bad Request
 Nova senha não fornecida → 400 Bad Request
 Confirmação não fornecida → 400 Bad Request
 Senha atual incorreta → 401 Unauthorized ("Senha atual incorreta")
 Nova senha = senha atual → 400 Bad Request ("Mesma senha")
 Nova senha fraca → 400 Bad Request
 Confirmação ≠ nova senha → 400 Bad Request ("Senhas não conferem")
 Erro ao atualizar banco → 500 Internal Server Error + log
 Atualizar último change de senha
 Editar Dados Pessoais
 Usuário não autenticado → 401 Unauthorized
 Token inválido → 401 Unauthorized
 Nome vazio → 400 Bad Request ("Nome obrigatório")
 Email vazio → 400 Bad Request ("Email obrigatório")
 Email inválido (regex) → 400 Bad Request
 Email já existe (outro usuário) → 409 Conflict ("Email já em uso")
 Usuário não encontrado → 404 Not Found
 Erro ao atualizar banco → 500 Internal Server Error + log
 Não permitir editar senha/role aqui
 Retornar usuário atualizado
 Listar Restaurantes
 Nenhum filtro → retornar todos com paginação
 Filtro por localização → validar valor
 Sem resultados → retornar array vazio (não é erro)
 Erro ao buscar banco → 500 Internal Server Error + log
 Dados incompletos (NULL) → retornar NULL ou valor padrão
 Limite de paginação excedido → 400 Bad Request
 Página inválida → 400 Bad Request
 Detalhe do Restaurante
 ID não fornecido → 400 Bad Request
 ID inválido (não é UUID) → 400 Bad Request
 Restaurante não encontrado → 404 Not Found
 Restaurante deletado logicamente → 404 Not Found
 Erro ao buscar banco → 500 Internal Server Error + log
 Retornar todas as informações (mesas, horários)
 Listar Mesas (com Disponibilidade)
 Restaurant_id não fornecido → 400 Bad Request
 Restaurant_id inválido → 400 Bad Request
 Data não fornecida → 400 Bad Request
 Data inválida (formato) → 400 Bad Request
 Data no passado → 400 Bad Request ("Data deve ser futura")
 Horário não fornecido → 400 Bad Request
 Horário inválido (formato) → 400 Bad Request
 Horário fora do funcionamento → 400 Bad Request ("Restaurante fechado")
 Restaurante não encontrado → 404 Not Found
 Erro ao buscar mesas → 500 Internal Server Error + log
 Erro ao verificar reservas conflitantes → 500 Internal Server Error + log
 Nenhuma mesa disponível → retornar array vazio
 Retornar apenas mesas não deletadas
 Retornar status de disponibilidade de cada mesa
 Criar Reserva (RF05)
 Usuário não autenticado → 401 Unauthorized
 Token inválido → 401 Unauthorized
 Restaurant_id não fornecido → 400 Bad Request
 Restaurant_id inválido → 400 Bad Request
 Table_id não fornecido → 400 Bad Request
 Table_id inválido → 400 Bad Request
 Data não fornecida → 400 Bad Request
 Data inválida → 400 Bad Request
 Data no passado → 400 Bad Request
 Horário não fornecido → 400 Bad Request
 Horário inválido → 400 Bad Request
 Pessoas não fornecido → 400 Bad Request
 Pessoas <= 0 ou inválido → 400 Bad Request
 RN01: Mesa já reservada neste horário → 409 Conflict ("Mesa não disponível")
 RN02: Pessoas > capacidade da mesa → 409 Conflict ("Muitas pessoas")
 Restaurante não encontrado → 404 Not Found
 Mesa não encontrada → 404 Not Found
 Mesa deletada → 404 Not Found
 Horário fora do funcionamento → 400 Bad Request
 Erro ao salvar no banco → 500 Internal Server Error + log
 RF07: Criar chamado interno → registrar em tabela de chamados
 RF08: Enviar confirmação por email → log de envio
 Erro ao enviar email → log (não bloqueia reserva)
 Retornar reserva criada com ID e status
 Listar Reservas do Cliente
 Usuário não autenticado → 401 Unauthorized
 Erro ao buscar banco → 500 Internal Server Error + log
 Nenhuma reserva encontrada → retornar array vazio
 Restaurante/mesa deletados → mostrar informações cache ou deletado
 Incluir status de cada reserva
 Ordenar por data descendente (mais recentes primeiro)
 Filtro por status (confirmada, cancelada, atendida) → validar valor
 Editar Reserva (RF06)
 Usuário não autenticado → 401 Unauthorized
 Reservation_id não fornecido → 400 Bad Request
 Reservation_id inválido → 400 Bad Request
 Reserva não encontrada → 404 Not Found
 Usuário não é dono da reserva → 403 Forbidden
 Reserva já foi atendida → 409 Conflict ("Não pode editar")
 Reserva já foi cancelada → 409 Conflict ("Não pode editar")
 Nova data no passado → 400 Bad Request
 Novo horário inválido → 400 Bad Request
 Nova mesa não existe → 404 Not Found
 RN01: Nova mesa já reservada → 409 Conflict
 RN02: Pessoas > capacidade nova mesa → 409 Conflict
 Nenhum campo alterado → 400 Bad Request ("Nenhuma alteração")
 Pessoas não fornecido (mas quer editar) → manter existente
 Erro ao atualizar banco → 500 Internal Server Error + log
 Atualizar timestamp de modificação
 Retornar reserva atualizada
 Cancelar Reserva (RN03)
 Usuário não autenticado → 401 Unauthorized
 Reservation_id não fornecido → 400 Bad Request
 Reservation_id inválido → 400 Bad Request
 Reserva não encontrada → 404 Not Found
 Usuário não é dono → 403 Forbidden
 Reserva já foi cancelada → 409 Conflict ("Já está cancelada")
 Reserva já foi atendida → 409 Conflict ("Já foi atendida")
 Prazo de cancelamento expirado (se implementar) → 409 Conflict
 Erro ao atualizar status → 500 Internal Server Error + log
 RN03: Liberar mesa (atualizar disponibilidade)
 Enviar notificação de cancelamento → log
 Erro ao enviar notificação → log (não bloqueia cancelamento)
 Atualizar timestamp de cancelamento
 Retornar reserva cancelada
🔔 Notificações
 Usuário não autenticado → 401 Unauthorized
 Listar notificações do usuário → array vazio se nenhuma
 Erro ao buscar banco → 500 Internal Server Error + log
 Marcar como lida → validar notificação existe
 Notification_id inválido → 404 Not Found
 Usuário não é destinatário → 403 Forbidden
 Erro ao atualizar → 500 Internal Server Error + log
 Deletar notificação → similar
 Retornar notificações ordenadas por data (mais recentes primeiro)
 Autenticação (Middleware)
 Header Authorization ausente → 401 Unauthorized
 Formato do header inválido (não é "Bearer <token>") → 401 Unauthorized
 Token inválido (não JWT válido) → 401 Unauthorized
 Token expirado → 401 Unauthorized ("Token expirado")
 Payload do token corrompido → 401 Unauthorized
 Secret key errado → log de erro (não deveria acontecer)
 Retornar usuário decodificado no req.user
 Autorização (Por rota)
 Usuário sem role de admin em rota admin → 403 Forbidden
 Usuário tentando acessar recurso de outro → 403 Forbidden
 Log de tentativas de acesso não autorizado
 Validação de Entrada (Global)
 SQL Injection → sanitizar inputs, usar prepared statements
 XSS → escapar/validar strings antes de retornar
 Campos extra na requisição → ignorar (não erro)
 Tipo de dado errado (string em lugar de número) → 400 Bad Request
 Valores fora do intervalo permitido → 400 Bad Request
 Strings muito longas → truncar ou rejeitar (configurável)
 Caracteres especiais não permitidos → 400 Bad Request
💾 Banco de Dados
 Violação de constraint (email único) → 409 Conflict
 Foreign key inválida → 400 Bad Request ou 404 Not Found
 Deadlock → retry automático (máx 3 tentativas)
 Conexão perdida → 500 Internal Server Error (reconectar)
 Timeout de query → 500 Internal Server Error + log
 Espaço em disco cheio → 500 Internal Server Error + alerta
 Transação falhou → rollback automático + log
 Rede e Performance
 Rate limiting → 429 Too Many Requests (máx 100 req/min por IP)
 Request muito grande → 413 Payload Too Large
 Headers ausentes obrigatórios → 400 Bad Request
 CORS mal configurado → 403 Forbidden
 Log de todas as requisições (info)
 Log de todos os erros (error)
 Tempo de resposta muito alto → log (warning)
 Erros Internos com Log
 Todos os 500 → log com stack trace + ID de erro
 Retry automático para operações críticas
 Alerta ao team se muitos erros em curto período
 Monitoramento de métricas (uptimes, latência)