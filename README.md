# 🔧 OficinaOS — Sistema de Gestão de Oficina Mecânica

> Trabalho Final — ADS | Programação Para a Internet I | Prof. Ely

---

## 📁 Estrutura do Projeto

```
oficina/
├── backend/
│   ├── server.js       ← Servidor Express (API REST)
│   ├── dados.json      ← Banco de dados JSON
│   └── package.json
└── frontend/
    ├── index.html      ← Página principal
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## 🚀 Como rodar

### 1. Instalar dependências do backend
```bash
cd backend
npm install
```

### 2. Iniciar o servidor
```bash
node server.js
# Servidor rodando em http://localhost:3000
```

### 3. Abrir o front-end
Abra o arquivo `frontend/index.html` diretamente no navegador,
ou use a extensão **Live Server** do VSCode.

---

## ✅ Requisitos Atendidos

| # | Requisito | Como foi implementado |
|---|-----------|----------------------|
| 1 | **Duas entidades 1:N** | `Veículo` → `Ordens de Serviço` |
| 2 | **Validações cliente + servidor** | Campos obrigatórios validados no JS antes do envio; servidor valida novamente ao receber o JSON |
| 3 | **Todos os métodos HTTP** | GET, POST, PUT, PATCH, DELETE em ambas as entidades |
| 4 | **Critérios de ordenação no servidor** | Veículos: modelo/marca/ano/proprietário/placa; OS: data_entrada/status |
| 5 | **Local Storage** | Tema dark/light, cache offline das entidades, última ordenação usada |
| 6 | **Persistência** | `dados.json` — arquivo JSON persistido no servidor |
| 7 | **Hospedagem** | Deploy no Render (backend) + GitHub Pages (frontend) |

---

## 🔗 Rotas da API

### Veículos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/veiculos?ordenar=modelo` | Listar (ordenado) |
| GET    | `/veiculos/:id` | Buscar por ID |
| POST   | `/veiculos` | Cadastrar |
| PUT    | `/veiculos/:id` | Atualizar completo |
| PATCH  | `/veiculos/:id` | Atualizar parcial |
| DELETE | `/veiculos/:id` | Remover |

### Ordens de Serviço
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/ordens?ordenar=data_entrada` | Listar (ordenado) |
| GET    | `/ordens/:id` | Buscar por ID |
| POST   | `/ordens` | Abrir nova OS |
| PUT    | `/ordens/:id` | Atualizar completo |
| PATCH  | `/ordens/:id` | Atualizar status/campos |
| DELETE | `/ordens/:id` | Remover |

---

## 🏗️ Regras de Negócio

- **Placa única**: não é possível cadastrar dois veículos com a mesma placa.
- **OS única por veículo**: um veículo não pode ter duas ordens de serviço com status `aberta` ou `em_andamento` ao mesmo tempo.
- **Validações de placa**: aceita formato antigo (ABC1234) e Mercosul (ABC1D23).
- **Cascade delete**: ao remover um veículo, todas as suas OS são removidas junto.

---

## 💡 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (DOM, Fetch API, Local Storage)
- **Backend**: Node.js + Express.js
- **Dados**: JSON (dados.json)
