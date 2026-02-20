# Backend - Sistema de Gerenciamento de Reservas de Mesas

Backend desenvolvido em **Django 6.0.2** com **Django REST Framework** e **JWT Authentication**.

## Requisitos

- Python 3.13+
- Django 6.0.2
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.5.0
- django-filter 24.3
- python-decouple 3.8

## Setup Inicial

### 1. Criar e ativar ambiente virtual

```powershell
# Navegue até o diretório do backend
cd Backend/reserveaqui

# Crie o ambiente virtual
python -m venv venv

# Ative o ambiente virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# OU para Windows CMD
venv\Scripts\activate.bat
```

### 2. Instalar dependências

```powershell
pip install -r ../requirements.txt
```

### 3. Executar migrações e criar superusuário

```powershell
python manage.py migrate
python manage.py createsuperuser
```

### 4. Executar servidor de desenvolvimento

```powershell
python manage.py runserver
```

Acesse: `http://127.0.0.1:8000/`

---

## APIs Disponíveis

### App: Usuarios

#### Modelos:
- **Usuario**: Usuário customizado (email como identificador)
- **Papel**: Define os 4 papéis (admin_sistema, admin_secundario, funcionario, cliente)
- **UsuarioPapel**: Relacionamento entre Usuários e Papéis

#### Endpoints:

| Endpoint | Método | Descrição | Autenticação |
|----------|--------|-----------|--------------|
| `/api/usuarios/cadastro/` | POST | Cadastrar novo usuário | Não |
| `/api/usuarios/login/` | POST | Login e obter tokens | Não |
| `/api/usuarios/me/` | GET | Dados do usuário logado | Sim |
| `/api/usuarios/trocar_senha/` | POST | Trocar senha | Sim |
| `/api/token/refresh/` | POST | Renovar token | Sim |

#### Validações de Senha:
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número

---

### App: Restaurantes

#### Modelos:
- **Restaurante**: Dados do restaurante (nome, endereço, proprietário, quantidade_mesas)
- **RestauranteUsuario**: Vínculo de usuários ao restaurante com papéis

#### Endpoints:

| Endpoint | Método | Descrição | Permissão |
|----------|--------|-----------|-----------|
| `/api/restaurantes/` | GET | Listar restaurantes | Autenticado |
| `/api/restaurantes/{id}/` | GET | Detalhes do restaurante | Autenticado |
| `/api/restaurantes/` | POST | Criar restaurante | Admin |
| `/api/restaurantes/{id}/` | PUT/PATCH | Atualizar restaurante | Proprietário/Admin |
| `/api/restaurantes/{id}/` | DELETE | Remover restaurante | Admin |
| `/api/restaurantes/{id}/mesas/` | GET | Listar mesas do restaurante | Autenticado |
| `/api/restaurantes/{id}/equipe/` | GET | Listar equipe do restaurante | Autenticado |
| `/api/restaurantes/{id}/adicionar_usuario/` | POST | Adicionar usuário à equipe | Proprietário/Admin |

#### Filtros Disponíveis:
- `?cidade=<cidade>` - Filtrar por cidade
- `?estado=<estado>` - Filtrar por estado
- `?ativo=true/false` - Filtrar por status
- `?search=<termo>` - Buscar por nome, cidade ou endereço
- `?ordering=nome,-data_criacao` - Ordenar resultados

---

### App: Mesas

#### Modelos:
- **Mesa**: Mesa do restaurante (número, status, capacidade fixa de 4 pessoas)

#### Funcionalidades:
- Criação automática de mesas ao cadastrar restaurante
- Capacidade fixa de 4 pessoas por mesa
- Status: disponível, ocupada, manutenção

---

### App: Reservas

#### Modelos:
- **Reserva**: Reserva de mesas (data, horário, quantidade de pessoas, status)
- **ReservaMesa**: Vínculo entre reserva e mesas alocadas

#### Funcionalidades:
- Cálculo automático de mesas necessárias (ceil(pessoas/4))
- Validação de antecedência mínima (2 horas)
- Status: pendente, confirmada, cancelada, concluída
- Suporte para reservas com/sem usuário cadastrado

---

## Autenticação JWT

Para acessar endpoints protegidos, inclua o token no header:

```
Authorization: Bearer <seu_access_token>
```

### Fluxo de Autenticação:

1. **Login**: POST `/api/usuarios/login/`
   ```json
   {
     "email": "usuario@example.com",
     "password": "SenhaForte123"
   }
   ```
   Retorna: `access` e `refresh` tokens

2. **Usar Access Token**: Incluir no header das requisições
   ```
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

3. **Renovar Token**: POST `/api/token/refresh/`
   ```json
   {
     "refresh": "seu_refresh_token"
   }
   ```
   Retorna novo `access` token

---

## Testes

Execute os testes de todos os apps:

```powershell
# Todos os testes
python manage.py test

# App específico
python manage.py test usuarios
python manage.py test restaurantes
python manage.py test mesas
python manage.py test reservas
```

**Total de testes**: 59 testes
- usuarios: 21 testes
- restaurantes: 9 testes
- mesas: 11 testes
- reservas: 18 testes

---

## Estrutura do Projeto

```
Backend/
├── reserveaqui/
│   ├── manage.py
│   ├── reserveaqui/          # Configurações do projeto
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── usuarios/             # App de autenticação
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tests.py
│   ├── restaurantes/         # App de restaurantes
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── permissions.py
│   │   └── tests.py
│   ├── mesas/               # App de mesas
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── tests.py
│   └── reservas/            # App de reservas
│       ├── models.py
│       ├── admin.py
│       └── tests.py
└── requirements.txt
```

---

## Admin Panel

Acesse o painel administrativo em: `http://127.0.0.1:8000/admin/`

Funcionalidades disponíveis:
- Gerenciar usuários e papéis
- Gerenciar restaurantes e equipes
- Visualizar e editar mesas
- Gerenciar reservas e vínculos de mesas
- Inline editing para relacionamentos